/* Chart helpers: number formatting, tooltip, emission bars and a small column-based Sankey. */
(function (root) {
  'use strict';

  // ------------------------------------------------------------------ formatting

  function fmt(v, digits) {
    if (!Number.isFinite(v)) return '—';
    const a = Math.abs(v);
    let d = digits;
    if (d === undefined) d = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a >= 0.01 ? 3 : 4;
    if (a === 0) d = 0;
    return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  /** Pick a display unit for a mass in kg: kg, t or kt. */
  function massUnit(maxKg, base) {
    base = base || '';
    if (maxKg >= 1e7) return { div: 1e6, unit: 'kt' + base };
    if (maxKg >= 1e4) return { div: 1e3, unit: 't' + base };
    return { div: 1, unit: 'kg' + base };
  }

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ------------------------------------------------------------------ tooltip

  let tip;
  function initTooltip() {
    tip = document.createElement('div');
    tip.className = 'tooltip';
    tip.setAttribute('role', 'tooltip');
    document.body.appendChild(tip);
    const move = (e) => {
      const el = e.target.closest && e.target.closest('[data-tip]');
      if (!el) { tip.classList.remove('show'); return; }
      tip.innerHTML = el.getAttribute('data-tip');
      tip.classList.add('show');
      const pad = 14, w = tip.offsetWidth, h = tip.offsetHeight;
      let x = e.clientX + pad, y = e.clientY + pad;
      if (x + w > window.innerWidth - 8) x = e.clientX - w - pad;
      if (y + h > window.innerHeight - 8) y = e.clientY - h - pad;
      tip.style.left = x + 'px';
      tip.style.top = y + 'px';
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseleave', () => tip.classList.remove('show'));
  }
  const tipHtml = (title, value) => `<div class="t-title">${esc(title)}</div><div class="t-val">${value}</div>`;

  // ------------------------------------------------------------------ emission bars

  /**
   * rows: [{label, scope, value, color, excluded}] in fixed category order.
   * Renders a 100 % composition strip and one bar per source (shared linear scale).
   */
  function emissionBars(el, rows, unit) {
    const total = rows.reduce((s, r) => s + (r.excluded ? 0 : r.value), 0);
    const max = Math.max(...rows.map((r) => r.value), 1e-12);
    const pct = (v) => total > 0 ? 100 * v / total : 0;

    const strip = rows.filter((r) => !r.excluded && pct(r.value) >= 0.15).map((r) =>
      `<div class="seg" style="flex:${r.value} 1 0;background:${r.color}" data-tip="${esc(tipHtml(r.label, `${fmt(r.value)} ${unit} · ${fmt(pct(r.value), 1)} %`))}"></div>`
    ).join('');

    const list = rows.map((r) => {
      const tipAttr = `data-tip="${esc(tipHtml(r.label + ' · ' + r.scope, r.excluded ? 'Excluded from boundary' : `${fmt(r.value)} ${unit} · ${fmt(pct(r.value), 1)} %`))}"`;
      return `
        <div class="name" ${tipAttr}><span class="sw" style="background:${r.color}"></span>${esc(r.label)}<span class="scope">${esc(r.scope)}</span></div>
        <div class="track" ${tipAttr}>${r.excluded ? '<span class="excluded">&nbsp;excluded</span>' :
          `<div class="bar" style="width:${(100 * r.value / max).toFixed(3)}%;background:${r.color}"></div>`}</div>
        <div class="val">${r.excluded ? '—' : fmt(r.value)}</div>
        <div class="pct">${r.excluded ? '' : fmt(pct(r.value), 1) + ' %'}</div>`;
    }).join('');

    el.innerHTML = `<div class="stack" role="img" aria-label="Share of emissions by source">${strip}</div>
      <div class="bars" role="table" aria-label="Emissions by source, ${esc(unit)}">${list}</div>`;
  }

  // ------------------------------------------------------------------ sankey

  /**
   * Minimal Sankey for a small, explicit column layout.
   * nodes: [{id, label, col, color?}]  links: [{source, target, value, color}]
   * opts: {width, height, unit, div, label, animate, compact}
   * compact (default: container narrower than 600 px) fits the diagram to the
   * container and replaces node labels with numbered markers plus a legend.
   */
  function sankey(el, nodes, links, opts) {
    el._sankeyArgs = { nodes, links, opts };   // lets the exporter redraw a full-size copy
    const compact = opts.compact !== undefined ? opts.compact : (el.clientWidth > 0 && el.clientWidth < 600);
    const W = compact ? Math.max(300, el.clientWidth) : (opts.width || 940);
    const H = opts.height || 420;
    const M = compact ? { l: 22, r: 22, t: 8, b: 8 } : { l: 170, r: 200, t: 12, b: 12 };
    const nodeW = compact ? 8 : 10, gap = compact ? 10 : 18, minH = 2;
    links = links.filter((l) => l.value > 0);
    const byId = Object.fromEntries(nodes.map((n) => [n.id, { ...n, in: [], out: [] }]));
    links.forEach((l) => { byId[l.source].out.push(l); byId[l.target].in.push(l); });
    const N = Object.values(byId).filter((n) => n.in.length || n.out.length);
    N.forEach((n) => {
      n.value = Math.max(sumV(n.in), sumV(n.out));
    });
    const cols = Math.max(...N.map((n) => n.col)) + 1;
    const colNodes = Array.from({ length: cols }, (_, c) => N.filter((n) => n.col === c));
    const innerH = H - M.t - M.b;
    const k = Math.min(...colNodes.filter((c) => c.length).map((c) =>
      (innerH - gap * (c.length - 1) - minH * c.length) / sumV(c)));
    const colX = (c) => M.l + (cols === 1 ? 0 : c * (W - M.l - M.r - nodeW) / (cols - 1));

    colNodes.forEach((c) => {
      let y = M.t;
      c.forEach((n) => {
        n.x = colX(n.col); n.y = y; n.h = Math.max(minH, n.value * k);
        y += n.h + gap;
      });
    });
    // link offsets: stack outgoing by target position, incoming by source position
    N.forEach((n) => {
      let o = 0;
      n.out.sort((a, b) => byId[a.target].y - byId[b.target].y).forEach((l) => { l.sy = n.y + o; l.w = Math.max(1, l.value * k); o += l.value * k; });
      let i = 0;
      n.in.sort((a, b) => byId[a.source].y - byId[b.source].y).forEach((l) => { l.ty = n.y + i; i += l.value * k; });
    });

    const f = (v) => `${fmt(v / opts.div)} ${opts.unit}`;
    const paths = links.map((l) => {
      const s = byId[l.source], t = byId[l.target];
      const x0 = s.x + nodeW, x1 = t.x, xm = (x0 + x1) / 2;
      const y0 = l.sy, y1 = l.ty, w = l.w;
      const d = `M${x0},${y0} C${xm},${y0} ${xm},${y1} ${x1},${y1} L${x1},${y1 + w} C${xm},${y1 + w} ${xm},${y0 + w} ${x0},${y0 + w} Z`;
      return `<path class="link" d="${d}" style="fill:${l.color};--col:${s.col}" data-tip="${esc(tipHtml(`${s.label} → ${t.label}`, f(l.value)))}"></path>`;
    }).join('');

    // number nodes column by column, top to bottom (used by compact markers and legend)
    colNodes.forEach((c) => c.sort((a, b) => a.y - b.y));
    let num = 0;
    colNodes.forEach((c) => c.forEach((n) => { n.num = ++num; }));

    // two-line labels need ~30px (compact markers ~14px); push colliding labels apart within each column
    const LABEL_H = compact ? 14 : 30;
    colNodes.forEach((c) => {
      let prev = -Infinity;
      c.forEach((n) => { n.ly = Math.max(n.y + n.h / 2, prev + LABEL_H); prev = n.ly; });
      const overflow = prev - (H - LABEL_H / 2);
      if (overflow > 0) {
        let next = Infinity;
        [...c].reverse().forEach((n) => { n.ly = Math.min(n.ly - overflow, next - LABEL_H); next = n.ly; });
      }
    });

    if (compact) {
      const swatch = (n) => n.color || (n.col === 0 ? (n.out[0] || n.in[0]) : (n.in[0] || n.out[0])).color;
      const marks = N.map((n) => {
        const first = n.col === 0;
        const tx = first ? n.x - 5 : n.x + nodeW + 5;
        return `<g class="node" style="--col:${n.col}" data-tip="${esc(tipHtml(n.label, f(n.value)))}">
          <rect x="${n.x}" y="${n.y}" width="${nodeW}" height="${n.h}" rx="2"${n.color ? ` style="fill:${n.color}"` : ''}></rect>
          <text class="num" x="${tx}" y="${n.ly + 4}" text-anchor="${first ? 'end' : 'start'}">${n.num}</text>
        </g>`;
      }).join('');
      const legend = [...N].sort((a, b) => a.num - b.num).map((n) =>
        `<li data-tip="${esc(tipHtml(n.label, f(n.value)))}"><span class="lg-num">${n.num}</span><span class="lg-sw" style="background:${swatch(n)}"></span><span class="lg-name">${esc(n.label)}</span><span class="lg-val">${f(n.value)}</span></li>`).join('');
      el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" data-compact="1" class="${opts.animate ? 'sankey-anim' : ''}" role="img" aria-label="${esc(opts.label || 'Flow diagram')}"><g class="links">${paths}</g><g class="nodes">${marks}</g></svg>
        <ol class="sankey-legend" aria-label="Diagram key">${legend}</ol>`;
      return;
    }

    const nodeSvg = N.map((n) => {
      const first = n.col === 0;
      const tx = first ? n.x - 14 : n.x + nodeW + 14;
      const anchor = first ? 'end' : 'start';
      const cy = n.y + n.h / 2;
      const ex = first ? n.x - 2 : n.x + nodeW + 2;
      const leader = Math.abs(n.ly - cy) > 3
        ? `<path d="M${ex},${cy} L${(ex + tx) / 2},${n.ly - 6}" style="stroke:var(--text-muted);fill:none;stroke-width:1"></path>` : '';
      return `<g class="node" style="--col:${n.col}" data-tip="${esc(tipHtml(n.label, f(n.value)))}">
        <rect x="${n.x}" y="${n.y}" width="${nodeW}" height="${n.h}" rx="2"${n.color ? ` style="fill:${n.color}"` : ''}></rect>${leader}
        <text x="${tx}" y="${n.ly - 2}" text-anchor="${anchor}">${esc(n.label)}</text>
        <text class="v" x="${tx}" y="${n.ly + 12}" text-anchor="${anchor}">${f(n.value)}</text>
      </g>`;
    }).join('');

    el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="min-width:${Math.round(W * 0.72)}px" class="${opts.animate ? 'sankey-anim' : ''}" role="img" aria-label="${esc(opts.label || 'Flow diagram')}"><g class="links">${paths}</g><g class="nodes">${nodeSvg}</g></svg>`;
  }

  const sumV = (a) => a.reduce((s, x) => s + x.value, 0);

  root.CAFO_CHARTS = { fmt, massUnit, esc, initTooltip, tipHtml, emissionBars, sankey };
})(window);
