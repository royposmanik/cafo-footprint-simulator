// Generates docs/CAFO-Footprint-Simulator.md from the simulator's own data and model,
// so the documented defaults, sources and example results always match the code.
// Usage: node scripts/generate-docs.js
const fs = require('fs');
const path = require('path');
const D = require('../js/data.js');
const M = require('../js/model.js');

const OUT = path.join(__dirname, '..', 'docs', 'CAFO-Footprint-Simulator.md');
const REF_KEYS = Object.keys(D.REFS);
const n = (k) => REF_KEYS.indexOf(k) + 1;
const cite = (refs) => (refs && refs.length ? refs.map((k) => `[${n(k)}]`).join('') : '');
const basis = (src) => D.BASIS[src.basis].label;
const srcCell = (src) => `${basis(src)} ${cite(src.refs)}`.trim();
const fmt = (v, d) => {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  if (d === undefined) d = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : 3;
  return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};
const md = (s) => String(s).replace(/\|/g, '\\|');
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(md).join(' | ')} |`)].join('\n');

const L = [];
const P = (...x) => L.push(...x.flatMap((block) => [block, '']));   // each block becomes its own paragraph
const date = new Date().toISOString().slice(0, 10);

// ------------------------------------------------------------------ header
P('# CAFO Footprint Simulator — technical documentation',
  '**By [W2R Lab](https://w2r-lab.vercel.app/index.html) (Waste-to-Resource Lab) at the Technion – Israel Institute of Technology**',
  `Live simulator: <https://cafo-footprint-simulator.vercel.app> · Source code: <https://github.com/royposmanik/cafo-footprint-simulator> · Generated ${date} from the simulator's data and model.`,
  '> **Status of the defaults.** Every coefficient is labelled by how it relates to its source: *From source* (copied from the cited document), *Approximated* (derived or rounded from it — verify against the original table before publishing) or *Assumption* (a typical business-as-usual value chosen by the model author — replace with site data). All coefficients can be edited in the simulator under *Advanced settings*.');

P('## Contents',
  '1. [Purpose and scope](#1-purpose-and-scope)',
  '2. [Using the simulator](#2-using-the-simulator)',
  '3. [Operation types, boundary and functional units](#3-operation-types-boundary-and-functional-units)',
  '4. [Calculation methods](#4-calculation-methods)',
  '5. [Default coefficients by operation type](#5-default-coefficients-by-operation-type)',
  '6. [Manure management systems](#6-manure-management-systems)',
  '7. [Emission factors, GWP sets and constants](#7-emission-factors-gwp-sets-and-constants)',
  '8. [Default results](#8-default-results)',
  '9. [Opening-page live counter](#9-opening-page-live-counter)',
  '10. [Limitations](#10-limitations)',
  '11. [Software and deployment](#11-software-and-deployment)',
  '12. [References](#12-references)');

// ------------------------------------------------------------------ 1
P('## 1. Purpose and scope',
  'The CAFO Footprint Simulator estimates the annual inputs, outputs and environmental footprints of a concentrated animal feeding operation (CAFO) managed under **business as usual (BAU)**. The user selects the operation type, farm size, manure management system, climate, electricity grid and system boundary; the simulator then computes:',
  '- **Inputs:** feed (as fed, dry matter, crude protein), drinking and service water, electricity, diesel, LPG and purchased animals.\n- **Outputs:** products (milk, eggs, live weight), mortalities, manure (wet mass, total and volatile solids, nitrogen), wastewater and gaseous losses.\n- **Carbon footprint:** CH₄, N₂O and CO₂ expressed as CO₂ equivalent, by source and GHG Protocol scope.\n- **Nitrogen balance:** from feed N through the herd and manure to air, water and soil.\n- **Water footprint:** green, blue and grey water (Water Footprint Network method).',
  'Results are presented as Sankey diagrams (material, nitrogen, carbon and water), key figures and inventory tables, and can be exported as CSV, branded PDF or JPEG. Mitigation options (digesters, covers, additives) are deliberately excluded so that BAU serves as a clean baseline.');

