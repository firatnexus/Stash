// End-to-end tests for the required workflows, run against the same web layer
// that is packaged into the APK. Android-only parts (system share sheet,
// opening the Instagram app) are covered through their browser fallbacks:
// share → `?text=` launch payload, open → window.open popup.
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const REEL = 'https://www.instagram.com/reel/C9xYz12AbcD/';

async function ready(page, path = '/#/home') {
  await page.goto(path);
  await page.waitForFunction(() => globalThis.__reels && globalThis.__reels.store.state.ready);
}
const nav = (page, name) => page.locator(`[data-testid=nav-${name}]`).click();

async function createCategory(page, name, keywords = []) {
  await nav(page, 'categories');
  await page.getByTestId('new-category').click();
  await page.getByTestId('category-name').fill(name);
  for (const k of keywords) {
    await page.getByTestId('keyword-input').fill(k);
    await page.getByTestId('keyword-input').press('Enter');
  }
  await page.getByTestId('category-save').click();
  await expect(page.getByTestId('category-row').filter({ hasText: name })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => {
    throw e;
  });
});

test('1 · create, rename and delete categories', async ({ page }) => {
  await ready(page);
  await createCategory(page, 'Recipes', ['pasta', 'tarif']);
  // duplicate names are rejected
  await page.getByTestId('new-category').click();
  await page.getByTestId('category-name').fill('recipes');
  await page.getByTestId('category-save').click();
  await expect(page.getByTestId('category-error')).not.toBeEmpty();
  await page.keyboard.press('Escape');
  // rename
  await page.getByTestId('category-row').filter({ hasText: 'Recipes' }).getByTestId('category-edit').click();
  await page.getByTestId('category-name').fill('Cooking');
  await page.getByTestId('category-save').click();
  await expect(page.getByTestId('category-row').filter({ hasText: 'Cooking' })).toBeVisible();
  // starter suggestions
  await page.getByTestId('starter-open').click();
  await page.getByTestId('starter-add').click();
  await expect(page.getByTestId('category-row')).toHaveCount(7);
  // delete
  await page.getByTestId('category-row').filter({ hasText: 'Cooking' }).getByTestId('category-edit').click();
  await page.getByTestId('category-delete').click();
  await page.getByTestId('confirm-sheet').getByRole('button').last().click();
  await expect(page.getByTestId('category-row')).toHaveCount(6);
});

test('2+3 · add a Reel URL, automatic and manual category assignment', async ({ page }) => {
  await ready(page);
  await createCategory(page, 'Recipes', ['pasta']);
  await createCategory(page, 'Travel', ['travel']);

  // Invalid links give clear errors
  await nav(page, 'add');
  await page.getByTestId('add-url').fill('https://youtube.com/watch?v=1');
  await expect(page.getByTestId('add-url-status')).toContainText(/not from Instagram/i);
  await page.getByTestId('add-submit').click();
  await expect(page.getByTestId('add-error')).not.toBeEmpty();

  // Caption matches a keyword → filed automatically
  await page.getByTestId('add-url').fill(REEL + '?igsh=abc123');
  await page.getByTestId('add-caption').fill('Creamy pasta in 10 minutes');
  await expect(page.getByTestId('add-suggestion')).toContainText('Recipes');
  await page.getByTestId('add-submit').click();
  await expect(page.locator('.toast').filter({ hasText: 'Saved to Recipes' })).toBeVisible();

  // No text → nothing invented, user is asked to pick
  await nav(page, 'add');
  await page.getByTestId('add-url').fill('https://www.instagram.com/reel/DDDDD44444/');
  await page.getByTestId('add-submit').click();
  await expect(page.getByTestId('pick-category-sheet')).toBeVisible();
  await page.getByTestId('pick-option').filter({ hasText: 'Travel' }).click();

  // Duplicate detection (different URL form, same Reel)
  await nav(page, 'home');
  await page.getByTestId('quick-url').fill('instagram.com/reels/C9xYz12AbcD');
  await page.getByTestId('quick-submit').click();
  await expect(page.locator('.toast').last()).toContainText(/already/i);

  // Change category from the detail sheet
  await nav(page, 'library');
  await expect(page.getByTestId('reel-card')).toHaveCount(2);
  const card = page.getByTestId('reel-card').filter({ hasText: 'Creamy pasta' });
  await expect(card).toContainText('Recipes');
  await card.click();
  await page.getByTestId('detail-category').selectOption({ label: 'Travel' });
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('reel-card').filter({ hasText: 'Creamy pasta' })).toContainText('Travel');

  // persisted across reloads (IndexedDB)
  await page.reload();
  await expect(page.getByTestId('reel-card')).toHaveCount(2);
});

