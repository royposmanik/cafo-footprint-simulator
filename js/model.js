/*
 * CAFO BAU carbon-footprint model.
 *
 * Pure functions, no DOM. Works in the browser (window.CAFO_MODEL) and in Node
 * (require('./model.js')) so it can be tested from the command line.
 *
 * Calculation basis: one animal place (housing capacity) for one year, then
 * scaled by the number of places. Emission equations follow the IPCC 2019
 * Refinement, Vol. 4, Ch. 10 (Tier 2) and Ch. 11.
 */
(function (root) {
  'use strict';

  const DATA = (typeof module !== 'undefined' && module.exports) ? require('./data.js') : root.CAFO_DATA;

  const GE_PER_KG_DM = 18.45;   // MJ gross energy per kg feed DM (IPCC default)
  const MJ_PER_KG_CH4 = 55.65;  // energy content of methane
  const CH4_DENSITY = 0.67;     // kg CH4 per m³
  const N2O_PER_N = 44 / 28;    // N2O-N -> N2O
  const PROTEIN_PER_N = 6.25;
  const MILK_N = 0.0053;        // kg N per kg FPCM (3.3 % true protein / 6.38)
  const MILK_PROTEIN = 0.033;
  const EGG_N = 0.0192;         // kg N per kg egg (~12 % protein)
  const EGG_PROTEIN = 0.12;

  // ------------------------------------------------------------------ resolving inputs

  /** Merge defaults with user overrides into flat, numeric parameter sets. */
  function resolve(state) {
    const sp = DATA.SPECIES[state.species];
    const ov = state.overrides || {};
    const params = {};
    for (const [k, [v]] of Object.entries(sp.params)) {
      const o = ov.species && ov.species[state.species] && ov.species[state.species][k];
      params[k] = isNum(o) ? o : v;
    }
    const globals = {};
    for (const [k, meta] of Object.entries(DATA.GLOBAL_META)) {
      const o = ov.globals && ov.globals[k];
      globals[k] = isNum(o) ? o : meta.value;
    }
    const mmsId = state.mms || sp.mms.default;
    const m = DATA.MMS[mmsId];
    const mmsKey = mmsOverrideKey(mmsId, sp.group, state.climate);
    const mo = (ov.mms && ov.mms[mmsKey]) || {};
    const mms = {
      id: mmsId, label: m.label, liquid: !!m.liquid,
      MCF: pick(mo.MCF, m.MCF[state.climate]),
      EF3: pick(mo.EF3, m.EF3),
      fracGas: pick(mo.fracGas, m.fracGas[sp.group]),
      fracLeach: pick(mo.fracLeach, m.fracLeach[sp.group]),
      fracLoss: pick(mo.fracLoss, m.fracLoss[sp.group]),
    };
    const gwp = DATA.GWP[state.gwp] || DATA.GWP.AR6;
    return { sp, params, globals, mms, gwp };
  }

  function mmsOverrideKey(mmsId, group, climate) { return `${mmsId}|${group}|${climate}`; }

  // ------------------------------------------------------------------ herd dynamics

  /**
   * Annual animal flows per animal place.
   * Returns live-animal days, DMI per animal-day, animals bought/sold/dead (kg LW)
   * and the product list with N and protein contents.
   */
  function herd(sp, p) {
    const lw = (label, kg) => ({ label, kg, n: kg * p.nLW, protein: kg * p.nLW * PROTEIN_PER_N, animal: true });

    if (sp.kind === 'dairy') {
      const culls = Math.max(0, p.replacementRate - p.mortalityRate) * p.matureWeight;
      const products = [
        { label: 'Milk (FPCM)', kg: p.milkYield, n: p.milkYield * MILK_N, protein: p.milkYield * MILK_PROTEIN, fu: true },
        lw('Cull cows (LW)', culls),
        lw('Calves sold (LW)', p.calvesPerCow * p.calfWeight),
      ];
      return {
        animalDays: 365, dmi: p.dmi, occupancy: 1, cycles: null,
        animalsIn: p.replacementRate * p.heiferWeight, animalsInLabel: 'Replacement heifers',
        dead: p.mortalityRate * p.matureWeight,
        products, fuKg: p.milkYield,
      };
    }

    if (sp.kind === 'sow') {
      const piglets = p.pigletsWeaned * p.weanWeight;
      const culls = Math.max(0, p.replacementRate - p.mortalityRate) * p.cullWeight;
      const products = [
        { ...lw('Weaned piglets (LW)', piglets), fu: true },
        lw('Cull sows (LW)', culls),
      ];
      return {
        animalDays: 365, dmi: p.dmi, occupancy: 1, cycles: null,
        animalsIn: p.replacementRate * p.giltWeight, animalsInLabel: 'Replacement gilts',
        dead: p.mortalityRate * p.cullWeight,
        products, fuKg: piglets,
      };
    }

    // batch (all-in / all-out) systems: growers and layers
    const cycleLen = p.daysInPlace + p.downtimeDays;
    const cycles = 365 / cycleLen;
    const occupancy = p.daysInPlace / cycleLen;
    // deaths are spread over the cycle, so on average half of the dead birds/animals are present
    const animalDays = 365 * occupancy * (1 - p.mortality / 2);
    const animalsIn = cycles * p.weightIn;
    const sold = cycles * (1 - p.mortality) * p.weightOut;
    const dead = cycles * p.mortality * (p.weightIn + p.weightOut) / 2;

    if (sp.kind === 'layer') {
      const eggs = p.henDayRate * p.eggWeight * animalDays;
      return {
        animalDays, dmi: p.dmi, occupancy, cycles,
        animalsIn, animalsInLabel: 'Pullets placed', dead,
        products: [
          { label: 'Eggs', kg: eggs, n: eggs * EGG_N, protein: eggs * EGG_PROTEIN, fu: true },
          lw('Spent hens (LW)', sold),
        ],
        fuKg: eggs,
      };
    }

    // grower: DMI follows from feed conversion over the gain made on farm
    const adg = (p.weightOut - p.weightIn) / p.daysInPlace;
    return {
      animalDays, dmi: p.fcr * adg, occupancy, cycles, adg,
      animalsIn, animalsInLabel: 'Animals placed', dead,
      products: [lw('Animals sold (LW)', sold)],
      fuKg: sold - animalsIn,   // net live-weight produced on farm
    };
  }

  // ------------------------------------------------------------------ main calculation

  function compute(state) {
    const { sp, params: p, globals: g, mms, gwp } = resolve(state);
    const n = Math.max(0, Number(state.size) || 0);
    const h = herd(sp, p);
    const warnings = [];

    // --- feed & digestion (per place per year)
    const dmiYr = h.dmi * h.animalDays;                        // kg DM
    const feedAsFed = dmiYr / p.feedDM;
    const ge = dmiYr * GE_PER_KG_DM;                           // MJ
    const entericCH4 = ge * (p.ym / 100) / MJ_PER_KG_CH4;      // IPCC eq. 10.21
    const ts = dmiYr * (1 - p.de + p.ue);                      // excreted solids, IPCC eq. 10.24 (mass basis)
    const vs = ts * p.vsFrac;
    const manureWet = ts / p.tsContent;

    // --- nitrogen balance (IPCC eq. 10.31/10.32: Nex = N intake − N retained)
    const nIntake = dmiYr * p.cp / PROTEIN_PER_N;
    const nAnimalsIn = h.animalsIn * p.nLW;
    const nProducts = h.products.reduce((s, x) => s + x.n, 0);
    const nDead = h.dead * p.nLW;
    const nRetained = nProducts + nDead - nAnimalsIn;
    let nex = nIntake - nRetained;
    if (nex < 0) { warnings.push('N retained exceeds N intake — check crude protein, DMI or production inputs.'); nex = 0; }

    // --- manure management
    const manureCH4 = vs * p.bo * CH4_DENSITY * mms.MCF;       // IPCC eq. 10.23
    const n2oDirectN = nex * mms.EF3;
    const nVol = nex * mms.fracGas;
    const nLeach = nex * mms.fracLeach;
    const n2oIndirectN = nVol * g.EF4 + nLeach * g.EF5;
    const nOtherLoss = Math.max(0, nex * mms.fracLoss - nVol - nLeach - n2oDirectN); // N2 and unaccounted
    const nApplied = Math.max(0, nex - nVol - nLeach - n2oDirectN - nOtherLoss);

    // --- land application of the remaining manure N
    const appDirectN = nApplied * g.EF1;
    const appVol = nApplied * g.fracGasM;
    const appLeach = nApplied * g.fracLeachH;
    const appIndirectN = appVol * g.EF4 + appLeach * g.EF5;
    const nToSoil = Math.max(0, nApplied - appDirectN - appVol - appLeach);

    // --- water and energy
    const drink = p.drinkWater * h.animalDays;                 // L ≈ kg
    const service = p.serviceWater * h.animalDays;

    // --- water footprint per place per year, m³ (Water Footprint Network: green / blue / grey)
    const feedWF = state.includeFeed ? dmiYr / 1000 : 0;                 // t DM × m³/t DM
    const nLeachedTotal = nLeach + (state.includeLand ? appLeach : 0);   // kg N reaching water
    const wfPerPlace = {
      feedGreen: feedWF * p.feedWFgreen,
      feedBlue: feedWF * p.feedWFblue,
      feedGrey: feedWF * p.feedWFgrey,
      drink: drink / 1000,
      service: service / 1000,
      manureGrey: nLeachedTotal / g.wfCmaxN,                             // dilution volume
    };

    // --- emissions per place per year, kg CO2e
    const perPlace = {
      enteric:     entericCH4 * gwp.CH4,
      manureCH4:   manureCH4 * gwp.CH4,
      manureN2O:   (n2oDirectN + n2oIndirectN) * N2O_PER_N * gwp.N2O,
      landN2O:     state.includeLand ? (appDirectN + appIndirectN) * N2O_PER_N * gwp.N2O : 0,
      feed:        state.includeFeed ? dmiYr * p.feedEF : 0,
      fuel:        p.diesel * g.dieselEF + p.lpg * g.lpgEF,
      electricity: p.electricity * g.gridEF,
      water:       (drink + service) / 1000 * g.waterEF,
    };
    const perPlaceTotal = sum(Object.values(perPlace));

    const gases = {
      CH4: (entericCH4 + manureCH4) * n,
      N2O: (n2oDirectN + n2oIndirectN + (state.includeLand ? appDirectN + appIndirectN : 0)) * N2O_PER_N * n,
    };

    // --- farm totals
    const scale = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v * n]));
    const emissions = scale(perPlace);
    const total = perPlaceTotal * n;
    const fuKg = h.fuKg * n;
    const proteinKg = h.products.reduce((s, x) => s + x.protein, 0) * n;
    if (h.fuKg <= 0) warnings.push('Functional-unit output is zero or negative — check weights.');

    // --- mass balance (kg/yr, farm)
    const productsKg = h.products.reduce((s, x) => s + x.kg, 0);
    const massIn = { feed: feedAsFed, drink, service, animals: h.animalsIn };
    const massOutKnown = { products: productsKg, dead: h.dead, manure: manureWet, wastewater: service };
    const residual = sum(Object.values(massIn)) - sum(Object.values(massOutKnown));
    if (residual < 0) warnings.push('Mass balance does not close (outputs exceed inputs) — check water, feed DM or manure solids.');

    const wf = scale(wfPerPlace);
    const wfTotal = Object.values(wf).reduce((a, b) => a + b, 0);
    const waterFootprint = {
      ...wf,
      green: wf.feedGreen,
      blue: wf.feedBlue + wf.drink + wf.service,
      grey: wf.feedGrey + wf.manureGrey,
      total: wfTotal,
      perFU: fuKg > 0 ? wfTotal * 1000 / fuKg : NaN,          // L per kg functional unit
      perPlace: wfTotal / (n || 1),                           // m³ per animal place per year
    };

    return {
      species: sp, mms, gwp, params: p, globals: g, size: n, warnings,
      waterFootprint,
      herd: h,
      perPlace: { emissions: perPlace, total: perPlaceTotal },
      emissions, total, gases,
      intensity: {
        perFU: fuKg > 0 ? total / fuKg : NaN,
        perProtein: proteinKg > 0 ? total / proteinKg : NaN,
        perPlace: perPlaceTotal,
      },
      inventory: {
        // inputs
        feedDM: dmiYr * n, feedAsFed: feedAsFed * n, crudeProtein: dmiYr * p.cp * n,
        drinkWater: drink * n, serviceWater: service * n,
        electricity: p.electricity * n, diesel: p.diesel * n, lpg: p.lpg * n,
        animalsIn: h.animalsIn * n, animalsInLabel: h.animalsInLabel,
        // outputs
        products: h.products.map((x) => ({ ...x, kg: x.kg * n, n: x.n * n, protein: x.protein * n })),
        fuKg, proteinKg, dead: h.dead * n,
        manureWet: manureWet * n, manureTS: ts * n, manureVS: vs * n, nex: nex * n,
        wastewater: service * n,
        entericCH4: entericCH4 * n, manureCH4: manureCH4 * n,
        avgInventory: n * h.animalDays / 365,
      },
      mass: {
        in: scale(massIn),
        out: { ...scale(massOutKnown), vapour: Math.max(0, residual) * n },
        residual: residual * n,
      },
      nitrogen: {
        feed: nIntake * n, animalsIn: nAnimalsIn * n,
        products: nProducts * n, dead: nDead * n, excreted: nex * n,
        mms: { volatilised: nVol * n, leached: nLeach * n, n2o: n2oDirectN * n, other: nOtherLoss * n, applied: nApplied * n },
        field: { n2o: appDirectN * n, volatilised: appVol * n, leached: appLeach * n, soil: nToSoil * n },
      },
    };
  }

  /** US EPA CAFO size class (40 CFR 122.23). */
  function epaClass(speciesId, size, mmsId) {
    const sp = DATA.SPECIES[speciesId];
    const t = (sp.epa.liquid && DATA.MMS[mmsId] && DATA.MMS[mmsId].liquid) ? sp.epa.liquid : sp.epa;
    if (size >= t.large) return { id: 'large', label: 'Large CAFO', threshold: t.large };
    if (size >= t.medium) return { id: 'medium', label: 'Medium AFO', threshold: t.medium };
    return { id: 'small', label: 'Small AFO', threshold: t.medium };
  }

  function sum(a) { return a.reduce((s, x) => s + x, 0); }
  function isNum(x) { return typeof x === 'number' && Number.isFinite(x); }
  function pick(o, d) { return isNum(o) ? o : d; }

  const MODEL = { compute, resolve, epaClass, mmsOverrideKey, herd };
  if (typeof module !== 'undefined' && module.exports) module.exports = MODEL;
  else root.CAFO_MODEL = MODEL;
})(typeof window !== 'undefined' ? window : globalThis);
