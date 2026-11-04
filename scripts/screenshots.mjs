// Playwright screenshot script. Usage: node scripts/screenshots.mjs [baseUrl]
// Starts the built server if no baseUrl is given. Screens are selected with ?screen=<name>.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('screenshots');
mkdirSync(OUT, { recursive: true });

const SCREENS = (process.env.SCREENS ?? 'menu').split(',');
const SIZE = { width: 1280, height: 720 };

let server;
let baseUrl = process.argv[2];
if (!baseUrl) {
  const port = 8099;
  server = spawn(process.execPath, ['server/dist/index.js'], {
    env: { ...process.env, PORT: String(port), DATA_DIR: path.resolve('screenshots/.data') },
    stdio: 'inherit'
  });
  baseUrl = `http://localhost:${port}`;
  await waitFor(`${baseUrl}/api/health`);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium',
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox']
});
const page = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('[console]', m.text()); });

for (const screen of SCREENS) {
  const url = `${baseUrl}/?screen=${screen}&seed=1234&headless=1`;
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__vwReady === true, null, { timeout: 60000 }).catch(() => {
    console.warn(`[${screen}] ready flag not set, capturing anyway`);
  });
  await page.waitForTimeout(Number(process.env.SETTLE_MS ?? 1500));
  const file = path.join(OUT, `${screen}.png`);
  await page.screenshot({ path: file });
  console.log(`saved ${file}`);
}

await browser.close();
server?.kill();

async function waitFor(url) {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`server did not start: ${url}`);
}
