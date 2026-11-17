/* Guards the two things a reviewer cannot eyeball on every change:
   that the dashboard numbers still match the institutional record, and that the chart
   engine renders those numbers without inventing or dropping any. Run: node scripts/test-content.mjs */
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
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
  // The ban covers the source *document*: the deck and its filename. "MAIC" on its own is the
  // consortium the centre actually sits on, and is published content in its own right.
  // The escape below is deliberate: an earlier revision held literal backspace characters here,
  // which made the pattern unmatchable and left this whole check inert.
  const banned = /(\bslide\b|MAIC\s*MEETING|\.pptx)/i;
  for (const entry of data.programs) {
    for (const field of ['title', 'date', 'text', 'year', 'note']) {
      assert.ok(!banned.test(String(entry[field] ?? '')), entry.title + '.' + field + ' still names a source');
    }
    for (const block of entry.details ?? []) {
      assert.ok(!banned.test(block.heading + ' ' + block.items.join(' ')),
        entry.title + ' carries a source reference in its detail blocks');
    }
    for (const group of entry.gallery ?? []) {
      assert.ok(!banned.test(group.label + ' ' + group.items.map(i => i.caption).join(' ')),
        entry.title + ' carries a source reference in a caption');
    }
  }
  for (const [title, date, body] of data.roadmap) {
    assert.ok(!banned.test(title + ' ' + date + ' ' + body), 'roadmap stage ' + title + ' still names a source');
  }
  assert.ok(!banned.test(data.intro), 'intro still names a source');
  assert.ok(!banned.test(data.forewords.flatMap(f => f.paragraphs).join(' ')), 'a foreword still names a source');
  assert.ok(!banned.test(data.appointments.roles.flat().join(' ')), 'an appointment still names a source');
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

check('Every photograph a record shows exists on disk and carries a caption', () => {
  const seen = new Set();
  let shots = 0;
  for (const entry of data.programs) {
    for (const group of entry.gallery ?? []) {
      assert.ok(group.items.length, entry.title + ' has an empty photograph group');
      for (const item of group.items) {
        assert.ok(existsSync(new URL('assets/' + item.src, root)), 'missing file: assets/' + item.src);
        assert.ok(item.caption && item.caption.trim().length > 8, item.src + ' needs a real caption');
        assert.ok(!seen.has(item.src), item.src + ' is shown twice');
        seen.add(item.src);
        shots++;
      }
    }
    // A single-location record must not carry a redundant group heading.
    if ((entry.gallery ?? []).length === 1) assert.equal(entry.gallery[0].label, '', entry.title + ' needs no group label');
  }
  assert.ok(shots >= 20, 'the photographic record is present');
  for (const entry of data.programs) {
    if (entry.image) assert.ok(existsSync(new URL('assets/' + entry.image, root)), 'missing lead image: ' + entry.image);
  }
});