// ------------------------------------------------------------------ 2
P('## 2. Using the simulator',
  '1. **Animal category** — one of seven CAFO types (section 3).\n2. **Farm size** — number of animal places; a scale shows the US EPA Small / Medium / Large CAFO class [' + n('cfr') + '].\n3. **Manure management and climate** — the BAU system is pre-selected; climate sets the methane conversion factor.\n4. **Energy and system boundary** — electricity grid factor, inclusion of feed production (Scope 3 emissions and feed water footprint) and of manure land application, and the GWP set.\n5. **Calculate** — results open on the *Material flows* Sankey; tabs switch to *Nitrogen balance*, *Carbon footprint* and *Water footprint*.',
  '**Exports.** *Export CSV* writes the scenario, emissions, intensities, inventory, water footprint, nitrogen flows, all coefficients with their source tags, constants and the reference list. *Save PDF* (computer) and *Save JPEG* produce an A4 landscape sheet with the W2R Lab and Technion header, figure, scenario, key figures and notes; on phones *Save to gallery* shares the JPEG to the photo gallery. On screens narrower than 600 px Sankey diagrams use numbered nodes with a key.');

// ------------------------------------------------------------------ 3
P('## 3. Operation types, boundary and functional units',
  table(['Operation type', 'Size unit', 'BAU manure system', 'Functional unit', 'US EPA Large CAFO threshold', 'Boundary note'],
    Object.values(D.SPECIES).map((s) => [s.label, s.unit, D.MMS[s.mms.default].label, s.fu.label, `≥ ${fmt(s.epa.large, 0)} ${s.epa.basis}`, s.note])),
  '**System boundary.** Cradle-to-farm-gate for one year of operation at the selected capacity. Emissions from animals before they enter the farm (heifer rearing, nursery, hatchery, cow-calf), bedding, buildings, carcass disposal, manure transport and land-use change are excluded. Feed production and manure land application can be switched off.',
  '**Allocation.** None: all emissions are attributed to the functional unit. A per-kg-protein intensity covering all products (milk or eggs plus live weight sold) is reported alongside.');

// ------------------------------------------------------------------ 4
P('## 4. Calculation methods',
  'All quantities are computed per **animal place per year** and multiplied by the number of places. Equation numbers refer to IPCC (2019) [' + n('ipcc2019') + '], Vol. 4, Ch. 10 unless stated otherwise.');
P('### 4.1 Herd dynamics',
  '- **Continuous herds (dairy, sows):** animal-days = 365; replacements bought = replacement rate × entry weight; culls sold = (replacement rate − mortality) × cull weight; deaths = mortality × adult weight; plus milk (dairy) or weaned piglets (sows).\n- **Batch systems (feedlot, swine finishing, broilers, layers, turkeys):** cycles = 365 / (days on farm + downtime); occupancy = days / (days + downtime); live animal-days = 365 × occupancy × (1 − mortality / 2); animals placed = cycles × entry weight; animals sold = cycles × (1 − mortality) × exit weight; deaths = cycles × mortality × mean weight.\n- **Feed intake:** growers DMI = FCR × average daily gain, ADG = (exit − entry weight) / days on farm; dairy, sows and layers use a DMI per animal-day.\n- **Functional unit:** FPCM (dairy), net live-weight gain = sold − placed (growers), eggs (layers) or weaned piglet live weight (sows).');
