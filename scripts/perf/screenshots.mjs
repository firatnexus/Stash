/**
 * Capture fresh UI screenshots for the README from the same web layer that
 * ships in the APK. Seeds demo data (including generated gradient covers so
 * the card layout is visible; real covers are fetched on device).
 * Usage: node scripts/perf/screenshots.mjs
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const WWW = path.join(ROOT, 'www');
const OUT = path.join(ROOT, 'docs', 'screenshots');
await mkdir(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    let p = path.join(WWW, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!existsSync(p) || path.relative(WWW, p).startsWith('..')) p = path.join(WWW, 'index.html');
    const body = await readFile(p);
    res.writeHead(200, { 'content-type': MIME[path.extname(p)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(8792, r));

// UI language and demo data of the shots: LANG_UI=tr for Turkish (default: en).
const LANG = process.env.LANG_UI === 'tr' ? 'tr' : 'en';
const CATS_TR = [
  { id: 'c1', name: 'Tarifler', color: 'coral', keywords: ['tarif', 'yemek'], order: 1, createdAt: 1, updatedAt: 1 },
  { id: 'c2', name: 'Seyahat', color: 'teal', keywords: ['seyahat'], order: 2, createdAt: 1, updatedAt: 1 },
  { id: 'c3', name: 'Eğitim', color: 'blue', keywords: ['ders'], order: 3, createdAt: 1, updatedAt: 1 },
  { id: 'c4', name: 'Kediler', color: 'amber', keywords: ['kedi'], order: 4, createdAt: 1, updatedAt: 1 },
];
const CATS_EN = [
  { id: 'c1', name: 'Recipes', color: 'coral', keywords: ['recipe', 'dinner'], order: 1, createdAt: 1, updatedAt: 1 },
  { id: 'c2', name: 'Travel', color: 'teal', keywords: ['travel'], order: 2, createdAt: 1, updatedAt: 1 },
  { id: 'c3', name: 'Learning', color: 'blue', keywords: ['lesson'], order: 3, createdAt: 1, updatedAt: 1 },
  { id: 'c4', name: 'Cats', color: 'amber', keywords: ['cat'], order: 4, createdAt: 1, updatedAt: 1 },
];
const cats = LANG === 'tr' ? CATS_TR : CATS_EN;
const HUES = [8, 24, 190, 200, 160, 280, 330, 40];
const coverDataUrl = (i) => {
  const hue = HUES[i % HUES.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="360"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},60%,55%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360},55%,35%)"/></linearGradient></defs><rect width="240" height="360" fill="url(#g)"/></svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
};
const REELS_TR = [
  { u: 'mutfakvekitap', c: 'Ev yapımı makarna tarifi 🍝 adım adım anlatım', cat: 'c1', tags: ['pratik', 'akşamyemeği'], d: 2 },
  { u: 'gezgin.ruya', c: 'Kapadokya\'da gün batımı yürüyüşü', cat: 'c2', tags: ['seyahat', 'doğa'], d: 5 },
  { u: 'derscalisiyorum', c: 'Fizik özet: tork ve açısal momentum', cat: 'c3', tags: ['özet'], d: 7 },
  { u: 'kedimveben', c: 'Kedimin sabah rutini 😹', cat: 'c4', tags: ['kedi', 'komik'], d: 1 },
  { u: 'mutfakvekitap', c: 'Fırında sebzeli tavuk, pratik akşam yemeği', cat: 'c1', tags: ['pratik'], d: 12 },
  { u: 'gezgin.ruya', c: 'Karadeniz yaylalarında kamp', cat: 'c2', tags: ['kamp'], d: 20 },
  { u: 'derscalisiyorum', c: 'İngilizce konuşma pratiği için 5 ipucu', cat: 'c3', tags: ['ingilizce'], d: 30 },
  { u: 'kedimveben', c: 'Sokak kedilerini beslemenin kuralları', cat: 'c4', tags: ['kedi'], d: 45 },
  // uncategorized with AI suggestions — drives the pick-sheet screenshot
  { u: 'fotografgunlugu', c: 'Golden hour fotoğrafçılığı için 7 ipucu', cat: null, tags: [], d: 1, pending: true, sug: ['pratik', 'ışık', 'fotoğraf'] },
];
const REELS_EN = [
  { u: 'kitchen.and.books', c: 'Homemade pasta recipe 🍝 step by step', cat: 'c1', tags: ['quick', 'dinner'], d: 2 },
  { u: 'wander.ruya', c: 'Sunset walk in Cappadocia', cat: 'c2', tags: ['travel', 'nature'], d: 5 },
  { u: 'study.notes', c: 'Physics recap: torque and angular momentum', cat: 'c3', tags: ['recap'], d: 7 },
  { u: 'my.cat.and.me', c: 'My cat\'s morning routine 😹', cat: 'c4', tags: ['cat', 'funny'], d: 1 },
  { u: 'kitchen.and.books', c: 'Oven-baked chicken with vegetables, an easy dinner', cat: 'c1', tags: ['quick'], d: 12 },
  { u: 'wander.ruya', c: 'Camping in the Black Sea highlands', cat: 'c2', tags: ['camping'], d: 20 },
  { u: 'study.notes', c: '5 tips for practising spoken English', cat: 'c3', tags: ['english'], d: 30 },
  { u: 'my.cat.and.me', c: 'House rules for feeding street cats', cat: 'c4', tags: ['cat'], d: 45 },
  // uncategorized with AI suggestions — drives the pick-sheet screenshot
  { u: 'photo.diary', c: '7 tips for golden hour photography', cat: null, tags: [], d: 1, pending: true, sug: ['tips', 'light', 'photography'] },
];
const reels = LANG === 'tr' ? REELS_TR : REELS_EN;
const data = reels.map((r, i) => ({
  id: 'r' + i,
  key: 'Shot' + i + 'Xyz',
  shortcode: 'Shot' + i + 'Xyz',
  kind: 'reel',
  url: 'https://www.instagram.com/reel/Demo' + i + '/',
  username: r.u,
  creatorName: null,
  caption: r.c,
  title: null,
  collection: null,
  notes: '',
  // generated gradient covers (README demo only; real covers are fetched from
  // Instagram's public embed page and stored on device)
  thumbnailUrl: coverDataUrl(i),
  thumbnailPath: null,
  avatarUrl: null,
  avatarPath: null,
  tags: r.tags,
  tagSuggestions: r.sug || [],
  newCategorySuggestion: null,
  categoryId: r.cat,
  categorySource: r.cat ? 'manual' : null,
  needsReview: !r.cat,
  suggestions: [],
  reasons: [],
  source: 'share',
  savedAt: null,
  addedAt: Date.now() - r.d * 86400000,
  updatedAt: 1,
}));

const browser = await chromium.launch();
const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });

async function seedAndGo(hash, theme = 'light') {
  await phone.goto('http://127.0.0.1:8792/index.html#/home');
  await phone.evaluate(
    ({ cats, data, theme, lang }) =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('stash', 1);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('reels')) {
            const s = db.createObjectStore('reels', { keyPath: 'id' });
            s.createIndex('key', 'key', { unique: true });
            s.createIndex('addedAt', 'addedAt');
            s.createIndex('categoryId', 'categoryId');
          }
          if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' });
          if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
        };
        req.onsuccess = () => {
          const db = req.result;
          const t = db.transaction(['reels', 'categories', 'settings'], 'readwrite');
          t.objectStore('reels').clear();
          t.objectStore('categories').clear();
          for (const c of cats) t.objectStore('categories').put(c);
          for (const r of data) t.objectStore('reels').put(r);
          t.objectStore('settings').put({ key: 'theme', value: theme });
          t.objectStore('settings').put({ key: 'lang', value: lang });
          t.oncomplete = () => { db.close(); resolve(); };
          t.onerror = () => reject(t.error);
        };
        req.onerror = () => reject(req.error);
      }),
    { cats, data, theme, lang: LANG },
  );
  await phone.reload({ waitUntil: 'networkidle' });
  await phone.goto('http://127.0.0.1:8792/index.html#' + hash);
  await phone.waitForFunction(() => globalThis.__reels && globalThis.__reels.store.state.ready);
  await phone.waitForTimeout(500);
}

const shot = (name) => phone.screenshot({ path: path.join(OUT, name) });

await seedAndGo('/home');
await shot('light-home.png');
await shot('overview.png'); // top of home as the hero image

await phone.goto('http://127.0.0.1:8792/index.html#/library');
await phone.waitForTimeout(500);
await shot('light-library.png');

// pick sheet with AI suggestions (open the uncategorized one via review strip)
await seedAndGo('/home');
await phone.locator('[data-testid="review-item"]').first().click();
await phone.waitForTimeout(600);
await shot('light-pick.png');

// detail sheet (dark)
await seedAndGo('/library', 'dark');
await phone.locator('[data-testid="reel-card"]').first().click();
await phone.waitForTimeout(600);
await shot('dark-detail.png');

// categories + add views (light)
await seedAndGo('/categories');
await shot('light-categories.png');
await phone.goto('http://127.0.0.1:8792/index.html#/add');
await phone.waitForTimeout(400);
await shot('light-add.png');

// dark home + library
await seedAndGo('/home', 'dark');
await shot('dark-home.png');
await phone.goto('http://127.0.0.1:8792/index.html#/library');
await phone.waitForTimeout(500);
await shot('dark-library.png');

await browser.close();
server.close();
console.log('screenshots written to docs/screenshots/');
