/* Minimal line-icon set (24×24, stroke = currentColor), drawn in the style of the Lucide icon family. */
(function (root) {
  'use strict';

  const P = (...d) => d.map((x) => `<path d="${x}"/>`).join('');
  const ICONS = {
    arrowRight: P('M5 12h14', 'm12 5 7 7-7 7'),
    arrowLeft: P('m12 19-7-7 7-7', 'M19 12H5'),
    external: P('M15 3h6v6', 'M10 14 21 3', 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'),
    pencil: P('M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'),
    plus: P('M5 12h14', 'M12 5v14'),
    download: P('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'),
    rotate: P('M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8', 'M3 3v5h5'),
    sun: '<circle cx="12" cy="12" r="4"/>' + P('M12 2v2', 'M12 20v2', 'm4.93 4.93 1.41 1.41', 'm17.66 17.66 1.41 1.41', 'M2 12h2', 'M20 12h2', 'm6.34 17.66-1.41 1.41', 'm19.07 4.93-1.41 1.41'),
    moon: P('M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z'),
    contrast: '<circle cx="12" cy="12" r="10"/>' + P('M12 18a6 6 0 0 0 0-12v12z'),
    layers: P('M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z', 'm22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65', 'm22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65'),
    flask: P('M10 2v7.31', 'M14 9.3V1.99', 'M8.5 2h7', 'M14 9.3a6.5 6.5 0 1 1-4 0', 'M5.52 16h12.96'),
    cloud: P('M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'),
    droplet: P('M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z'),
    factory: P('M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z', 'M17 18h1', 'M12 18h1', 'M7 18h1'),
    flame: P('M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z'),
    chart: P('M3 3v18h18', 'M18 17V9', 'M13 17V5', 'M8 17v-3'),
    activity: P('M22 12h-4l-3 9L9 3l-3 9H2'),
    paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/>' + P('M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.05Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z'),
    warehouse: P('M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z', 'M6 18h12', 'M6 14h12', 'M6 10h12v12H6z'),
    tank: P('M21 5c0 1.66-4 3-9 3S3 6.66 3 5s4-3 9-3 9 1.34 9 3', 'M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5', 'M3 12c0 1.66 4 3 9 3s9-1.34 9-3'),
    zap: P('M13 2 3 14h9l-1 8 10-12h-9l1-8z'),
    thermometer: P('M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z'),
    frame: P('M3 7V5a2 2 0 0 1 2-2h2', 'M17 3h2a2 2 0 0 1 2 2v2', 'M21 17v2a2 2 0 0 1-2 2h-2', 'M7 21H5a2 2 0 0 1-2-2v-2'),
    sliders: P('M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M2 14h4', 'M10 8h4', 'M18 16h4'),
    book: P('M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z', 'M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'),
    calculator: P('M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M8 6h8', 'M16 14v4', 'M16 10h.01', 'M12 10h.01', 'M8 10h.01', 'M12 14h.01', 'M8 14h.01', 'M12 18h.01', 'M8 18h.01'),
    leaf: P('M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z', 'M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12'),
    scale: P('m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z', 'm2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z', 'M7 21h10', 'M12 3v18', 'M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2'),
    car: P('M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2', 'M9 17h6') + '<circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
    tag: P('M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.42l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z') + '<circle cx="7.5" cy="7.5" r=".5"/>',
    percent: P('M19 5 5 19') + '<circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    wind: P('M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2', 'M9.6 4.6A2 2 0 1 1 11 8H2', 'M12.6 19.4A2 2 0 1 0 14 16H2'),
    flows: P('M3 6h5c4 0 4 6 8 6h5', 'M3 12h5c4 0 4 6 8 6h5', 'M3 18h18'),
  };

  function icon(name, cls) {
    const body = ICONS[name];
    if (!body) return '';
    return `<svg class="ic${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
  }

  /** Replace every [data-icon] placeholder in the document with its SVG. */
  function hydrate(scope) {
    (scope || document).querySelectorAll('[data-icon]').forEach((el) => {
      el.innerHTML = icon(el.dataset.icon, el.dataset.iconClass);
    });
  }

  root.CAFO_ICONS = { icon, hydrate };
})(window);