P('### 4.2 Enteric methane (Eq. 10.21)', '```\nCH4_enteric = DMI × 18.45 MJ/kg DM × (Ym / 100) / 55.65 MJ/kg CH4\n```');
P('### 4.3 Manure solids (Eq. 10.24, mass basis)', '```\nTS  = DMI × (1 − DE + UE)          excreted total solids\nVS  = TS × (VS/TS)                  volatile solids\nwet manure = TS / TS content        as excreted\n```');
P('### 4.4 Manure methane (Eq. 10.23)', '```\nCH4_manure = VS × Bo × 0.67 kg/m³ × MCF(system, climate)\n```');
P('### 4.5 Nitrogen excretion (Tier 2)', '```\nN_intake   = DMI × CP / 6.25\nN_retained = N in products + N in mortalities − N in purchased animals\nNex        = N_intake − N_retained\n```', `Product N: milk 0.0053 kg N/kg FPCM ${cite(['idf', 'jones'])}, eggs 0.0192 kg N/kg ${cite(['fdc'])}, live weight = body N content × live weight.`);
P('### 4.6 Manure N₂O and nitrogen partition', '```\nN2O_direct   = Nex × EF3 × 44/28                                  (Eq. 10.25)\nN_volatilised = Nex × FracGasMS          N_leached = Nex × FracLeachMS\nN2O_indirect = (N_volatilised × EF4 + N_leached × EF5) × 44/28\nN_other      = Nex × FracLossMS − N_volatilised − N_leached − Nex × EF3   (N2 and unaccounted)\nN_applied    = Nex − N_volatilised − N_leached − Nex × EF3 − N_other\n```');
P('### 4.7 Land application (IPCC 2019, Ch. 11)', '```\nN2O_field = (N_applied × EF1 + N_applied × FracGASM × EF4 + N_applied × FracLEACH × EF5) × 44/28\nN_soil    = N_applied × (1 − EF1 − FracGASM − FracLEACH)\n```');
P('### 4.8 Supply-chain and energy emissions', '```\nFeed        = DMI × feed footprint (kg CO2 equivalent / kg DM, excl. land-use change)\nElectricity = kWh × grid factor\nFuels       = diesel L × diesel factor + LPG L × LPG factor\nWater       = (drinking + service water) m³ × water-supply factor\n```');
P('### 4.9 CO₂ equivalent and scopes',
  '**CO₂ equivalent** expresses different greenhouse gases as the amount of CO₂ that would cause the same warming over 100 years: CO₂ equivalent = CO₂ + CH₄ × GWP₁₀₀(CH₄) + N₂O × GWP₁₀₀(N₂O) (section 7.2). Feed footprints are taken as CO₂ equivalent values directly.',
  table(['Emission source', 'Gas', 'GHG Protocol scope [' + n('ghgp') + ']'], D.SOURCES.map((s) => [s.label, s.gas === 'mixed' ? 'mixed (LCA value)' : s.gas, s.scope])));
P('### 4.10 Water footprint (Water Footprint Network method [' + n('hoekstra2011') + '])', '```\nFeed green / blue / grey (m³) = DMI (t DM) × crop water footprint (m³/t DM) of the ration\nOn-farm blue (m³)             = drinking water + service water\nManure grey (m³)              = N leached (storage + fields) / (c_max − c_nat)\n```', `with c_max = 10 mg NO₃-N/L and c_nat = 0 [${n('franke2013')}]. Feed water footprints are ration-weighted from global-average crop water footprints [${n('mekonnen2011')}].`);
P('### 4.11 Mass balance', 'Respiration & evaporation = (feed as fed + drinking water + service water + purchased animals) − (products + mortalities + manure as excreted + wastewater). The residual represents CO₂ and water vapour exhaled by animals and evaporated from housing; a negative residual triggers a warning.');
P('### 4.12 Intensities', '- per functional unit = total / functional-unit output\n- per animal place = total / number of places\n- per kg protein = total / protein in all products (N × 6.25 for live weight)\n- nitrogen use efficiency = N in products / feed N');

// ------------------------------------------------------------------ 5
P('## 5. Default coefficients by operation type', 'Units per animal-day refer to live, occupied animal-days; units per place refer to housing capacity.');
for (const [id, s] of Object.entries(D.SPECIES)) {
  const rows = Object.entries(s.params).map(([k, [v, src]]) => {
    const meta = D.PARAM_META[k];
    return [meta.group, meta.label, v, meta.unit, srcCell(src), src.note];
  });
  P(`### 5.${Object.keys(D.SPECIES).indexOf(id) + 1} ${s.label}`, `*${s.note}* Default size ${fmt(s.size.default, 0)} ${s.unit}; size presets ${s.size.presets.map((x) => fmt(x, 0)).join(' / ')}.`,
    table(['Group', 'Parameter', 'Default', 'Unit', 'Basis', 'Note'], rows));
}

