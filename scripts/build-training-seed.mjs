/* Turns the seed modules in content.js into one importable SQL file, so a cPanel install
   without a terminal can create the table and load the starting catalogue in one paste.
   Run: node scripts/build-training-seed.mjs */
import {readFileSync, writeFileSync} from 'node:fs';
import vm from 'node:vm';

const root = new URL('..', import.meta.url);
const read = name => readFileSync(new URL(name, root), 'utf8');

const context = {window: {}};
vm.createContext(context);
vm.runInContext(read('content.js'), context);
const modules = context.window.CAAIT.training;

// MySQL string literal: escape backslash first, then the quote.
const quote = value => "'" + String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

const schema = read('database/schema.sql');
const start = schema.indexOf('CREATE TABLE IF NOT EXISTS training');
// Slice to the statement terminator, so the table options travel with the DDL.
const table = schema.slice(start, schema.indexOf(';', start) + 1);

const columns = 'slug,title,tag,description,objectives,requirements,steps,prompt,practice,outcome,sources,position';
const rows = modules.map((module, index) => {
  const values = [
    module.id, module.title, module.tag, module.description,
    module.objectives.join('\n'),
    module.requirements,
    module.steps.map(([title, body]) => `${title} :: ${body}`).join('\n'),
    module.prompt, module.practice, module.outcome,
    module.sources.map(([name, url]) => `${name} :: ${url}`).join('\n')
  ].map(quote).join(',');
  // Re-importing must never overwrite edits an admin has since made.
  return `INSERT INTO training(${columns}) VALUES (${values},${index + 1}) ON DUPLICATE KEY UPDATE slug=slug;`;
});

const out = [
  '-- CAAiT: jadual modul latihan dan kandungan permulaan.',
  '-- Import sekali melalui phpMyAdmin pada database CAAiT.',
  '-- Selamat diimport berulang kali: modul yang sudah wujud tidak ditulis ganti.',
  '',
  '-- Pastikan aksara khas (petikan melengkung, sengkang panjang) selamat semasa disalin.',
  'SET NAMES utf8mb4;',
  '',
  table,
  '',
  ...rows,
  ''
].join('\n');

writeFileSync(new URL('database/training-seed.sql', root), out);
console.log(`database/training-seed.sql ditulis — ${modules.length} modul, ${out.length} bait`);
