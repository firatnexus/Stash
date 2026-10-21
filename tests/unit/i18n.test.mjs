import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DICTS, t, setLang } from '../../www/src/core/i18n.js';

const SRC = new URL('../../www/src/', import.meta.url).pathname;
const files = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? files(join(dir, n)) : n.endsWith('.js') ? [join(dir, n)] : []));
const code = files(SRC).map((f) => readFileSync(f, 'utf8')).join('\n');

const DYNAMIC = {
  autoBy_: ['keyword', 'collection', 'creator', 'ai'],
  backupErr_: ['invalid', 'wrong_app', 'newer_schema'],
  color_: ['coral', 'amber', 'green', 'teal', 'blue', 'violet', 'rose', 'slate'],
  err_: ['empty_name', 'duplicate_name', 'not_found', 'generic'],
  exportErr_: ['not_zip', 'zip64', 'corrupt', 'no_inflate', 'unsupported_method', 'no_saved_file', 'generic'],
  exportStep: ['1', '2', '3', '4', '5'],
  kind_: ['reel', 'post', 'tv', 'share'],
  source_: ['manual', 'share', 'export', 'backup'],
  theme_: ['system', 'light', 'dark'],
  urlErr_: ['empty', 'not_url', 'not_instagram', 'unsupported'],
  works: ['1', '2', '3', '4', '5'],
};

test('English and Turkish have exactly the same keys', () => {
  const en = Object.keys(DICTS.en).sort();
  const tr = Object.keys(DICTS.tr).sort();
  assert.deepEqual(en.filter((k) => !tr.includes(k)), [], 'missing in tr');
  assert.deepEqual(tr.filter((k) => !en.includes(k)), [], 'missing in en');
});

test('every literal t()/tf() key used in the code exists', () => {
  const used = new Set();
  for (const m of code.matchAll(/\bt[f]?\(\s*'([A-Za-z0-9_]+)'\s*[,)]/g)) used.add(m[1]);
  for (const m of code.matchAll(/\btf\([^)]*?,\s*'([A-Za-z0-9_]+)'/g)) used.add(m[1]);
  const missing = [...used].filter((k) => !(k in DICTS.en));
  assert.deepEqual(missing, []);
  assert.ok(used.size > 100, `found ${used.size} keys`);
});

test('every dynamic key family is complete', () => {
  for (const [prefix, suffixes] of Object.entries(DYNAMIC)) {
    for (const s of suffixes) assert.ok(prefix + s in DICTS.en, prefix + s);
  }
});

test('placeholders match between languages', () => {
  const ph = (s) => [...new Set([...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort().join(',');
  for (const k of Object.keys(DICTS.en)) assert.equal(ph(DICTS.tr[k]), ph(DICTS.en[k]), k);
});

test('interpolation and plurals', () => {
  setLang('en');
  const k = Object.keys(DICTS.en).find((x) => /\|/.test(DICTS.en[x]) && /\{n\}/.test(DICTS.en[x]));
  assert.ok(k, 'has a plural key');
  assert.notEqual(t(k, { n: 1 }), t(k, { n: 2 }));
  assert.match(t(k, { n: 2 }), /2/);
  setLang('tr');
  assert.match(t(k, { n: 2 }), /2/);
});
