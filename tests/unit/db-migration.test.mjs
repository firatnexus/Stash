// Upgrading from builds that stored data in the 'reels-organizer' database.
// Runs in its own process (node:test isolates files), so the module-level
// connection in db.js starts closed.
import 'fake-indexeddb/auto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DB_NAME, LEGACY_DB_NAMES, closeDb, getAll, get, put } from '../../www/src/storage/db.js';

const LEGACY = LEGACY_DB_NAMES[0];

function seedLegacy({ reels = [], categories = [], settings = [] }) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(LEGACY, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      const s = db.createObjectStore('reels', { keyPath: 'id' });
      s.createIndex('key', 'key', { unique: true });
      s.createIndex('addedAt', 'addedAt');
      s.createIndex('categoryId', 'categoryId');
      db.createObjectStore('categories', { keyPath: 'id' });
      db.createObjectStore('settings', { keyPath: 'key' });
    };
    req.onsuccess = () => {
      const db = req.result;
      const t = db.transaction(['reels', 'categories', 'settings'], 'readwrite');
      reels.forEach((r) => t.objectStore('reels').put(r));
      categories.forEach((c) => t.objectStore('categories').put(c));
      settings.forEach((x) => t.objectStore('settings').put(x));
      t.oncomplete = () => { db.close(); resolve(); };
      t.onerror = () => reject(t.error);
    };
    req.onerror = () => reject(req.error);
  });
}

const dbNames = async () => (await indexedDB.databases()).map((d) => d.name).sort();
const wipe = async () => {
  await closeDb();
  for (const n of [DB_NAME, LEGACY]) await new Promise((r) => { const d = indexedDB.deleteDatabase(n); d.onsuccess = d.onerror = r; });
};

test('the new database is called stash', () => {
  assert.equal(DB_NAME, 'stash');
});

test('a fresh install creates only the stash database', async () => {
  await wipe();
  assert.deepEqual(await getAll('reels'), []);
  assert.deepEqual(await dbNames(), ['stash']);
});

test('data from the legacy reels-organizer database is moved over and the old one removed', async () => {
  await wipe();
  await seedLegacy({
    reels: [{ id: 'r1', key: 'AAA', addedAt: 1, categoryId: 'c1' }, { id: 'r2', key: 'BBB', addedAt: 2, categoryId: null }],
    categories: [{ id: 'c1', name: 'Recipes' }],
    settings: [{ key: 'theme', value: 'dark' }],
  });
  assert.equal((await getAll('reels')).length, 2);
  assert.equal((await get('categories', 'c1')).name, 'Recipes');
  assert.equal((await get('settings', 'theme')).value, 'dark');
  assert.deepEqual(await dbNames(), ['stash']);

  // a second launch does not bring anything back
  await closeDb();
  assert.equal((await getAll('reels')).length, 2);
});

test('an interrupted migration resumes without overwriting newer data', async () => {
  await wipe();
  // new database already has a reel with the same link and a changed setting
  await put('reels', { id: 'new', key: 'AAA', addedAt: 9, categoryId: null });
  await put('settings', { key: 'theme', value: 'light' });
  await closeDb();
  await seedLegacy({
    reels: [{ id: 'r1', key: 'AAA', addedAt: 1 }, { id: 'r2', key: 'BBB', addedAt: 2 }],
    settings: [{ key: 'theme', value: 'dark' }, { key: 'lang', value: 'tr' }],
  });
  const reels = (await getAll('reels')).map((r) => r.id).sort();
  assert.deepEqual(reels, ['new', 'r2']);
  assert.equal((await get('settings', 'theme')).value, 'light');
  assert.equal((await get('settings', 'lang')).value, 'tr');
  assert.deepEqual(await dbNames(), ['stash']);
});
