// Full round, menu → leaderboard, driven through the DOM. The clock is fast-forwarded.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const port = 8096;
const server = spawn(process.execPath, ['server/dist/index.js'], { env: { ...process.env, PORT: String(port), VW_DEV_NO_TIME_CHECK: '1', DATA_DIR: 'screenshots/.data-e2e' }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
const state = () => page.evaluate(() => window.__flow.state);
const step = async (label, fn, expect) => {
  await fn();
  try {
    await page.waitForFunction((s) => window.__flow.state === s, expect, { timeout: 60000, polling: 250 });
  } catch (e) {
    const info = await page.evaluate(() => ({ state: window.__flow.state, result: !!window.__flow.result, running: window.__flow.round.running, remaining: window.__flow.round.remaining, freezeEnd: window.__flow.freezeEnd - performance.now(), timeScale: window.__vw.timeScale }));
    console.error(`${label}: expected ${expect}, got`, JSON.stringify(info), 'errors:', errors);
    throw e;
  }
  console.log(`${label.padEnd(28)} → ${await state()}`);
};
await page.goto(`http://localhost:${port}/?seed=E2E`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__vwReady === true, null, { timeout: 90000 });
console.log('boot'.padEnd(28), '→', await state());
await step('click PLAY', () => page.click('text=PLAY'), 'worldPicker');
await step('pick Downtown', () => page.click('.theme-card:nth-child(2)'), 'worldPicker');
await step('click NEXT', () => page.click('text=NEXT: LOADOUT'), 'loadout');
await step('click DEPLOY', () => page.click('text=DEPLOY'), 'countdown');
await step('countdown', async () => {}, 'playing');
// Wreck something: a few explosions at a structure, then fast-forward the clock.
const wreck = await page.evaluate(() => {
  const g = window.__vw;
  const s = g.world.structures[0];
  for (let k = 0; k < 4; k++) g.destruction.applyDamage({ x: s.center.x + k, y: s.center.y, z: s.center.z }, 4, 90, 'e2e');
  return { structure: s.name, score: g.score.score };
});
console.log('wrecked'.padEnd(28), '→', JSON.stringify(wreck));
await page.evaluate(() => (window.__flow.round.remaining = 0.5));
await page.waitForTimeout(500);
console.log('after fast-forward'.padEnd(28), '→', JSON.stringify(await page.evaluate(() => ({ state: window.__flow.state, remaining: window.__flow.round.remaining, running: window.__flow.round.running }))));
await step('clock runs out', async () => {}, 'results');
await page.waitForTimeout(2200);
await step('click CONTINUE', () => page.click('text=CONTINUE'), 'initials');
await page.keyboard.type('ZAC');
await step('press ENTER', () => page.keyboard.press('Enter'), 'leaderboard');
await page.waitForTimeout(600);
const board = await page.evaluate(() => [...document.querySelectorAll('.board .row')].map((r) => r.textContent?.replace(/\s+/g, ' ').trim()));
console.log('leaderboard rows'.padEnd(28), '→', JSON.stringify(board));
await page.screenshot({ path: 'screenshots/e2e-leaderboard.png' });
await step('click PLAY AGAIN', () => page.click('text=PLAY AGAIN'), 'worldPicker');
console.log('page errors:', errors.length ? errors : 'none');
await browser.close();
server.kill();
process.exit(errors.length ? 1 : 0);