// ------------------------------------------------------------------ 6
P('## 6. Manure management systems', `Source for all values: ${srcCell(D.SRC.mms)} — ${D.SRC.mms.note}.`);
P('### 6.1 Methane conversion factor and direct N₂O',
  table(['System', 'MCF cool', 'MCF temperate', 'MCF warm', 'EF3 (kg N₂O-N/kg N)'],
    Object.values(D.MMS).map((m) => [m.label, m.MCF.cool, m.MCF.temperate, m.MCF.warm, m.EF3])),
  `Climates: ${Object.values(D.CLIMATES).join('; ')}.`);
P('### 6.2 Nitrogen loss fractions by animal group (FracGas / FracLeach / FracLoss)',
  table(['System', 'Dairy', 'Beef', 'Swine', 'Poultry'],
    Object.values(D.MMS).map((m) => [m.label, ...['dairy', 'beef', 'swine', 'poultry'].map((g) => `${m.fracGas[g]} / ${m.fracLeach[g]} / ${m.fracLoss[g]}`)])));
P('### 6.3 Systems available per operation type', table(['Operation type', 'Options (BAU default first)'],
  Object.values(D.SPECIES).map((s) => [s.label, [s.mms.default, ...s.mms.options.filter((o) => o !== s.mms.default)].map((o) => D.MMS[o].label).join('; ')])));

// ------------------------------------------------------------------ 7
P('## 7. Emission factors, GWP sets and constants');
P('### 7.1 Emission factors (all operation types)', table(['Factor', 'Default', 'Unit', 'Basis', 'Note'],
  Object.values(D.GLOBAL_META).map((g) => [g.label, g.value, g.unit, srcCell(g.src), g.src.note])));
P('**Electricity grid presets**', table(['Grid', 'kg CO₂ equivalent/kWh', 'Basis', 'Note'],
  Object.values(D.GRID_PRESETS).map((g) => [g.label, g.value, srcCell(g.src), g.src.note])));
P('### 7.2 Global warming potentials (100-year)', table(['Set', 'CH₄', 'N₂O', 'Source'],
  Object.entries(D.GWP).map(([k, g]) => [g.label + (k === 'AR6' ? ' (default)' : ''), g.CH4, g.N2O, cite([g.ref])])));
P('### 7.3 Fixed constants', table(['Constant', 'Value', 'Basis', 'Note'], D.CONSTANTS.map((c) => [c.label, c.value, srcCell(c.src), c.src.note])));

// ------------------------------------------------------------------ 8
P('## 8. Default results', 'Each operation type at its default size, BAU manure system, temperate climate, US grid, AR6 GWPs, feed production and land application included.');
const res = Object.entries(D.SPECIES).map(([id, s]) => {
  const r = M.compute({ species: id, size: s.size.default, mms: s.mms.default, climate: 'temperate', gwp: 'AR6', includeFeed: true, includeLand: true });
  const e = r.emissions, t = r.total;
  const top = D.SOURCES.map((x) => [x.label, e[x.key]]).sort((a, b) => b[1] - a[1])[0];
  return { s, r, top: `${top[0]} (${fmt(100 * top[1] / t, 0)} %)` };
});
P(table(['Operation type', 'Size', 'Total (t CO₂ equivalent/yr)', 'Per functional unit (kg CO₂ equivalent)', 'Largest source', 'Water footprint (L per FU)', 'Green / blue / grey', 'N use efficiency'],
  res.map(({ s, r, top }) => [s.label, `${fmt(s.size.default, 0)} ${s.unit.replace(/ (.*)$/, '')}`, fmt(r.total / 1000, 0), `${fmt(r.intensity.perFU, 2)} / ${s.fu.label}`, top,
    `${fmt(r.waterFootprint.perFU, 0)} / ${s.fu.label}`,
    ['green', 'blue', 'grey'].map((k) => fmt(100 * r.waterFootprint[k] / r.waterFootprint.total, 0)).join(' / ') + ' %',
    fmt(100 * r.nitrogen.products / r.nitrogen.feed, 0) + ' %'])));
