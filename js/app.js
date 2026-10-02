/* UI for the CAFO BAU carbon-footprint calculator: setup wizard -> calculate -> results lenses. */
(function () {
  'use strict';

  const D = window.CAFO_DATA;
  const M = window.CAFO_MODEL;
  const C = window.CAFO_CHARTS;
  const IC = window.CAFO_ICONS;
  const ic = (name, cls) => IC.icon(name, cls);
  const { fmt, esc } = C;
  const STORE_KEY = 'cafo-bau-v2';
  const S = (i) => `var(--series-${i})`;
  const $ = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------------ UI vocabulary

  const SPECIES_UI = {
    dairy:    { sub: 'Milk production' },
    beef:     { sub: 'Finishing cattle' },
    swine:    { sub: 'Grow-finish pigs' },
    sows:     { sub: 'Farrow-to-wean' },
    broilers: { sub: 'Meat chickens' },
    layers:   { sub: 'Table eggs' },
    turkeys:  { sub: 'Meat turkeys' },
  };
  const MMS_UI = {
    lagoon: { sub: 'Liquid manure held in an open earthen basin' },
    liquid: { sub: 'Slurry stored in a tank without crust' },
    pit: { sub: 'Slurry stored in a pit below slatted floors' },
    solid: { sub: 'Manure stacked and stored in heaps' },
    drylot: { sub: 'Manure deposited and dried on unpaved pens' },
    dailySpread: { sub: 'Manure removed and spread daily' },
    poultryLitter: { sub: 'Manure mixed with bedding on the house floor' },
    poultryNoLitter: { sub: 'Manure dried on belts or in high-rise pits' },
  };
  const CLIMATE_UI = { cool: { name: 'Cool' }, temperate: { name: 'Temperate' }, warm: { name: 'Warm' } };
  const SIZE_NAMES = ['Small', 'Medium', 'Large', 'Very large'];
  const STEPS = [
    { id: 'animals', icon: 'paw', label: 'Animal category', title: 'Animal category', sub: 'Select the type of operation to simulate.' },
    { id: 'size', icon: 'warehouse', label: 'Farm size', title: 'Farm size', sub: 'Number of animal places (housing capacity).' },
    { id: 'manure', icon: 'tank', label: 'Manure & climate', title: 'Manure management and climate', sub: 'How manure is stored, and the climate it is stored in.' },
    { id: 'power', icon: 'zap', label: 'Energy & boundary', title: 'Energy and system boundary', sub: 'Electricity source, emission sources included, and GWP set.' },
  ];
  const LOADER = ['Building herd dynamics…', 'Computing feed and water inputs…', 'Estimating manure and nitrogen flows…', 'Converting emissions to CO₂ equivalent…'];
  const CAR_T_CO2E_PER_YR = 4.6; // typical US passenger vehicle, US EPA

  // ------------------------------------------------------------------ citations

  const REF_KEYS = Object.keys(D.REFS);
  const refNum = (k) => REF_KEYS.indexOf(k) + 1;
  const citeRefs = (keys, prefix = 'ref-') => keys.map((k) => `<a class="cite" href="#${prefix}${k}" title="${esc(D.REFS[k].short)}">[${refNum(k)}]</a>`).join('');
  /** Badge + numbered refs + note for a source descriptor {refs, basis, note}. */
  function citeHtml(src) {
    const b = D.BASIS[src.basis];
    return `<span class="basis b-${src.basis}" title="${esc(b.label)}">${b.icon} ${esc(b.label)}</span> ${citeRefs(src.refs)} <span class="src-note">${esc(src.note)}</span>`;
  }
  const citeText = (src) => `${D.BASIS[src.basis].label}${src.refs.length ? ' [' + src.refs.map(refNum).join(', ') + ']' : ''} — ${src.note}`;

  /** Footnote text defining CO₂ equivalent for a GWP set. */
  function co2eqDefinition(gwpKey) {
    const g = D.GWP[gwpKey];
    return `<sup class="fn-mark">*</sup> <b>CO₂ equivalent</b> expresses different greenhouse gases as the amount of carbon dioxide that would cause the same warming over 100 years (global warming potential, GWP100). With ${esc(g.label.replace(' GWP100', ''))} factors ${citeRefs([g.ref])}, 1 tonne of methane (CH₄) counts as ${g.CH4} tonnes and 1 tonne of nitrous oxide (N₂O) as ${g.N2O} tonnes of CO₂ equivalent.`;
  }

  // ------------------------------------------------------------------ state

  function defaultState() {
    return {
      species: 'dairy',
      sizes: Object.fromEntries(Object.entries(D.SPECIES).map(([k, s]) => [k, s.size.default])),
      mmsBySpecies: {},
      climate: 'temperate',
      gwp: 'AR6',
      grid: 'us',
      includeFeed: true,
      includeLand: true,
      step: 0,
      maxStep: 0,
      view: 'mass',
      theme: 'auto',
      overrides: { species: {}, globals: {}, mms: {} },
    };
  }

  let state = load();
  let result = null;

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && D.SPECIES[s.species]) {
        return { ...defaultState(), ...s, step: 0, overrides: { species: {}, globals: {}, mms: {}, ...(s.overrides || {}) } };
      }
    } catch (e) { /* storage unavailable */ }
    return defaultState();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  const sp = () => D.SPECIES[state.species];
  const size = () => state.sizes[state.species];
  const mmsId = () => {
    const m = state.mmsBySpecies[state.species];
    return sp().mms.options.includes(m) ? m : sp().mms.default;
  };
  const gridEF = () => {
    const o = state.overrides.globals.gridEF;
    return typeof o === 'number' ? o : D.GLOBAL_META.gridEF.value;
  };
  const modelState = () => ({
    species: state.species, size: size(), mms: mmsId(), climate: state.climate, gwp: state.gwp,
    includeFeed: state.includeFeed, includeLand: state.includeLand, overrides: state.overrides,
  });
  function singular(u) {
    return u.replace(/^pig spaces$/, 'pig space').replace(/^bird places$/, 'bird place').replace(/^hen places$/, 'hen place')
      .replace(/^head places$/, 'head place').replace(/^cows$/, 'cow').replace(/^sows$/, 'sow');
  }

  function showScreen(name) {
    ['intro', 'setup', 'loading', 'results'].forEach((s) => { $('screen-' + s).hidden = s !== name; });
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    if (name === 'intro') startClock(); else stopClock();
  }

  // ================================================================== INTRO & LIVE CLOCK

  const CLK = D.GLOBAL_CLOCK;
  const T_PER_SEC = CLK.annualTonnesCO2e / (365.25 * 86400);
  const pageOpened = Date.now();
  let clockRaf = null, clockTimer = null;

  function compact(t) {
    if (t >= 1e9) return fmt(t / 1e9, 1) + ' Gt';
    if (t >= 1e6) return fmt(t / 1e6, 1) + ' Mt';
    if (t >= 1e3) return fmt(t / 1e3, 1) + ' kt';
    return fmt(t, 0) + ' t';
  }

  function renderIntroStatic() {
    $('clock-rate').textContent = fmt(T_PER_SEC, 0);
    $('clock-day').textContent = compact(T_PER_SEC * 86400) + ' CO₂ equivalent';
    $('clock-share').textContent = '≈ ' + fmt(CLK.shareOfAnthropogenic * 100, 0) + ' %';
    $('clock-source').innerHTML = `<b>Live counter.</b> ${compact(CLK.annualTonnesCO2e)} CO₂ equivalent per year for ${esc(CLK.scope)} (reference year ${CLK.refYear}), spread evenly over the year ${citeRefs(CLK.src.refs, 'intro-ref-')}. Methane share ${citeRefs(['unep2021'], 'intro-ref-')}; heat-trapping factors ${citeRefs(['ar6'], 'intro-ref-')}.`;
    $('co2-def-intro').innerHTML = co2eqDefinition('AR6').replace(/href="#ref-/g, 'href="#intro-ref-');
    $('why-methane').textContent = `≈ ${fmt(CLK.methaneShare * 100, 0)} %`;
    $('intro-note').innerHTML = `<b>Why livestock and not only CAFOs?</b> There is no reliable worldwide estimate for CAFOs alone. The counter uses all livestock supply chains ${citeRefs(['fao2023'], 'intro-ref-')}, of which industrial operations are one part, so read it as context, not as a CAFO total. The simulator itself calculates the footprint of a single CAFO.`;
    $('intro-refs').innerHTML = ['fao2023', 'unep2021', 'ar6'].map((k) =>
      `<li id="intro-ref-${k}">[${refNum(k)}] ${esc(D.REFS[k].full)}${D.REFS[k].url ? ` <a href="${esc(D.REFS[k].url)}" target="_blank" rel="noopener">${esc(D.REFS[k].url.replace(/^https?:\/\//, ''))}</a>` : ''}</li>`).join('');
  }

  function tickClock() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    $('clock-today').textContent = fmt((now - midnight) / 1000 * T_PER_SEC, 0);
    $('clock-session').textContent = compact((now - pageOpened) / 1000 * T_PER_SEC);
  }

  function startClock() {
    stopClock();
    tickClock();
    if (reducedMotion) { clockTimer = setInterval(tickClock, 1000); return; }
    const loop = () => { tickClock(); clockRaf = requestAnimationFrame(loop); };
    clockRaf = requestAnimationFrame(loop);
  }
  function stopClock() {
    if (clockRaf) cancelAnimationFrame(clockRaf);
    if (clockTimer) clearInterval(clockTimer);
    clockRaf = clockTimer = null;
  }

  // ================================================================== SETUP WIZARD

  function choiceHtml({ key, attr, ttl, sub, meta, pressed, tag }) {
    return `<button type="button" class="choice" data-${attr}="${key}" aria-pressed="${pressed}">
      ${tag ? `<span class="tag">${esc(tag)}</span>` : ''}<span class="ttl">${esc(ttl)}</span>
      ${sub ? `<span class="sub">${esc(sub)}</span>` : ''}${meta ? `<span class="meta">${esc(meta)}</span>` : ''}</button>`;
  }

  function renderSetup() {
    const step = STEPS[state.step];
    $('stepper').innerHTML = STEPS.map((s, i) => {
      const cls = i === state.step ? 'current' : i <= state.maxStep ? 'done' : '';
      return `<li class="${cls}"><button type="button" data-goto="${i}" ${i > state.maxStep ? 'disabled' : ''}>
        <span class="num">${i < state.step || (i <= state.maxStep && i !== state.step) ? '✓' : i + 1}</span><span class="lbl">${esc(s.label)}</span></button></li>`;
    }).join('');
    $('xp-fill').style.width = `${(100 * (state.step + 1)) / STEPS.length}%`;
    $('step-kicker').textContent = `Step ${state.step + 1} of ${STEPS.length}`;
    $('step-title').textContent = step.title;
    $('step-sub').textContent = step.sub;
    $('btn-back').disabled = state.step === 0;
    const last = state.step === STEPS.length - 1;
    $('btn-next').innerHTML = last ? `${ic('calculator', 'ic-sm')} Calculate` : `Next ${ic('arrowRight', 'ic-sm')}`;
    $('step-ico').innerHTML = ic(step.icon);
    $('btn-next').classList.toggle('primary', !last);
    $('btn-next').classList.toggle('calc', last);

    const body = $('step-body');
    body.style.animation = 'none'; void body.offsetWidth; body.style.animation = '';
    body.innerHTML = ({ animals: stepAnimals, size: stepSize, manure: stepManure, power: stepPower })[step.id]();
    if (step.id === 'size') updateSizeBits();
    renderSummary();
  }

  function stepAnimals() {
    return `<div class="choices">${Object.entries(D.SPECIES).map(([k, s]) => choiceHtml({
      key: k, attr: 'species', ttl: s.label, sub: SPECIES_UI[k].sub, meta: `Per ${singular(s.unitShort)} · result per ${s.fu.label}`, pressed: k === state.species,
    })).join('')}</div><p class="hint">${esc(sp().note)}</p>`;
  }

  function stepSize() {
    const s = sp();
    return `
      <div class="size-hero">
        <input type="number" id="size-input" min="1" step="1" value="${size()}" aria-label="Number of ${esc(s.unit)}">
        <span class="unit">${esc(s.unit)}</span>
      </div>
      <input type="range" id="size-range" min="0" max="1000" step="1" aria-label="Farm size (log scale)">
      <div class="presets">${s.size.presets.map((v, i) =>
        `<button type="button" class="preset" data-size="${v}" aria-pressed="false"><b>${SIZE_NAMES[i]}</b><span>${fmt(v, 0)}</span></button>`).join('')}</div>
      <div class="scale">
        <div class="scale-title"><span>US EPA size class (log scale)</span><span class="badge" id="epa-badge"><span class="dot"></span><span></span></span></div>
        <div class="scale-wrap"><div class="scale-track" id="scale-track"></div><div class="scale-marker" id="scale-marker"></div></div>
        <div class="scale-labels" id="scale-labels"></div>
      </div>
      <p class="hint" id="epa-note"></p>`;
  }

  function renderScale() {
    const s = sp(), n = size();
    const pos = (v) => 100 * sizeToSlider(v) / 1000;
    const med = M.epaClass(state.species, 0, mmsId()).threshold;
    const large = M.epaClass(state.species, 1e12, mmsId()).threshold;
    $('scale-track').innerHTML = `<div class="z-small" style="width:${pos(med)}%"></div><div class="z-medium" style="width:${pos(large) - pos(med)}%"></div><div class="z-large" style="flex:1"></div>`;
    $('scale-marker').style.left = pos(n) + '%';
    $('scale-labels').innerHTML = `<span style="left:0">${fmt(s.size.min, 0)}</span><span style="left:${pos(med)}%">Medium<br>${fmt(med, 0)}</span><span style="left:${pos(large)}%">Large<br>${fmt(large, 0)}</span><span style="left:100%">${fmt(s.size.max, 0)}</span>`;
    const cls = M.epaClass(state.species, n, mmsId());
    $('epa-badge').dataset.class = cls.id;
    $('epa-badge').lastElementChild.textContent = cls.label;
    $('epa-note').innerHTML = `Thresholds for ${esc(s.epa.basis)} under US EPA rule 40 CFR 122.23.`;
  }

  function updateSizeBits() {
    const n = size();
    const input = $('size-input');
    if (document.activeElement !== input) input.value = n;
    $('size-range').value = sizeToSlider(n);
    document.querySelectorAll('.preset').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.size) === n)));
    renderScale();
    renderSummary();
  }

  function stepManure() {
    const s = sp();
    return `<div class="section-label">${ic('tank', 'ic-sm')} Manure management system</div>
      <div class="choices wide">${s.mms.options.map((k) => choiceHtml({
        key: k, attr: 'mms', ttl: D.MMS[k].label, sub: MMS_UI[k].sub,
        pressed: k === mmsId(), tag: k === s.mms.default ? 'BAU DEFAULT' : '',
      })).join('')}</div>
      <div class="section-label">${ic('thermometer', 'ic-sm')} Climate</div>
      <div class="choices">${Object.entries(D.CLIMATES).map(([k, v]) => choiceHtml({
        key: k, attr: 'climate', ttl: CLIMATE_UI[k].name, sub: v.replace(/^[^(]*\(|\)$/g, ''),
        pressed: k === state.climate,
      })).join('')}</div>
      <p class="hint">Climate sets the methane conversion factor (MCF) of stored manure; warmer storage produces more methane.</p>`;
  }

  function stepPower() {
    return `<div class="section-label">${ic('zap', 'ic-sm')} Electricity grid</div>
      <div class="choices">${Object.entries(D.GRID_PRESETS).map(([k, g]) => choiceHtml({
        key: k, attr: 'grid', ttl: g.label, sub: `${g.value} kg CO₂ equivalent/kWh`, pressed: k === state.grid,
      })).join('')}${choiceHtml({ key: 'custom', attr: 'grid', ttl: 'Custom', sub: 'User-defined factor', pressed: state.grid === 'custom' })}</div>
      ${state.grid === 'custom' ? `<label class="inline-field">Grid factor <input type="number" id="grid-custom" step="any" min="0" value="${gridEF()}"> kg CO₂ equivalent/kWh</label>` : ''}
      <div class="section-label">${ic('frame', 'ic-sm')} System boundary</div>
      <div class="toggles">
        ${toggleHtml('includeFeed', 'Feed production', 'Purchased feed: Scope 3 emissions and feed water footprint')}
        ${toggleHtml('includeLand', 'Manure land application', 'N₂O after manure is spread on fields')}
      </div>
      <label class="inline-field">Global warming potentials
        <select id="gwp-select">${Object.entries(D.GWP).map(([k, g]) =>
          `<option value="${k}" ${k === state.gwp ? 'selected' : ''}>${esc(g.label)} (CH₄ ${g.CH4}, N₂O ${g.N2O})</option>`).join('')}</select>
      </label>`;
  }

  function toggleHtml(key, ttl, sub) {
    return `<button type="button" class="toggle-card" data-toggle="${key}" aria-pressed="${state[key]}">
      <span><span class="ttl">${esc(ttl)}</span><span class="sub">${esc(sub)}</span></span>
      <span class="switch" aria-hidden="true"></span></button>`;
  }

  function renderSummary() {
    const s = sp();
    const items = [
      ['paw', 'Animal category', s.label],
      ['warehouse', 'Size', `${fmt(size(), 0)} ${s.unitShort}`],
      ['scale', 'US EPA class', M.epaClass(state.species, size(), mmsId()).label],
      ['tank', 'Manure system', D.MMS[mmsId()].label],
      ['thermometer', 'Climate', CLIMATE_UI[state.climate].name],
      ['zap', 'Grid factor', `${gridEF()} kg CO₂ equivalent/kWh`],
      ['frame', 'Boundary', ['farm', state.includeFeed && 'feed', state.includeLand && 'fields'].filter(Boolean).join(' + ')],
      ['cloud', 'GWP set', D.GWP[state.gwp].label.replace('IPCC ', '')],
    ];
    $('summary-list').innerHTML = items.map(([i, k, v]) => `<dt>${ic(i, 'ic-sm')}${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  }

  // log-scale slider mapping
  function sliderToSize(pos) {
    const { min, max } = sp().size;
    return niceRound(min * Math.pow(max / min, pos / 1000));
  }
  function sizeToSlider(v) {
    const { min, max } = sp().size;
    return Math.round(1000 * Math.log(Math.min(Math.max(v, min), max) / min) / Math.log(max / min));
  }
  function niceRound(v) {
    const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(v)) - 1));
    return Math.max(1, Math.round(v / mag) * mag);
  }

  function goStep(i) {
    state.step = Math.max(0, Math.min(STEPS.length - 1, i));
    state.maxStep = Math.max(state.maxStep, state.step);
    save();
    renderSetup();
  }

  function bindSetup() {
    $('stepper').addEventListener('click', (e) => {
      const b = e.target.closest('[data-goto]');
      if (b && !b.disabled) goStep(Number(b.dataset.goto));
    });
    $('btn-back').addEventListener('click', () => goStep(state.step - 1));
    $('btn-next').addEventListener('click', () => (state.step === STEPS.length - 1 ? calculate() : goStep(state.step + 1)));
    $('btn-calc').addEventListener('click', calculate);

    const body = $('step-body');
    body.addEventListener('click', (e) => {
      const t = e.target.closest('button');
      if (!t) return;
      if (t.dataset.species) {
        state.species = t.dataset.species;
        save(); renderSetup();
      } else if (t.dataset.size) {
        state.sizes[state.species] = Number(t.dataset.size);
        save(); updateSizeBits();
      } else if (t.dataset.mms) {
        state.mmsBySpecies[state.species] = t.dataset.mms;
        save(); renderSetup();
      } else if (t.dataset.climate) {
        state.climate = t.dataset.climate;
        save(); renderSetup();
      } else if (t.dataset.grid) {
        state.grid = t.dataset.grid;
        if (D.GRID_PRESETS[state.grid]) state.overrides.globals.gridEF = D.GRID_PRESETS[state.grid].value;
        save(); renderSetup();
      } else if (t.dataset.toggle) {
        state[t.dataset.toggle] = !state[t.dataset.toggle];
        save(); renderSetup();
      }
    });
    body.addEventListener('input', (e) => {
      if (e.target.id === 'size-input') {
        const v = Math.round(Number(e.target.value));
        if (v > 0) { state.sizes[state.species] = v; save(); updateSizeBits(); }
      } else if (e.target.id === 'size-range') {
        state.sizes[state.species] = sliderToSize(Number(e.target.value));
        save(); updateSizeBits();
      } else if (e.target.id === 'grid-custom') {
        const v = Number(e.target.value);
        if (e.target.value !== '' && v >= 0) { state.overrides.globals.gridEF = v; save(); renderSummary(); }
      }
    });
    body.addEventListener('change', (e) => {
      if (e.target.id === 'gwp-select') { state.gwp = e.target.value; save(); renderSummary(); }
    });
  }

  // ================================================================== CALCULATE

  function calculate() {
    state.maxStep = STEPS.length - 1;
    save();
    result = M.compute(modelState());
    showScreen('loading');
    const steps = reducedMotion ? 1 : LOADER.length;
    let i = 0;
    const tick = () => {
      if (i >= steps) {
        showScreen('results');
        renderResults(true);
        renderAssumptions();
        renderSources();
        return;
      }
      $('loader-msg').textContent = LOADER[i];
      i++;
      setTimeout(tick, reducedMotion ? 50 : 280);
    };
    tick();
  }

  // ================================================================== RESULTS

  function renderResults(animate) {
    const s = sp(), r = result;
    $('result-title').textContent = `${fmt(size(), 0)} ${s.label.toLowerCase()}`;
    $('result-chips').innerHTML = [
      s.label,
      D.MMS[mmsId()].label,
      `${CLIMATE_UI[state.climate].name} climate`,
      `Grid ${gridEF()} kg CO₂ equivalent/kWh`,
      `${M.epaClass(state.species, size(), mmsId()).label}`,
    ].map((c) => `<span class="chip">${esc(c)}</span>`).join('');

    document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === state.view)));
    $('warnings').innerHTML = r.warnings.map((w) => `<div class="warning-item" role="alert">${esc(w)}</div>`).join('');

    ({ mass: viewMass, nitrogen: viewNitrogen, carbon: viewCarbon, water: viewWater })[state.view](animate);
  }

  function kpis(tiles) {
    $('kpis').innerHTML = tiles.map((t) =>
      `<div class="kpi ${t.hero ? 'hero' : ''}">${t.icon ? `<span class="kpi-ic">${ic(t.icon)}</span>` : ''}<div class="label">${esc(t.label)}</div>
        <div class="value">${t.value}</div><div class="unit">${esc(t.unit)}</div></div>`).join('');
  }

  const tonnes = (kg) => fmt(kg / 1000, kg / 1000 >= 100 ? 0 : 1);

  // ---------------------------------------------------------------- mass lens
  function viewMass(animate) {
    const r = result, m = r.mass, inv = r.inventory;
    const totalIn = Object.values(m.in).reduce((a, b) => a + b, 0);
    kpis([
      { icon: 'layers', hero: true, label: 'Total material through the farm', value: tonnes(totalIn), unit: 't per year (feed + water + animals)' },
      { icon: 'leaf', label: 'Feed in', value: tonnes(inv.feedAsFed), unit: 't as fed / yr' },
      { icon: 'droplet', label: 'Water in', value: fmt((inv.drinkWater + inv.serviceWater) / 1000, 0), unit: 'm³ / yr' },
      { icon: 'tank', label: 'Manure out', value: tonnes(inv.manureWet), unit: 't as excreted / yr' },
    ]);

    const mu = C.massUnit(totalIn, '/yr');
    const nodes = [
      { id: 'feed', label: 'Feed (as fed)', col: 0 },
      { id: 'drink', label: 'Drinking water', col: 0 },
      { id: 'service', label: 'Service water', col: 0 },
      { id: 'animalsIn', label: inv.animalsInLabel, col: 0 },
      { id: 'farm', label: 'Farm', col: 1 },
      ...inv.products.map((p, i) => ({ id: 'p' + i, label: p.label, col: 2 })),
      { id: 'dead', label: 'Mortalities', col: 2 },
      { id: 'manure', label: 'Manure as excreted', col: 2 },
      { id: 'wastewater', label: 'Wastewater', col: 2 },
      { id: 'vapour', label: 'Respiration & evaporation', col: 2 },
    ];
    const links = [
      { source: 'feed', target: 'farm', value: m.in.feed, color: S(1) },
      { source: 'drink', target: 'farm', value: m.in.drink, color: S(3) },
      { source: 'service', target: 'farm', value: m.in.service, color: S(7) },
      { source: 'animalsIn', target: 'farm', value: m.in.animals, color: S(2) },
      ...inv.products.map((p, i) => ({ source: 'farm', target: 'p' + i, value: p.kg, color: S(6) })),
      { source: 'farm', target: 'dead', value: m.out.dead, color: S(8) },
      { source: 'farm', target: 'manure', value: m.out.manure, color: S(4) },
      { source: 'farm', target: 'wastewater', value: m.out.wastewater, color: S(7) },
      { source: 'farm', target: 'vapour', value: m.out.vapour, color: 'var(--neutral-flow)' },
    ];
    $('flow-title').innerHTML = `${ic('layers', 'ic-sm')} Material flows`;
    C.sankey($('sankey'), nodes, links, { unit: mu.unit, div: mu.div, height: 420, animate, label: 'Annual mass flows of the farm' });
    $('flow-note').innerHTML = `Respiration & evaporation closes the balance (inputs − measured outputs): CO₂ and water vapour exhaled by animals and evaporated from housing. Hover any flow for its value. Sources: feed intake & excretion ${citeRefs(['ipcc2019', 'asabe'])}, production levels ${citeRefs(['nass'])}; water use is an assumption.`;
    $('detail').innerHTML = `<div class="card"><div class="panel-head"><h2>Annual inventory</h2><small class="hint">Whole farm, per year</small></div>
      <div class="table-grid"><div><h3>Inputs</h3><table id="tbl-in"></table></div><div><h3>Outputs</h3><table id="tbl-out"></table></div></div></div>`;
    renderInventory();
  }

  // ---------------------------------------------------------------- nitrogen lens
  function viewNitrogen(animate) {
    const N = result.nitrogen;
    const land = state.includeLand;
    const nIn = N.feed + N.animalsIn;
    const airLoss = N.mms.volatilised + N.mms.n2o + N.mms.other + (land ? N.field.volatilised + N.field.n2o : 0);
    kpis([
      { icon: 'percent', hero: true, label: 'Nitrogen use efficiency', value: fmt(100 * N.products / N.feed, 0) + ' %', unit: 'of feed N ends up in products' },
      { icon: 'leaf', label: 'N in feed', value: tonnes(N.feed), unit: 't N / yr' },
      { icon: 'tank', label: 'N excreted', value: tonnes(N.excreted), unit: 't N / yr' },
      { icon: 'wind', label: 'N lost to air', value: tonnes(airLoss), unit: 't N / yr (NH₃, NOx, N₂O, N₂)' },
    ]);
    const mu = C.massUnit(nIn, ' N/yr');
    const nodes = [
      { id: 'feedN', label: 'Feed N', col: 0 },
      { id: 'animN', label: 'N in purchased animals', col: 0 },
      { id: 'herd', label: 'Herd', col: 1 },
      { id: 'exN', label: 'N excreted', col: 2 },
      { id: 'prodN', label: 'N in products', col: 2 },
      { id: 'deadN', label: 'N in mortalities', col: 2 },
      { id: 'appN', label: land ? 'Land-applied manure N' : 'Manure N leaving farm', col: 3 },
      { id: 'volN', label: 'NH₃ + NOx (storage)', col: 3 },
      { id: 'n2oN', label: 'N₂O-N (storage)', col: 3 },
      { id: 'leachN', label: 'Leached / runoff', col: 3 },
      { id: 'otherN', label: 'N₂ & other losses', col: 3 },
      { id: 'soilN', label: 'Soil & crop N', col: 4 },
      { id: 'fVolN', label: 'NH₃ + NOx (field)', col: 4 },
      { id: 'fLeachN', label: 'Leached (field)', col: 4 },
      { id: 'fN2oN', label: 'N₂O-N (field)', col: 4 },
    ];
    const links = [
      { source: 'feedN', target: 'herd', value: N.feed, color: S(1) },
      { source: 'animN', target: 'herd', value: N.animalsIn, color: S(2) },
      { source: 'herd', target: 'prodN', value: N.products, color: S(6) },
      { source: 'herd', target: 'deadN', value: N.dead, color: S(8) },
      { source: 'herd', target: 'exN', value: N.excreted, color: S(4) },
      { source: 'exN', target: 'volN', value: N.mms.volatilised, color: S(5) },
      { source: 'exN', target: 'n2oN', value: N.mms.n2o, color: S(8) },
      { source: 'exN', target: 'leachN', value: N.mms.leached, color: S(7) },
      { source: 'exN', target: 'otherN', value: N.mms.other, color: 'var(--neutral-flow)' },
      { source: 'exN', target: 'appN', value: N.mms.applied, color: S(4) },
    ];
    if (land) links.push(
      { source: 'appN', target: 'soilN', value: N.field.soil, color: S(6) },
      { source: 'appN', target: 'fVolN', value: N.field.volatilised, color: S(5) },
      { source: 'appN', target: 'fLeachN', value: N.field.leached, color: S(7) },
      { source: 'appN', target: 'fN2oN', value: N.field.n2o, color: S(8) },
    );
    $('flow-title').innerHTML = `${ic('flask', 'ic-sm')} Nitrogen balance`;
    C.sankey($('sankey'), nodes, links, { unit: mu.unit, div: mu.div, width: 1100, height: 440, animate, label: 'Annual nitrogen flows of the farm' });
    $('flow-note').innerHTML = `N excreted = feed N + purchased-animal N − N leaving in products and mortalities. Storage losses follow FracGas, FracLeach and FracLossMS of the selected manure system ${citeRefs(['ipcc2019', 'ipcc2006'])}; field losses follow FracGASM, FracLEACH and EF1 ${citeRefs(['ipcc2019'])}; protein factors ${citeRefs(['jones'])}.`;
    $('detail').innerHTML = '';
  }

  // ---------------------------------------------------------------- carbon lens
  function viewCarbon(animate) {
    const r = result, s = sp();
    const perPlace = r.intensity.perPlace;
    const placeUnit = perPlace >= 1000 ? { v: perPlace / 1000, u: 't' } : { v: perPlace, u: 'kg' };
    kpis([
      { icon: 'cloud', hero: true, label: 'Farm carbon footprint', value: tonnes(r.total), unit: 't CO₂ equivalent* per year' },
      { icon: 'tag', label: `Per ${s.fu.label}`, value: fmt(r.intensity.perFU, 2), unit: `kg CO₂ equivalent / ${s.fu.label}` },
      { icon: 'warehouse', label: `Per ${singular(s.unitShort)}`, value: fmt(placeUnit.v, placeUnit.v >= 100 ? 0 : 2), unit: `${placeUnit.u} CO₂ equivalent / yr` },
      { icon: 'car', label: 'Passenger-car equivalent', value: fmt(r.total / 1000 / CAR_T_CO2E_PER_YR, 0), unit: 'cars driven for one year (4.6 t CO₂ each)' },
    ]);

    // sources -> scope -> total
    const order = ['enteric', 'manureCH4', 'manureN2O', 'landN2O', 'fuel', 'electricity', 'feed', 'water'];
    const SHORT = { enteric: 'Enteric CH₄', manureCH4: 'Manure storage CH₄', manureN2O: 'Manure storage N₂O', landN2O: 'Manure on fields N₂O', fuel: 'On-farm fuels CO₂', electricity: 'Electricity CO₂', feed: 'Feed production', water: 'Water supply' };
    const SCOPE_NODE = { 'Scope 1': 'On-farm · Scope 1', 'Scope 2': 'Purchased power · Scope 2', 'Scope 3': 'Supply chain · Scope 3' };
    const srcIdx = Object.fromEntries(D.SOURCES.map((x, i) => [x.key, i]));
    const nodes = [
      ...order.map((k) => ({ id: k, label: SHORT[k], col: 0, color: S(srcIdx[k] + 1) })),
      ...Object.entries(SCOPE_NODE).map(([k, v]) => ({ id: k, label: v, col: 1 })),
      { id: 'total', label: 'Carbon footprint', col: 2 },
    ];
    const links = [];
    order.forEach((k) => links.push({ source: k, target: D.SOURCES[srcIdx[k]].scope, value: r.emissions[k], color: S(srcIdx[k] + 1) }));
    Object.keys(SCOPE_NODE).forEach((sc) => links.push({
      source: sc, target: 'total', value: D.SOURCES.filter((x) => x.scope === sc).reduce((a, x) => a + r.emissions[x.key], 0), color: 'var(--neutral-flow)',
    }));
    const mu = C.massUnit(r.total, ' CO₂ equivalent/yr');
    $('flow-title').innerHTML = `${ic('cloud', 'ic-sm')} Carbon footprint by source and scope`;
    C.sankey($('sankey'), nodes, links, { unit: mu.unit, div: mu.div, height: 420, animate, label: 'Greenhouse-gas emissions by source and scope' });
    $('flow-note').innerHTML = `Emission sources (CO₂ equivalent, ${esc(r.gwp.label)} ${citeRefs([r.gwp.ref])}) grouped into GHG Protocol scopes ${citeRefs(['ghgp'])}. Animal & manure emissions ${citeRefs(['ipcc2019', 'ipcc2006'])}; feed ${citeRefs(['gerber2013', 'feedprint'])}; fuels ${citeRefs(['epaHub'])}. Hover any flow for its value.`;

    const g = r.gases, gw = r.gwp;
    $('detail').innerHTML = `<div class="card"><div class="panel-head"><h2>Emissions by source</h2><small class="hint" id="em-unit"></small></div>
      <div id="em-chart"></div>
      <div class="fact-row">
        <div class="fact">Methane (CH₄)<strong>${tonnes(g.CH4)} t</strong>${tonnes(g.CH4 * gw.CH4)} t CO₂ equivalent · ${fmt(100 * g.CH4 * gw.CH4 / r.total, 0)} % of total</div>
        <div class="fact">Nitrous oxide (N₂O)<strong>${tonnes(g.N2O)} t</strong>${tonnes(g.N2O * gw.N2O)} t CO₂ equivalent · ${fmt(100 * g.N2O * gw.N2O / r.total, 0)} % of total</div>
        <div class="fact">Per kg protein<strong>${fmt(r.intensity.perProtein, 1)} kg CO₂ equivalent</strong>all products, no allocation</div>
      </div>
      <p class="footnote">${co2eqDefinition(state.gwp)}</p></div>`;
    const emu = C.massUnit(r.total, ' CO₂ equivalent/yr');
    $('em-unit').textContent = emu.unit;
    C.emissionBars($('em-chart'), D.SOURCES.map((src, i) => ({
      label: src.label, scope: src.scope, color: S(i + 1), value: r.emissions[src.key] / emu.div,
      excluded: (src.key === 'feed' && !state.includeFeed) || (src.key === 'landN2O' && !state.includeLand),
    })), emu.unit);
  }

  // ---------------------------------------------------------------- water lens
  function viewWater(animate) {
    const W = result.waterFootprint, s = sp();
    const m3 = (v) => fmt(v, v >= 100 ? 0 : 1);
    const pct = (v) => (v > 0 && 100 * v / W.total < 1 ? '< 1' : fmt(100 * v / W.total, 0)) + ' %';
    kpis([
      W.total >= 1e6
        ? { icon: 'droplet', hero: true, label: 'Farm water footprint', value: fmt(W.total / 1e6, 1), unit: 'million m³ per year (green + blue + grey)' }
        : { icon: 'droplet', hero: true, label: 'Farm water footprint', value: m3(W.total), unit: 'm³ per year (green + blue + grey)' },
      { icon: 'tag', label: `Per ${s.fu.label}`, value: fmt(W.perFU, 0), unit: `L / ${s.fu.label}` },
      { icon: 'percent', label: 'Blue water', value: pct(W.blue), unit: `${m3(W.blue)} m³ / yr (irrigation + on-farm)` },
      { icon: 'warehouse', label: 'On-farm water use', value: m3(W.drink + W.service), unit: 'm³ / yr (drinking + service)' },
    ]);

    const C_GREEN = S(6), C_BLUE = S(1), C_GREY = 'var(--neutral-flow)';
    const nodes = [
      { id: 'feed', label: 'Feed crops', col: 0 },
      { id: 'drink', label: 'Drinking water', col: 0 },
      { id: 'service', label: 'Service water', col: 0 },
      { id: 'manure', label: 'Manure nitrate', col: 0 },
      { id: 'green', label: 'Green water (rain)', col: 1, color: C_GREEN },
      { id: 'blue', label: 'Blue water (surface & ground)', col: 1, color: C_BLUE },
      { id: 'grey', label: 'Grey water (pollution)', col: 1, color: C_GREY },
      { id: 'total', label: 'Water footprint', col: 2 },
    ];
    const links = [
      { source: 'feed', target: 'green', value: W.feedGreen, color: C_GREEN },
      { source: 'feed', target: 'blue', value: W.feedBlue, color: C_BLUE },
      { source: 'drink', target: 'blue', value: W.drink, color: C_BLUE },
      { source: 'service', target: 'blue', value: W.service, color: C_BLUE },
      { source: 'feed', target: 'grey', value: W.feedGrey, color: C_GREY },
      { source: 'manure', target: 'grey', value: W.manureGrey, color: C_GREY },
      { source: 'green', target: 'total', value: W.green, color: C_GREEN },
      { source: 'blue', target: 'total', value: W.blue, color: C_BLUE },
      { source: 'grey', target: 'total', value: W.grey, color: C_GREY },
    ];
    const big = W.total >= 1e6;
    $('flow-title').innerHTML = `${ic('droplet', 'ic-sm')} Water footprint by source and component`;
    C.sankey($('sankey'), nodes, links, { unit: big ? 'million m³/yr' : 'm³/yr', div: big ? 1e6 : 1, height: 400, animate, label: 'Water footprint by source and component' });
    $('flow-note').innerHTML = `Water footprint following the Water Footprint Network method ${citeRefs(['hoekstra2011'])}. Feed water from crop water footprints ${citeRefs(['mekonnen2011'])}; on-farm blue water = drinking + service water; manure grey water = leached nitrate-N ÷ ${fmt(result.globals.wfCmaxN * 1000, 0)} mg N/L ${citeRefs(['franke2013'])}. Hover any flow for its value.`;

    const row = (label, v, note) => `<tr><td>${label}</td><td class="num">${m3(v)}</td><td class="num">${fmt(v * 1000 / result.inventory.fuKg, 0)}</td><td class="num">${pct(v)}</td><td class="u">${note}</td></tr>`;
    $('detail').innerHTML = `<div class="card"><div class="panel-head"><h2>Water footprint inventory</h2><small class="hint">Whole farm, per year</small></div>
      <div class="table-scroll"><table>
        <tr><th>Component</th><th class="num">m³ / yr</th><th class="num">L / ${esc(s.fu.label)}</th><th class="num">Share</th><th>Basis</th></tr>
        ${row('Feed — green', W.feedGreen, 'rain-fed evapotranspiration of feed crops')}
        ${row('Feed — blue', W.feedBlue, 'irrigation water consumed by feed crops')}
        ${row('Feed — grey', W.feedGrey, 'dilution of fertiliser leaching in feed crops')}
        ${row('Drinking water', W.drink, 'on-farm blue water')}
        ${row('Service water', W.service, 'on-farm blue water (cleaning, cooling)')}
        ${row('Manure nitrate — grey', W.manureGrey, 'dilution of nitrate leached from manure')}
        <tr><td><b>Total</b></td><td class="num"><b>${m3(W.total)}</b></td><td class="num"><b>${fmt(W.perFU, 0)}</b></td><td class="num">100 %</td><td></td></tr>
      </table></div>
      <div class="fact-row">
        <div class="fact">Green water<strong>${pct(W.green)}</strong>rainwater stored in soil and used by feed crops</div>
        <div class="fact">Blue water<strong>${pct(W.blue)}</strong>surface and groundwater consumed</div>
        <div class="fact">Grey water<strong>${pct(W.grey)}</strong>freshwater needed to dilute pollution</div>
      </div>
      <p class="hint">Feed water footprints are global averages for the main ration ingredients. Irrigated forage (e.g. alfalfa in arid regions) can raise blue water substantially. Edit the values under Advanced settings. Benchmarks: ${citeRefs(['mekonnen2012'])}.</p></div>`;
  }

  function renderInventory() {
    const r = result, inv = r.inventory;
    const t = (kg) => [fmt(kg / 1000), 't'];
    const vol = (L) => L >= 1e5 ? [fmt(L / 1000), 'm³'] : [fmt(L), 'L'];
    const row = (label, [v, u], sub) => `<tr class="${sub ? 'sub' : ''}"><td>${esc(label)}</td><td class="num">${v}</td><td class="u">${u}</td></tr>`;
    $('tbl-in').innerHTML = '<tr><th>Item</th><th class="num">Amount</th><th>Unit</th></tr>' + [
      row('Feed, as fed', t(inv.feedAsFed)),
      row('Dry matter', t(inv.feedDM), true),
      row('Crude protein', t(inv.crudeProtein), true),
      row('Drinking water', vol(inv.drinkWater)),
      row('Service water', vol(inv.serviceWater)),
      row('Electricity', [fmt(inv.electricity / 1000), 'MWh']),
      row('Diesel', vol(inv.diesel)),
      row('Propane / LPG', vol(inv.lpg)),
      row(inv.animalsInLabel + ' (live weight)', t(inv.animalsIn)),
      row('Average live inventory', [fmt(inv.avgInventory, 0), 'head']),
    ].join('');
    $('tbl-out').innerHTML = '<tr><th>Item</th><th class="num">Amount</th><th>Unit</th></tr>' + [
      ...inv.products.map((p) => row(p.label, t(p.kg))),
      row(`Functional unit (${sp().fu.label})`, t(inv.fuKg)),
      row('Protein in all products', t(inv.proteinKg)),
      row('Mortalities (carcasses)', t(inv.dead)),
      row('Manure as excreted', t(inv.manureWet)),
      row('Total solids', t(inv.manureTS), true),
      row('Volatile solids', t(inv.manureVS), true),
      row('Nitrogen', t(inv.nex), true),
      row('Wastewater', vol(inv.wastewater)),
      row('Enteric CH4', t(inv.entericCH4)),
      row('Manure CH4', t(inv.manureCH4)),
      row('N2O (manure + land application)', t(r.gases.N2O)),
    ].join('');
  }

  function bindResults() {
    document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => {
      state.view = b.dataset.view;
      save();
      renderResults(true);
    }));
    $('btn-replay').addEventListener('click', () => renderResults(true));
    $('btn-edit').addEventListener('click', () => { showScreen('setup'); renderSetup(); });
    $('btn-new').addEventListener('click', () => {
      const theme = state.theme;
      state = defaultState();
      state.theme = theme;
      save();
      showScreen('setup');
      renderSetup();
    });
    $('btn-csv').addEventListener('click', exportCsv);
  }

  // ================================================================== EXPERT MODE

  function assumptionRows() {
    const s = sp();
    const rows = [];
    const groups = {};
    for (const [k, [def, src]] of Object.entries(s.params)) {
      const meta = D.PARAM_META[k];
      (groups[meta.group] = groups[meta.group] || []).push({
        scope: 'species', key: k, label: meta.label, unit: meta.unit, def, src,
        cur: (state.overrides.species[state.species] || {})[k],
      });
    }
    for (const [g, list] of Object.entries(groups)) rows.push({ head: `${s.label} — ${g}` }, ...list);

    const m = D.MMS[mmsId()];
    const mo = state.overrides.mms[M.mmsOverrideKey(mmsId(), s.group, state.climate)] || {};
    rows.push({ head: `Manure system — ${m.label} (${CLIMATE_UI[state.climate].name.toLowerCase()} climate)` },
      { scope: 'mms', key: 'MCF', label: 'Methane conversion factor MCF', unit: 'fraction', def: m.MCF[state.climate], src: D.SRC.mms, cur: mo.MCF },
      { scope: 'mms', key: 'EF3', label: 'EF3 — direct N2O from storage', unit: 'kg N2O-N/kg N', def: m.EF3, src: D.SRC.mms, cur: mo.EF3 },
      { scope: 'mms', key: 'fracGas', label: 'FracGasMS — NH3+NOx volatilised', unit: 'fraction of Nex', def: m.fracGas[s.group], src: D.SRC.mms, cur: mo.fracGas },
      { scope: 'mms', key: 'fracLeach', label: 'FracLeachMS — leaching & runoff', unit: 'fraction of Nex', def: m.fracLeach[s.group], src: D.SRC.mms, cur: mo.fracLeach },
      { scope: 'mms', key: 'fracLoss', label: 'FracLossMS — total N lost in storage', unit: 'fraction of Nex', def: m.fracLoss[s.group], src: D.SRC.mms, cur: mo.fracLoss });

    rows.push({ head: 'Emission factors (all operation types)' });
    for (const [k, meta] of Object.entries(D.GLOBAL_META)) {
      rows.push({ scope: 'globals', key: k, label: meta.label, unit: meta.unit, def: meta.value, src: meta.src, cur: state.overrides.globals[k] });
    }
    return rows;
  }

  function renderAssumptions() {
    let modified = 0;
    $('assume-table').innerHTML = '<tr><th>Parameter</th><th class="num">Value</th><th>Unit</th><th class="num">Default</th><th>Source</th><th></th></tr>' +
      assumptionRows().map((r) => {
        if (r.head) return `<tr class="group-head"><td colspan="6">${esc(r.head)}</td></tr>`;
        const isMod = typeof r.cur === 'number' && r.cur !== r.def;
        if (isMod) modified++;
        const val = typeof r.cur === 'number' ? r.cur : r.def;
        return `<tr class="${isMod ? 'modified' : ''}" data-scope="${r.scope}" data-key="${r.key}" data-def="${r.def}">
          <td>${esc(r.label)}</td>
          <td class="num"><input type="number" step="any" value="${val}" aria-label="${esc(r.label)}"></td>
          <td class="u">${esc(r.unit)}</td>
          <td class="num">${r.def}</td>
          <td class="src">${citeHtml(r.src)}</td>
          <td>${isMod ? '<button type="button" class="btn-link" data-reset>reset</button>' : ''}</td></tr>`;
      }).join('');
    $('assume-count').textContent = modified ? `${modified} edited` : 'BAU defaults';
  }

  function setOverride(scope, key, value) {
    const o = state.overrides;
    let t;
    if (scope === 'species') t = (o.species[state.species] = o.species[state.species] || {});
    else if (scope === 'mms') {
      const mk = M.mmsOverrideKey(mmsId(), sp().group, state.climate);
      t = (o.mms[mk] = o.mms[mk] || {});
    } else t = o.globals;
    if (value === null) delete t[key]; else t[key] = value;
    if (scope === 'globals' && key === 'gridEF') {
      const match = Object.entries(D.GRID_PRESETS).find(([, g]) => g.value === gridEF());
      state.grid = match ? match[0] : 'custom';
    }
  }

  function recalc() {
    result = M.compute(modelState());
    save();
    renderResults(false);
    renderAssumptions();
    renderSources();
  }

  function bindAssumptions() {
    const tbl = $('assume-table');
    tbl.addEventListener('change', (e) => {
      const tr = e.target.closest('tr[data-key]');
      if (!tr || e.target.tagName !== 'INPUT') return;
      const v = Number(e.target.value);
      if (e.target.value === '' || !Number.isFinite(v)) setOverride(tr.dataset.scope, tr.dataset.key, null);
      else setOverride(tr.dataset.scope, tr.dataset.key, v === Number(tr.dataset.def) ? null : v);
      recalc();
    });
    tbl.addEventListener('click', (e) => {
      if (!e.target.matches('[data-reset]')) return;
      const tr = e.target.closest('tr[data-key]');
      setOverride(tr.dataset.scope, tr.dataset.key, null);
      recalc();
    });
  }

  // ================================================================== METHODS & SOURCES

  function renderSources() {
    const gwpRef = D.GWP[state.gwp].ref;
    const gridSrc = D.GRID_PRESETS[state.grid] ? D.GRID_PRESETS[state.grid].src : { refs: [], basis: 'assumed', note: 'User-entered grid factor' };
    const steps = [
      ['Herd dynamics & production', 'Continuous herds: replacement, mortality and yield per head. Batch systems: cycles = 365 / (days + downtime); animal-days = 365 × occupancy × (1 − mortality/2)', ['nass']],
      ['Feed intake', 'Growers: DMI = FCR × average daily gain; dairy, sows, layers: DMI per animal-day', []],
      ['Enteric CH₄', 'CH₄ = DMI × 18.45 MJ/kg × Ym/100 ÷ 55.65 MJ/kg (Tier 2, Eq. 10.21)', ['ipcc2019']],
      ['Manure solids', 'TS = DMI × (1 − DE + UE); VS = TS × VS/TS; wet manure = TS ÷ TS content (Eq. 10.24, mass basis)', ['ipcc2019', 'asabe']],
      ['Manure CH₄', 'CH₄ = VS × Bo × 0.67 × MCF(system, climate) (Eq. 10.23)', ['ipcc2019', 'ipcc2006']],
      ['N excretion', 'Nex = N intake − N retained; N intake = DMI × CP ÷ 6.25; N retained in milk, eggs and live-weight change (Tier 2 N excretion)', ['ipcc2019', 'jones']],
      ['Direct N₂O, storage', 'N₂O = Nex × EF3 × 44/28 (Eq. 10.25)', ['ipcc2019']],
      ['Indirect N₂O, storage', 'N₂O = (Nex × FracGasMS × EF4 + Nex × FracLeachMS × EF5) × 44/28', ['ipcc2019', 'ipcc2006']],
      ['Manure N to fields', 'N applied = Nex × (1 − FracLossMS)', ['ipcc2019', 'ipcc2006']],
      ['N₂O from land application', 'N₂O = (N applied × EF1 + N applied × FracGASM × EF4 + N applied × FracLEACH × EF5) × 44/28 (Ch. 11)', ['ipcc2019']],
      ['Feed production', 'CO₂ equivalent = DMI × feed footprint (kg CO₂ equivalent/kg DM, excluding land-use change)', ['gerber2013', 'feedprint']],
      ['Electricity', 'CO₂ equivalent = kWh × grid emission factor', gridSrc.refs],
      ['On-farm fuels', 'CO₂ = diesel L × 2.70 + LPG L × 1.51', ['epaHub']],
      ['Water supply', 'CO₂ equivalent = m³ × water-supply factor', []],
      ['Water footprint — feed', 'Green / blue / grey m³ = DMI (t DM) × crop water footprint per t DM of the ration', ['hoekstra2011', 'mekonnen2011']],
      ['Water footprint — on farm', 'Blue m³ = drinking + service water', ['hoekstra2011']],
      ['Water footprint — manure', 'Grey m³ = nitrate-N leached (storage + fields) ÷ (c_max − c_nat), c_max = 10 mg N/L, c_nat = 0', ['franke2013']],
      ['CO₂ equivalents', `CO₂ equivalent = CH₄ × GWP_CH₄ + N₂O × GWP_N₂O (${D.GWP[state.gwp].label}: ${D.GWP[state.gwp].CH4} / ${D.GWP[state.gwp].N2O})`, [gwpRef]],
      ['Scopes', 'Scope 1 = on-farm (animals, manure, fuels, fields); Scope 2 = purchased electricity; Scope 3 = feed and water supply chains', ['ghgp']],
      ['Functional unit', 'kg fat- and protein-corrected milk (dairy); kg live-weight gain, eggs or weaned piglets (others); no co-product allocation', ['idf']],
      ['CAFO size class', 'Large / Medium thresholds by animal type', ['cfr']],
      ['Mass balance', 'Respiration & evaporation = (feed + water + animals in) − (products + mortalities + manure + wastewater)', []],
    ];
    $('sources-body').innerHTML = `
      <p>Each default value is marked by how it relates to its source:
        <span class="basis b-taken">✔ From source</span> copied from the cited document;
        <span class="basis b-approx">≈ Approximated</span> derived or rounded from the cited document — check against the original table before publishing;
        <span class="basis b-assumed">✎ Assumption</span> model-author estimate of a typical US BAU value — replace with site data. Per-parameter sources are listed under Advanced settings.</p>
      <h3>Calculation chain</h3>
      <div class="table-scroll"><table class="src-table"><tr><th>Step</th><th>Calculation</th><th>Sources</th></tr>
        ${steps.map(([s, f, r]) => `<tr><td><b>${esc(s)}</b></td><td>${esc(f)}</td><td class="nowrap">${r.length ? citeRefs(r) : '<span class="muted">first principles / assumption</span>'}</td></tr>`).join('')}
      </table></div>
      <h3>Fixed constants</h3>
      <div class="table-scroll"><table class="src-table"><tr><th>Constant</th><th>Value</th><th>Source</th></tr>
        ${D.CONSTANTS.map((c) => `<tr><td>${esc(c.label)}</td><td class="nowrap">${esc(c.value)}</td><td>${citeHtml(c.src)}</td></tr>`).join('')}
        <tr><td>Electricity grid factor (selected)</td><td class="nowrap">${gridEF()} kg CO₂ equivalent/kWh</td><td>${citeHtml(gridSrc)}</td></tr>
      </table></div>
      <h3>References</h3>
      <ol class="ref-list">${REF_KEYS.map((k) => {
        const r = D.REFS[k];
        return `<li id="ref-${k}">${esc(r.full)}${r.url ? ` <a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.url.replace(/^https?:\/\//, ''))}</a>` : ''}</li>`;
      }).join('')}</ol>`;
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest && e.target.closest('a.cite')) $('sources').open = true;
  });

  // ================================================================== EXPORT & THEME

  function exportCsv() {
    const r = result, s = sp(), inv = r.inventory;
    const lines = [['section', 'item', 'value', 'unit']];
    const add = (sec, item, v, u) => lines.push([sec, item, Number.isFinite(v) ? +v.toPrecision(6) : v, u]);
    add('scenario', 'operation type', s.label, '');
    add('scenario', 'size', size(), s.unit);
    add('scenario', 'manure system', r.mms.label, '');
    add('scenario', 'climate', state.climate, '');
    add('scenario', 'GWP set', r.gwp.label, '');
    add('scenario', 'feed production included', String(state.includeFeed), '');
    add('scenario', 'land application included', String(state.includeLand), '');
    D.SOURCES.forEach((src) => add('emissions', src.label, r.emissions[src.key], 'kg CO2 equivalent/yr'));
    add('emissions', 'Total', r.total, 'kg CO2 equivalent/yr');
    add('intensity', 'per functional unit', r.intensity.perFU, `kg CO2 equivalent/${s.fu.label}`);
    add('intensity', 'per animal place', r.intensity.perPlace, 'kg CO2 equivalent/place/yr');
    add('intensity', 'per kg protein', r.intensity.perProtein, 'kg CO2 equivalent/kg protein');
    add('gases', 'CH4', r.gases.CH4, 'kg/yr');
    add('gases', 'N2O', r.gases.N2O, 'kg/yr');
    add('inputs', 'feed as fed', inv.feedAsFed, 'kg/yr');
    add('inputs', 'feed dry matter', inv.feedDM, 'kg/yr');
    add('inputs', 'crude protein', inv.crudeProtein, 'kg/yr');
    add('inputs', 'drinking water', inv.drinkWater, 'L/yr');
    add('inputs', 'service water', inv.serviceWater, 'L/yr');
    add('inputs', 'electricity', inv.electricity, 'kWh/yr');
    add('inputs', 'diesel', inv.diesel, 'L/yr');
    add('inputs', 'LPG', inv.lpg, 'L/yr');
    add('inputs', inv.animalsInLabel, inv.animalsIn, 'kg LW/yr');
    inv.products.forEach((p) => add('outputs', p.label, p.kg, 'kg/yr'));
    add('outputs', 'mortalities', inv.dead, 'kg/yr');
    add('outputs', 'manure as excreted', inv.manureWet, 'kg/yr');
    add('outputs', 'manure total solids', inv.manureTS, 'kg/yr');
    add('outputs', 'manure volatile solids', inv.manureVS, 'kg/yr');
    add('outputs', 'manure N excreted', inv.nex, 'kg N/yr');
    add('outputs', 'wastewater', inv.wastewater, 'L/yr');
    add('outputs', 'respiration & evaporation (balance)', r.mass.residual, 'kg/yr');
    const W = r.waterFootprint;
    [['feed green', W.feedGreen], ['feed blue', W.feedBlue], ['feed grey', W.feedGrey], ['drinking water (blue)', W.drink],
      ['service water (blue)', W.service], ['manure nitrate (grey)', W.manureGrey], ['total', W.total]].forEach(([k, v]) => add('water footprint', k, v, 'm3/yr'));
    add('water footprint', 'per functional unit', W.perFU, `L/${s.fu.label}`);
    const N = r.nitrogen;
    add('nitrogen', 'feed N', N.feed, 'kg N/yr');
    add('nitrogen', 'N in products', N.products, 'kg N/yr');
    add('nitrogen', 'N excreted', N.excreted, 'kg N/yr');
    add('nitrogen', 'NH3+NOx-N from storage', N.mms.volatilised, 'kg N/yr');
    add('nitrogen', 'land-applied N', N.mms.applied, 'kg N/yr');
    assumptionRows().filter((x) => !x.head).forEach((x) => {
      const edited = typeof x.cur === 'number' && x.cur !== x.def;
      lines.push(['assumptions', x.label, typeof x.cur === 'number' ? x.cur : x.def, x.unit, edited ? 'User-edited value' : citeText(x.src)]);
    });
    D.CONSTANTS.forEach((c) => lines.push(['constants', c.label, c.value, '', citeText(c.src)]));
    REF_KEYS.forEach((k, i) => lines.push(['references', `[${i + 1}] ${D.REFS[k].short}`, D.REFS[k].full, '', D.REFS[k].url || '']));
    lines[0].push('source');

    const csv = lines.map((l) => l.map((c) => /[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : c).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `cafo-bau-${state.species}-${size()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function applyTheme() {
    if (state.theme === 'auto') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = state.theme;
    $('btn-theme').innerHTML = `${ic({ auto: 'contrast', light: 'sun', dark: 'moon' }[state.theme], 'ic-sm')} ${{ auto: 'Auto', light: 'Light', dark: 'Dark' }[state.theme]}`;
  }

  // ================================================================== boot

  $('btn-theme').addEventListener('click', () => {
    state.theme = { auto: 'light', light: 'dark', dark: 'auto' }[state.theme] || 'auto';
    applyTheme();
    save();
  });
  bindSetup();
  bindResults();
  bindAssumptions();
  C.initTooltip();
  IC.hydrate();
  $('btn-back').innerHTML = `${ic('arrowLeft', 'ic-sm')} Back`;
  applyTheme();
  renderIntroStatic();
  renderSetup();
  const startSimulator = () => { showScreen('setup'); renderSetup(); };
  $('btn-start').addEventListener('click', startSimulator);
  $('btn-home').addEventListener('click', () => showScreen('intro'));
  showScreen('intro');
})();
