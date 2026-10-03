/*
 * Figure export: renders the current Sankey figure on a branded sheet
 * (W2R Lab at the Technion) and saves it as PDF (desktop) or JPEG
 * (phones: shared to the photo gallery via the Web Share API).
 */
(function (root) {
  'use strict';

  const LAB = {
    name: 'W2R Lab',
    full: 'Waste-to-Resource Lab',
    institution: 'Technion – Israel Institute of Technology',
    url: 'https://w2r-lab.vercel.app/index.html',
    urlLabel: 'w2r-lab.vercel.app',
    logo: 'https://w2r-lab.vercel.app/assets/img/w2r-badge.png',
    technionLogo: 'https://w2r-lab.vercel.app/assets/img/technion-leave-a-mark-light.png', // light version for dark backgrounds
  };
  const APP = { name: 'CAFO Footprint Simulator', url: 'https://cafo-footprint-simulator.vercel.app', urlLabel: 'cafo-footprint-simulator.vercel.app' };
  const JSPDF_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  const FONT = 'Figtree, "Segoe UI", Arial, sans-serif';
  const C = {
    dark: '#0b1512', onDark: '#ecf4ee', onDarkMuted: '#9fb2a8', amber: '#ffc000',
    ink: '#0f1f19', ink2: '#3e5149', muted: '#687a71', line: '#dde6e0', tile: '#eef3ef', accent: '#157a55',
  };
  const W = 2400, H = Math.round(2400 / Math.SQRT2); // A4 landscape proportions

  // ------------------------------------------------------------------ helpers

  const $ = (sel) => document.querySelector(sel);
  const text = (sel) => ($(sel) ? $(sel).innerText.trim() : '');

  function isPhone() {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    return coarse && window.innerWidth < 900;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.async = true;
      s.onload = resolve; s.onerror = () => reject(new Error('Could not load ' + src));
      document.head.appendChild(s);
    });
  }
  let jspdfPromise;
  function getJsPDF() {
    if (root.jspdf && root.jspdf.jsPDF) return Promise.resolve(root.jspdf.jsPDF);
    jspdfPromise = jspdfPromise || loadScript(JSPDF_SRC).then(() => root.jspdf.jsPDF);
    return jspdfPromise;
  }

  function loadImage(src, cors) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      if (cors) img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image failed: ' + src));
      img.src = src;
    });
  }
  const logoCache = {};
  const getImage = (src) => (logoCache[src] = logoCache[src] || loadImage(src, true).catch(() => null));

  /** Serialise the live Sankey SVG with light-theme computed styles inlined. */
  function svgToImage(svg) {
    const html = document.documentElement;
    const prevTheme = html.dataset.theme;
    html.dataset.theme = 'light';
    const clone = svg.cloneNode(true);
    const src = svg.querySelectorAll('*'), dst = clone.querySelectorAll('*');
    const props = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-linejoin', 'paint-order', 'opacity', 'font-size', 'font-weight'];
    src.forEach((el, i) => {
      const cs = getComputedStyle(el);
      const d = dst[i];
      d.removeAttribute('class');
      d.removeAttribute('data-tip');
      let style = props.map((p) => `${p}:${cs.getPropertyValue(p)}`).join(';');
      if (el.tagName === 'text') style += `;font-family:${FONT}`;
      if (el.tagName === 'g') style += ';opacity:1';
      d.setAttribute('style', style);
    });
    if (prevTheme === undefined) delete html.dataset.theme; else html.dataset.theme = prevTheme;

    const vb = svg.viewBox.baseVal;
    clone.removeAttribute('class');
    clone.removeAttribute('style');
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    // rasterise at 3× so the figure stays sharp when scaled onto the sheet
    clone.setAttribute('width', vb.width * 3);
    clone.setAttribute('height', vb.height * 3);
    const xml = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }));
    return loadImage(url).then((img) => { URL.revokeObjectURL(url); return { img, w: vb.width, h: vb.height }; });
  }

  function wrap(ctx, str, maxW) {
    const words = str.split(/\s+/), lines = [];
    let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    if (line) lines.push(line);
    return lines;
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ------------------------------------------------------------------ sheet

  /** Draw the branded figure sheet; returns { canvas, links } (links in px for PDF annotations). */
  async function renderSheet() {
    let svg = $('#sankey svg');
    if (!svg) throw new Error('No figure to export yet.');
    // Phones show a compact diagram with a numbered key; the sheet always uses the full labelled layout.
    let tmp = null;
    if (svg.dataset.compact && $('#sankey')._sankeyArgs) {
      const a = $('#sankey')._sankeyArgs;
      tmp = document.createElement('div');
      tmp.className = 'sankey-wrap';
      tmp.style.cssText = 'position:absolute;left:-10000px;top:0;width:1200px';
      document.body.appendChild(tmp);
      root.CAFO_CHARTS.sankey(tmp, a.nodes, a.links, { ...a.opts, animate: false, compact: false });
      svg = tmp.querySelector('svg');
    }
    await Promise.all(['400', '600', '700'].map((w) => document.fonts.load(`${w} 40px Figtree`).catch(() => null)));
    const [fig, logo, technion] = await Promise.all([svgToImage(svg), getImage(LAB.logo), getImage(LAB.technionLogo)]);
    if (tmp) tmp.remove();

    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    const M = 90, links = [];
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);

    // header band — W2R Lab (left) and Technion (right)
    const HB = 200;
    ctx.fillStyle = C.dark; ctx.fillRect(0, 0, W, HB);
    let tx = M;
    if (logo) {
      ctx.save(); ctx.beginPath(); ctx.arc(M + 70, HB / 2, 70, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(logo, M, HB / 2 - 70, 140, 140); ctx.restore();
      tx = M + 170;
    }
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = C.onDark; ctx.font = `700 56px ${FONT}`;
    ctx.fillText(LAB.name, tx, 92);
    const nameW = ctx.measureText(LAB.name).width;
    ctx.fillStyle = C.onDarkMuted; ctx.font = `400 34px ${FONT}`;
    ctx.fillText('· ' + LAB.full, tx + nameW + 16, 92);
    const inst = LAB.institution + '  ·  ';
    ctx.fillText(inst, tx, 146);
    const instW = ctx.measureText(inst).width;
    ctx.fillStyle = C.amber; ctx.font = `600 32px ${FONT}`;
    ctx.fillText(LAB.urlLabel, tx + instW, 146);
    links.push({ x: tx + instW, y: 146 - 32, w: ctx.measureText(LAB.urlLabel).width, h: 40, url: LAB.url });
    if (technion) {
      const th = 104, tw = th * technion.naturalWidth / technion.naturalHeight;
      const tlx = W - M - tw;
      ctx.drawImage(technion, tlx, (HB - th) / 2, tw, th);
      ctx.strokeStyle = 'rgba(236, 244, 238, 0.18)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(tlx - 44, 52); ctx.lineTo(tlx - 44, HB - 52); ctx.stroke();
    }

    // simulator label, figure title + scenario
    let y = HB + 78;
    ctx.fillStyle = '#a8690a'; ctx.font = `700 26px ${FONT}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = '4px';
    ctx.fillText(APP.name.toUpperCase(), M, y);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    y += 64;
    ctx.fillStyle = C.ink; ctx.font = `700 54px ${FONT}`;
    ctx.fillText(text('#flow-title'), M, y);
    y += 56;
    ctx.fillStyle = C.ink2; ctx.font = `400 32px ${FONT}`;
    const chips = [...document.querySelectorAll('#result-chips .chip')].map((c) => c.textContent.trim());
    const subtitle = [text('#result-title')].concat(chips.slice(1)).join('  ·  ');
    wrap(ctx, subtitle, W - 2 * M).slice(0, 2).forEach((l) => { ctx.fillText(l, M, y); y += 42; });

    // figure, fitted between title and the key-figures row
    const kpis = [...document.querySelectorAll('#kpis .kpi')].map((k) => ({
      label: k.querySelector('.label').innerText.trim(), value: k.querySelector('.value').innerText.trim(), unit: k.querySelector('.unit').innerText.trim(),
    }));
    const KH = 170, NH = 120, FOOT = 90;
    const top = y + 10, bottom = H - FOOT - NH - KH - 40;
    const s = Math.min((W - 2 * M) / fig.w, (bottom - top) / fig.h);
    const fw = fig.w * s, fh = fig.h * s;
    ctx.drawImage(fig.img, M + (W - 2 * M - fw) / 2, top + (bottom - top - fh) / 2, fw, fh);

    // key figures
    const ky = bottom + 20, gap = 24, kw = (W - 2 * M - gap * (kpis.length - 1)) / Math.max(1, kpis.length);
    kpis.forEach((k, i) => {
      const kx = M + i * (kw + gap);
      ctx.fillStyle = C.tile; roundRect(ctx, kx, ky, kw, KH, 16); ctx.fill();
      if (i === 0) { ctx.fillStyle = C.accent; ctx.fillRect(kx, ky + 16, 6, KH - 32); }
      ctx.fillStyle = C.ink2; ctx.font = `500 28px ${FONT}`;
      ctx.fillText(k.label, kx + 28, ky + 46, kw - 56);
      ctx.fillStyle = C.ink; ctx.font = `700 56px ${FONT}`;
      ctx.fillText(k.value, kx + 28, ky + 112, kw - 56);
      ctx.fillStyle = C.muted; ctx.font = `400 24px ${FONT}`;
      ctx.fillText(k.unit, kx + 28, ky + 148, kw - 56);
    });

    // notes (from the figure caption, without interactive hints)
    let ny = ky + KH + 48;
    ctx.fillStyle = C.muted; ctx.font = `400 24px ${FONT}`;
    const note = text('#flow-note').replace(/\s*Hover any flow for its value\.?/g, '').trim();
    wrap(ctx, note, W - 2 * M).slice(0, 3).forEach((l) => { ctx.fillText(l, M, ny); ny += 32; });

    // footer
    const fy = H - FOOT;
    ctx.strokeStyle = C.line; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(M, fy); ctx.lineTo(W - M, fy); ctx.stroke();
    ctx.fillStyle = C.muted; ctx.font = `400 24px ${FONT}`;
    const date = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const left = `Generated with ${APP.name} · `;
    ctx.fillText(left, M, fy + 48);
    const lw = ctx.measureText(left).width;
    ctx.fillStyle = C.accent; ctx.fillText(APP.urlLabel, M + lw, fy + 48);
    const aw = ctx.measureText(APP.urlLabel).width;
    links.push({ x: M + lw, y: fy + 24, w: aw, h: 32, url: APP.url });
    ctx.fillStyle = C.muted;
    ctx.fillText(` · ${date} · Indicative business-as-usual estimates; methods and sources in the simulator.`, M + lw + aw, fy + 48, W - 2 * M - lw - aw - 420);
    ctx.textAlign = 'right';
    ctx.fillText(`© ${new Date().getFullYear()} ${LAB.name} at the Technion`, W - M, fy + 48);
    ctx.textAlign = 'left';

    return { canvas, links, title: text('#flow-title') };
  }

  function fileBase() {
    const title = text('#result-title').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const fig = text('#flow-title').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return `cafo-${title}-${fig}`.slice(0, 90);
  }

  // ------------------------------------------------------------------ outputs

  async function savePDF() {
    const [{ canvas, links, title }, jsPDF] = await Promise.all([renderSheet(), getJsPDF()]);
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight();
    doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pw, ph);
    const k = pw / W;
    links.forEach((l) => doc.link(l.x * k, l.y * k, l.w * k, l.h * k, { url: l.url }));
    doc.setProperties({ title: `${title} — ${APP.name}`, author: `${LAB.name} (${LAB.full}), ${LAB.institution}`, creator: APP.name, subject: 'CAFO business-as-usual footprint figure' });
    doc.save(fileBase() + '.pdf');
  }

  async function saveJPEG() {
    const { canvas } = await renderSheet();
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
    const name = fileBase() + '.jpg';
    const file = new File([blob], name, { type: 'image/jpeg' });
    // Phones: the share sheet offers "Save Image" (iOS) / "Save to gallery" (Android).
    if (isPhone() && navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: APP.name }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  root.CAFO_EXPORT = { savePDF, saveJPEG, isPhone, renderSheet };
})(window);
