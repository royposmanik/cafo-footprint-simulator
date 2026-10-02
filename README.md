# CAFO Footprint Simulator (business as usual)

by [W2R Lab](https://w2r-lab.vercel.app/index.html) at the Technion

A browser tool for estimating the annual inputs, outputs and greenhouse-gas emissions of a
concentrated animal feeding operation (CAFO) run as **business as usual (BAU)**.

You choose the operation type and farm size. The tool estimates:

- **Inputs:** feed (as fed, dry matter, crude protein), drinking and service water, electricity, diesel, LPG and purchased animals
- **Outputs:** products (milk, eggs, live weight), mortalities, manure (wet mass, TS, VS, N), wastewater and gaseous emissions
- **Emissions (CO2 equivalent):** enteric CH4, manure CH4, manure N2O (direct and indirect), N2O from land application, feed production, fuels, electricity and water supply
- **Water footprint:** green, blue and grey water (Water Footprint Network method) from feed crops, on-farm water use and manure nitrate leaching
- **Material-flow (MFA) diagrams:** whole-farm mass, nitrogen, carbon and water flows drawn as Sankey diagrams

## How it works

0. **Opening page.** A live counter shows global livestock greenhouse-gas emissions since local midnight, using FAO GLEAM 3: about 6.2 Gt CO2 equivalent per year, or about 196 t per second. Short cards below it explain why this matters. The counter covers all livestock supply chains, because there is no reliable worldwide estimate for CAFOs alone. Change `GLOBAL_CLOCK` in `js/data.js` if a CAFO-only figure becomes available.
1. **Animal category.** Select one of 7 CAFO types.
2. **Farm size.** Set the number of animal places with the slider, the presets or by typing a number. A scale shows where the farm falls against the US EPA Small / Medium / Large CAFO thresholds.
3. **Manure management and climate.** Choose the manure system (the BAU default is tagged) and the climate.
4. **Energy and system boundary.** Choose the electricity grid, which emission sources to include (feed production, manure land application) and the GWP set.
5. **Calculate.** An animated Sankey diagram appears, with four perspectives:
   - **Material flows:** feed, water and animals in; products, manure, wastewater and respiration out
   - **Nitrogen balance:** feed N through the herd and manure to air, water and soil
   - **Carbon footprint:** emission sources → GHG Protocol scopes → total CO₂ equivalent, plus a breakdown by source
   - **Water footprint:** feed crops, drinking water, service water and manure nitrate → green / blue / grey → total, plus an inventory table

**Saving figures.** On a computer, *Save PDF* creates an A4 landscape sheet: a header with the W2R Lab badge, lab details and link, and the Technion logo, the figure, scenario, key numbers, notes, and a dated footer. *Save JPEG* saves the same sheet as an image. On a phone, *Save to gallery* creates a JPEG and opens the share sheet, where "Save Image" adds it to the photo gallery. The W2R badge and Technion logo are loaded from w2r-lab.vercel.app, and PDFs use jsPDF from cdnjs.

Under the results, **Advanced settings** lets you edit every coefficient, and results update immediately. **Methods & sources** lists each calculation step and its references.

## Running it

Open `index.html` in any modern browser. There is no build step and no server. The only external resource is the Figtree web font; without internet the page falls back to the system font.
Edited assumptions are stored in the browser's `localStorage`.

Model check from the command line (Node ≥ 18):

```bash
node tests/sanity.js
```

## Operation types

| Type | Size unit | BAU manure system | Functional unit |
|---|---|---|---|
| Dairy cows | mature cows | uncovered anaerobic lagoon | kg FPCM |
| Beef feedlot | head capacity | open dry lot | kg LW gain |
| Swine finishing | pig spaces | deep pit (> 1 month) | kg LW gain |
| Swine sow farm | sows | deep pit (> 1 month) | kg weaned piglet |
| Broiler chickens | bird places | poultry litter | kg LW gain |
| Laying hens | hen places | high-rise / manure belt | kg eggs |
| Turkeys | bird places | poultry litter | kg LW gain |

Farm size is also classified against the US EPA CAFO thresholds (40 CFR 122.23).

## Project layout

```
index.html        page markup and the in-app "Methods" section
css/styles.css    styles (light and dark themes, W2R Lab palette)
js/data.js        all default coefficients and their sources  <- edit defaults here
js/model.js       calculation engine (pure functions; runs in browser and Node)
js/charts.js      emission bar chart and Sankey renderer (no libraries)
js/icons.js       inline line-icon set (Lucide-style SVG)
js/export.js      branded PDF / JPEG export of the current figure
js/app.js         UI wiring, assumptions editor, CSV export
tests/sanity.js   runs every operation type and checks mass/N balances
```

## Method summary

The model works on one **animal place for one year**, then multiplies by the number of places.

- **Herd dynamics.** Dairy and sow herds are continuous (replacement, mortality, yield per head).
  Batch systems use `cycles = 365 / (days on farm + downtime)` and live animal-days
  `= 365 × occupancy × (1 − mortality/2)`. For growers, DMI = FCR × average daily gain.
- **Enteric CH4** (IPCC 2019, eq. 10.21): `DMI × 18.45 × Ym/100 / 55.65`.
- **Manure solids:** `TS = DMI × (1 − DE + UE)`, `VS = TS × VS/TS`, wet manure `= TS / TS content`.
- **Manure CH4** (eq. 10.23): `VS × Bo × 0.67 × MCF(system, climate)`.
- **N excretion:** `Nex = DMI × CP/6.25 − N retained`. N retained is the N in milk, eggs and net live-weight change.
- **Manure N2O:** direct `Nex × EF3`; indirect via FracGasMS × EF4 and FracLeachMS × EF5.
  N left after FracLossMS is land-applied, giving direct N2O (EF1) plus indirect N2O (FracGASM, FracLEACH).
- **Feed:** DMI × feed footprint (kg CO2 equivalent/kg DM, cradle-to-farm-gate, **excluding land-use change**).
- **Energy and water:** activity × emission factor (grid, diesel, LPG and water supply).
- **Water footprint:** feed green/blue/grey = DMI (t DM) × ration crop water footprint (m³/t DM). On-farm blue = drinking + service water. Manure grey = nitrate-N leached in storage and fields ÷ 10 mg N/L (natural background 0).
- **GWP100:** AR6 by default (CH4 27, N2O 273). AR5 and AR4 can be selected.
- **Mass balance:** feed + water + purchased animals − (products + mortalities + manure + wastewater).
  The remainder is reported as respiration (CO2 and water vapour) plus evaporation.

## Sources

Every default value carries a source tag in the app (Advanced settings) and in the CSV export:

- **✔ From source:** copied from the cited document.
- **≈ Approximated:** derived or rounded from the cited document. Check it against the original table before publishing.
- **✎ Assumption:** the model author's estimate of a typical US BAU value. Replace it with site data.

### Source of each coefficient group

| Coefficients | Source |
|---|---|
| Equations (enteric CH4, VS, manure CH4, N2O, N excretion) | [1] from source — Tier 2 equation (Ch. 10) |
| Ym, cattle | [1] approximated — Ym defaults (high-producing dairy 5.7 %, feedlot 3.0 %) |
| Ym, swine | [1] assumption — IPCC gives no Ym for swine; set so enteric CH4 ≈ IPCC Tier 1 swine factor (~1.5 kg CH4/head/yr) |
| Ym, poultry | [1] from source — IPCC gives no enteric CH4 factor for poultry (negligible) → 0 |
| Digestibility DE | [1] approximated — Chosen within the IPCC digestibility ranges for the feeding situation |
| Urinary energy UE | [1] from source — Default urinary energy: cattle 0.04, swine 0.02 of GE |
| Bo | [2, 1] approximated — Bo for North America (2006 Annex 10A.2; 2019 Table 10.16) |
| MCF, EF3, FracGas, FracLeach, FracLoss (manure systems) | [1, 2] approximated — MCF (2019 Table 10.17), EF3 (2019 Table 10.21), FracGas / FracLeach / FracLoss (2006 Tables 10.22–10.23); rounded and grouped into three climates |
| EF1, EF4, EF5, FracGASM, FracLEACH | [1] from source — Aggregated defaults, Ch. 11 Tables 11.1 & 11.3 |
| Manure VS/TS and TS content | [6] approximated — Typical as-excreted manure characteristics, rounded |
| Herd, production and feed conversion | [16] assumption — Typical US production level, rounded |
| Crude protein, DMI, feed DM, water use, energy use | assumption — Model-author assumption — replace with site data |
| Body N content | assumption — Typical whole-body N content (≈ 2.5 % mammals, 2.9 % poultry) |
| Feed production footprint | [12, 13] assumption — Indicative value within published feed LCA ranges; excludes land-use change |
| Diesel and LPG emission factors | [8] from source — Combustion CO2, converted from per-gallon to per-litre |
| Water-supply emission factor | assumption — Pumping & treatment energy assumption |
| Feed water footprint (green, blue, grey) | [19] assumption — Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Grey-water nitrate limit (10 mg N/L) | [21] from source |
| Grid factor, United States avg. (0.37 kg CO2 equivalent/kWh) | [9] approximated — US national average, rounded |
| Grid factor, EU-27 avg. (0.24 kg CO2 equivalent/kWh) | [10] approximated — EU-27 generation intensity, rounded |
| Grid factor, Israel (0.5 kg CO2 equivalent/kWh) | assumption — Approximate national grid intensity — verify with Israeli national data |
| Grid factor, Coal-heavy grid (0.85 kg CO2 equivalent/kWh) | assumption — Illustrative coal-dominated grid |
| Grid factor, Mostly renewable (0.05 kg CO2 equivalent/kWh) | assumption — Illustrative low-carbon grid |
| IPCC AR6 GWP100 (CH4 27, N2O 273) | [3] from source |
| IPCC AR5 GWP100 (CH4 28, N2O 265) | [4] from source |
| IPCC AR4 GWP100 (CH4 25, N2O 298) | [5] from source |
| Scope definitions | [11] |
| CAFO size thresholds | [7] from source |
| Constant: Gross energy of feed = 18.45 MJ/kg DM | [1] from source — IPCC default energy density of feed |
| Constant: Energy content of methane = 55.65 MJ/kg CH4 | [1] from source — Enteric CH4 equation |
| Constant: Methane density = 0.67 kg/m³ | [1] from source — Manure CH4 equation |
| Constant: N2O-N → N2O = 44/28 | [1] from source — Stoichiometric conversion |
| Constant: Protein = N × 6.25 = 6.25 | [15] from source — Feed and live-weight protein |
| Constant: Milk N content = 0.0053 kg N/kg FPCM | [14, 15] approximated — 3.3 % true protein ÷ 6.38 |
| Constant: Egg N content = 0.0192 kg N/kg egg | [17, 15] approximated — ≈ 12 % protein ÷ 6.25 |
| Constant: Typical passenger car = 4.6 t CO2/yr | [18] from source — Only for the “like driving” comparison |

### References

1. IPCC (2019). 2019 Refinement to the 2006 IPCC Guidelines for National Greenhouse Gas Inventories. Vol. 4: Agriculture, Forestry and Other Land Use — Ch. 10 "Emissions from Livestock and Manure Management" and Ch. 11 "N2O Emissions from Managed Soils, and CO2 Emissions from Lime and Urea Application". Calvo Buendia, E., Tanabe, K., Kranjc, A., Baasansuren, J., Fukuda, M., Ngarize, S., Osako, A., Pyrozhenko, Y., Shermanau, P. & Federici, S. (eds). IPCC, Switzerland. https://www.ipcc-nggip.iges.or.jp/public/2019rf/vol4.html
2. IPCC (2006). 2006 IPCC Guidelines for National Greenhouse Gas Inventories. Vol. 4: Agriculture, Forestry and Other Land Use, Ch. 10 "Emissions from Livestock and Manure Management" (incl. Annex 10A.2). Eggleston, H.S., Buendia, L., Miwa, K., Ngara, T. & Tanabe, K. (eds). IGES, Japan. https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html
3. Forster, P. et al. (2021). The Earth’s Energy Budget, Climate Feedbacks, and Climate Sensitivity. In: Climate Change 2021: The Physical Science Basis. Contribution of Working Group I to the Sixth Assessment Report of the IPCC. Cambridge University Press. Table 7.15 (GWP100: CH4 non-fossil 27.0, N2O 273). https://www.ipcc.ch/report/ar6/wg1/
4. Myhre, G. et al. (2013). Anthropogenic and Natural Radiative Forcing. In: Climate Change 2013: The Physical Science Basis. Contribution of Working Group I to the Fifth Assessment Report of the IPCC. Cambridge University Press. Table 8.7 (GWP100: CH4 28, N2O 265). https://www.ipcc.ch/report/ar5/wg1/
5. Forster, P. et al. (2007). Changes in Atmospheric Constituents and in Radiative Forcing. In: Climate Change 2007: The Physical Science Basis. Contribution of Working Group I to the Fourth Assessment Report of the IPCC. Cambridge University Press. Table 2.14 (GWP100: CH4 25, N2O 298). https://www.ipcc.ch/report/ar4/wg1/
6. ASABE (2005, reaffirmed). ASAE D384.2: Manure Production and Characteristics. American Society of Agricultural and Biological Engineers, St. Joseph, MI.
7. US Code of Federal Regulations, 40 CFR § 122.23 — Concentrated animal feeding operations (applicability; size thresholds for Large and Medium CAFOs). https://www.ecfr.gov/current/title-40/chapter-I/subchapter-D/part-122/subpart-B/section-122.23
8. US EPA. GHG Emission Factors Hub. Center for Corporate Climate Leadership (combustion CO2: diesel 10.21 kg/gal; propane 5.72 kg/gal). https://www.epa.gov/climateleadership/ghg-emission-factors-hub
9. US EPA. Emissions & Generation Resource Integrated Database (eGRID) — US national average output emission rate. https://www.epa.gov/egrid
10. European Environment Agency. Greenhouse gas emission intensity of electricity generation in Europe (indicator).
11. WRI & WBCSD (2004). The Greenhouse Gas Protocol: A Corporate Accounting and Reporting Standard, revised edition (Scope 1/2/3 definitions). https://ghgprotocol.org/corporate-standard
12. Gerber, P.J., Steinfeld, H., Henderson, B., Mottet, A., Opio, C., Dijkman, J., Falcucci, A. & Tempio, G. (2013). Tackling climate change through livestock — A global assessment of emissions and mitigation opportunities. FAO, Rome (GLEAM results).
13. Vellinga, Th.V., Blonk, H., Marinussen, M., van Zeist, W.J., de Boer, I.J.M. & Starmans, D. (2013). Methodology used in FeedPrint: a tool quantifying greenhouse gas emissions of feed production and utilization. Wageningen UR Livestock Research, Report 674.
14. International Dairy Federation (2022). The IDF global Carbon Footprint standard for the dairy sector. Bulletin of the IDF No. 520/2022 (fat- and protein-corrected milk as functional unit).
15. Jones, D.B. (1931). Factors for converting percentages of nitrogen in foods and feeds into percentages of proteins. USDA Circular No. 183 (N × 6.25; milk N × 6.38).
16. USDA National Agricultural Statistics Service. Milk Production; Poultry — Production and Value; Quarterly Hogs and Pigs; Cattle on Feed (orientation for typical US production levels only). https://www.nass.usda.gov/
17. USDA Agricultural Research Service. FoodData Central — Egg, whole, raw, fresh (protein ≈ 12–13 %). https://fdc.nal.usda.gov/
18. Hoekstra, A.Y., Chapagain, A.K., Aldaya, M.M. & Mekonnen, M.M. (2011). The Water Footprint Assessment Manual: Setting the Global Standard. Earthscan, London (green, blue and grey water footprint definitions).
19. Mekonnen, M.M. & Hoekstra, A.Y. (2011). The green, blue and grey water footprint of crops and derived crop products. Hydrology and Earth System Sciences 15, 1577–1600 (global averages, e.g. maize ≈ 1,222 m³/t; soybean ≈ 2,145 m³/t; wheat ≈ 1,827 m³/t).
20. Mekonnen, M.M. & Hoekstra, A.Y. (2012). A global assessment of the water footprint of farm animal products. Ecosystems 15, 401–415 (benchmark product water footprints by production system).
21. Franke, N.A., Boyacioglu, H. & Hoekstra, A.Y. (2013). Grey water footprint accounting: Tier 1 supporting guidelines. Value of Water Research Report Series No. 65, UNESCO-IHE, Delft (grey WF = pollutant load ÷ (c_max − c_nat)).
22. FAO (2023). Pathways towards lower emissions — A global assessment of the greenhouse gas emissions and mitigation options from livestock agrifood systems. Food and Agriculture Organization of the United Nations, Rome (GLEAM 3: livestock supply chains ≈ 6.2 Gt CO2 equivalent in 2015, ≈ 12 % of anthropogenic emissions).
23. United Nations Environment Programme & Climate and Clean Air Coalition (2021). Global Methane Assessment: Benefits and Costs of Mitigating Methane Emissions. UNEP, Nairobi (livestock ≈ 32 % of anthropogenic methane).
24. US EPA. Greenhouse Gas Emissions from a Typical Passenger Vehicle (≈ 4.6 t CO2 per vehicle per year). https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle

## Important caveats

- **The defaults are indicative and need checking.** The IPCC-derived values (Ym, Bo, MCF, EF3, Frac*)
  are approximations of the IPCC 2019 Refinement tables. Production, water and energy values are
  typical US BAU assumptions. For publication, check each value against the original tables and
  your country's inventory, or replace it with site data. Use the Assumptions panel to edit them.
- **Boundary:** cradle to farm gate for the CAFO stage only. Upstream animal rearing (heifers,
  nursery, hatchery, cow-calf), bedding, buildings, carcass disposal, manure transport and
  land-use change are excluded.
- **No co-product allocation.** All emissions go to the functional unit. A per-kg-protein figure
  covering all products is also shown.
- **Manure system:** one system per farm receives all excreted manure. Solid separation and
  mixed systems are not modelled.
- **BAU scope:** mitigation options (digesters, covers, additives) are deliberately not included.
  This keeps BAU as the clean baseline for later comparison with mitigation scenarios.
