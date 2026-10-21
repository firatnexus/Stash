// Regenerates README screenshots. Start the server first: npm run serve
import { chromium, devices } from 'playwright';
const b = await chromium.launch();
async function run(theme, views) {
  const ctx = await b.newContext({ ...devices['Pixel 7'], colorScheme: theme, locale: 'tr-TR' });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/#/home'); await p.waitForFunction(() => globalThis.__reels?.store.state.ready);
  await p.evaluate(async () => {
    const s = __reels.store;
    await s.setSetting('lang', 'tr');
    await s.addStarters(['recipes','games','tech','travel','funny','learning'], 'tr');
    const add = async (code, caption, username) => { await s.addFromText({ text: 'https://www.instagram.com/reel/' + code + '/', caption, username }); await new Promise(r => setTimeout(r, 15)); };
    await add('AAAAA11111', 'Fırında çıtır patates, akşam yemeği için 15 dakikada hazır #tarif #yemek', 'mutfak.sirlari');
    await add('BBBBB22222', 'Kapadokya balon turu ve gün doğumu manzarası #travel', 'gezgin.ece');
    await add('FFFFF66666', 'Python ile 5 dakikada otomasyon: pratik kod ipuçları #yazilim', 'kod.kahvesi');
    await add('CCCCC33333', null, null);
    await add('DDDDD44444', 'cooking game idea for unity', 'indie.dev');
    await add('EEEEE55555', 'Godot ile 2D platform oyunu: zıplama mekaniği #gamedev', 'oyun.atolyesi');
    await add('GGGGG77777', 'Kedim yine aynı şeyi yaptı 😂 #komik', 'patili.gunler');
  });
  await p.reload(); await p.waitForTimeout(800);
  for (const v of views) {
    if (v === 'pick') {
      await p.goto('http://localhost:5173/#/home'); await p.waitForTimeout(400);
      await p.locator('.review-item').first().click(); await p.waitForTimeout(600);
    } else { await p.goto('http://localhost:5173/#/' + v); await p.waitForTimeout(600); }
    await p.screenshot({ path: `docs/screenshots/${theme}-${v}.png` });
  }
  await ctx.close();
}
await run('light', ['home', 'library', 'pick', 'categories', 'add']);
await run('dark', ['library']);
await b.close();
