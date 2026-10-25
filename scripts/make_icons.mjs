// Renders launcher/splash PNGs from www/icons/icon.svg with headless Chromium.
// Usage: node scripts/make_icons.mjs   (requires `npx playwright install chromium`)
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const svg = readFileSync(new URL('www/icons/icon.svg', root), 'utf8');
const RES = new URL('android/app/src/main/res/', root);
const DENS = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const browser = await chromium.launch();
const page = await browser.newPage();

async function render(file, w, h, html) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;width:${w}px;height:${h}px;overflow:hidden">${html}</body></html>`);
  writeFileSync(file, await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } }));
}
const img = (size, extra = '') => `<div style="width:${size}px;height:${size}px;${extra}">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>`;

// Legacy launcher icons (pre-Android 8)
for (const [d, s] of Object.entries(DENS)) {
  const px = Math.round(48 * s);
  await render(new URL(`mipmap-${d}/ic_launcher.png`, RES), px, px, img(px));
  await render(new URL(`mipmap-${d}/ic_launcher_round.png`, RES), px, px, img(px, 'border-radius:50%;overflow:hidden'));
}

// Pre-Android 12 splash images: keep existing sizes, centered mark on paper background
const sizeOf = (buf) => [buf.readUInt32BE(16), buf.readUInt32BE(20)];
for (const dir of readdirSync(RES).filter((n) => n.startsWith('drawable'))) {
  const f = new URL(`${dir}/splash.png`, RES);
  if (!existsSync(f)) continue;
  const [w, h] = sizeOf(readFileSync(f));
  const m = Math.round(Math.min(w, h) * 0.28);
  await render(f, w, h, `<div style="width:100%;height:100%;display:grid;place-items:center;background:#F5F5F5">${img(m)}</div>`);
}

// Web icons
for (const s of [192, 512]) await render(new URL(`www/icons/icon-${s}.png`, root), s, s, img(s));

await browser.close();
console.log('Icons rendered.');
