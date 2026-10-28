// Storage + app-logic tests against a real IndexedDB implementation (fake-indexeddb).
import 'fake-indexeddb/auto';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import * as store from '../../www/src/core/store.js';
import * as repo from '../../www/src/storage/repo.js';
import { closeDb } from '../../www/src/storage/db.js';
import { validateBackup, BackupError, backupFileName } from '../../www/src/io/backup.js';

const REEL = 'https://www.instagram.com/reel/C9xYz12AbcD/';

beforeEach(async () => {
  await store.wipeAll();
});

test('workflow: create category → add Reel → auto assign → search', async () => {
  await store.load();
  const cat = await store.createCategory({ name: 'Recipes', keywords: ['pasta', 'tarif'] });
  const r = await store.addFromText({ text: REEL + '?igsh=xyz', caption: 'Creamy pasta in 10 minutes' });
  assert.equal(r.added.length, 1);
  const reel = r.added[0];
  assert.equal(reel.url, REEL);
  assert.equal(reel.categoryId, cat.id);
  assert.equal(reel.categorySource, 'keyword');
  assert.equal(reel.needsReview, false);

  assert.equal(store.queryReels({ q: 'PASTA' }).length, 1);
  assert.equal(store.queryReels({ q: 'recipes' }).length, 1, 'search includes category name');
  assert.equal(store.queryReels({ q: 'sushi' }).length, 0);
  assert.equal(store.queryReels({ cat: cat.id }).length, 1);
  assert.equal(store.queryReels({ cat: 'none' }).length, 0);

  // persisted
  await closeDb();
  const again = await repo.listReels();
  assert.equal(again.length, 1);
});

test('duplicates and invalid links are reported, not stored', async () => {
  await store.load();
  await store.addFromText({ text: REEL });
  const r = await store.addFromText({ text: `https://instagram.com/reel/C9xYz12AbcD\nhttps://youtube.com/watch?v=1\nnope` });
  assert.equal(r.added.length, 0);
  assert.equal(r.duplicates.length, 1);
  assert.deepEqual(r.invalid.map((i) => i.error), ['not_instagram', 'not_url']);
  assert.equal(store.state.reels.length, 1);
  // DB-level unique index also protects against races
  const dup = await repo.addReel({ key: 'C9xYz12AbcD', shortcode: 'C9xYz12AbcD', url: REEL });
  assert.equal(dup.status, 'duplicate');
});

test('uncertain reels go to review and can be filed manually', async () => {
  await store.load();
  const a = await store.createCategory({ name: 'Recipes' });
  await store.createCategory({ name: 'Travel' });
  const r = await store.addFromText({ text: REEL }); // no text at all → nothing invented, needs a choice
  const reel = r.added[0];
  assert.equal(reel.categoryId, null);
  assert.equal(reel.needsReview, true);
  assert.equal(reel.caption, null);
  assert.equal(store.reviewQueue().length, 1);

  const filed = await store.assignCategory(reel.id, a.id);
  assert.equal(filed.categoryId, a.id);
  assert.equal(filed.categorySource, 'manual');
  assert.equal(store.reviewQueue().length, 0);
});

test('sorting newest / oldest', async () => {
  await store.load();
  await store.addFromText({ text: 'https://www.instagram.com/reel/AAAAA11111/' });
  await new Promise((r) => setTimeout(r, 5));
  await store.addFromText({ text: 'https://www.instagram.com/reel/BBBBB22222/' });
  assert.deepEqual(store.queryReels({ sort: 'new' }).map((r) => r.key), ['BBBBB22222', 'AAAAA11111']);
  assert.deepEqual(store.queryReels({ sort: 'old' }).map((r) => r.key), ['AAAAA11111', 'BBBBB22222']);
});

test('category rename, duplicate names and delete', async () => {
  await store.load();
  const c = await store.createCategory({ name: 'Game Ideas' });
  await assert.rejects(store.createCategory({ name: '  game ideas ' }), (e) => e.code === 'duplicate_name');
  await assert.rejects(store.createCategory({ name: '   ' }), (e) => e.code === 'empty_name');
  const renamed = await store.updateCategory(c.id, { name: 'Oyun Fikirleri', keywords: ['unity', '#gamedev', 'unity'] });
  assert.equal(renamed.name, 'Oyun Fikirleri');
  assert.deepEqual(renamed.keywords, ['unity', 'gamedev']);

  const r = await store.addFromText({ text: REEL, categoryId: c.id });
  assert.equal(r.added[0].categoryId, c.id);
  await store.deleteCategory(c.id);
  assert.equal(store.state.categories.length, 0);
  const after = store.state.reels[0];
  assert.equal(after.categoryId, null);
  assert.equal(after.needsReview, true);
});

test('share payload import keeps shared caption only', async () => {
  await store.load();
  await store.addStarters(['recipes', 'travel'], 'tr');
  assert.deepEqual(store.state.categories.map((c) => c.name).sort(), ['Seyahat', 'Tarifler']);
  const res = await store.addFromShare({ text: 'https://www.instagram.com/reel/C9xYz12AbcD/?igsh=abc' });
  assert.equal(res.added.length, 1);
  assert.equal(res.added[0].source, 'share');
  assert.equal(res.added[0].caption, null);
  const none = await store.addFromShare({ text: 'just words' });
  assert.equal(none.invalid[0].error, 'no_link');
});

