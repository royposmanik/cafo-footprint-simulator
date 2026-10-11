# CAFO Footprint Simulator — technical documentation

**By [W2R Lab](https://w2r-lab.vercel.app/index.html) (Waste-to-Resource Lab) at the Technion – Israel Institute of Technology**

Live simulator: <https://cafo-footprint-simulator.vercel.app> · Source code: <https://github.com/royposmanik/cafo-footprint-simulator> · Generated 2026-10-11 from the simulator's data and model.

> **Status of the defaults.** Every coefficient is labelled by how it relates to its source: *From source* (copied from the cited document), *Approximated* (derived or rounded from it — verify against the original table before publishing) or *Assumption* (a typical business-as-usual value chosen by the model author — replace with site data). All coefficients can be edited in the simulator under *Advanced settings*.

## Contents

1. [Purpose and scope](#1-purpose-and-scope)

2. [Using the simulator](#2-using-the-simulator)

3. [Operation types, boundary and functional units](#3-operation-types-boundary-and-functional-units)

4. [Calculation methods](#4-calculation-methods)

5. [Default coefficients by operation type](#5-default-coefficients-by-operation-type)

6. [Manure management systems](#6-manure-management-systems)

7. [Emission factors, GWP sets and constants](#7-emission-factors-gwp-sets-and-constants)

8. [Default results](#8-default-results)

9. [Opening-page live counter](#9-opening-page-live-counter)

10. [Limitations](#10-limitations)

11. [Software and deployment](#11-software-and-deployment)

12. [References](#12-references)

## 1. Purpose and scope

The CAFO Footprint Simulator estimates the annual inputs, outputs and environmental footprints of a concentrated animal feeding operation (CAFO) managed under **business as usual (BAU)**. The user selects the operation type, farm size, manure management system, climate, electricity grid and system boundary; the simulator then computes:

- **Inputs:** feed (as fed, dry matter, crude protein), drinking and service water, electricity, diesel, LPG and purchased animals.
- **Outputs:** products (milk, eggs, live weight), mortalities, manure (wet mass, total and volatile solids, nitrogen), wastewater and gaseous losses.
- **Carbon footprint:** CH₄, N₂O and CO₂ expressed as CO₂ equivalent, by source and GHG Protocol scope.
- **Nitrogen balance:** from feed N through the herd and manure to air, water and soil.
- **Water footprint:** green, blue and grey water (Water Footprint Network method).

Results are presented as Sankey diagrams (material, nitrogen, carbon and water), key figures and inventory tables, and can be exported as CSV, branded PDF or JPEG. Mitigation options (digesters, covers, additives) are deliberately excluded so that BAU serves as a clean baseline.

## 2. Using the simulator

1. **Animal category** — one of seven CAFO types (section 3).
2. **Farm size** — number of animal places; a scale shows the US EPA Small / Medium / Large CAFO class [7].
3. **Manure management and climate** — the BAU system is pre-selected; climate sets the methane conversion factor.
4. **Energy and system boundary** — electricity grid factor, inclusion of feed production (Scope 3 emissions and feed water footprint) and of manure land application, and the GWP set.
5. **Calculate** — results open on the *Material flows* Sankey; tabs switch to *Nitrogen balance*, *Carbon footprint* and *Water footprint*.

**Exports.** *Export CSV* writes the scenario, emissions, intensities, inventory, water footprint, nitrogen flows, all coefficients with their source tags, constants and the reference list. *Save PDF* (computer) and *Save JPEG* produce an A4 landscape sheet with the W2R Lab and Technion header, figure, scenario, key figures and notes; on phones *Save to gallery* shares the JPEG to the photo gallery. On screens narrower than 600 px Sankey diagrams use numbered nodes with a key.

## 3. Operation types, boundary and functional units

| Operation type | Size unit | BAU manure system | Functional unit | US EPA Large CAFO threshold | Boundary note |
|---|---|---|---|---|---|
| Dairy cows | mature cows | Uncovered anaerobic lagoon | kg FPCM | ≥ 700 mature dairy cows | Lactating + dry cows. Heifers raised off-site (bought in as springers). |
| Beef feedlot | head (one-time capacity) | Open dry lot | kg LW gain | ≥ 1,000 cattle other than mature dairy cows | Finishing phase only; cow-calf and backgrounding emissions are outside the boundary. |
| Swine finishing | pig spaces | Deep pit under slats (> 1 month) | kg LW gain | ≥ 2,500 swine ≥ 55 lb | Feeder-to-finish (25 → 130 kg). Nursery and sow farm are outside the boundary. |
| Swine sow farm | sows (inventory) | Deep pit under slats (> 1 month) | kg weaned piglet | ≥ 2,500 swine ≥ 55 lb | Farrow-to-wean. Pre-weaning piglet mortality is not tracked as a mass flow. |
| Broiler chickens | bird places | Poultry house with litter | kg LW gain | ≥ 125,000 chickens other than layers (dry manure) | Hatchery and breeder flocks are outside the boundary. Litter bedding not modelled. |
| Laying hens | hen places | Poultry without litter (high-rise / manure belt) | kg eggs | ≥ 82,000 laying hens (dry manure) | Pullets reared off-site. Cage / cage-free house with belt or high-rise manure handling. |
| Turkeys | bird places | Poultry house with litter | kg LW gain | ≥ 55,000 turkeys | Mixed hens/toms average. Brooder and hatchery outside the boundary. |

**System boundary.** Cradle-to-farm-gate for one year of operation at the selected capacity. Emissions from animals before they enter the farm (heifer rearing, nursery, hatchery, cow-calf), bedding, buildings, carcass disposal, manure transport and land-use change are excluded. Feed production and manure land application can be switched off.

**Allocation.** None: all emissions are attributed to the functional unit. A per-kg-protein intensity covering all products (milk or eggs plus live weight sold) is reported alongside.

## 4. Calculation methods

All quantities are computed per **animal place per year** and multiplied by the number of places. Equation numbers refer to IPCC (2019) [1], Vol. 4, Ch. 10 unless stated otherwise.

### 4.1 Herd dynamics

- **Continuous herds (dairy, sows):** animal-days = 365; replacements bought = replacement rate × entry weight; culls sold = (replacement rate − mortality) × cull weight; deaths = mortality × adult weight; plus milk (dairy) or weaned piglets (sows).
- **Batch systems (feedlot, swine finishing, broilers, layers, turkeys):** cycles = 365 / (days on farm + downtime); occupancy = days / (days + downtime); live animal-days = 365 × occupancy × (1 − mortality / 2); animals placed = cycles × entry weight; animals sold = cycles × (1 − mortality) × exit weight; deaths = cycles × mortality × mean weight.
- **Feed intake:** growers DMI = FCR × average daily gain, ADG = (exit − entry weight) / days on farm; dairy, sows and layers use a DMI per animal-day.
- **Functional unit:** FPCM (dairy), net live-weight gain = sold − placed (growers), eggs (layers) or weaned piglet live weight (sows).

### 4.2 Enteric methane (Eq. 10.21)

```
CH4_enteric = DMI × 18.45 MJ/kg DM × (Ym / 100) / 55.65 MJ/kg CH4
```

### 4.3 Manure solids (Eq. 10.24, mass basis)

```
TS  = DMI × (1 − DE + UE)          excreted total solids
VS  = TS × (VS/TS)                  volatile solids
wet manure = TS / TS content        as excreted
```

### 4.4 Manure methane (Eq. 10.23)

```
CH4_manure = VS × Bo × 0.67 kg/m³ × MCF(system, climate)
```

### 4.5 Nitrogen excretion (Tier 2)

```
N_intake   = DMI × CP / 6.25
N_retained = N in products + N in mortalities − N in purchased animals
Nex        = N_intake − N_retained
```

Product N: milk 0.0053 kg N/kg FPCM [14][15], eggs 0.0192 kg N/kg [17], live weight = body N content × live weight.

### 4.6 Manure N₂O and nitrogen partition

```
N2O_direct   = Nex × EF3 × 44/28                                  (Eq. 10.25)
N_volatilised = Nex × FracGasMS          N_leached = Nex × FracLeachMS
N2O_indirect = (N_volatilised × EF4 + N_leached × EF5) × 44/28
N_other      = Nex × FracLossMS − N_volatilised − N_leached − Nex × EF3   (N2 and unaccounted)
N_applied    = Nex − N_volatilised − N_leached − Nex × EF3 − N_other
```

### 4.7 Land application (IPCC 2019, Ch. 11)

```
N2O_field = (N_applied × EF1 + N_applied × FracGASM × EF4 + N_applied × FracLEACH × EF5) × 44/28
N_soil    = N_applied × (1 − EF1 − FracGASM − FracLEACH)
```

### 4.8 Supply-chain and energy emissions

```
Feed        = DMI × feed footprint (kg CO2 equivalent / kg DM, excl. land-use change)
Electricity = kWh × grid factor
Fuels       = diesel L × diesel factor + LPG L × LPG factor
Water       = (drinking + service water) m³ × water-supply factor
```

### 4.9 CO₂ equivalent and scopes

**CO₂ equivalent** expresses different greenhouse gases as the amount of CO₂ that would cause the same warming over 100 years: CO₂ equivalent = CO₂ + CH₄ × GWP₁₀₀(CH₄) + N₂O × GWP₁₀₀(N₂O) (section 7.2). Feed footprints are taken as CO₂ equivalent values directly.

| Emission source | Gas | GHG Protocol scope [11] |
|---|---|---|
| Enteric fermentation | CH4 | Scope 1 |
| Manure management CH4 | CH4 | Scope 1 |
| Manure management N2O | N2O | Scope 1 |
| Manure land application N2O | N2O | Scope 1 |
| Feed production | mixed (LCA value) | Scope 3 |
| On-farm fuels | CO2 | Scope 1 |
| Electricity | CO2 | Scope 2 |
| Water supply | CO2 | Scope 3 |

### 4.10 Water footprint (Water Footprint Network method [18])

```
Feed green / blue / grey (m³) = DMI (t DM) × crop water footprint (m³/t DM) of the ration
On-farm blue (m³)             = drinking water + service water
Manure grey (m³)              = N leached (storage + fields) / (c_max − c_nat)
```

with c_max = 10 mg NO₃-N/L and c_nat = 0 [21]. Feed water footprints are ration-weighted from global-average crop water footprints [19].

### 4.11 Mass balance

Respiration & evaporation = (feed as fed + drinking water + service water + purchased animals) − (products + mortalities + manure as excreted + wastewater). The residual represents CO₂ and water vapour exhaled by animals and evaporated from housing; a negative residual triggers a warning.

### 4.12 Intensities

- per functional unit = total / functional-unit output
- per animal place = total / number of places
- per kg protein = total / protein in all products (N × 6.25 for live weight)
- nitrogen use efficiency = N in products / feed N

## 5. Default coefficients by operation type

Units per animal-day refer to live, occupied animal-days; units per place refer to housing capacity.

### 5.1 Dairy cows

*Lactating + dry cows. Heifers raised off-site (bought in as springers).* Default size 2,000 mature cows; size presets 150 / 500 / 2,000 / 10,000.

| Group | Parameter | Default | Unit | Basis | Note |
|---|---|---|---|---|---|
| Herd & production | Milk yield (fat & protein corrected) | 10800 | kg FPCM/cow/yr | Assumption [16] | Typical US production level, rounded |
| Herd & production | Mature body weight | 680 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Replacement heifer weight at entry | 590 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Replacement rate | 0.38 | fraction/yr | Assumption [16] | Typical US production level, rounded |
| Herd & production | Adult mortality | 0.06 | fraction/yr | Assumption [16] | Typical US production level, rounded |
| Herd & production | Calves sold | 0.92 | head/cow/yr | Assumption [16] | Typical US production level, rounded |
| Herd & production | Calf weight at sale | 42 | kg LW | Assumption [16] | Typical US production level, rounded |
| Diet & digestion | Dry-matter intake | 23.5 | kg DM/animal-day | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Dietary crude protein | 0.165 | fraction of DM | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Digestibility (DE/GE; ME/GE for poultry) | 0.69 | fraction | Approximated [1] | Chosen within the IPCC digestibility ranges for the feeding situation |
| Diet & digestion | Urinary energy | 0.04 | fraction of GE | From source [1] | Default urinary energy: cattle 0.04, swine 0.02 of GE |
| Diet & digestion | Methane conversion factor Ym | 5.7 | % of GE | Approximated [1] | Ym defaults (high-producing dairy 5.7 %, feedlot 3.0 %) |
| Diet & digestion | Feed dry-matter content (as fed) | 0.52 | fraction | Assumption | Model-author assumption — replace with site data |
| Manure | Volatile solids in manure solids (VS/TS) | 0.85 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Total solids in manure as excreted | 0.125 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Max. CH4 producing capacity Bo | 0.24 | m³ CH4/kg VS | Approximated [2][1] | Bo for North America (2006 Annex 10A.2; 2019 Table 10.16) |
| Manure | N content of live weight | 0.025 | kg N/kg LW | Assumption | Typical whole-body N content (≈ 2.5 % mammals, 2.9 % poultry) |
| Water | Drinking water | 115 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Water | Service water (wash, parlor, cooling) | 80 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Energy | Electricity | 900 | kWh/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Diesel (feeding, manure handling) | 80 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Propane / LPG (heating, hot water) | 20 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Upstream | Feed production footprint | 0.35 | kg CO₂ equivalent/kg DM | Assumption [12][13] | Indicative value within published feed LCA ranges; excludes land-use change |
| Water footprint | Feed water footprint — green | 900 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — blue | 70 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — grey | 110 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |

### 5.2 Beef feedlot

*Finishing phase only; cow-calf and backgrounding emissions are outside the boundary.* Default size 10,000 head (one-time capacity); size presets 500 / 2,000 / 10,000 / 50,000.

| Group | Parameter | Default | Unit | Basis | Note |
|---|---|---|---|---|---|
| Herd & production | Weight at placement | 360 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Weight at market / depletion | 630 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Days on farm per cycle | 165 | d | Assumption [16] | Typical US production level, rounded |
| Herd & production | Downtime between cycles (cleaning) | 15 | d | Assumption | Model-author assumption — replace with site data |
| Herd & production | Mortality per cycle | 0.015 | fraction | Assumption [16] | Typical US production level, rounded |
| Herd & production | Feed conversion ratio | 6 | kg DM / kg LW gain | Assumption [16] | Typical US production level, rounded |
| Diet & digestion | Dietary crude protein | 0.135 | fraction of DM | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Digestibility (DE/GE; ME/GE for poultry) | 0.78 | fraction | Approximated [1] | Chosen within the IPCC digestibility ranges for the feeding situation |
| Diet & digestion | Urinary energy | 0.04 | fraction of GE | From source [1] | Default urinary energy: cattle 0.04, swine 0.02 of GE |
| Diet & digestion | Methane conversion factor Ym | 3 | % of GE | Approximated [1] | Ym defaults (high-producing dairy 5.7 %, feedlot 3.0 %) |
| Diet & digestion | Feed dry-matter content (as fed) | 0.75 | fraction | Assumption | Model-author assumption — replace with site data |
| Manure | Volatile solids in manure solids (VS/TS) | 0.85 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Total solids in manure as excreted | 0.12 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Max. CH4 producing capacity Bo | 0.19 | m³ CH4/kg VS | Approximated [2][1] | Bo for North America (2006 Annex 10A.2; 2019 Table 10.16) |
| Manure | N content of live weight | 0.025 | kg N/kg LW | Assumption | Typical whole-body N content (≈ 2.5 % mammals, 2.9 % poultry) |
| Water | Drinking water | 45 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Water | Service water (wash, parlor, cooling) | 2 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Energy | Electricity | 35 | kWh/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Diesel (feeding, manure handling) | 30 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Propane / LPG (heating, hot water) | 10 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Upstream | Feed production footprint | 0.4 | kg CO₂ equivalent/kg DM | Assumption [12][13] | Indicative value within published feed LCA ranges; excludes land-use change |
| Water footprint | Feed water footprint — green | 1050 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — blue | 80 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — grey | 170 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |

### 5.3 Swine finishing

*Feeder-to-finish (25 → 130 kg). Nursery and sow farm are outside the boundary.* Default size 5,000 pig spaces; size presets 500 / 2,400 / 5,000 / 20,000.

| Group | Parameter | Default | Unit | Basis | Note |
|---|---|---|---|---|---|
| Herd & production | Weight at placement | 25 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Weight at market / depletion | 130 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Days on farm per cycle | 115 | d | Assumption [16] | Typical US production level, rounded |
| Herd & production | Downtime between cycles (cleaning) | 7 | d | Assumption | Model-author assumption — replace with site data |
| Herd & production | Mortality per cycle | 0.04 | fraction | Assumption [16] | Typical US production level, rounded |
| Herd & production | Feed conversion ratio | 2.45 | kg DM / kg LW gain | Assumption [16] | Typical US production level, rounded |
| Diet & digestion | Dietary crude protein | 0.16 | fraction of DM | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Digestibility (DE/GE; ME/GE for poultry) | 0.82 | fraction | Approximated [1] | Chosen within the IPCC digestibility ranges for the feeding situation |
| Diet & digestion | Urinary energy | 0.02 | fraction of GE | From source [1] | Default urinary energy: cattle 0.04, swine 0.02 of GE |
| Diet & digestion | Methane conversion factor Ym | 0.5 | % of GE | Assumption [1] | IPCC gives no Ym for swine; set so enteric CH4 ≈ IPCC Tier 1 swine factor (~1.5 kg CH4/head/yr) |
| Diet & digestion | Feed dry-matter content (as fed) | 0.88 | fraction | Assumption | Model-author assumption — replace with site data |
| Manure | Volatile solids in manure solids (VS/TS) | 0.8 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Total solids in manure as excreted | 0.1 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Max. CH4 producing capacity Bo | 0.48 | m³ CH4/kg VS | Approximated [2][1] | Bo for North America (2006 Annex 10A.2; 2019 Table 10.16) |
| Manure | N content of live weight | 0.025 | kg N/kg LW | Assumption | Typical whole-body N content (≈ 2.5 % mammals, 2.9 % poultry) |
| Water | Drinking water | 9 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Water | Service water (wash, parlor, cooling) | 1.5 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Energy | Electricity | 50 | kWh/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Diesel (feeding, manure handling) | 3 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Propane / LPG (heating, hot water) | 6 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Upstream | Feed production footprint | 0.5 | kg CO₂ equivalent/kg DM | Assumption [12][13] | Indicative value within published feed LCA ranges; excludes land-use change |
| Water footprint | Feed water footprint — green | 1350 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — blue | 120 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — grey | 190 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |

### 5.4 Swine sow farm

*Farrow-to-wean. Pre-weaning piglet mortality is not tracked as a mass flow.* Default size 2,500 sows (inventory); size presets 300 / 1,200 / 2,500 / 10,000.

| Group | Parameter | Default | Unit | Basis | Note |
|---|---|---|---|---|---|
| Herd & production | Piglets weaned | 26 | head/sow/yr | Assumption [16] | Typical US production level, rounded |
| Herd & production | Weaning weight | 6.5 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Replacement rate | 0.5 | fraction/yr | Assumption [16] | Typical US production level, rounded |
| Herd & production | Replacement gilt weight at entry | 135 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Cull sow weight | 240 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Adult mortality | 0.08 | fraction/yr | Assumption [16] | Typical US production level, rounded |
| Diet & digestion | Dry-matter intake | 2.6 | kg DM/animal-day | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Dietary crude protein | 0.15 | fraction of DM | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Digestibility (DE/GE; ME/GE for poultry) | 0.78 | fraction | Approximated [1] | Chosen within the IPCC digestibility ranges for the feeding situation |
| Diet & digestion | Urinary energy | 0.02 | fraction of GE | From source [1] | Default urinary energy: cattle 0.04, swine 0.02 of GE |
| Diet & digestion | Methane conversion factor Ym | 0.6 | % of GE | Assumption [1] | IPCC gives no Ym for swine; set so enteric CH4 ≈ IPCC Tier 1 swine factor (~1.5 kg CH4/head/yr) |
| Diet & digestion | Feed dry-matter content (as fed) | 0.88 | fraction | Assumption | Model-author assumption — replace with site data |
| Manure | Volatile solids in manure solids (VS/TS) | 0.8 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Total solids in manure as excreted | 0.09 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Max. CH4 producing capacity Bo | 0.48 | m³ CH4/kg VS | Approximated [2][1] | Bo for North America (2006 Annex 10A.2; 2019 Table 10.16) |
| Manure | N content of live weight | 0.025 | kg N/kg LW | Assumption | Typical whole-body N content (≈ 2.5 % mammals, 2.9 % poultry) |
| Water | Drinking water | 20 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Water | Service water (wash, parlor, cooling) | 6 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Energy | Electricity | 400 | kWh/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Diesel (feeding, manure handling) | 5 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Propane / LPG (heating, hot water) | 30 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Upstream | Feed production footprint | 0.5 | kg CO₂ equivalent/kg DM | Assumption [12][13] | Indicative value within published feed LCA ranges; excludes land-use change |
| Water footprint | Feed water footprint — green | 1350 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — blue | 120 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — grey | 190 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |

### 5.5 Broiler chickens

*Hatchery and breeder flocks are outside the boundary. Litter bedding not modelled.* Default size 200,000 bird places; size presets 25,000 / 100,000 / 200,000 / 1,000,000.

| Group | Parameter | Default | Unit | Basis | Note |
|---|---|---|---|---|---|
| Herd & production | Weight at placement | 0.042 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Weight at market / depletion | 2.9 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Days on farm per cycle | 47 | d | Assumption [16] | Typical US production level, rounded |
| Herd & production | Downtime between cycles (cleaning) | 14 | d | Assumption | Model-author assumption — replace with site data |
| Herd & production | Mortality per cycle | 0.045 | fraction | Assumption [16] | Typical US production level, rounded |
| Herd & production | Feed conversion ratio | 1.58 | kg DM / kg LW gain | Assumption [16] | Typical US production level, rounded |
| Diet & digestion | Dietary crude protein | 0.21 | fraction of DM | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Digestibility (DE/GE; ME/GE for poultry) | 0.75 | fraction | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Urinary energy | 0 | fraction of GE | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Methane conversion factor Ym | 0 | % of GE | From source [1] | IPCC gives no enteric CH4 factor for poultry (negligible) → 0 |
| Diet & digestion | Feed dry-matter content (as fed) | 0.89 | fraction | Assumption | Model-author assumption — replace with site data |
| Manure | Volatile solids in manure solids (VS/TS) | 0.75 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Total solids in manure as excreted | 0.25 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Max. CH4 producing capacity Bo | 0.36 | m³ CH4/kg VS | Approximated [2][1] | Bo for North America (2006 Annex 10A.2; 2019 Table 10.16) |
| Manure | N content of live weight | 0.029 | kg N/kg LW | Assumption | Typical whole-body N content (≈ 2.5 % mammals, 2.9 % poultry) |
| Water | Drinking water | 0.19 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Water | Service water (wash, parlor, cooling) | 0.03 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Energy | Electricity | 1.6 | kWh/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Diesel (feeding, manure handling) | 0.05 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Propane / LPG (heating, hot water) | 0.9 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Upstream | Feed production footprint | 0.6 | kg CO₂ equivalent/kg DM | Assumption [12][13] | Indicative value within published feed LCA ranges; excludes land-use change |
| Water footprint | Feed water footprint — green | 1500 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — blue | 120 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — grey | 170 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |

### 5.6 Laying hens

*Pullets reared off-site. Cage / cage-free house with belt or high-rise manure handling.* Default size 1,000,000 hen places; size presets 50,000 / 250,000 / 1,000,000 / 3,000,000.

| Group | Parameter | Default | Unit | Basis | Note |
|---|---|---|---|---|---|
| Herd & production | Weight at placement | 1.4 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Weight at market / depletion | 1.75 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Days on farm per cycle | 500 | d | Assumption [16] | Typical US production level, rounded |
| Herd & production | Downtime between cycles (cleaning) | 21 | d | Assumption | Model-author assumption — replace with site data |
| Herd & production | Mortality per cycle | 0.08 | fraction | Assumption [16] | Typical US production level, rounded |
| Herd & production | Laying rate | 0.82 | eggs/hen-day | Assumption [16] | Typical US production level, rounded |
| Herd & production | Average egg weight | 0.06 | kg/egg | Assumption [16] | Typical US production level, rounded |
| Diet & digestion | Dry-matter intake | 0.092 | kg DM/animal-day | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Dietary crude protein | 0.17 | fraction of DM | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Digestibility (DE/GE; ME/GE for poultry) | 0.74 | fraction | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Urinary energy | 0 | fraction of GE | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Methane conversion factor Ym | 0 | % of GE | From source [1] | IPCC gives no enteric CH4 factor for poultry (negligible) → 0 |
| Diet & digestion | Feed dry-matter content (as fed) | 0.89 | fraction | Assumption | Model-author assumption — replace with site data |
| Manure | Volatile solids in manure solids (VS/TS) | 0.7 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Total solids in manure as excreted | 0.25 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Max. CH4 producing capacity Bo | 0.39 | m³ CH4/kg VS | Approximated [2][1] | Bo for North America (2006 Annex 10A.2; 2019 Table 10.16) |
| Manure | N content of live weight | 0.029 | kg N/kg LW | Assumption | Typical whole-body N content (≈ 2.5 % mammals, 2.9 % poultry) |
| Water | Drinking water | 0.2 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Water | Service water (wash, parlor, cooling) | 0.01 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Energy | Electricity | 2.5 | kWh/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Diesel (feeding, manure handling) | 0.05 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Propane / LPG (heating, hot water) | 0 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Upstream | Feed production footprint | 0.55 | kg CO₂ equivalent/kg DM | Assumption [12][13] | Indicative value within published feed LCA ranges; excludes land-use change |
| Water footprint | Feed water footprint — green | 1500 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — blue | 120 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — grey | 170 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |

### 5.7 Turkeys

*Mixed hens/toms average. Brooder and hatchery outside the boundary.* Default size 60,000 bird places; size presets 10,000 / 30,000 / 60,000 / 200,000.

| Group | Parameter | Default | Unit | Basis | Note |
|---|---|---|---|---|---|
| Herd & production | Weight at placement | 0.06 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Weight at market / depletion | 15 | kg LW | Assumption [16] | Typical US production level, rounded |
| Herd & production | Days on farm per cycle | 120 | d | Assumption [16] | Typical US production level, rounded |
| Herd & production | Downtime between cycles (cleaning) | 21 | d | Assumption | Model-author assumption — replace with site data |
| Herd & production | Mortality per cycle | 0.08 | fraction | Assumption [16] | Typical US production level, rounded |
| Herd & production | Feed conversion ratio | 2.3 | kg DM / kg LW gain | Assumption [16] | Typical US production level, rounded |
| Diet & digestion | Dietary crude protein | 0.22 | fraction of DM | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Digestibility (DE/GE; ME/GE for poultry) | 0.72 | fraction | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Urinary energy | 0 | fraction of GE | Assumption | Model-author assumption — replace with site data |
| Diet & digestion | Methane conversion factor Ym | 0 | % of GE | From source [1] | IPCC gives no enteric CH4 factor for poultry (negligible) → 0 |
| Diet & digestion | Feed dry-matter content (as fed) | 0.89 | fraction | Assumption | Model-author assumption — replace with site data |
| Manure | Volatile solids in manure solids (VS/TS) | 0.75 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Total solids in manure as excreted | 0.25 | fraction | Approximated [6] | Typical as-excreted manure characteristics, rounded |
| Manure | Max. CH4 producing capacity Bo | 0.36 | m³ CH4/kg VS | Approximated [2][1] | Bo for North America (2006 Annex 10A.2; 2019 Table 10.16) |
| Manure | N content of live weight | 0.029 | kg N/kg LW | Assumption | Typical whole-body N content (≈ 2.5 % mammals, 2.9 % poultry) |
| Water | Drinking water | 0.55 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Water | Service water (wash, parlor, cooling) | 0.05 | L/animal-day | Assumption | Model-author assumption — replace with site data |
| Energy | Electricity | 4 | kWh/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Diesel (feeding, manure handling) | 0.2 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Energy | Propane / LPG (heating, hot water) | 2.5 | L/place/yr | Assumption | Model-author assumption — replace with site data |
| Upstream | Feed production footprint | 0.6 | kg CO₂ equivalent/kg DM | Assumption [12][13] | Indicative value within published feed LCA ranges; excludes land-use change |
| Water footprint | Feed water footprint — green | 1500 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — blue | 120 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |
| Water footprint | Feed water footprint — grey | 170 | L/kg DM | Assumption [19] | Ration-weighted from global-average crop water footprints of maize, soybean and wheat (per t DM); forage assumed 400 / 50 / 50 m³/t DM |

## 6. Manure management systems

Source for all values: Approximated [1][2] — MCF (2019 Table 10.17), EF3 (2019 Table 10.21), FracGas / FracLeach / FracLoss (2006 Tables 10.22–10.23); rounded and grouped into three climates.

### 6.1 Methane conversion factor and direct N₂O

| System | MCF cool | MCF temperate | MCF warm | EF3 (kg N₂O-N/kg N) |
|---|---|---|---|---|
| Uncovered anaerobic lagoon | 0.7 | 0.76 | 0.8 | 0 |
| Liquid/slurry tank, no crust | 0.25 | 0.42 | 0.73 | 0 |
| Deep pit under slats (> 1 month) | 0.25 | 0.42 | 0.73 | 0.002 |
| Solid storage (stacked manure) | 0.02 | 0.04 | 0.05 | 0.01 |
| Open dry lot | 0.01 | 0.015 | 0.02 | 0.02 |
| Daily spread | 0.001 | 0.005 | 0.01 | 0 |
| Poultry house with litter | 0.015 | 0.015 | 0.015 | 0.001 |
| Poultry without litter (high-rise / manure belt) | 0.015 | 0.015 | 0.015 | 0.001 |

Climates: Cool (mean annual < 10 °C); Temperate (10–20 °C); Warm (> 20 °C).

### 6.2 Nitrogen loss fractions by animal group (FracGas / FracLeach / FracLoss)

| System | Dairy | Beef | Swine | Poultry |
|---|---|---|---|---|
| Uncovered anaerobic lagoon | 0.35 / 0 / 0.77 | 0.35 / 0 / 0.77 | 0.4 / 0 / 0.78 | 0.4 / 0 / 0.77 |
| Liquid/slurry tank, no crust | 0.4 / 0 / 0.4 | 0.4 / 0 / 0.4 | 0.48 / 0 / 0.48 | 0.4 / 0 / 0.4 |
| Deep pit under slats (> 1 month) | 0.28 / 0 / 0.28 | 0.28 / 0 / 0.28 | 0.25 / 0 / 0.25 | 0.28 / 0 / 0.28 |
| Solid storage (stacked manure) | 0.3 / 0.02 / 0.4 | 0.45 / 0.02 / 0.5 | 0.45 / 0.02 / 0.5 | 0.4 / 0.02 / 0.5 |
| Open dry lot | 0.2 / 0.035 / 0.3 | 0.3 / 0.035 / 0.4 | 0.3 / 0.035 / 0.4 | 0.3 / 0.035 / 0.4 |
| Daily spread | 0.07 / 0 / 0.22 | 0.07 / 0 / 0.22 | 0.07 / 0 / 0.22 | 0.07 / 0 / 0.22 |
| Poultry house with litter | 0.4 / 0 / 0.5 | 0.4 / 0 / 0.5 | 0.4 / 0 / 0.5 | 0.4 / 0 / 0.5 |
| Poultry without litter (high-rise / manure belt) | 0.55 / 0 / 0.55 | 0.55 / 0 / 0.55 | 0.55 / 0 / 0.55 | 0.55 / 0 / 0.55 |

### 6.3 Systems available per operation type

| Operation type | Options (BAU default first) |
|---|---|
| Dairy cows | Uncovered anaerobic lagoon; Liquid/slurry tank, no crust; Solid storage (stacked manure); Open dry lot; Daily spread |
| Beef feedlot | Open dry lot; Solid storage (stacked manure); Deep pit under slats (> 1 month); Liquid/slurry tank, no crust |
| Swine finishing | Deep pit under slats (> 1 month); Uncovered anaerobic lagoon; Liquid/slurry tank, no crust; Solid storage (stacked manure) |
| Swine sow farm | Deep pit under slats (> 1 month); Uncovered anaerobic lagoon; Liquid/slurry tank, no crust; Solid storage (stacked manure) |
| Broiler chickens | Poultry house with litter; Solid storage (stacked manure) |
| Laying hens | Poultry without litter (high-rise / manure belt); Poultry house with litter; Uncovered anaerobic lagoon |
| Turkeys | Poultry house with litter; Solid storage (stacked manure) |

## 7. Emission factors, GWP sets and constants

### 7.1 Emission factors (all operation types)

| Factor | Default | Unit | Basis | Note |
|---|---|---|---|---|
| Grid electricity | 0.37 | kg CO₂ equivalent/kWh | Approximated [9] | US national average, rounded (or the grid chosen in step 4) |
| Diesel combustion | 2.7 | kg CO₂ equivalent/L | From source [8] | Combustion CO2, converted from per-gallon to per-litre |
| Propane / LPG combustion | 1.51 | kg CO₂ equivalent/L | From source [8] | Combustion CO2, converted from per-gallon to per-litre |
| Water supply (pumping, treatment) | 0.3 | kg CO₂ equivalent/m³ | Assumption | Pumping & treatment energy assumption |
| EF1 — direct N2O from applied manure N | 0.01 | kg N2O-N/kg N | From source [1] | Aggregated defaults, Ch. 11 Tables 11.1 & 11.3 |
| EF4 — N2O from volatilised N | 0.01 | kg N2O-N/kg N | From source [1] | Aggregated defaults, Ch. 11 Tables 11.1 & 11.3 |
| EF5 — N2O from leached N | 0.011 | kg N2O-N/kg N | From source [1] | Aggregated defaults, Ch. 11 Tables 11.1 & 11.3 |
| FracGASM — NH3+NOx volatilised at application | 0.21 | fraction | From source [1] | Aggregated defaults, Ch. 11 Tables 11.1 & 11.3 |
| FracLEACH-(H) — leaching after application | 0.24 | fraction | From source [1] | Aggregated defaults, Ch. 11 Tables 11.1 & 11.3 |
| Max. acceptable nitrate-N concentration (grey water) | 0.01 | kg N/m³ | From source [21] | 10 mg NO3-N/L water-quality standard; natural background assumed 0 |

**Electricity grid presets**

| Grid | kg CO₂ equivalent/kWh | Basis | Note |
|---|---|---|---|
| United States avg. | 0.37 | Approximated [9] | US national average, rounded |
| EU-27 avg. | 0.24 | Approximated [10] | EU-27 generation intensity, rounded |
| Israel | 0.5 | Assumption | Approximate national grid intensity — verify with Israeli national data |
| Coal-heavy grid | 0.85 | Assumption | Illustrative coal-dominated grid |
| Mostly renewable | 0.05 | Assumption | Illustrative low-carbon grid |

### 7.2 Global warming potentials (100-year)

| Set | CH₄ | N₂O | Source |
|---|---|---|---|
| IPCC AR6 GWP100 (default) | 27 | 273 | [3] |
| IPCC AR5 GWP100 | 28 | 265 | [4] |
| IPCC AR4 GWP100 | 25 | 298 | [5] |

### 7.3 Fixed constants

| Constant | Value | Basis | Note |
|---|---|---|---|
| Gross energy of feed | 18.45 MJ/kg DM | From source [1] | IPCC default energy density of feed |
| Energy content of methane | 55.65 MJ/kg CH4 | From source [1] | Enteric CH4 equation |
| Methane density | 0.67 kg/m³ | From source [1] | Manure CH4 equation |
| N2O-N → N2O | 44/28 | From source [1] | Stoichiometric conversion |
| Protein = N × 6.25 | 6.25 | From source [15] | Feed and live-weight protein |
| Milk N content | 0.0053 kg N/kg FPCM | Approximated [14][15] | 3.3 % true protein ÷ 6.38 |
| Egg N content | 0.0192 kg N/kg egg | Approximated [17][15] | ≈ 12 % protein ÷ 6.25 |
| Typical passenger car | 4.6 t CO2/yr | From source [24] | Only for the “like driving” comparison |

## 8. Default results

Each operation type at its default size, BAU manure system, temperate climate, US grid, AR6 GWPs, feed production and land application included.

| Operation type | Size | Total (t CO₂ equivalent/yr) | Per functional unit (kg CO₂ equivalent) | Largest source | Water footprint (L per FU) | Green / blue / grey | N use efficiency |
|---|---|---|---|---|---|---|---|
| Dairy cows | 2,000 mature | 33,788 | 1.56 / kg FPCM | Manure management CH4 (50 %) | 950 / kg FPCM | 75 / 7 / 18 % | 28 % |
| Beef feedlot | 10,000 head | 31,164 | 5.90 / kg LW gain | Feed production (42 %) | 9,978 / kg LW gain | 65 / 5 / 30 % | 45 % |
| Swine finishing | 5,000 pig | 4,825 | 3.23 / kg LW gain | Manure management CH4 (46 %) | 4,903 / kg LW gain | 70 / 6 / 24 % | 48 % |
| Swine sow farm | 2,500 sows | 3,786 | 8.96 / kg weaned piglet | Manure management CH4 (44 %) | 11,209 / kg weaned piglet | 68 / 7 / 26 % | 30 % |
| Broiler chickens | 200,000 bird | 4,114 | 1.26 / kg LW gain | Feed production (77 %) | 3,197 / kg LW gain | 76 / 6 / 18 % | 54 % |
| Laying hens | 1,000,000 hen | 21,602 | 1.31 / kg eggs | Feed production (79 %) | 3,688 / kg eggs | 76 / 6 / 18 % | 42 % |
| Turkeys | 60,000 bird | 4,144 | 1.94 / kg LW gain | Feed production (74 %) | 4,953 / kg LW gain | 73 / 6 / 21 % | 34 % |

### 8.1 Emissions by source (kg CO₂ equivalent per functional unit)

| Operation type | Enteric fermentation | Manure management CH4 | Manure management N2O | Manure land application N2O | Feed production | On-farm fuels | Electricity | Water supply |
|---|---|---|---|---|---|---|---|---|
| Dairy cows | 0.41 | 0.78 | 0.02 | 0.02 | 0.28 | 0.02 | 0.03 | 0.00 |
| Beef feedlot | 1.66 | 0.07 | 1.08 | 0.41 | 2.47 | 0.18 | 0.02 | 0.01 |
| Swine finishing | 0.11 | 1.47 | 0.08 | 0.18 | 1.26 | 0.06 | 0.06 | 0.00 |
| Swine sow farm | 0.30 | 3.93 | 0.20 | 0.48 | 2.81 | 0.35 | 0.88 | 0.02 |
| Broiler chickens | 0.00 | 0.03 | 0.05 | 0.08 | 0.97 | 0.09 | 0.04 | 0.00 |
| Laying hens | 0.00 | 0.04 | 0.09 | 0.09 | 1.03 | 0.01 | 0.06 | 0.00 |
| Turkeys | 0.00 | 0.05 | 0.12 | 0.17 | 1.44 | 0.12 | 0.04 | 0.00 |

## 9. Opening-page live counter

The counter spreads 6.2 Gt CO₂ equivalent per year — all livestock supply chains worldwide in 2015 [22] — evenly over the year (≈ 196 t per second, ≈ 17.0 Mt per day) and counts from local midnight. Livestock's share of anthropogenic emissions (≈ 12 %) is from the same source; the methane share (≈ 32 %) from [23]. No reliable global estimate exists for CAFOs alone, so the counter covers all livestock and is shown as context, not as a CAFO total.

## 10. Limitations

- Default coefficients are indicative; values marked *Approximated* were transcribed from IPCC tables without line-by-line verification, and *Assumption* values are typical US BAU figures.
- One manure management system receives all excreted manure; solid separation and mixed systems are not modelled.
- Feed footprints and feed water footprints are ration-level averages and exclude land-use change; irrigated forage in arid regions can raise blue water substantially.
- Pre-farm animal rearing, bedding, buildings, carcass disposal and manure transport are outside the boundary; no co-product allocation is applied.
- Steady-state annual averages: no seasonality, herd growth or year-to-year variation.
- The live counter uses a global livestock estimate for 2015, not CAFOs specifically.

## 11. Software and deployment

Static web application without build step or runtime dependencies (the Figtree web font and, for PDF export, jsPDF are loaded from CDNs).

| File | Content |
|---|---|
| index.html | page structure: opening page, setup steps, results |
| css/styles.css | styles, W2R Lab palette, light and dark themes |
| js/data.js | all default coefficients, sources and references |
| js/model.js | calculation engine (browser and Node) |
| js/charts.js | Sankey renderer and emission bars |
| js/icons.js | line-icon set |
| js/export.js | branded PDF / JPEG export |
| js/app.js | user interface |
| tests/sanity.js | model checks (mass, nitrogen and water balances) |
| scripts/generate-docs.js | generates this document |

Hosted on Vercel (team W2R) from the GitHub repository; every push to `main` redeploys. Regenerate this document with `node scripts/generate-docs.js` after changing data or model.

## 12. References

1. IPCC (2019). 2019 Refinement to the 2006 IPCC Guidelines for National Greenhouse Gas Inventories. Vol. 4: Agriculture, Forestry and Other Land Use — Ch. 10 "Emissions from Livestock and Manure Management" and Ch. 11 "N2O Emissions from Managed Soils, and CO2 Emissions from Lime and Urea Application". Calvo Buendia, E., Tanabe, K., Kranjc, A., Baasansuren, J., Fukuda, M., Ngarize, S., Osako, A., Pyrozhenko, Y., Shermanau, P. & Federici, S. (eds). IPCC, Switzerland. <https://www.ipcc-nggip.iges.or.jp/public/2019rf/vol4.html>
2. IPCC (2006). 2006 IPCC Guidelines for National Greenhouse Gas Inventories. Vol. 4: Agriculture, Forestry and Other Land Use, Ch. 10 "Emissions from Livestock and Manure Management" (incl. Annex 10A.2). Eggleston, H.S., Buendia, L., Miwa, K., Ngara, T. & Tanabe, K. (eds). IGES, Japan. <https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html>
3. Forster, P. et al. (2021). The Earth’s Energy Budget, Climate Feedbacks, and Climate Sensitivity. In: Climate Change 2021: The Physical Science Basis. Contribution of Working Group I to the Sixth Assessment Report of the IPCC. Cambridge University Press. Table 7.15 (GWP100: CH4 non-fossil 27.0, N2O 273). <https://www.ipcc.ch/report/ar6/wg1/>
4. Myhre, G. et al. (2013). Anthropogenic and Natural Radiative Forcing. In: Climate Change 2013: The Physical Science Basis. Contribution of Working Group I to the Fifth Assessment Report of the IPCC. Cambridge University Press. Table 8.7 (GWP100: CH4 28, N2O 265). <https://www.ipcc.ch/report/ar5/wg1/>
5. Forster, P. et al. (2007). Changes in Atmospheric Constituents and in Radiative Forcing. In: Climate Change 2007: The Physical Science Basis. Contribution of Working Group I to the Fourth Assessment Report of the IPCC. Cambridge University Press. Table 2.14 (GWP100: CH4 25, N2O 298). <https://www.ipcc.ch/report/ar4/wg1/>
6. ASABE (2005, reaffirmed). ASAE D384.2: Manure Production and Characteristics. American Society of Agricultural and Biological Engineers, St. Joseph, MI.
7. US Code of Federal Regulations, 40 CFR § 122.23 — Concentrated animal feeding operations (applicability; size thresholds for Large and Medium CAFOs). <https://www.ecfr.gov/current/title-40/chapter-I/subchapter-D/part-122/subpart-B/section-122.23>
8. US EPA. GHG Emission Factors Hub. Center for Corporate Climate Leadership (combustion CO2: diesel 10.21 kg/gal; propane 5.72 kg/gal). <https://www.epa.gov/climateleadership/ghg-emission-factors-hub>
9. US EPA. Emissions & Generation Resource Integrated Database (eGRID) — US national average output emission rate. <https://www.epa.gov/egrid>
10. European Environment Agency. Greenhouse gas emission intensity of electricity generation in Europe (indicator).
11. WRI & WBCSD (2004). The Greenhouse Gas Protocol: A Corporate Accounting and Reporting Standard, revised edition (Scope 1/2/3 definitions). <https://ghgprotocol.org/corporate-standard>
12. Gerber, P.J., Steinfeld, H., Henderson, B., Mottet, A., Opio, C., Dijkman, J., Falcucci, A. & Tempio, G. (2013). Tackling climate change through livestock — A global assessment of emissions and mitigation opportunities. FAO, Rome (GLEAM results).
13. Vellinga, Th.V., Blonk, H., Marinussen, M., van Zeist, W.J., de Boer, I.J.M. & Starmans, D. (2013). Methodology used in FeedPrint: a tool quantifying greenhouse gas emissions of feed production and utilization. Wageningen UR Livestock Research, Report 674.
14. International Dairy Federation (2022). The IDF global Carbon Footprint standard for the dairy sector. Bulletin of the IDF No. 520/2022 (fat- and protein-corrected milk as functional unit).
15. Jones, D.B. (1931). Factors for converting percentages of nitrogen in foods and feeds into percentages of proteins. USDA Circular No. 183 (N × 6.25; milk N × 6.38).
16. USDA National Agricultural Statistics Service. Milk Production; Poultry — Production and Value; Quarterly Hogs and Pigs; Cattle on Feed (orientation for typical US production levels only). <https://www.nass.usda.gov/>
17. USDA Agricultural Research Service. FoodData Central — Egg, whole, raw, fresh (protein ≈ 12–13 %). <https://fdc.nal.usda.gov/>
18. Hoekstra, A.Y., Chapagain, A.K., Aldaya, M.M. & Mekonnen, M.M. (2011). The Water Footprint Assessment Manual: Setting the Global Standard. Earthscan, London (green, blue and grey water footprint definitions).
19. Mekonnen, M.M. & Hoekstra, A.Y. (2011). The green, blue and grey water footprint of crops and derived crop products. Hydrology and Earth System Sciences 15, 1577–1600 (global averages, e.g. maize ≈ 1,222 m³/t; soybean ≈ 2,145 m³/t; wheat ≈ 1,827 m³/t).
20. Mekonnen, M.M. & Hoekstra, A.Y. (2012). A global assessment of the water footprint of farm animal products. Ecosystems 15, 401–415 (benchmark product water footprints by production system).
21. Franke, N.A., Boyacioglu, H. & Hoekstra, A.Y. (2013). Grey water footprint accounting: Tier 1 supporting guidelines. Value of Water Research Report Series No. 65, UNESCO-IHE, Delft (grey WF = pollutant load ÷ (c_max − c_nat)).
22. FAO (2023). Pathways towards lower emissions — A global assessment of the greenhouse gas emissions and mitigation options from livestock agrifood systems. Food and Agriculture Organization of the United Nations, Rome (GLEAM 3: livestock supply chains ≈ 6.2 Gt CO₂ equivalent in 2015, ≈ 12 % of anthropogenic emissions).
23. United Nations Environment Programme & Climate and Clean Air Coalition (2021). Global Methane Assessment: Benefits and Costs of Mitigating Methane Emissions. UNEP, Nairobi (livestock ≈ 32 % of anthropogenic methane).
24. US EPA. Greenhouse Gas Emissions from a Typical Passenger Vehicle (≈ 4.6 t CO2 per vehicle per year). <https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle>
