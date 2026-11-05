/* CAAiT chart engine. Dependency-free SVG/DOM views.
   Values always come from application data; colours always come from the CAAiT logo palette.
   Palette validated with the dataviz six checks (light surface, categorical + ordinal). */
window.CAAITVisuals = (() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const observers = new Set();
  const running = new Set();
  let serial = 0;

  /* Logo-derived tokens. ordinal5/ordinal3 are one violet hue, light to dark;
     accent is the logo magenta and marks extremes only. */
  const C = {
    violet:'#5b21c7', accent:'#e020a8',
    ordinal5:['#b795f2','#a179ec','#8b5ce3','#7340d2','#5b21c7'],
    ordinal3:['#b795f2','#8b5ce3','#5b21c7'],ordinal3Desc:['#5b21c7','#8b5ce3','#b795f2'],
    track:'#ece8f6', grid:'#e7e4f0', surface:'#ffffff'
  };

  const nf = new Intl.NumberFormat('ms-MY');
  const num = value => nf.format(Number(value) || 0);

  /* Axis ceilings land on 1/2/2.5/5 x 10^k so ticks read as clean numbers. */
  function niceTop(max, ticks = 4) {
    const raw = Math.max(1, max) / ticks;
    const power = 10 ** Math.floor(Math.log10(raw));
    const step = [1, 2, 2.5, 5, 10].find(s => s * power >= raw - 1e-9) * power;
    return {top: step * ticks, step};
  }

  /* Rounded data-end, square baseline: the mark spec for every bar and column. */
  function columnPath(x, y, width, floor, radius = 4) {
    const r = Math.min(radius, width / 2, Math.max(0, floor - y));
    return `M${x},${floor}L${x},${y + r}Q${x},${y} ${x + r},${y}L${x + width - r},${y}Q${x + width},${y} ${x + width},${y + r}L${x + width},${floor}Z`;
  }

  function tableView(rows, labelHead, valueHead, summary) {
    return `<details class="chart-data"><summary>${escape(summary)}</summary><div class="table-scroll"><table><thead><tr><th>${escape(labelHead)}</th><th>${escape(valueHead)}</th></tr></thead><tbody>${rows.map(r => `<tr><td>${escape(r.label)}</td><td>${escape(r.display ?? num(r.value))}</td></tr>`).join('')}</tbody></table></div></details>`;
  }

  /* ---------- Columns: magnitude across a small set of ordered bands ---------- */
  function columns(items, options = {}) {
    if (!items.length) return '<p class="empty">Belum ada data untuk paparan ini.</p>';
    const {unit = 'entri', caption = 'Nilai', emphasis = null} = options;
    const left = 46, right = 708, floor = 238, ceiling = 26;
    const {top, step} = niceTop(Math.max(...items.map(i => Number(i.value))));
    const band = (right - left) / items.length;
    const width = Math.min(24, band * 0.46);

    const grid = [];
    for (let v = 0; v <= top + 1e-9; v += step) {
      const y = floor - v / top * (floor - ceiling);
      grid.push(`<line x1="${left}" x2="${right}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}" class="chart-grid"/><text x="${left - 10}" y="${(y + 4).toFixed(2)}" text-anchor="end" class="chart-axis">${num(v)}</text>`);
    }

    const marks = items.map((item, index) => {
      const value = Math.max(0, Number(item.value));
      const x = left + index * band + (band - width) / 2;
      const y = floor - value / top * (floor - ceiling);
      const hot = emphasis === item.label || item.emphasis;
      const colour = hot ? C.accent : C.violet;
      const mid = (x + width / 2).toFixed(2);
      const label = `${item.label}: ${num(value)} ${unit}`;
      return `<g class="column-group"><rect class="column-hit" x="${(left + index * band).toFixed(2)}" y="${ceiling}" width="${band.toFixed(2)}" height="${floor - ceiling}" tabindex="0" role="img" aria-label="${escape(label)}" data-label="${escape(item.label)}" data-value="${escape(num(value))}" data-unit="${escape(unit)}"/><path class="column-mark" d="${columnPath(x, y, width, floor)}" fill="${colour}"/><text class="column-value" x="${mid}" y="${(y - 9).toFixed(2)}" text-anchor="middle">${num(value)}</text><text class="chart-axis column-label" x="${mid}" y="${floor + 22}" text-anchor="middle">${escape(item.label)}</text>${item.sub ? `<text class="chart-axis column-sub" x="${mid}" y="${floor + 38}" text-anchor="middle">${escape(item.sub)}</text>` : ''}</g>`;
    }).join('');

    return `<div class="column-chart"><svg viewBox="0 0 720 ${items.some(i => i.sub) ? 290 : 274}" role="img" aria-label="${escape(caption)}. Nilai penuh tersedia dalam jadual di bawah.">${grid.join('')}<line x1="${left}" x2="${right}" y1="${floor}" y2="${floor}" class="chart-axis-line"/>${marks}</svg><output class="chart-tooltip" hidden></output>${tableView(items, 'Kategori', caption, `Lihat jadual (${items.length} kategori)`)}</div>`;
  }

  /* ---------- Horizontal bars: ranked magnitude, long labels ---------- */
  function bars(items, options = {}) {
    const {unit = '', caption = 'Nilai', emphasis = null, summary = 'Lihat jadual nilai', ordinal = false} = options;
    if (!items.length) return '<p class="empty">Belum ada data untuk tempoh ini.</p>';
    const max = Math.max(1, ...items.map(x => Number(x.value)));
    const rows = items.map((item, index) => {
      const value = Math.max(0, Number(item.value));
      const hot = emphasis === item.label || item.emphasis;
      const display = item.display ?? num(value);
      // An ordinal row set reads its rank from the ramp; a nominal set keeps one hue.
      const fill = ordinal ? C.ordinal5[(items.length - 1 - index) % C.ordinal5.length] : (hot ? C.accent : C.violet);
      return `<div class="bar-row${hot ? ' is-accent' : ''}"><div class="bar-label"><span>${escape(item.label)}</span><strong>${escape(display)}</strong></div><div class="bar-track" title="${escape(item.label)}: ${escape(display)} ${escape(unit)}"><div class="bar-fill" style="width:${(value / max * 100).toFixed(2)}%;background:${fill}"></div></div></div>`;
    }).join('');
    return `<div class="bar-set">${rows}${tableView(items, 'Kategori', caption, summary)}</div>`;
  }

  /* ---------- Donut: part-to-whole at a glance, ordinal ramp ---------- */
  function donutChart(items, centreLabel, options = {}) {
    const {hero = false, colours = C.ordinal3Desc, note = ''} = options;
    const radius = 62, circumference = 2 * Math.PI * radius;
    const gap = 2 / circumference * 100; // a 2px surface gap, expressed in pathLength units
    const total = items.reduce((sum, item) => sum + Number(item.value), 0);
    const filled = items.filter(item => Number(item.value) > 0);
    let offset = 0;
    const segments = items.map((item, index) => {
      const amount = total ? Number(item.value) / total * 100 : 0;
      if (!amount) return '';
      const drawn = filled.length > 1 ? Math.max(0.6, amount - gap) : amount;
      const circle = `<circle class="donut-segment" cx="80" cy="80" r="${radius}" fill="none" stroke="${colours[index % colours.length]}" stroke-width="15" pathLength="100" stroke-dasharray="${drawn.toFixed(3)} ${(100 - drawn).toFixed(3)}" stroke-dashoffset="${(-offset).toFixed(3)}"><title>${escape(item.label)}: ${num(item.value)}</title></circle>`;
      offset += amount;
      return circle;
    }).join('');
    const legend = items.map((item, index) => `<div><span class="legend-dot" style="background:${colours[index % colours.length]}" aria-hidden="true"></span><span>${escape(item.label)}</span><strong>${num(item.value)}</strong></div>`).join('');
    return `<div class="composition"><div class="donut-wrap"><svg class="donut" viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="${radius}" fill="none" stroke="${C.track}" stroke-width="15"/>${segments}</svg><div class="donut-value${hero ? ' is-hero' : ''}"><strong data-count="${total}">${num(total)}</strong><span>${escape(centreLabel)}</span></div></div><div class="chart-legend">${legend}</div></div>${total ? '' : '<p class="source">Belum ada data dalam tempoh dipilih.</p>'}${note ? `<p class="source">${escape(note)}</p>` : ''}`;
  }

  /* Dashboard awam: bagaimana 12 entri rekod terbahagi mengikut darjah pengesahan.
     Ordered reported -> planned -> future, so the ordinal ramp carries the order. */
  function composition(programs) {
    const groups = [
      {key:'reported', label:'Direkodkan'},
      {key:'mixed', label:'LOI & perancangan'},
      {key:'future', label:'Kerjasama masa hadapan'}
    ].map(group => ({...group, value: programs.filter(p => p.status === group.key).length}));
    return `<section class="panel composition-panel"><div class="composition-intro"><span class="eyebrow">Gambaran rekod</span><h2>Aktiviti &amp; perancangan</h2><p class="muted">Warna semakin pekat mengikut darjah pengesahan rekod.</p><p class="source">Jumlah entri bukan jumlah program selesai. Rancangan kekal dibezakan daripada rekod aktiviti.</p></div><div class="composition-chart">${donutChart(groups, 'entri rekod', {hero: true})}</div></section>`;
  }

  /* Admin inbox: new -> read -> resolved is a workflow order, so it takes the same ramp. */
  function distribution(items, caption) {
    return donutChart(items, caption);
  }

  /* ---------- Stage ladder: the roadmap as an ordered progression ---------- */
  /* The roadmap reads as a journey: one rail that draws itself, numbered stops that
     settle in sequence, and a slow pulse so the ladder never looks frozen. */
  function stages(items) {
    const colours = ['#cdbdf2', '#b795f2', '#a179ec', '#8b5ce3', '#7340d2', '#5b21c7'];
    const steps = items.map((item, index) => {
      const date = String(item.date || '').trim();
      return `<li class="journey-step" style="--stage:${colours[index % colours.length]};--i:${index}">` +
        `<span class="journey-dot" aria-hidden="true"><i>${String(index + 1).padStart(2, '0')}</i></span>` +
        `<div class="journey-card"><h3>${escape(item.title)}</h3>` +
        (date ? `<p class="stage-date">${escape(date)}</p>` : '') +
        `<p class="stage-body">${escape(item.body)}</p></div></li>`;
    }).join('');
    return `<div class="journey"><span class="journey-rail" aria-hidden="true"><span class="journey-progress"></span></span><ol class="journey-steps">${steps}</ol></div>`;
  }

  /* ---------- Neural field: a living echo of the logo's node mesh ----------
     Canvas rather than a 3D library: the page ships under a strict script-src CSP that
     blocks every CDN, and the whole project stays dependency-free and build-free.
     A few hundred lines of 2D beat a 600KB import for a decorative field. */
  function neural(options = {}) {
    return `<canvas class="neural-field" data-neural='${escape(JSON.stringify(options))}' aria-hidden="true"></canvas>`;
  }

  const fields = new Set();
  function stopFields() {
    for (const field of fields) field.stop();
    fields.clear();
  }

  function wireNeural(root) {
    root.querySelectorAll('.neural-field:not([data-wired])').forEach(canvas => {
      canvas.dataset.wired = 'true';
      let settings = {};
      try { settings = JSON.parse(canvas.dataset.neural || '{}'); } catch { settings = {}; }
      const density = settings.density ?? 0.00012;
      const maxNodes = settings.max ?? 70;
      const link = settings.link ?? 132;
      const context = canvas.getContext('2d');
      if (!context) return;

      let nodes = [], width = 0, height = 0, ratio = 1, frame = 0, visible = true, alive = true;

      function layout() {
        const box = canvas.getBoundingClientRect();
        if (!box.width || !box.height) return false;
        ratio = Math.min(2, devicePixelRatio || 1);
        width = box.width; height = box.height;
        canvas.width = Math.round(width * ratio);
        canvas.height = Math.round(height * ratio);
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
        const count = Math.max(18, Math.min(maxNodes, Math.round(width * height * density)));
        nodes = Array.from({length: count}, () => ({
          x: Math.random() * width, y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22, vy: (Math.random() - 0.5) * 0.22,
          r: 1.1 + Math.random() * 1.9,
          hot: Math.random() < 0.18          // a few nodes carry the accent
        }));
        return true;
      }

      function draw(step) {
        context.clearRect(0, 0, width, height);
        for (const node of nodes) {
          if (step) {
            node.x += node.vx; node.y += node.vy;
            if (node.x < 0 || node.x > width) node.vx *= -1;
            if (node.y < 0 || node.y > height) node.vy *= -1;
          }
        }
        // Edges first so nodes sit on top of them.
        context.lineWidth = 1;
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
            const distance = Math.hypot(dx, dy);
            if (distance > link) continue;
            const strength = (1 - distance / link) * 0.42;
            context.strokeStyle = `rgba(91,33,199,${strength.toFixed(3)})`;
            context.beginPath();
            context.moveTo(nodes[i].x, nodes[i].y);
            context.lineTo(nodes[j].x, nodes[j].y);
            context.stroke();
          }
        }
        for (const node of nodes) {
          context.fillStyle = node.hot ? 'rgba(224,32,168,.75)' : 'rgba(91,33,199,.52)';
          context.beginPath();
          context.arc(node.x, node.y, node.r, 0, Math.PI * 2);
          context.fill();
        }
      }

      function tick() {
        if (!alive) return;
        if (visible) draw(true);
        frame = requestAnimationFrame(tick);
      }

      const onResize = () => { if (layout()) draw(false); };
      const seen = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, {threshold: 0});

      const field = {
        stop() {
          alive = false;
          cancelAnimationFrame(frame);
          seen.disconnect();
          removeEventListener('resize', onResize);
        }
      };

      if (!layout()) { requestAnimationFrame(() => { if (layout()) draw(false); }); return; }
      addEventListener('resize', onResize, {passive: true});
      seen.observe(canvas);
      fields.add(field);
      // Reduced motion still gets the picture, just held still.
      if (reduced.matches) draw(false); else tick();
    });
  }

  /* ---------- Sparkline for stat tiles ---------- */
  function sparkline(values) {
    if (!values || values.length < 2) return '';
    const max = Math.max(1, ...values), min = Math.min(...values);
    const span = Math.max(1, max - min);
    const points = values.map((value, index) => [
      index / (values.length - 1) * 96 + 2,
      22 - (value - min) / span * 18
    ]);
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
    const last = points.at(-1);
    return `<svg class="sparkline" viewBox="0 0 100 26" aria-hidden="true"><path d="${line} L${last[0].toFixed(2)},26 L2,26 Z" fill="${C.ordinal5[0]}" opacity=".28"/><path d="${line}" fill="none" stroke="${C.ordinal5[1]}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${last[0].toFixed(2)}" cy="${last[1].toFixed(2)}" r="3.5" fill="${C.accent}" stroke="${C.surface}" stroke-width="2"/></svg>`;
  }

  /* ---------- Trend line with crosshair, peak marker and keyboard parity ---------- */
  function trend(days) {
    if (!days.length) return '<p class="empty">Belum ada lawatan dalam tempoh ini.</p>';
    const id = `trend-${++serial}`;
    const {top, step} = niceTop(Math.max(...days.map(day => day.value)));
    const left = 46, right = 702, floor = 218, ceiling = 22;
    const points = days.map((day, index) => ({...day,
      x: days.length === 1 ? (left + right) / 2 : left + index / (days.length - 1) * (right - left),
      y: floor - day.value / top * (floor - ceiling)
    }));
    const line = points.map((point, index) => `${index ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
    const area = `${line} L${points.at(-1).x.toFixed(2)},${floor} L${points[0].x.toFixed(2)},${floor} Z`;
    const peak = points.reduce((best, point) => point.value > best.value ? point : best, points[0]);
    const last = points.at(-1);

    const grid = [];
    for (let v = 0; v <= top + 1e-9; v += step) {
      const y = floor - v / top * (floor - ceiling);
      grid.push(`<line x1="${left}" x2="${right}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}" class="chart-grid"/><text x="${left - 10}" y="${(y + 4).toFixed(2)}" text-anchor="end" class="chart-axis">${num(v)}</text>`);
    }
    // Dots stay readable up to a month; past that the line and the table carry it.
    const dots = points.length <= 31 ? points.map(point => `<circle class="trend-dot" cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="3.2"/>`).join('') : '';
    const peakMark = Number(peak.value) ? `<circle class="trend-peak" cx="${peak.x.toFixed(2)}" cy="${peak.y.toFixed(2)}" r="5"/><text class="trend-peak-label" x="${peak.x.toFixed(2)}" y="${(peak.y - 13).toFixed(2)}" text-anchor="middle">${num(peak.value)}</text>` : '';

    return `<div class="trend-chart" data-points="${escape(JSON.stringify(points.map(p => ({label: p.label, value: p.value, x: p.x, y: p.y}))))}">` +
      `<div class="chart-heading"><span class="chart-key">Paparan modul / hari</span><span class="chart-peak">Puncak <strong>${num(peak.value)}</strong> · ${escape(peak.label)}</span></div>` +
      `<svg viewBox="0 0 720 258" role="img" aria-label="Trend paparan harian dari ${escape(days[0].label)} hingga ${escape(days.at(-1).label)}. Data penuh tersedia dalam jadual di bawah.">` +
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${C.violet}" stop-opacity=".16"/><stop offset="100%" stop-color="${C.violet}" stop-opacity="0"/></linearGradient></defs>` +
      `${grid.join('')}<line x1="${left}" x2="${right}" y1="${floor}" y2="${floor}" class="chart-axis-line"/>` +
      `<path class="trend-area" d="${area}" fill="url(#${id})"/><path class="trend-line" d="${line}" pathLength="1"/>${dots}${peakMark}` +
      `<circle class="trend-end" cx="${last.x.toFixed(2)}" cy="${last.y.toFixed(2)}" r="4.5"/>` +
      `<line class="chart-guide" x1="0" x2="0" y1="${ceiling}" y2="${floor}" hidden/><circle class="chart-marker" r="5.5" hidden/>` +
      `<text x="${left}" y="248" class="chart-axis">${escape(days[0].label)}</text><text x="${right}" y="248" text-anchor="end" class="chart-axis">${escape(days.at(-1).label)}</text></svg>` +
      `<output class="chart-tooltip" hidden></output>` +
      `<label class="chart-scrubber">Teroka hari <input type="range" min="0" max="${days.length - 1}" value="${days.length - 1}" aria-label="Pilih hari dalam graf"></label>` +
      tableView(days, 'Tarikh', 'Paparan', `Lihat data harian (${days.length} hari)`) + `</div>`;
  }

  /* ---------- Wiring ---------- */
  function wireTrend(root) {
    root.querySelectorAll('.trend-chart:not([data-wired])').forEach(chart => {
      chart.dataset.wired = 'true';
      const points = JSON.parse(chart.dataset.points);
      const svg = chart.querySelector('svg');
      const tooltip = chart.querySelector('output');
      const input = chart.querySelector('input');
      const guide = chart.querySelector('.chart-guide');
      const marker = chart.querySelector('.chart-marker');
      function show(index) {
        const point = points[Math.max(0, Math.min(points.length - 1, index))];
        tooltip.hidden = false;
        tooltip.textContent = `${point.label} · ${num(point.value)} paparan`;
        guide.removeAttribute('hidden');
        marker.removeAttribute('hidden');
        guide.setAttribute('x1', point.x); guide.setAttribute('x2', point.x);
        marker.setAttribute('cx', point.x); marker.setAttribute('cy', point.y);
        input.value = String(points.indexOf(point));
        input.setAttribute('aria-valuetext', tooltip.textContent);
      }
      svg.addEventListener('pointermove', event => {
        const box = svg.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width * 720;
        show(Math.round((x - 46) / (702 - 46) * (points.length - 1)));
      });
      svg.addEventListener('pointerleave', () => {
        tooltip.hidden = true;
        guide.setAttribute('hidden', ''); marker.setAttribute('hidden', '');
      });
      input.addEventListener('input', () => show(Number(input.value)));
      input.addEventListener('focus', () => show(Number(input.value)));
      input.setAttribute('aria-valuetext', `${points.at(-1).label} · ${num(points.at(-1).value)} paparan`);
    });
  }

  function wireColumns(root) {
    root.querySelectorAll('.column-chart:not([data-wired])').forEach(chart => {
      chart.dataset.wired = 'true';
      const tooltip = chart.querySelector('output');
      const clear = () => { tooltip.hidden = true; chart.querySelectorAll('.column-group').forEach(g => g.classList.remove('is-active')); };
      chart.querySelectorAll('.column-hit').forEach(hit => {
        const group = hit.closest('.column-group');
        const show = () => {
          clear();
          group.classList.add('is-active');
          tooltip.hidden = false;
          tooltip.textContent = `${hit.dataset.label} · ${hit.dataset.value} ${hit.dataset.unit}`;
        };
        hit.addEventListener('pointerenter', show);
        hit.addEventListener('focus', show);
        hit.addEventListener('blur', clear);
      });
      chart.querySelector('svg').addEventListener('pointerleave', clear);
    });
  }

  /* The final value is written first and the clock starts inside the first frame, so a
     throttled or never-running rAF (background tab, reduced motion, capture) still leaves
     the correct number in the DOM rather than a frozen partial count. */
  function countUp(node) {
    const target = Number(node.dataset.count);
    const suffix = node.dataset.suffix ?? '';
    const settle = () => { node.textContent = num(target) + suffix; };
    if (!Number.isFinite(target)) return;
    settle();
    if (reduced.matches) return;
    // Wall-clock progress plus a timer backstop: a throttled or stalled rAF can no longer
    // strand a partial number on screen, because neither correctness path depends on frames.
    const duration = 900, startedAt = Date.now();
    let frame = 0;
    const tick = () => {
      const progress = Math.min(1, (Date.now() - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      node.textContent = num(Math.round(target * eased)) + suffix;
      if (progress < 1) frame = requestAnimationFrame(tick); else settle();
    };
    frame = requestAnimationFrame(tick);
    const backstop = setTimeout(() => { cancelAnimationFrame(frame); settle(); }, duration + 250);
    running.add({cancel: () => { cancelAnimationFrame(frame); clearTimeout(backstop); settle(); }});
  }

  function enhance(root) {
    // Disconnected views never keep observers or animations alive.
    for (const observer of observers) { observer.disconnect(); observers.delete(observer); }
    for (const animation of running) { animation.cancel(); running.delete(animation); }
    stopFields();
    wireTrend(root);
    wireColumns(root);
    wireNeural(root);

    const counters = root.querySelectorAll('[data-count]:not([data-counted])');
    const targets = root.querySelectorAll('.stat,.bar-fill,.trend-line,.trend-area,.trend-dot,.trend-peak,.trend-end,.donut-wrap,.column-mark,.column-value,.intro-grid,.admin-welcome,.training-metric,.chart-card-title,.journey-step,.journey-progress,.org-node,.org-dept');
    if (reduced.matches) {
      counters.forEach(node => { node.dataset.counted = 'true'; countUp(node); });
      return;
    }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const node = entry.target;
        observer.unobserve(node);
        if (node.dataset.count !== undefined) { node.dataset.counted = 'true'; countUp(node); continue; }
        if (node.dataset.animated) continue;
        node.dataset.animated = 'true';
        const order = node.parentElement ? [...node.parentElement.children].indexOf(node) : 0;
        let frames = [{opacity:0, transform:'translateY(12px)'}, {opacity:1, transform:'translateY(0)'}];
        let duration = 650, delay = 0;
        if (node.classList.contains('stat') || node.classList.contains('journey-step') || node.classList.contains('org-node') || node.classList.contains('org-dept')) delay = order * 85;
        if (node.classList.contains('journey-progress')) { frames = [{transform:'scaleX(0)'}, {transform:'scaleX(1)'}]; duration = 1400; }
        if (node.classList.contains('bar-fill')) frames = [{transform:'scaleX(0)'}, {transform:'scaleX(1)'}];
        if (node.classList.contains('column-mark')) { frames = [{transform:'scaleY(0)'}, {transform:'scaleY(1)'}]; duration = 720; delay = order * 10; }
        if (node.classList.contains('column-value')) { frames = [{opacity:0}, {opacity:1}]; delay = 420; }
        if (node.classList.contains('trend-line')) { frames = [{strokeDashoffset:1}, {strokeDashoffset:0}]; duration = 1100; }
        if (node.classList.contains('trend-area')) frames = [{opacity:0}, {opacity:1}];
        if (node.classList.contains('trend-dot') || node.classList.contains('trend-peak') || node.classList.contains('trend-end')) { frames = [{opacity:0}, {opacity:1}]; delay = 650; }
        if (node.classList.contains('donut-wrap')) frames = [{opacity:0, transform:'scale(.91) rotate(-12deg)'}, {opacity:1, transform:'scale(1) rotate(0)'}];
        const animation = node.animate(frames, {duration, easing:'cubic-bezier(.22,1,.36,1)', delay});
        running.add(animation);
        animation.finished.then(() => running.delete(animation)).catch(() => {});
      }
    }, {threshold:.12});
    observers.add(observer);
    counters.forEach(node => observer.observe(node));
    targets.forEach(node => observer.observe(node));
  }

  reduced.addEventListener('change', () => {
    if (!reduced.matches) return;
    for (const animation of running) animation.cancel();
    running.clear();
    for (const observer of observers) observer.disconnect();
    observers.clear();
  });

  return {composition, distribution, donutChart, columns, bars, stages, neural, sparkline, trend, enhance, palette: C, num};
})();
