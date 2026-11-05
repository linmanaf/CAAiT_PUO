/* Guards the two things a reviewer cannot eyeball on every change:
   that the dashboard numbers still match CAAIT (MAIC MEETING), and that the chart
   engine renders those numbers without inventing or dropping any. Run: node scripts/test-content.mjs */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');

// Minimal browser surface: the chart engine only needs these at load time.
const context = {window: {}, matchMedia: () => ({matches: false, addEventListener() {}}), Intl, Math, JSON, performance, Date, console};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(read('content.js'), context);
vm.runInContext(read('visuals.js'), context);
const {CAAIT: data, CAAITVisuals: viz} = context.window;

const results = [];
const check = (name, fn) => { fn(); results.push(name); };

check('Slide records: 12 entries, every one sourced to slides 5–7 with a known status', () => {
  assert.equal(data.programs.length, 12);
  for (const p of data.programs) {
    assert.ok([5, 6, 7].includes(p.slide), `${p.title} cites slide ${p.slide}`);
    assert.ok(['reported', 'mixed', 'future'].includes(p.status), `${p.title} status`);
    assert.ok(p.title && p.date && p.text, `${p.title} missing a field`);
  }
});

check('Year buckets partition the 12 entries exactly once each', () => {
  const buckets = ['2024', '2025', '2025–2026', '2026', 'Tiada tarikh'];
  const counts = Object.fromEntries(buckets.map(y => [y, data.programs.filter(p => p.year === y).length]));
  assert.deepEqual(counts, {'2024': 2, '2025': 5, '2025–2026': 2, '2026': 2, 'Tiada tarikh': 1});
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), data.programs.length);
  for (const p of data.programs) assert.ok(buckets.includes(p.year), `${p.title} has an unknown year bucket`);
});

check('Reported reach matches the three slide-5 figures (400 + 2400 + 400)', () => {
  const withAudience = data.programs.filter(p => p.audience != null);
  assert.equal(withAudience.length, 3);
  // Spread back into a host array: values cross a vm realm and carry its Array prototype.
  assert.deepEqual([...withAudience.map(p => p.audience)].sort((a, b) => a - b), [400, 400, 2400]);
  assert.equal(withAudience.reduce((sum, p) => sum + p.audience, 0), 3200);
  for (const p of withAudience) assert.match(p.audienceLabel, /\+\+$/, `${p.title} must keep the "++" qualifier`);
});

check('Status split matches the donut: 10 reported, 1 LOI/planned, 1 future', () => {
  const by = key => data.programs.filter(p => p.status === key).length;
  assert.deepEqual([by('reported'), by('mixed'), by('future')], [10, 1, 1]);
});

check('Roadmap keeps six slide-4 stages, only the first one dated', () => {
  assert.equal(data.roadmap.length, 6);
  assert.match(data.roadmap[0][1], /Ogos 2024/);
  assert.equal(data.roadmap.filter(([, date]) => /tidak dinyatakan/i.test(date)).length, 4);
});

check('Columns render every value, the clean axis top and the accent on the peak', () => {
  const items = [{label: '2024', value: 2}, {label: '2025', value: 5}, {label: 'Tiada tarikh', value: 1}];
  const svg = viz.columns(items, {unit: 'entri', emphasis: '2025'});
  for (const item of items) assert.ok(svg.includes(`>${item.value}</text>`), `value ${item.value} is drawn`);
  assert.ok(svg.includes('>8</text>'), 'axis tops out on a clean 8');
  assert.ok(svg.includes(viz.palette.accent), 'peak wears the accent');
  assert.ok(svg.includes('<table>'), 'a table view exists');
  assert.ok(svg.includes('tabindex="0"'), 'bands are keyboard reachable');
});

check('Donut segments leave a surface gap and total the parts', () => {
  const html = viz.donutChart([{label: 'A', value: 10}, {label: 'B', value: 1}, {label: 'C', value: 1}], 'entri');
  assert.ok(html.includes('data-count="12"'), 'centre figure is the sum');
  assert.ok(html.includes('>12</strong>'), 'the final number is in the DOM before any animation');
  const drawn = [...html.matchAll(/stroke-dasharray="([\d.]+) /g)].map(m => Number(m[1]));
  assert.equal(drawn.length, 3);
  assert.ok(drawn.reduce((a, b) => a + b, 0) < 100, 'segments are trimmed by the 2px gap');
});

check('Zero data degrades to an honest empty state, never a fake chart', () => {
  assert.match(viz.columns([]), /Belum ada data/);
  assert.match(viz.bars([]), /Belum ada data/);
  assert.match(viz.trend([]), /Belum ada lawatan/);
  const empty = viz.donutChart([{label: 'A', value: 0}], 'maklum balas');
  assert.ok(!empty.includes('stroke-dasharray'), 'no segment is drawn for zero');
});

check('Trend plots each day, marks the peak and ships a table twin', () => {
  const days = [{label: '2026-01-01', value: 3}, {label: '2026-01-02', value: 9}, {label: '2026-01-03', value: 4}];
  const html = viz.trend(days);
  assert.equal([...html.matchAll(/class="trend-dot"/g)].length, 3);
  assert.ok(html.includes('class="trend-peak"'), 'peak is marked');
  assert.ok(html.includes('>9</text>'), 'peak is direct-labelled');
  for (const day of days) assert.ok(html.includes(`<td>${day.label}</td>`), `${day.label} is in the table`);
});

check('Untrusted text is escaped everywhere it reaches the DOM', () => {
  const nasty = '<img src=x onerror="alert(1)">';
  for (const html of [viz.columns([{label: nasty, value: 1}]), viz.bars([{label: nasty, value: 1}]),
                      viz.donutChart([{label: nasty, value: 1}], nasty),
                      viz.trend([{label: nasty, value: 1}]),
                      viz.stages([{title: nasty, date: nasty, body: nasty}])]) {
    assert.ok(!html.includes('onerror="'), 'no raw event handler survives');
    assert.ok(html.includes('&lt;img'), 'the tag is escaped');
  }
});

check('Stage ladder keeps slide order and marks undated stages as undated', () => {
  const html = viz.stages(data.roadmap.map(([title, date, body]) => ({title, date, body})));
  assert.equal([...html.matchAll(/class="stage"/g)].length, 6);
  assert.equal([...html.matchAll(/is-undated/g)].length, 4);
  assert.ok(html.indexOf('Penubuhan') < html.indexOf('Hala tuju'), 'stages stay in slide order');
});

console.log(JSON.stringify({passed: results.length, results}, null, 2));