test('4 · search, category filter and sorting', async ({ page }) => {
  await ready(page);
  await page.evaluate(async () => {
    const s = globalThis.__reels.store;
    const a = await s.createCategory({ name: 'Recipes', keywords: ['pasta'] });
    await s.createCategory({ name: 'Tech', keywords: ['phone'] });
    await s.addFromText({ text: 'https://www.instagram.com/reel/AAAAA11111/', caption: 'Pasta night', username: 'chef.anna' });
    await new Promise((r) => setTimeout(r, 10));
    await s.addFromText({ text: 'https://www.instagram.com/reel/BBBBB22222/', caption: 'New phone review' });
    await new Promise((r) => setTimeout(r, 10));
    await s.addFromText({ text: 'https://www.instagram.com/reel/CCCCC33333/', caption: 'Çok güzel bir şarkı', categoryId: a.id });
  });
  await nav(page, 'library');
  await expect(page.getByTestId('reel-card')).toHaveCount(3);
  await page.getByTestId('search-input').fill('chef.anna');
  await expect(page.getByTestId('reel-card')).toHaveCount(1);
  await page.getByTestId('search-input').fill('sarki'); // diacritic-insensitive
  await expect(page.getByTestId('reel-card')).toHaveCount(1);
  await page.getByTestId('search-input').fill('nothing-matches');
  await expect(page.getByTestId('empty-state')).toBeVisible();
  await page.getByTestId('search-input').fill('');
  await page.getByTestId('filter-chip').filter({ hasText: 'Recipes' }).click();
  await expect(page.getByTestId('reel-card')).toHaveCount(2);
  await page.getByTestId('filter-chip').filter({ hasText: 'All' }).click();
  await page.getByTestId('sort-select').selectOption('old');
  await expect(page.getByTestId('reel-card').first()).toContainText('Pasta night');
  await page.getByTestId('sort-select').selectOption('new');
  await expect(page.getByTestId('reel-card').first()).toContainText('Çok güzel');
});

test('5 · open on Instagram', async ({ page }) => {
  await ready(page);
  await page.evaluate((u) => globalThis.__reels.store.addFromText({ text: u }), REEL);
  await nav(page, 'library');
  const [popup] = await Promise.all([page.waitForEvent('popup'), page.getByTestId('reel-card').first().getByTestId('open-instagram').click()]);
  expect(popup.url()).toContain('instagram.com/reel/C9xYz12AbcD');
});