test('Instagram export import: collections become categories, duplicates skipped', async () => {
  await store.load();
  await store.addFromText({ text: 'https://www.instagram.com/reel/AAAAA11111/' });
  const p = (key, extra = {}) => ({ parsed: { key, shortcode: key, kind: 'reel', url: `https://www.instagram.com/reel/${key}/` }, username: null, savedAt: 1, collection: null, ...extra });
  const items = [p('AAAAA11111'), p('BBBBB22222', { collection: 'Tatlılar' }), p('CCCCC33333', { parsed: { key: 'CCCCC33333', shortcode: 'CCCCC33333', kind: 'post', url: 'https://www.instagram.com/p/CCCCC33333/' } })];
  const res = await store.importExportItems(items, { includePosts: false, collectionsAsCategories: true });
  assert.deepEqual(res, { added: 1, duplicates: 1, assigned: 1, skippedPosts: 1 });
  const cat = store.state.categories.find((c) => c.name === 'Tatlılar');
  assert.ok(cat);
  assert.equal(store.state.reels.find((r) => r.key === 'BBBBB22222').categoryId, cat.id);
});

test('backup export → wipe → restore (replace) round-trips everything except the API key', async () => {
  await store.load();
  const c = await store.createCategory({ name: 'Learning', color: 'teal', keywords: ['tips'] });
  await store.addFromText({ text: REEL, notes: 'watch later', categoryId: c.id });
  await store.setSetting('ai', { ...store.state.settings.ai, apiKey: 'secret-key', model: 'gpt' });
  const backup = JSON.parse(JSON.stringify(store.makeBackup()));
  assert.equal(backup.settings.ai.apiKey, '');
  assert.equal(backup.reels.length, 1);
  assert.match(backupFileName(new Date(2026, 0, 5)), /stash-backup-2026-01-05\.json/);

  await store.wipeAll();
  assert.equal(store.state.reels.length, 0);
  const res = await store.restoreBackup(backup, 'replace');
  assert.equal(res.reels, 1);
  assert.equal(store.state.categories[0].name, 'Learning');
  assert.equal(store.state.reels[0].notes, 'watch later');
  assert.equal(store.state.reels[0].categoryId, store.state.categories[0].id);
});

test('backup merge reuses categories by name and skips existing reels', async () => {
  await store.load();
  const c = await store.createCategory({ name: 'Travel' });
  await store.addFromText({ text: REEL, categoryId: c.id });
  const incoming = {
    app: 'stash', schemaVersion: 1,
    categories: [{ id: 'other-id', name: 'travel' }, { id: 'n2', name: 'Funny' }],
    reels: [
      { url: REEL, categoryId: 'other-id' },
      { url: 'https://www.instagram.com/reel/ZZZZZ99999/', categoryId: 'other-id' },
      { url: 'https://evil.example/reel/1' },
    ],
  };
  const res = await store.restoreBackup(incoming, 'merge');
  assert.deepEqual([res.categories, res.reels, res.duplicates, res.skipped], [1, 1, 1, 1]);
  const z = store.state.reels.find((r) => r.key === 'ZZZZZ99999');
  assert.equal(z.categoryId, c.id);
});

test('backup validation errors', () => {
  assert.throws(() => validateBackup(null), (e) => e instanceof BackupError && e.code === 'invalid');
  assert.throws(() => validateBackup({ app: 'other' }), (e) => e.code === 'wrong_app');
  assert.throws(() => validateBackup({ app: 'stash', schemaVersion: 99, reels: [], categories: [] }), (e) => e.code === 'newer_schema');
  assert.throws(() => validateBackup({ app: 'stash', schemaVersion: 1, reels: 'x', categories: [] }), (e) => e.code === 'invalid');
  // backups made before 1.2.2 (app: 'reels-organizer') still restore
  const v = validateBackup({ app: 'reels-organizer', schemaVersion: 1, categories: [{ id: 'a', name: 'A' }], reels: [{ url: REEL, categoryId: 'missing' }, { url: REEL }] });
  assert.equal(v.reels.length, 1);
  assert.equal(v.skipped, 1);
  assert.equal(v.reels[0].categoryId, null);
  assert.equal(v.reels[0].needsReview, true);
});

test('recheck applies new keywords to unsorted reels', async () => {
  await store.load();
  const c = await store.createCategory({ name: 'Tech' });
  const r = await store.addFromText({ text: REEL, caption: 'new phone review' });
  assert.equal(r.added[0].categoryId, null);
  await store.addFromText({ text: 'https://www.instagram.com/reel/MMMMM11111/', caption: 'phone' });
  await store.updateCategory(c.id, { keywords: ['phone', 'review'] });
  const res = await store.recheckUnsorted({ useAi: false });
  assert.equal(res.assigned, 2);
  assert.equal(store.state.reels.find((x) => x.key === 'C9xYz12AbcD').categoryId, c.id);
});
