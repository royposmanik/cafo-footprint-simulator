/*
 * Default coefficients for the CAFO business-as-usual (BAU) carbon-footprint calculator.
 *
 * Every number here is a *default* — all of them can be overridden in the UI
 * ("Assumptions" panel). Values marked "assumption" are typical US BAU figures
 * chosen by the model author; replace them with site or inventory data.
 *
 * Units convention: all per-animal values are per *animal place* (housing capacity)
 * unless the unit says "per animal-day" (an occupied, live animal-day).
 */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- references
  // Numbered in this order in the UI and README.
  const REFS = {
    ipcc2019: {
      short: 'IPCC 2019',
      full: 'IPCC (2019). 2019 Refinement to the 2006 IPCC Guidelines for National Greenhouse Gas Inventories. Vol. 4: Agriculture, Forestry and Other Land Use — Ch. 10 "Emissions from Livestock and Manure Management" and Ch. 11 "N2O Emissions from Managed Soils, and CO2 Emissions from Lime and Urea Application". Calvo Buendia, E., Tanabe, K., Kranjc, A., Baasansuren, J., Fukuda, M., Ngarize, S., Osako, A., Pyrozhenko, Y., Shermanau, P. & Federici, S. (eds). IPCC, Switzerland.',
      url: 'https://www.ipcc-nggip.iges.or.jp/public/2019rf/vol4.html',
    },
    ipcc2006: {
      short: 'IPCC 2006',
      full: 'IPCC (2006). 2006 IPCC Guidelines for National Greenhouse Gas Inventories. Vol. 4: Agriculture, Forestry and Other Land Use, Ch. 10 "Emissions from Livestock and Manure Management" (incl. Annex 10A.2). Eggleston, H.S., Buendia, L., Miwa, K., Ngara, T. & Tanabe, K. (eds). IGES, Japan.',
      url: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html',
    },
    ar6: {
      short: 'IPCC AR6',
      full: 'Forster, P. et al. (2021). The Earth’s Energy Budget, Climate Feedbacks, and Climate Sensitivity. In: Climate Change 2021: The Physical Science Basis. Contribution of Working Group I to the Sixth Assessment Report of the IPCC. Cambridge University Press. Table 7.15 (GWP100: CH4 non-fossil 27.0, N2O 273).',
      url: 'https://www.ipcc.ch/report/ar6/wg1/',
    },
    ar5: {
      short: 'IPCC AR5',
      full: 'Myhre, G. et al. (2013). Anthropogenic and Natural Radiative Forcing. In: Climate Change 2013: The Physical Science Basis. Contribution of Working Group I to the Fifth Assessment Report of the IPCC. Cambridge University Press. Table 8.7 (GWP100: CH4 28, N2O 265).',
      url: 'https://www.ipcc.ch/report/ar5/wg1/',
    },
    ar4: {
      short: 'IPCC AR4',
      full: 'Forster, P. et al. (2007). Changes in Atmospheric Constituents and in Radiative Forcing. In: Climate Change 2007: The Physical Science Basis. Contribution of Working Group I to the Fourth Assessment Report of the IPCC. Cambridge University Press. Table 2.14 (GWP100: CH4 25, N2O 298).',
      url: 'https://www.ipcc.ch/report/ar4/wg1/',
    },
    asabe: {
      short: 'ASABE D384.2',
      full: 'ASABE (2005, reaffirmed). ASAE D384.2: Manure Production and Characteristics. American Society of Agricultural and Biological Engineers, St. Joseph, MI.',
    },
    cfr: {
      short: '40 CFR 122.23',
      full: 'US Code of Federal Regulations, 40 CFR § 122.23 — Concentrated animal feeding operations (applicability; size thresholds for Large and Medium CAFOs).',
      url: 'https://www.ecfr.gov/current/title-40/chapter-I/subchapter-D/part-122/subpart-B/section-122.23',
    },
    epaHub: {
      short: 'US EPA EF Hub',
      full: 'US EPA. GHG Emission Factors Hub. Center for Corporate Climate Leadership (combustion CO2: diesel 10.21 kg/gal; propane 5.72 kg/gal).',
      url: 'https://www.epa.gov/climateleadership/ghg-emission-factors-hub',
    },
    egrid: {
      short: 'US EPA eGRID',
      full: 'US EPA. Emissions & Generation Resource Integrated Database (eGRID) — US national average output emission rate.',
      url: 'https://www.epa.gov/egrid',
    },
    eea: {
      short: 'EEA',
      full: 'European Environment Agency. Greenhouse gas emission intensity of electricity generation in Europe (indicator).',
    },
    ghgp: {
      short: 'GHG Protocol',
      full: 'WRI & WBCSD (2004). The Greenhouse Gas Protocol: A Corporate Accounting and Reporting Standard, revised edition (Scope 1/2/3 definitions).',
      url: 'https://ghgprotocol.org/corporate-standard',
    },
    gerber2013: {
      short: 'Gerber et al. 2013',
      full: 'Gerber, P.J., Steinfeld, H., Henderson, B., Mottet, A., Opio, C., Dijkman, J., Falcucci, A. & Tempio, G. (2013). Tackling climate change through livestock — A global assessment of emissions and mitigation opportunities. FAO, Rome (GLEAM results).',
    },
    feedprint: {
      short: 'Vellinga et al. 2013',
      full: 'Vellinga, Th.V., Blonk, H., Marinussen, M., van Zeist, W.J., de Boer, I.J.M. & Starmans, D. (2013). Methodology used in FeedPrint: a tool quantifying greenhouse gas emissions of feed production and utilization. Wageningen UR Livestock Research, Report 674.',
    },
    idf: {
      short: 'IDF 2022',
      full: 'International Dairy Federation (2022). The IDF global Carbon Footprint standard for the dairy sector. Bulletin of the IDF No. 520/2022 (fat- and protein-corrected milk as functional unit).',
    },
    jones: {
      short: 'Jones 1931',
      full: 'Jones, D.B. (1931). Factors for converting percentages of nitrogen in foods and feeds into percentages of proteins. USDA Circular No. 183 (N × 6.25; milk N × 6.38).',
    },
    nass: {
      short: 'USDA NASS',
      full: 'USDA National Agricultural Statistics Service. Milk Production; Poultry — Production and Value; Quarterly Hogs and Pigs; Cattle on Feed (orientation for typical US production levels only).',
      url: 'https://www.nass.usda.gov/',
    },
    fdc: {
      short: 'USDA FoodData Central',
      full: 'USDA Agricultural Research Service. FoodData Central — Egg, whole, raw, fresh (protein ≈ 12–13 %).',
      url: 'https://fdc.nal.usda.gov/',
    },
    hoekstra2011: {
      short: 'Hoekstra et al. 2011',
      full: 'Hoekstra, A.Y., Chapagain, A.K., Aldaya, M.M. & Mekonnen, M.M. (2011). The Water Footprint Assessment Manual: Setting the Global Standard. Earthscan, London (green, blue and grey water footprint definitions).',
    },
    mekonnen2011: {
      short: 'Mekonnen & Hoekstra 2011',
      full: 'Mekonnen, M.M. & Hoekstra, A.Y. (2011). The green, blue and grey water footprint of crops and derived crop products. Hydrology and Earth System Sciences 15, 1577–1600 (global averages, e.g. maize ≈ 1,222 m³/t; soybean ≈ 2,145 m³/t; wheat ≈ 1,827 m³/t).',
    },
    mekonnen2012: {
      short: 'Mekonnen & Hoekstra 2012',
      full: 'Mekonnen, M.M. & Hoekstra, A.Y. (2012). A global assessment of the water footprint of farm animal products. Ecosystems 15, 401–415 (benchmark product water footprints by production system).',
    },
    franke2013: {
      short: 'Franke et al. 2013',
      full: 'Franke, N.A., Boyacioglu, H. & Hoekstra, A.Y. (2013). Grey water footprint accounting: Tier 1 supporting guidelines. Value of Water Research Report Series No. 65, UNESCO-IHE, Delft (grey WF = pollutant load ÷ (c_max − c_nat)).',
    },
    fao2023: {
      short: 'FAO 2023',
      full: 'FAO (2023). Pathways towards lower emissions — A global assessment of the greenhouse gas emissions and mitigation options from livestock agrifood systems. Food and Agriculture Organization of the United Nations, Rome (GLEAM 3: livestock supply chains ≈ 6.2 Gt CO₂ equivalent in 2015, ≈ 12 % of anthropogenic emissions).',
    },
    unep2021: {
      short: 'UNEP & CCAC 2021',
      full: 'United Nations Environment Programme & Climate and Clean Air Coalition (2021). Global Methane Assessment: Benefits and Costs of Mitigating Methane Emissions. UNEP, Nairobi (livestock ≈ 32 % of anthropogenic methane).',
    },
    vehicle: {
      short: 'US EPA vehicle',
      full: 'US EPA. Greenhouse Gas Emissions from a Typical Passenger Vehicle (≈ 4.6 t CO2 per vehicle per year).',
      url: 'https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle',
    },
  };

  // How a default value relates to its references:
  //   taken   — value copied from the cited source
  //   approx  — derived or rounded from the cited source; verify against the original table
  //   assumed — model-author assumption (informed by the cited sources where given); replace with site data
  const BASIS = {
    taken:   { icon: '✔', label: 'From source' },
    approx:  { icon: '≈', label: 'Approximated' },
    assumed: { icon: '✎', label: 'Assumption' },
  };

  const SRC = {
    eq:        { refs: ['ipcc2019'], basis: 'taken', note: 'Tier 2 equation (Ch. 10)' },
    ue:        { refs: ['ipcc2019'], basis: 'taken', note: 'Default urinary energy: cattle 0.04, swine 0.02 of GE' },
    de:        { refs: ['ipcc2019'], basis: 'approx', note: 'Chosen within the IPCC digestibility ranges for the feeding situation' },
    ym:        { refs: ['ipcc2019'], basis: 'approx', note: 'Ym defaults (high-producing dairy 5.7 %, feedlot 3.0 %)' },
    ymSwine:   { refs: ['ipcc2019'], basis: 'assumed', note: 'IPCC gives no Ym for swine; set so enteric CH4 ≈ IPCC Tier 1 swine factor (~1.5 kg CH4/head/yr)' },
    ymPoultry: { refs: ['ipcc2019'], basis: 'taken', note: 'IPCC gives no enteric CH4 factor for poultry (negligible) → 0' },
    bo:        { refs: ['ipcc2006', 'ipcc2019'], basis: 'approx', note: 'Bo for North America (2006 Annex 10A.2; 2019 Table 10.16)' },
    mms:       { refs: ['ipcc2019', 'ipcc2006'], basis: 'approx', note: 'MCF (2019 Table 10.17), EF3 (2019 Table 10.21), FracGas / FracLeach / FracLoss (2006 Tables 10.22–10.23); rounded and grouped into three climates' },
    soil:      { refs: ['ipcc2019'], basis: 'taken', note: 'Aggregated defaults, Ch. 11 Tables 11.1 & 11.3' },
    asabe:     { refs: ['asabe'], basis: 'approx', note: 'Typical as-excreted manure characteristics, rounded' },
    prod:      { refs: ['nass'], basis: 'assumed', note: 'Typical US production level, rounded' },
    assumed:   { refs: [], basis: 'assumed', note: 'Model-author assumption — replace with site data' },
    nlw:       { refs: [], basis: 'assumed', note: 'Typical whole-body N content (≈ 2.5 % mammals, 2.9 % poultry)' },
    lca:       { refs: ['gerber2013', 'feedprint'], basis: 'assumed', note: 'Indicative value within published feed LCA ranges; excludes land-use change' },
    epa:       { refs: ['epaHub'], basis: 'taken', note: 'Combustion CO2, converted from per-gallon to per-litre' },
    water:     { refs: [], basis: 'assumed', note: 'Pumping & treatment energy assumption' },
    wfFeed:    { refs: ['mekonnen2011'], basis: 'assumed', note: 'Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM' },
  };

  // Fixed constants used inside the model (js/model.js).
  const CONSTANTS = [
    { label: 'Gross energy of feed', value: '18.45 MJ/kg DM', src: { refs: ['ipcc2019'], basis: 'taken', note: 'IPCC default energy density of feed' } },
    { label: 'Energy content of methane', value: '55.65 MJ/kg CH4', src: { refs: ['ipcc2019'], basis: 'taken', note: 'Enteric CH4 equation' } },
    { label: 'Methane density', value: '0.67 kg/m³', src: { refs: ['ipcc2019'], basis: 'taken', note: 'Manure CH4 equation' } },
    { label: 'N2O-N → N2O', value: '44/28', src: { refs: ['ipcc2019'], basis: 'taken', note: 'Stoichiometric conversion' } },
    { label: 'Protein = N × 6.25', value: '6.25', src: { refs: ['jones'], basis: 'taken', note: 'Feed and live-weight protein' } },
    { label: 'Milk N content', value: '0.0053 kg N/kg FPCM', src: { refs: ['idf', 'jones'], basis: 'approx', note: '3.3 % true protein ÷ 6.38' } },
    { label: 'Egg N content', value: '0.0192 kg N/kg egg', src: { refs: ['fdc', 'jones'], basis: 'approx', note: '≈ 12 % protein ÷ 6.25' } },
    { label: 'Typical passenger car', value: '4.6 t CO2/yr', src: { refs: ['vehicle'], basis: 'taken', note: 'Only for the “like driving” comparison' } },
  ];

  // ---------------------------------------------------------------- parameter metadata
  const PARAM_META = {
    // herd & production — dairy / sow (continuous herds)
    milkYield:       { label: 'Milk yield (fat & protein corrected)', unit: 'kg FPCM/cow/yr', group: 'Herd & production' },
    matureWeight:    { label: 'Mature body weight', unit: 'kg LW', group: 'Herd & production' },
    heiferWeight:    { label: 'Replacement heifer weight at entry', unit: 'kg LW', group: 'Herd & production' },
    replacementRate: { label: 'Replacement rate', unit: 'fraction/yr', group: 'Herd & production' },
    mortalityRate:   { label: 'Adult mortality', unit: 'fraction/yr', group: 'Herd & production' },
    calvesPerCow:    { label: 'Calves sold', unit: 'head/cow/yr', group: 'Herd & production' },
    calfWeight:      { label: 'Calf weight at sale', unit: 'kg LW', group: 'Herd & production' },
    pigletsWeaned:   { label: 'Piglets weaned', unit: 'head/sow/yr', group: 'Herd & production' },
    weanWeight:      { label: 'Weaning weight', unit: 'kg LW', group: 'Herd & production' },
    giltWeight:      { label: 'Replacement gilt weight at entry', unit: 'kg LW', group: 'Herd & production' },
    cullWeight:      { label: 'Cull sow weight', unit: 'kg LW', group: 'Herd & production' },
    // herd & production — batch (all-in/all-out) systems
    weightIn:        { label: 'Weight at placement', unit: 'kg LW', group: 'Herd & production' },
    weightOut:       { label: 'Weight at market / depletion', unit: 'kg LW', group: 'Herd & production' },
    daysInPlace:     { label: 'Days on farm per cycle', unit: 'd', group: 'Herd & production' },
    downtimeDays:    { label: 'Downtime between cycles (cleaning)', unit: 'd', group: 'Herd & production' },
    mortality:       { label: 'Mortality per cycle', unit: 'fraction', group: 'Herd & production' },
    fcr:             { label: 'Feed conversion ratio', unit: 'kg DM / kg LW gain', group: 'Herd & production' },
    henDayRate:      { label: 'Laying rate', unit: 'eggs/hen-day', group: 'Herd & production' },
    eggWeight:       { label: 'Average egg weight', unit: 'kg/egg', group: 'Herd & production' },
    // diet & digestion
    dmi:             { label: 'Dry-matter intake', unit: 'kg DM/animal-day', group: 'Diet & digestion' },
    cp:              { label: 'Dietary crude protein', unit: 'fraction of DM', group: 'Diet & digestion' },
    de:              { label: 'Digestibility (DE/GE; ME/GE for poultry)', unit: 'fraction', group: 'Diet & digestion' },
    ue:              { label: 'Urinary energy', unit: 'fraction of GE', group: 'Diet & digestion' },
    ym:              { label: 'Methane conversion factor Ym', unit: '% of GE', group: 'Diet & digestion' },
    feedDM:          { label: 'Feed dry-matter content (as fed)', unit: 'fraction', group: 'Diet & digestion' },
    // manure
    vsFrac:          { label: 'Volatile solids in manure solids (VS/TS)', unit: 'fraction', group: 'Manure' },
    tsContent:       { label: 'Total solids in manure as excreted', unit: 'fraction', group: 'Manure' },
    bo:              { label: 'Max. CH4 producing capacity Bo', unit: 'm³ CH4/kg VS', group: 'Manure' },
    nLW:             { label: 'N content of live weight', unit: 'kg N/kg LW', group: 'Manure' },
    // water
    drinkWater:      { label: 'Drinking water', unit: 'L/animal-day', group: 'Water' },
    serviceWater:    { label: 'Service water (wash, parlor, cooling)', unit: 'L/animal-day', group: 'Water' },
    // energy
    electricity:     { label: 'Electricity', unit: 'kWh/place/yr', group: 'Energy' },
    diesel:          { label: 'Diesel (feeding, manure handling)', unit: 'L/place/yr', group: 'Energy' },
    lpg:             { label: 'Propane / LPG (heating, hot water)', unit: 'L/place/yr', group: 'Energy' },
    // upstream
    feedEF:          { label: 'Feed production footprint', unit: 'kg CO₂ equivalent/kg DM', group: 'Upstream' },
    feedWFgreen:     { label: 'Feed water footprint — green', unit: 'L/kg DM', group: 'Water footprint' },
    feedWFblue:      { label: 'Feed water footprint — blue', unit: 'L/kg DM', group: 'Water footprint' },
    feedWFgrey:      { label: 'Feed water footprint — grey', unit: 'L/kg DM', group: 'Water footprint' },
  };

  // ---------------------------------------------------------------- manure management systems
  // MCF by climate; EF3 = direct N2O-N per kg N; fracGas / fracLeach / fracLoss per animal group.
  const MMS = {
    lagoon: {
      label: 'Uncovered anaerobic lagoon',
      MCF: { cool: 0.70, temperate: 0.76, warm: 0.80 },
      EF3: 0,
      fracGas:   { dairy: 0.35, beef: 0.35, swine: 0.40, poultry: 0.40 },
      fracLeach: { dairy: 0,    beef: 0,    swine: 0,    poultry: 0 },
      fracLoss:  { dairy: 0.77, beef: 0.77, swine: 0.78, poultry: 0.77 },
      liquid: true,
    },
    liquid: {
      label: 'Liquid/slurry tank, no crust',
      MCF: { cool: 0.25, temperate: 0.42, warm: 0.73 },
      EF3: 0,
      fracGas:   { dairy: 0.40, beef: 0.40, swine: 0.48, poultry: 0.40 },
      fracLeach: { dairy: 0,    beef: 0,    swine: 0,    poultry: 0 },
      fracLoss:  { dairy: 0.40, beef: 0.40, swine: 0.48, poultry: 0.40 },
      liquid: true,
    },
    pit: {
      label: 'Deep pit under slats (> 1 month)',
      MCF: { cool: 0.25, temperate: 0.42, warm: 0.73 },
      EF3: 0.002,
      fracGas:   { dairy: 0.28, beef: 0.28, swine: 0.25, poultry: 0.28 },
      fracLeach: { dairy: 0,    beef: 0,    swine: 0,    poultry: 0 },
      fracLoss:  { dairy: 0.28, beef: 0.28, swine: 0.25, poultry: 0.28 },
      liquid: true,
    },
    solid: {
      label: 'Solid storage (stacked manure)',
      MCF: { cool: 0.02, temperate: 0.04, warm: 0.05 },
      EF3: 0.01,
      fracGas:   { dairy: 0.30, beef: 0.45, swine: 0.45, poultry: 0.40 },
      fracLeach: { dairy: 0.02, beef: 0.02, swine: 0.02, poultry: 0.02 },
      fracLoss:  { dairy: 0.40, beef: 0.50, swine: 0.50, poultry: 0.50 },
    },
    drylot: {
      label: 'Open dry lot',
      MCF: { cool: 0.01, temperate: 0.015, warm: 0.02 },
      EF3: 0.02,
      fracGas:   { dairy: 0.20, beef: 0.30, swine: 0.30, poultry: 0.30 },
      fracLeach: { dairy: 0.035, beef: 0.035, swine: 0.035, poultry: 0.035 },
      fracLoss:  { dairy: 0.30, beef: 0.40, swine: 0.40, poultry: 0.40 },
    },
    dailySpread: {
      label: 'Daily spread',
      MCF: { cool: 0.001, temperate: 0.005, warm: 0.01 },
      EF3: 0,
      fracGas:   { dairy: 0.07, beef: 0.07, swine: 0.07, poultry: 0.07 },
      fracLeach: { dairy: 0,    beef: 0,    swine: 0,    poultry: 0 },
      fracLoss:  { dairy: 0.22, beef: 0.22, swine: 0.22, poultry: 0.22 },
    },
    poultryLitter: {
      label: 'Poultry house with litter',
      MCF: { cool: 0.015, temperate: 0.015, warm: 0.015 },
      EF3: 0.001,
      fracGas:   { dairy: 0.40, beef: 0.40, swine: 0.40, poultry: 0.40 },
      fracLeach: { dairy: 0,    beef: 0,    swine: 0,    poultry: 0 },
      fracLoss:  { dairy: 0.50, beef: 0.50, swine: 0.50, poultry: 0.50 },
    },
    poultryNoLitter: {
      label: 'Poultry without litter (high-rise / manure belt)',
      MCF: { cool: 0.015, temperate: 0.015, warm: 0.015 },
      EF3: 0.001,
      fracGas:   { dairy: 0.55, beef: 0.55, swine: 0.55, poultry: 0.55 },
      fracLeach: { dairy: 0,    beef: 0,    swine: 0,    poultry: 0 },
      fracLoss:  { dairy: 0.55, beef: 0.55, swine: 0.55, poultry: 0.55 },
    },
  };

  const CLIMATES = {
    cool:      'Cool (mean annual < 10 °C)',
    temperate: 'Temperate (10–20 °C)',
    warm:      'Warm (> 20 °C)',
  };

  // ---------------------------------------------------------------- global factors
  const GWP = {
    AR6: { label: 'IPCC AR6 GWP100', CH4: 27.0, N2O: 273, ref: 'ar6' },
    AR5: { label: 'IPCC AR5 GWP100', CH4: 28, N2O: 265, ref: 'ar5' },
    AR4: { label: 'IPCC AR4 GWP100', CH4: 25, N2O: 298, ref: 'ar4' },
  };

  const GRID_PRESETS = {
    us:     { label: 'United States avg.', value: 0.37, src: { refs: ['egrid'], basis: 'approx', note: 'US national average, rounded' } },
    eu:     { label: 'EU-27 avg.', value: 0.24, src: { refs: ['eea'], basis: 'approx', note: 'EU-27 generation intensity, rounded' } },
    israel: { label: 'Israel', value: 0.50, src: { refs: [], basis: 'assumed', note: 'Approximate national grid intensity — verify with Israeli national data' } },
    coal:   { label: 'Coal-heavy grid', value: 0.85, src: { refs: [], basis: 'assumed', note: 'Illustrative coal-dominated grid' } },
    renew:  { label: 'Mostly renewable', value: 0.05, src: { refs: [], basis: 'assumed', note: 'Illustrative low-carbon grid' } },
  };

  const GLOBAL_META = {
    gridEF:     { label: 'Grid electricity', unit: 'kg CO₂ equivalent/kWh', value: 0.37, src: { refs: ['egrid'], basis: 'approx', note: 'US national average, rounded (or the grid chosen in step 4)' } },
    dieselEF:   { label: 'Diesel combustion', unit: 'kg CO₂ equivalent/L', value: 2.70, src: SRC.epa },
    lpgEF:      { label: 'Propane / LPG combustion', unit: 'kg CO₂ equivalent/L', value: 1.51, src: SRC.epa },
    waterEF:    { label: 'Water supply (pumping, treatment)', unit: 'kg CO₂ equivalent/m³', value: 0.30, src: SRC.water },
    EF1:        { label: 'EF1 — direct N2O from applied manure N', unit: 'kg N2O-N/kg N', value: 0.010, src: SRC.soil },
    EF4:        { label: 'EF4 — N2O from volatilised N', unit: 'kg N2O-N/kg N', value: 0.010, src: SRC.soil },
    EF5:        { label: 'EF5 — N2O from leached N', unit: 'kg N2O-N/kg N', value: 0.011, src: SRC.soil },
    fracGasM:   { label: 'FracGASM — NH3+NOx volatilised at application', unit: 'fraction', value: 0.21, src: SRC.soil },
    fracLeachH: { label: 'FracLEACH-(H) — leaching after application', unit: 'fraction', value: 0.24, src: SRC.soil },
    wfCmaxN:    { label: 'Max. acceptable nitrate-N concentration (grey water)', unit: 'kg N/m³', value: 0.010, src: { refs: ['franke2013'], basis: 'taken', note: '10 mg NO3-N/L water-quality standard; natural background assumed 0' } },
  };

  // ---------------------------------------------------------------- animal categories
  // params: key -> [default value, source]
  const SPECIES = {
    dairy: {
      label: 'Dairy cows', icon: 'Dairy', kind: 'dairy', group: 'dairy',
      unit: 'mature cows', unitShort: 'cows',
      fu: { label: 'kg FPCM', name: 'milk' },
      note: 'Lactating + dry cows. Heifers raised off-site (bought in as springers).',
      epa: { medium: 200, large: 700, basis: 'mature dairy cows' },
      size: { min: 50, max: 20000, default: 2000, presets: [150, 500, 2000, 10000] },
      mms: { default: 'lagoon', options: ['lagoon', 'liquid', 'solid', 'drylot', 'dailySpread'] },
      params: {
        milkYield: [10800, SRC.prod], matureWeight: [680, SRC.prod], heiferWeight: [590, SRC.prod],
        replacementRate: [0.38, SRC.prod], mortalityRate: [0.06, SRC.prod],
        calvesPerCow: [0.92, SRC.prod], calfWeight: [42, SRC.prod],
        dmi: [23.5, SRC.assumed], cp: [0.165, SRC.assumed], de: [0.69, SRC.de], ue: [0.04, SRC.ue],
        ym: [5.7, SRC.ym], feedDM: [0.52, SRC.assumed],
        vsFrac: [0.85, SRC.asabe], tsContent: [0.125, SRC.asabe], bo: [0.24, SRC.bo], nLW: [0.025, SRC.nlw],
        drinkWater: [115, SRC.assumed], serviceWater: [80, SRC.assumed],
        electricity: [900, SRC.assumed], diesel: [80, SRC.assumed], lpg: [20, SRC.assumed],
        feedEF: [0.35, SRC.lca],
        feedWFgreen: [900, SRC.wfFeed], feedWFblue: [70, SRC.wfFeed], feedWFgrey: [110, SRC.wfFeed],
      },
    },
    beef: {
      label: 'Beef feedlot', icon: 'Beef', kind: 'grower', group: 'beef',
      unit: 'head (one-time capacity)', unitShort: 'head place',
      fu: { label: 'kg LW gain', name: 'live-weight gain' },
      note: 'Finishing phase only; cow-calf and backgrounding emissions are outside the boundary.',
      epa: { medium: 300, large: 1000, basis: 'cattle other than mature dairy cows' },
      size: { min: 100, max: 100000, default: 10000, presets: [500, 2000, 10000, 50000] },
      mms: { default: 'drylot', options: ['drylot', 'solid', 'pit', 'liquid'] },
      params: {
        weightIn: [360, SRC.prod], weightOut: [630, SRC.prod], daysInPlace: [165, SRC.prod],
        downtimeDays: [15, SRC.assumed], mortality: [0.015, SRC.prod], fcr: [6.0, SRC.prod],
        cp: [0.135, SRC.assumed], de: [0.78, SRC.de], ue: [0.04, SRC.ue], ym: [3.0, SRC.ym], feedDM: [0.75, SRC.assumed],
        vsFrac: [0.85, SRC.asabe], tsContent: [0.12, SRC.asabe], bo: [0.19, SRC.bo], nLW: [0.025, SRC.nlw],
        drinkWater: [45, SRC.assumed], serviceWater: [2, SRC.assumed],
        electricity: [35, SRC.assumed], diesel: [30, SRC.assumed], lpg: [10, SRC.assumed],
        feedEF: [0.40, SRC.lca],
        feedWFgreen: [1050, SRC.wfFeed], feedWFblue: [80, SRC.wfFeed], feedWFgrey: [170, SRC.wfFeed],
      },
    },
    swine: {
      label: 'Swine finishing', icon: 'Swine', kind: 'grower', group: 'swine',
      unit: 'pig spaces', unitShort: 'pig spaces',
      fu: { label: 'kg LW gain', name: 'live-weight gain' },
      note: 'Feeder-to-finish (25 → 130 kg). Nursery and sow farm are outside the boundary.',
      epa: { medium: 750, large: 2500, basis: 'swine ≥ 55 lb' },
      size: { min: 200, max: 50000, default: 5000, presets: [500, 2400, 5000, 20000] },
      mms: { default: 'pit', options: ['pit', 'lagoon', 'liquid', 'solid'] },
      params: {
        weightIn: [25, SRC.prod], weightOut: [130, SRC.prod], daysInPlace: [115, SRC.prod],
        downtimeDays: [7, SRC.assumed], mortality: [0.04, SRC.prod], fcr: [2.45, SRC.prod],
        cp: [0.16, SRC.assumed], de: [0.82, SRC.de], ue: [0.02, SRC.ue], ym: [0.5, SRC.ymSwine], feedDM: [0.88, SRC.assumed],
        vsFrac: [0.80, SRC.asabe], tsContent: [0.10, SRC.asabe], bo: [0.48, SRC.bo], nLW: [0.025, SRC.nlw],
        drinkWater: [9, SRC.assumed], serviceWater: [1.5, SRC.assumed],
        electricity: [50, SRC.assumed], diesel: [3, SRC.assumed], lpg: [6, SRC.assumed],
        feedEF: [0.50, SRC.lca],
        feedWFgreen: [1350, SRC.wfFeed], feedWFblue: [120, SRC.wfFeed], feedWFgrey: [190, SRC.wfFeed],
      },
    },
    sows: {
      label: 'Swine sow farm', icon: 'Sows', kind: 'sow', group: 'swine',
      unit: 'sows (inventory)', unitShort: 'sows',
      fu: { label: 'kg weaned piglet', name: 'weaned piglets' },
      note: 'Farrow-to-wean. Pre-weaning piglet mortality is not tracked as a mass flow.',
      epa: { medium: 750, large: 2500, basis: 'swine ≥ 55 lb' },
      size: { min: 100, max: 20000, default: 2500, presets: [300, 1200, 2500, 10000] },
      mms: { default: 'pit', options: ['pit', 'lagoon', 'liquid', 'solid'] },
      params: {
        pigletsWeaned: [26, SRC.prod], weanWeight: [6.5, SRC.prod], replacementRate: [0.50, SRC.prod],
        giltWeight: [135, SRC.prod], cullWeight: [240, SRC.prod], mortalityRate: [0.08, SRC.prod],
        dmi: [2.6, SRC.assumed], cp: [0.15, SRC.assumed], de: [0.78, SRC.de], ue: [0.02, SRC.ue],
        ym: [0.6, SRC.ymSwine], feedDM: [0.88, SRC.assumed],
        vsFrac: [0.80, SRC.asabe], tsContent: [0.09, SRC.asabe], bo: [0.48, SRC.bo], nLW: [0.025, SRC.nlw],
        drinkWater: [20, SRC.assumed], serviceWater: [6, SRC.assumed],
        electricity: [400, SRC.assumed], diesel: [5, SRC.assumed], lpg: [30, SRC.assumed],
        feedEF: [0.50, SRC.lca],
        feedWFgreen: [1350, SRC.wfFeed], feedWFblue: [120, SRC.wfFeed], feedWFgrey: [190, SRC.wfFeed],
      },
    },
    broilers: {
      label: 'Broiler chickens', icon: 'Broilers', kind: 'grower', group: 'poultry',
      unit: 'bird places', unitShort: 'bird places',
      fu: { label: 'kg LW gain', name: 'live-weight gain' },
      note: 'Hatchery and breeder flocks are outside the boundary. Litter bedding not modelled.',
      epa: { medium: 37500, large: 125000, basis: 'chickens other than layers (dry manure)' },
      size: { min: 10000, max: 2000000, default: 200000, presets: [25000, 100000, 200000, 1000000] },
      mms: { default: 'poultryLitter', options: ['poultryLitter', 'solid'] },
      params: {
        weightIn: [0.042, SRC.prod], weightOut: [2.9, SRC.prod], daysInPlace: [47, SRC.prod],
        downtimeDays: [14, SRC.assumed], mortality: [0.045, SRC.prod], fcr: [1.58, SRC.prod],
        cp: [0.21, SRC.assumed], de: [0.75, SRC.assumed], ue: [0, SRC.assumed], ym: [0, SRC.ymPoultry], feedDM: [0.89, SRC.assumed],
        vsFrac: [0.75, SRC.asabe], tsContent: [0.25, SRC.asabe], bo: [0.36, SRC.bo], nLW: [0.029, SRC.nlw],
        drinkWater: [0.19, SRC.assumed], serviceWater: [0.03, SRC.assumed],
        electricity: [1.6, SRC.assumed], diesel: [0.05, SRC.assumed], lpg: [0.9, SRC.assumed],
        feedEF: [0.60, SRC.lca],
        feedWFgreen: [1500, SRC.wfFeed], feedWFblue: [120, SRC.wfFeed], feedWFgrey: [170, SRC.wfFeed],
      },
    },
    layers: {
      label: 'Laying hens', icon: 'Layers', kind: 'layer', group: 'poultry',
      unit: 'hen places', unitShort: 'hen places',
      fu: { label: 'kg eggs', name: 'eggs' },
      note: 'Pullets reared off-site. Cage / cage-free house with belt or high-rise manure handling.',
      epa: { medium: 25000, large: 82000, basis: 'laying hens (dry manure)', liquid: { medium: 9000, large: 30000 } },
      size: { min: 10000, max: 5000000, default: 1000000, presets: [50000, 250000, 1000000, 3000000] },
      mms: { default: 'poultryNoLitter', options: ['poultryNoLitter', 'poultryLitter', 'lagoon'] },
      params: {
        weightIn: [1.4, SRC.prod], weightOut: [1.75, SRC.prod], daysInPlace: [500, SRC.prod],
        downtimeDays: [21, SRC.assumed], mortality: [0.08, SRC.prod], henDayRate: [0.82, SRC.prod], eggWeight: [0.060, SRC.prod],
        dmi: [0.092, SRC.assumed], cp: [0.17, SRC.assumed], de: [0.74, SRC.assumed], ue: [0, SRC.assumed],
        ym: [0, SRC.ymPoultry], feedDM: [0.89, SRC.assumed],
        vsFrac: [0.70, SRC.asabe], tsContent: [0.25, SRC.asabe], bo: [0.39, SRC.bo], nLW: [0.029, SRC.nlw],
        drinkWater: [0.20, SRC.assumed], serviceWater: [0.01, SRC.assumed],
        electricity: [2.5, SRC.assumed], diesel: [0.05, SRC.assumed], lpg: [0, SRC.assumed],
        feedEF: [0.55, SRC.lca],
        feedWFgreen: [1500, SRC.wfFeed], feedWFblue: [120, SRC.wfFeed], feedWFgrey: [170, SRC.wfFeed],
      },
    },
    turkeys: {
      label: 'Turkeys', icon: 'Turkeys', kind: 'grower', group: 'poultry',
      unit: 'bird places', unitShort: 'bird places',
      fu: { label: 'kg LW gain', name: 'live-weight gain' },
      note: 'Mixed hens/toms average. Brooder and hatchery outside the boundary.',
      epa: { medium: 16500, large: 55000, basis: 'turkeys' },
      size: { min: 5000, max: 500000, default: 60000, presets: [10000, 30000, 60000, 200000] },
      mms: { default: 'poultryLitter', options: ['poultryLitter', 'solid'] },
      params: {
        weightIn: [0.06, SRC.prod], weightOut: [15, SRC.prod], daysInPlace: [120, SRC.prod],
        downtimeDays: [21, SRC.assumed], mortality: [0.08, SRC.prod], fcr: [2.3, SRC.prod],
        cp: [0.22, SRC.assumed], de: [0.72, SRC.assumed], ue: [0, SRC.assumed], ym: [0, SRC.ymPoultry], feedDM: [0.89, SRC.assumed],
        vsFrac: [0.75, SRC.asabe], tsContent: [0.25, SRC.asabe], bo: [0.36, SRC.bo], nLW: [0.029, SRC.nlw],
        drinkWater: [0.55, SRC.assumed], serviceWater: [0.05, SRC.assumed],
        electricity: [4.0, SRC.assumed], diesel: [0.2, SRC.assumed], lpg: [2.5, SRC.assumed],
        feedEF: [0.60, SRC.lca],
        feedWFgreen: [1500, SRC.wfFeed], feedWFblue: [120, SRC.wfFeed], feedWFgrey: [170, SRC.wfFeed],
      },
    },
  };

  // Emission source categories — order is the fixed color-slot order.
  const SOURCES = [
    { key: 'enteric',   label: 'Enteric fermentation',      gas: 'CH4', scope: 'Scope 1' },
    { key: 'manureCH4', label: 'Manure management CH4',      gas: 'CH4', scope: 'Scope 1' },
    { key: 'manureN2O', label: 'Manure management N2O',      gas: 'N2O', scope: 'Scope 1' },
    { key: 'landN2O',   label: 'Manure land application N2O', gas: 'N2O', scope: 'Scope 1' },
    { key: 'feed',      label: 'Feed production',            gas: 'mixed', scope: 'Scope 3' },
    { key: 'fuel',      label: 'On-farm fuels',              gas: 'CO2', scope: 'Scope 1' },
    { key: 'electricity', label: 'Electricity',              gas: 'CO2', scope: 'Scope 2' },
    { key: 'water',     label: 'Water supply',               gas: 'CO2', scope: 'Scope 3' },
  ];

  // Opening-page live counter. No reliable global estimate exists for CAFOs alone, so the clock
  // uses all livestock supply chains (FAO GLEAM 3) as the context figure — swap here if a CAFO-only estimate becomes available.
  const GLOBAL_CLOCK = {
    annualTonnesCO2e: 6.2e9,
    scope: 'all livestock supply chains worldwide',
    refYear: 2015,
    shareOfAnthropogenic: 0.12,
    methaneShare: 0.32,
    src: { refs: ['fao2023'], basis: 'taken', note: 'GLEAM 3 global livestock supply-chain emissions, reference year 2015, spread evenly over the year' },
  };

  const DATA = { REFS, BASIS, CONSTANTS, GLOBAL_CLOCK, SRC, PARAM_META, MMS, CLIMATES, GWP, GRID_PRESETS, GLOBAL_META, SPECIES, SOURCES };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  else root.CAFO_DATA = DATA;
})(typeof window !== 'undefined' ? window : globalThis);
