/* Emits an importable INSERT for a single seed module, for when only part of the
   catalogue is missing. Run: node scripts/build-one-module-sql.mjs github */
import {readFileSync, writeFileSync} from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const slug = process.argv[2];
if (!slug) { console.error('Usage: node scripts/build-one-module-sql.mjs <slug>'); process.exit(1); }

const context = {window: {}};
vm.createContext(context);
vm.runInContext(readFileSync(new URL('content.js', root), 'utf8'), context);
const module = context.window.CAAIT.training.find(t => t.id === slug);
if (!module) { console.error('Modul tidak dijumpai: ' + slug); process.exit(1); }

const quote = value => "'" + String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const position = context.window.CAAIT.training.indexOf(module) + 1;

const values = [
  module.id, module.title, module.tag, module.description,
  module.objectives.join('\n'),
  module.requirements,
  module.steps.map(([title, body]) => `${title} :: ${body}`).join('\n'),
  module.prompt, module.practice, module.outcome,
  module.sources.map(([name, url]) => `${name} :: ${url}`).join('\n')
].map(quote).join(',');

const columns = 'slug,title,tag,description,objectives,requirements,steps,prompt,practice,outcome,sources,position';
const out = [
  '-- CAAiT: satu modul latihan sahaja.',
  '-- Selamat dijalankan berulang kali: modul yang sudah wujud tidak ditulis ganti.',
  'SET NAMES utf8mb4;',
  '',
  `INSERT INTO training(${columns}) VALUES (${values},${position}) ON DUPLICATE KEY UPDATE slug=slug;`,
  ''
].join('\n');

const file = new URL(`database/training-${slug}.sql`, root);
writeFileSync(file, out);
console.log(`database/training-${slug}.sql ditulis — ${out.length} bait`);
