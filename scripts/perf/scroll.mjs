/**
 * Scroll-performance measurement for the library view.
 *
 * Seeds N reels into IndexedDB, opens #/library and measures frame timings
 * while auto-scrolling through the whole list. Reports average frame time,
 * p95/p99 frame time and jank counts (frames > 32ms / > 100ms), plus
 * long-task counts from the Long Tasks API.
 *
 * Usage: node scripts/perf/scroll.mjs [count] [--view=list]
 * Note: measures desktop Chromium on this machine — NOT an Android device.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.join(fileURLToPath(new URL('.', import.meta.url)), '..', '..');
const WWW = path.join(ROOT, 'www');
const COUNT = Number(process.argv[2] || 300);
const VIEW = process.argv.includes('--view=list') ? 'list' : 'grid';

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
await new Promise((r) => server.listen(8791, r));

const browser = await chromium.launch();
const cpuRate = Number(process.argv.includes('--cpu') ? process.argv[process.argv.indexOf('--cpu') + 1] : 1);
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); // phone-like
if (cpuRate > 1) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
}
await page.goto('http://127.0.0.1:8791/index.html#/library?view=' + VIEW);

// Seed categories + reels directly in IndexedDB, then reload so the app boots with data.
await page.evaluate(
  ({ n }) =>
    new Promise((resolve, reject) => {
      const cats = ['Tarifler', 'Seyahat', 'Eğitim', 'Spor', 'Müzik', 'Kedi'].map((name, i) => ({ id: 'cat' + i, name, color: 'none', keywords: [], order: i, createdAt: 1, updatedAt: 1 }));
      const cap = ['Ev yapımı makarna tarifi 🍝 adım adım', 'Kapadokya\'da gün batımı yürüyüşü', 'Fizik dersi özet: tork ve açısal momentum', '5 dakikada ev antrenmanı bacak günü', 'Akustik gitarla Türkçe cover', 'Kedimin sabah rutini 😹', 'Fırında sebzeli tavuk, pratik akşam yemeği', 'Karadeniz yaylalarında kamp', 'İngilizce konuşma pratiği ipuçları', 'Koşu formu: adım frekansı nasıl artar', 'Basit beat yapımı için 4 ipucu', 'Kedi maması tarifleri ve püf noktaları', 'Çıtır poğaça tarifi mayasız', 'Balkanlar yolculuğu güzergâhı', 'YKS biyoloji: hücre döngüsü özeti', 'Plank challenge 30 gün', 'Piyano ile Notaların hikâyesi', 'Sokak kedilerini beslemenin kuralları'];
      const reels = [];
      for (let i = 0; i < n; i++) {
        const day = 400 - Math.floor(i / 8);
        reels.push({
          id: 'r' + i,
          key: 'Perf' + String(i).padStart(4, '0') + 'ABC',
          shortcode: 'Perf' + String(i).padStart(4, '0') + 'ABC',
          kind: 'reel',
          url: 'https://www.instagram.com/reel/Perf' + i + '/',
          username: 'user' + (i % 40),
          creatorName: null,
          caption: cap[i % cap.length] + ' ' + (i + 1),
          title: null,
          collection: null,
          notes: '',
          thumbnailUrl: null,
          thumbnailPath: null,
          avatarUrl: null,
          avatarPath: null,
          tags: i % 3 === 0 ? ['pratik', 'tarif'] : i % 3 === 1 ? ['seyahat'] : [],
          tagSuggestions: [],
          newCategorySuggestion: null,
          categoryId: 'cat' + (i % 6),
          categorySource: 'manual',
          needsReview: false,
          suggestions: [],
          reasons: [],
          source: 'manual',
          savedAt: null,
          addedAt: Date.now() - day * 86400000,
          updatedAt: 1,
        });
      }
      const req = indexedDB.open('reels-organizer', 1);
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
        const t = db.transaction(['reels', 'categories'], 'readwrite');
        t.objectStore('reels').clear();
        t.objectStore('categories').clear();
        for (const c of cats) t.objectStore('categories').put(c);
        for (const r of reels) t.objectStore('reels').put(r);
        t.oncomplete = () => { db.close(); resolve(); };
        t.onerror = () => reject(t.error);
      };
      req.onerror = () => reject(req.error);
    }),
  { n: COUNT },
);

await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => globalThis.__reels && globalThis.__reels.store.state.ready);
await page.waitForTimeout(400);

const stats = await page.evaluate(async () => {
  const longTasks = [];
  const po = new PerformanceObserver((list) => longTasks.push(...list.getEntries().map((e) => e.duration)));
  po.observe({ entryTypes: ['longtask'] });

  // scroll the whole list in small steps, measuring frame deltas
  const deltas = [];
  let last = performance.now();
  let frames = 0;
  await new Promise((resolve) => {
    let y = 0;
    const step = () => {
      window.scrollTo(0, y);
      y += 24;
      if (y < document.documentElement.scrollHeight + window.innerHeight && frames < 3000) requestAnimationFrame(step);
      else resolve();
    };
    const tick = (t) => {
      deltas.push(t - last);
      last = t;
      frames++;
      if (frames < 100000) requestAnimationFrame(tick); // keeps rAF alive during scroll
    };
    requestAnimationFrame(tick);
    requestAnimationFrame(step);
    setTimeout(resolve, 30000); // hard cap
  });
  po.disconnect();
  const sorted = [...deltas].sort((a, b) => a - b);
  const at = (q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))];
  return {
    frames: deltas.length,
    avgMs: +(deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(1),
    p95Ms: +at(0.95).toFixed(1),
    p99Ms: +at(0.99).toFixed(1),
    over32: deltas.filter((d) => d > 32).length,
    over100: deltas.filter((d) => d > 100).length,
    longTasks: longTasks.length,
    longTaskMs: +longTasks.reduce((a, b) => a + b, 0).toFixed(0),
    scrollHeight: document.documentElement.scrollHeight,
  };
});

console.log(`library view=${VIEW} reels=${COUNT} cpuThrottle=${cpuRate}x (desktop Chromium, phone viewport)`);
console.log(JSON.stringify(stats, null, 2));
await browser.close();
server.close();
