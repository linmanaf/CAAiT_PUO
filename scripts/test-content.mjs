/* Guards the two things a reviewer cannot eyeball on every change:
   that the dashboard numbers still match the institutional record, and that the chart
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

check('Records: 12 entries, each with provenance, a date and a known status', () => {
  assert.equal(data.programs.length, 12);
  for (const p of data.programs) {
    assert.ok([5, 6, 7].includes(p.ref), `${p.title} keeps its internal provenance ref`);
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

check('Reported reach matches the three recorded figures (400 + 2400 + 400)', () => {
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

check('Roadmap keeps six stages; undated ones carry no date at all', () => {
  assert.equal(data.roadmap.length, 6);
  assert.match(data.roadmap[0][1], /Ogos 2024/);
  assert.equal(data.roadmap.filter(([, date]) => String(date).trim() === '').length, 4);
  assert.equal(data.roadmap.filter(([, date]) => /tidak dinyatakan/i.test(date)).length, 0);
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

check('Journey keeps its order and omits dates it does not have', () => {
  const html = viz.stages(data.roadmap.map(([title, date, body]) => ({title, date, body})));
  assert.equal([...html.matchAll(/class="journey-step"/g)].length, 6);
  assert.equal([...html.matchAll(/class="stage-date"/g)].length, 2, 'only the two dated stages render a date');
  assert.ok(html.indexOf('Penubuhan') < html.indexOf('Hala tuju'), 'stages stay in recorded order');
});

check('No source vocabulary leaks into anything a visitor can read', () => {
  const banned = /(slide|MAIC)/i;
  for (const entry of data.programs) {
    for (const field of ['title', 'date', 'text', 'year']) {
      assert.ok(!banned.test(String(entry[field] ?? '')), entry.title + '.' + field + ' still names a source');
    }
  }
  for (const [title, date, body] of data.roadmap) {
    assert.ok(!banned.test(title + ' ' + date + ' ' + body), 'roadmap stage ' + title + ' still names a source');
  }
  assert.ok(!banned.test(data.intro), 'intro still names a source');
  const rendered = [
    viz.composition(data.programs),
    viz.stages(data.roadmap.map(([title, date, body]) => ({title, date, body}))),
    viz.columns([{label: '2024', value: 2}]),
    viz.donutChart([{label: 'Direkodkan', value: 10}], 'entri rekod')
  ].join(' ');
  assert.ok(!banned.test(rendered), 'a rendered view still prints a source reference');
});

check('Decorative neural field is inert and carries no meaning', () => {
  const field = viz.neural({max: 40});
  assert.ok(field.includes('aria-hidden=' + String.fromCharCode(34) + 'true' + String.fromCharCode(34)), 'hidden from assistive tech');
  assert.ok(!/ on[a-z]+=/i.test(field), 'no inline event handler');
});

check('Organisation chain holds five roles, each with a portrait', () => {
  assert.equal(data.organization.length, 5);
  const names = data.organization.map(r => r[0]).join(' | ');
  assert.ok(!/Azman|Ainie/i.test(names), 'removed roles must not come back');
  assert.match(data.organization[3][0], /Marlina/, 'Marlina sits fourth, under Norman');
  assert.match(data.organization[4][0], /Akhyar/, 'Akhyar sits fifth, under Marlina');
  for (const [name, role, photo] of data.organization) {
    assert.ok(name && role && photo, name + ' is missing a field');
  }
  assert.equal(data.coordinators.length, 7);
});

console.log(JSON.stringify({passed: results.length, results}, null, 2));
