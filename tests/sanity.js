// Sanity check: run every CAFO type with BAU defaults and print key results.
// Usage: node tests/sanity.js
const DATA = require('../js/data.js');
const MODEL = require('../js/model.js');

let failed = 0;
const rows = [];
for (const [id, sp] of Object.entries(DATA.SPECIES)) {
  const r = MODEL.compute({
    species: id, size: 1, mms: sp.mms.default, climate: 'temperate',
    gwp: 'AR6', includeLand: true, includeFeed: true,
  });
  const e = r.perPlace.emissions;
  rows.push({
    type: id,
    'DMI kg/d': r.herd.dmi.toFixed(3),
    'Nex kg/yr': r.inventory.nex.toFixed(2),
    'CH4 ent kg': r.inventory.entericCH4.toFixed(2),
    'CH4 mms kg': r.inventory.manureCH4.toFixed(2),
    'kgCO2e/place': r.total.toFixed(1),
    'per FU': r.intensity.perFU.toFixed(2) + ' /' + sp.fu.label,
    'enteric %': (100 * e.enteric / r.total).toFixed(0),
    'feed %': (100 * e.feed / r.total).toFixed(0),
    'WF L/FU': r.waterFootprint.perFU.toFixed(0),
    'WF g/b/gy %': ['green', 'blue', 'grey'].map((k) => (100 * r.waterFootprint[k] / r.waterFootprint.total).toFixed(0)).join('/'),
    'mass resid %': (100 * r.mass.residual / Object.values(r.mass.in).reduce((a, b) => a + b, 0)).toFixed(0),
  });
  if (!(r.total > 0) || !Number.isFinite(r.intensity.perFU) || r.warnings.length) {
    failed++;
    console.error(`FAIL ${id}:`, r.warnings);
  }
  // water footprint components add up and are positive
  const W = r.waterFootprint;
  if (!(W.total > 0) || Math.abs(W.green + W.blue + W.grey - W.total) > 1e-6 * W.total) { failed++; console.error(`FAIL ${id}: water footprint`); }
  // N balance closes: intake + animals in = products + dead + excreted
  const N = r.nitrogen;
  const nErr = Math.abs(N.feed + N.animalsIn - N.products - N.dead - N.excreted);
  // manure N partition closes
  const m = N.mms;
  const mErr = Math.abs(N.excreted - (m.volatilised + m.leached + m.n2o + m.other + m.applied));
  if (nErr > 1e-9 || mErr > 1e-9) { failed++; console.error(`FAIL ${id}: N balance error ${nErr} / ${mErr}`); }
}
console.table(rows);

// Scaling is linear in herd size
const a = MODEL.compute({ species: 'dairy', size: 100, climate: 'temperate', gwp: 'AR6', includeLand: true, includeFeed: true });
const b = MODEL.compute({ species: 'dairy', size: 200, climate: 'temperate', gwp: 'AR6', includeLand: true, includeFeed: true });
if (Math.abs(b.total / a.total - 2) > 1e-9) { failed++; console.error('FAIL: non-linear scaling'); }

// Overrides take effect
const c = MODEL.compute({ species: 'dairy', size: 100, climate: 'temperate', gwp: 'AR6', includeLand: true, includeFeed: true,
  overrides: { species: { dairy: { ym: 0 } } } });
if (c.emissions.enteric !== 0) { failed++; console.error('FAIL: override ignored'); }

console.log(failed ? `${failed} check(s) failed` : 'All checks passed');
process.exit(failed ? 1 : 0);