test('6 · export a backup and restore it', async ({ page }, info) => {
  await ready(page);
  await page.evaluate(async (u) => {
    const s = globalThis.__reels.store;
    const c = await s.createCategory({ name: 'Learning', keywords: ['tips'] });
    await s.addFromText({ text: u, notes: 'watch later', categoryId: c.id });
  }, REEL);
  await nav(page, 'settings');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('backup-export').click()]);
  expect(download.suggestedFilename()).toMatch(/^stash-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const file = info.outputPath('backup.json');
  await download.saveAs(file);
  const json = JSON.parse(readFileSync(file, 'utf8'));
  expect(json.app).toBe('stash');
  expect(json.reels).toHaveLength(1);

  // wipe everything
  await page.getByTestId('wipe').click();
  await page.getByTestId('confirm-sheet').getByRole('button').last().click();
  await expect(page.getByTestId('data-section')).toContainText('0 Reels and 0 categories');

  // invalid file → clear error
  await page.getByTestId('backup-file').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"hello":1}') });
  await expect(page.getByTestId('backup-status')).not.toBeEmpty();

  // restore
  await page.getByTestId('backup-file').setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: readFileSync(file) });
  await page.getByTestId('restore-replace').check();
  await page.getByTestId('restore-confirm').click();
  await nav(page, 'library');
  await expect(page.getByTestId('reel-card')).toHaveCount(1);
  await expect(page.getByTestId('reel-card')).toContainText('Learning');
});

test('7 · app launches offline-ready with every screen reachable', async ({ page }) => {
  await ready(page);
  for (const v of ['home', 'library', 'add', 'categories', 'settings']) {
    await nav(page, v);
    await expect(page.locator('#view [data-testid^=view-]')).toBeVisible();
  }
  // no external requests at start-up (fonts and code are bundled)
  const external = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost')) external.push(r.url());
  });
  await page.reload();
  await page.waitForTimeout(500);
  expect(external).toEqual([]);
});

test('8 · share a Reel link into the app', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => globalThis.__reels && globalThis.__reels.store.state.ready);
  await page.evaluate(() => globalThis.__reels.store.createCategory({ name: 'Funny', keywords: ['lol'] }));
  // cold start with a shared payload (what the Android share intent delivers)
  await page.goto('/?text=' + encodeURIComponent(`lol this cat ${REEL}?igsh=MWQ1`) + '#/home');
  await expect(page.locator('.toast').filter({ hasText: 'Saved to Funny' })).toBeVisible();
  // warm share while running
  await page.evaluate(() => {
    globalThis.__reels.handleShare({ text: 'https://www.instagram.com/reel/SHARE22222/' });
  });
  await expect(page.getByTestId('pick-category-sheet')).toBeVisible();
  await page.getByTestId('pick-option').filter({ hasText: 'Funny' }).click();
  // a share without an Instagram link
  await page.evaluate(() => {
    globalThis.__reels.handleShare({ text: 'just some words' });
  });
  await expect(page.locator('.toast').last()).toBeVisible();
  await nav(page, 'library');
  await expect(page.getByTestId('reel-card')).toHaveCount(2);
});

test('9 · sheet drag-to-dismiss', async ({ page }) => {
  test.skip((page.viewportSize() ?? { width: 0 }).width >= 720, 'drag-to-dismiss is phone-width only');
  await page.goto('/');
  await page.waitForFunction(() => globalThis.__reels && globalThis.__reels.store.state.ready);
  await page.evaluate(() => {
    globalThis.__reels.store.createCategory({ name: 'Funny', keywords: ['lol'] });
    globalThis.__reels.handleShare({ text: 'https://www.instagram.com/reel/DRAG12345/' });
  });
  const sheet = page.getByTestId('pick-category-sheet');
  await expect(sheet).toBeVisible();
  // a short drag springs back and keeps the sheet open
  const grip = sheet.locator('.sheet-grip');
  let box = await grip.boundingBox();
  await page.mouse.move(box.x + 20, box.y + 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 20, box.y + 42, { steps: 8 });
  await page.mouse.up();
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveCSS('transform', 'none'); // spring back settles
  // a long downward drag dismisses it
  box = await grip.boundingBox();
  await page.mouse.move(box.x + 20, box.y + 2);
  await page.mouse.down();
  await page.mouse.move(box.x + 20, box.y + 420, { steps: 12 });
  await page.mouse.up();
  await expect(sheet).toBeHidden({ timeout: 2000 });
});