check('Material held off-site is linked over https and nowhere else', () => {
  const links = data.programs.flatMap(p => p.links ?? []);
  // Five, not six: the AI Awareness livestream URL had expired, so the button was removed
  // rather than left pointing at a dead page.
  assert.ok(links.length >= 5, 'the recorded off-site material is linked');
  for (const link of links) {
    assert.match(link.url, /^https:\/\//, link.label + ' must be https');
    assert.ok(link.label && !/^https?:/i.test(link.label), 'a link must read as a label, not a bare URL');
  }
});

check('Each foreword ships its paragraphs, portrait and signature, in order of office', () => {
  // The running order is the order of office, and it is the one thing a reader will notice
  // if it slips, so it is asserted rather than left to the order of the array literal.
  // Spread into a host array: values cross a vm realm and carry its Array prototype.
  assert.deepEqual([...data.forewords.map(f => f.role)],
    ['Pengarah', 'Timbalan Pengarah (Akademik)', 'Ketua Pusat CAAiT']);
  const signatories = data.forewords.map(f => f.name).join(' | ');
  assert.match(signatories, /Salmi.*Norman.*Marlina/);
  for (const f of data.forewords) {
    assert.ok(f.paragraphs.length >= 5, f.role + ' lost part of its text');
    for (const p of f.paragraphs) assert.ok(p.trim().length > 40, f.role + ' has a truncated paragraph');
    assert.ok(existsSync(new URL('assets/' + f.portrait, root)), 'missing portrait: ' + f.portrait);
    assert.ok(['photo', 'cutout'].includes(f.kind), f.role + ' needs a known portrait kind');
    // Without intrinsic dimensions the lazy-loaded portraits collapse and the page jumps
    // as each one arrives — very visible with three stacked forewords.
    assert.ok(Array.isArray(f.size) && f.size.length === 2 && f.size.every(n => n > 0),
      f.role + ' portrait needs intrinsic width and height');
    // The name is its own field now, so the honorific can be marked up separately; the
    // signature holds only the lines beneath it.
    assert.ok(f.name && f.name.trim(), f.role + ' needs a name');
    assert.ok(f.signature.length >= 2, f.role + ' needs a full signature block');
    assert.ok(!/\bb\.c\.n\b/i.test(f.signature.join(' ')),
      f.role + ' must not bake a post-nominal into the signature lines');
    if (f.honorific !== undefined) {
      assert.equal(f.honorific, f.honorific.toUpperCase(), 'a post-nominal is set in capitals');
    }
    // Greeting and closing are genuinely optional — only one signatory wrote both.
    for (const field of ['greeting', 'closing']) {
      if (f[field] !== undefined) assert.ok(f[field].trim(), f.role + ' has an empty ' + field);
    }
  }
  // Only an alpha cut-out gets the floor treatment; a flat photograph must not claim it.
  const cutouts = data.forewords.filter(f => f.kind === 'cutout');
  assert.equal(cutouts.length, 1);
  assert.match(cutouts[0].portrait, /\.png$/);
});

check('Every foreword route is whitelisted by the API', () => {
  // Each foreword is its own route, so its slug is also an analytics module id. A slug that
  // is missing from $modules is rejected with 422 at runtime — silently, since analytics is
  // deliberately fire-and-forget. Cheaper to catch here than to notice months of lost views.
  const php = read('api/index.php');
  const line = php.match(/^\$modules=\[(.*?)\];/m);
  assert.ok(line, 'could not find $modules in api/index.php');
  const whitelisted = [...line[1].matchAll(/'([^']+)'/g)].map(m => m[1]);
  for (const f of data.forewords) {
    assert.ok(whitelisted.includes(f.slug), f.slug + ' is missing from $modules in api/index.php');
  }
  const slugs = [...data.forewords.map(f => f.slug)];
  assert.equal(new Set(slugs).size, slugs.length, 'two forewords share a slug');
});

check('A post-nominal is never detached or recoloured by a descendant rule', () => {
  // `.foreword-who span` and `.org-id span` style the role line under a name. Written as
  // descendant selectors they also hit the .honorific inside the name itself, which made
  // B.C.N a purple block on its own line instead of staying joined to the name. The child
  // combinator is what keeps them apart, so it is pinned here.
  const css = read('analytics.css');
  // Every block that puts a sub-label under a name and may also hold a .honorific inside it.
  for (const parent of ['.foreword-who', '.foreword-sign', '.org-id']) {
    assert.ok(css.includes(parent + '>span{'),
      parent + ' must use the child combinator so it cannot swallow .honorific');
    assert.ok(!new RegExp(parent.replace('.', '\\.') + '\\s+span\\s*\\{').test(css),
      parent + ' still has a descendant span rule that would catch .honorific');
  }
  const rule = css.match(/\.honorific\{([^}]*)\}/);
  assert.ok(rule, '.honorific rule is missing');
  assert.match(rule[1], /display:inline/, 'the post-nominal must stay on the name’s line');
  assert.match(rule[1], /color:inherit/, 'the post-nominal must take the name’s colour');
  assert.ok(!/color:var\(--c-violet\)/.test(rule[1]), 'the post-nominal must not be purple');
  // <strong> is 700 by default, so anything lighter reads as thinner than the name it follows.
  assert.match(rule[1], /font-weight:700/, 'the post-nominal must be as bold as the name');
});

check('Consortium appointments name a role, a person and a post', () => {
  const a = data.appointments;
  assert.equal(a.roles.length, 2);
  assert.ok(existsSync(new URL('assets/' + a.banner, root)), 'missing banner: ' + a.banner);
  for (const row of a.roles) {
    // role, person, post — plus an optional fourth slot for a post-nominal.
    assert.ok(row.length === 3 || row.length === 4, 'an appointment row has the wrong shape');
    for (const cell of row) assert.ok(cell && cell.trim(), 'an appointment field is blank');
    if (row.length === 4) assert.equal(row[3], row[3].toUpperCase(), 'a post-nominal is set in capitals');
  }
  // Each listed person must also be traceable in the organisation chain or be the centre head.
  assert.match(a.roles.map(r => r[1]).join(' '), /Salmi/);
  assert.match(a.roles.map(r => r[1]).join(' '), /Marlina/);
});

check('Training marks resolve for every seeded module', () => {
  const marks = {canva: ['training/canva.jpg', 'training/canva-ai.jpg'], bob: ['training/ibm-bob.png'], github: ['training/github.png']};
  for (const module of data.training) {
    assert.ok(marks[module.id], module.id + ' has no product mark');
    for (const src of marks[module.id]) assert.ok(existsSync(new URL('assets/' + src, root)), 'missing mark: ' + src);
  }
});

console.log(JSON.stringify({passed: results.length, results}, null, 2));