P('### 8.1 Emissions by source (kg CO₂ equivalent per functional unit)', table(['Operation type', ...D.SOURCES.map((x) => x.label)],
  res.map(({ s, r }) => [s.label, ...D.SOURCES.map((x) => fmt(r.emissions[x.key] / r.inventory.fuKg, 2))])));

// ------------------------------------------------------------------ 9
const C = D.GLOBAL_CLOCK;
P('## 9. Opening-page live counter',
  `The counter spreads ${fmt(C.annualTonnesCO2e / 1e9, 1)} Gt CO₂ equivalent per year — ${C.scope} in ${C.refYear} [${n('fao2023')}] — evenly over the year (≈ ${fmt(C.annualTonnesCO2e / (365.25 * 86400), 0)} t per second, ≈ ${fmt(C.annualTonnesCO2e / 365.25 / 1e6, 1)} Mt per day) and counts from local midnight. Livestock's share of anthropogenic emissions (≈ ${fmt(C.shareOfAnthropogenic * 100, 0)} %) is from the same source; the methane share (≈ ${fmt(C.methaneShare * 100, 0)} %) from [${n('unep2021')}]. No reliable global estimate exists for CAFOs alone, so the counter covers all livestock and is shown as context, not as a CAFO total.`);

// ------------------------------------------------------------------ 10
P('## 10. Limitations',
  '- Default coefficients are indicative; values marked *Approximated* were transcribed from IPCC tables without line-by-line verification, and *Assumption* values are typical US BAU figures.\n- One manure management system receives all excreted manure; solid separation and mixed systems are not modelled.\n- Feed footprints and feed water footprints are ration-level averages and exclude land-use change; irrigated forage in arid regions can raise blue water substantially.\n- Pre-farm animal rearing, bedding, buildings, carcass disposal and manure transport are outside the boundary; no co-product allocation is applied.\n- Steady-state annual averages: no seasonality, herd growth or year-to-year variation.\n- The live counter uses a global livestock estimate for 2015, not CAFOs specifically.');

// ------------------------------------------------------------------ 11
P('## 11. Software and deployment',
  'Static web application without build step or runtime dependencies (the Figtree web font and, for PDF export, jsPDF are loaded from CDNs).',
  table(['File', 'Content'], [
    ['index.html', 'page structure: opening page, setup steps, results'],
    ['css/styles.css', 'styles, W2R Lab palette, light and dark themes'],
    ['js/data.js', 'all default coefficients, sources and references'],
    ['js/model.js', 'calculation engine (browser and Node)'],
    ['js/charts.js', 'Sankey renderer and emission bars'],
    ['js/icons.js', 'line-icon set'],
    ['js/export.js', 'branded PDF / JPEG export'],
    ['js/app.js', 'user interface'],
    ['tests/sanity.js', 'model checks (mass, nitrogen and water balances)'],
    ['scripts/generate-docs.js', 'generates this document'],
  ]),
  'Hosted on Vercel (team W2R) from the GitHub repository; every push to `main` redeploys. Regenerate this document with `node scripts/generate-docs.js` after changing data or model.');

// ------------------------------------------------------------------ 12
P('## 12. References', REF_KEYS.map((k, i) => `${i + 1}. ${D.REFS[k].full}${D.REFS[k].url ? ' <' + D.REFS[k].url + '>' : ''}`).join('\n'));

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, L.join('\n'));
console.log(`Wrote ${path.relative(process.cwd(), OUT)} (${L.join('\n').length.toLocaleString()} characters)`);