test('Instagram data export import (ZIP)', async ({ page }) => {
  await ready(page);
  const { makeZip } = await import('../unit/helpers/zip-writer.mjs');
  const zip = makeZip([
    {
      name: 'your_instagram_activity/saved/saved_posts.json',
      data: JSON.stringify({
        saved_saved_media: [
          { title: 'chef.anna', string_map_data: { 'Saved on': { href: 'https://www.instagram.com/reel/AAAAA11111/', timestamp: 1730000000 } } },
          { title: 'trip.tr', string_map_data: { 'Saved on': { href: 'https://www.instagram.com/p/BBBBB22222/', timestamp: 1730000100 } } },
        ],
      }),
    },
    {
      name: 'your_instagram_activity/saved/saved_collections.json',
      data: JSON.stringify({
        saved_saved_collections: [
          { title: 'Collection', string_map_data: { Name: { value: 'Desserts' } } },
          { title: 'chef.anna', string_map_data: { Name: { href: 'https://www.instagram.com/reel/AAAAA11111/', value: 'chef.anna' } } },
        ],
      }),
    },
  ]);
  await nav(page, 'add');
  await page.getByTestId('export-file').setInputFiles({ name: 'instagram.zip', mimeType: 'application/zip', buffer: zip });
  await expect(page.getByTestId('export-facts')).toBeVisible();
  await page.getByTestId('export-confirm').click();
  await nav(page, 'library');
  await expect(page.getByTestId('reel-card')).toHaveCount(2);
  await expect(page.getByTestId('reel-card').filter({ hasText: 'chef.anna' })).toContainText('Desserts');
});

test('upgrade from the legacy reels-organizer database keeps the library', async ({ page }) => {
  await ready(page);
  await page.evaluate(async (url) => {
    const s = globalThis.__reels.store;
    const c = await s.createCategory({ name: 'Recipes', keywords: ['pasta'] });
    await s.addFromText({ text: url, caption: 'Creamy pasta', categoryId: c.id });
    await s.setSetting('theme', 'dark');
  }, REEL);
  // Leave the app (closing its connection) and turn the data into a pre-1.2.2
  // install: everything in 'reels-organizer', no 'stash' database.
  await page.goto('/icons/icon.svg');
  await page.evaluate(async () => {
    const open = (name, v, up) => new Promise((res, rej) => {
      const r = v ? indexedDB.open(name, v) : indexedDB.open(name);
      if (up) r.onupgradeneeded = () => up(r.result);
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    const done = (t) => new Promise((res, rej) => { t.oncomplete = res; t.onerror = () => rej(t.error); });
    const stores = ['reels', 'categories', 'settings'];
    const src = await open('stash');
    const data = {};
    for (const st of stores) {
      data[st] = await new Promise((res) => { const q = src.transaction([st]).objectStore(st).getAll(); q.onsuccess = () => res(q.result); });
    }
    src.close();
    const dst = await open('reels-organizer', 1, (db) => {
      const s = db.createObjectStore('reels', { keyPath: 'id' });
      s.createIndex('key', 'key', { unique: true });
      s.createIndex('addedAt', 'addedAt');
      s.createIndex('categoryId', 'categoryId');
      db.createObjectStore('categories', { keyPath: 'id' });
      db.createObjectStore('settings', { keyPath: 'key' });
    });
    const t = dst.transaction(stores, 'readwrite');
    for (const st of stores) data[st].forEach((x) => t.objectStore(st).put(x));
    await done(t);
    dst.close();
    await new Promise((res) => { const d = indexedDB.deleteDatabase('stash'); d.onsuccess = d.onerror = res; });
  });
  await ready(page, '/#/library');
  await expect(page.getByTestId('reel-card')).toHaveCount(1);
  await expect(page.getByTestId('reel-card').first()).toContainText('Recipes');
  expect(await page.evaluate(() => document.documentElement.dataset.theme || globalThis.__reels.store.state.settings?.theme)).toBe('dark');
  const names = await page.evaluate(async () => (await indexedDB.databases()).map((d) => d.name).sort());
  expect(names).toEqual(['stash']);
});
