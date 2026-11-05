/* Emits a seed module as a single-line, pure-ASCII INSERT.

   Every value is hex-encoded, so the statement survives any copy-paste path: no quotes to
   unbalance, no newlines to truncate a string, no characters a connection charset can mangle.
   The project already uses this technique in export-admin.php for the same reason.

   Run: node scripts/build-hex-module-sql.mjs github */
import {readFileSync, writeFileSync} from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const slug = process.argv[2];
if (!slug) { console.error('Usage: node scripts/build-hex-module-sql.mjs <slug>'); process.exit(1); }

const context = {window: {}};
vm.createContext(context);
vm.runInContext(readFileSync(new URL('content.js', root), 'utf8'), context);
const all = context.window.CAAIT.training;
const module = all.find(t => t.id === slug);
if (!module) { console.error('Modul tidak dijumpai: ' + slug); process.exit(1); }

const hex = value => 'CONVERT(0x' + Buffer.from(String(value), 'utf8').toString('hex') + ' USING utf8mb4)';

const values = [
  module.id, module.title, module.tag, module.description,
  module.objectives.join('\n'),
  module.requirements,
  module.steps.map(([title, body]) => `${title} :: ${body}`).join('\n'),
  module.prompt, module.practice, module.outcome,
  module.sources.map(([name, url]) => `${name} :: ${url}`).join('\n')
].map(hex).join(',');

const columns = 'slug,title,tag,description,objectives,requirements,steps,prompt,practice,outcome,sources,position';
const out = [
  '-- CAAiT: modul ' + slug + ', dikodkan hex supaya selamat disalin.',
  '-- Jalankan kesemuanya sekali gus. Baris terakhir memaparkan hasilnya.',
  '',
  `INSERT INTO training(${columns}) VALUES (${values},${all.indexOf(module) + 1}) ON DUPLICATE KEY UPDATE slug=slug;`,
  '',
  'SELECT slug, title, CHAR_LENGTH(steps) AS panjang_steps FROM training ORDER BY position;',
  ''
].join('\n');

writeFileSync(new URL(`database/training-${slug}-hex.sql`, root), out);
console.log(`database/training-${slug}-hex.sql ditulis — ${out.length} bait, INSERT satu baris`);
