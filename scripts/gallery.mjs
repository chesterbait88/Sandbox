// Visual review gallery: every user-facing screen and HUD state, action moments, every structure
// from a 3/4 view and up close, theme overviews, terrain and material close-ups, each weapon in hand.
// Usage: node scripts/gallery.mjs   → screenshots/gallery/*.jpg + INDEX.md
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('screenshots/gallery');
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const port = 8093;
const dataDir = path.resolve('screenshots/.data-gallery');
rmSync(dataDir, { recursive: true, force: true });
const server = spawn(process.execPath, ['server/dist/index.js'], { env: { ...process.env, PORT: String(port), DATA_DIR: dataDir, VW_DEV_NO_TIME_CHECK: '1' }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 900));
const base = `http://localhost:${port}`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.error('[pageerror]', e.message));

const index = [];
let n = 0;
async function shot(name, what, lookFor) {
  const file = `${String(++n).padStart(2, '0')}-${name}.jpg`;
  await page.screenshot({ path: path.join(OUT, file), type: 'jpeg', quality: 88 });
  index.push({ file, what, lookFor });
  console.log('saved', file);
}
const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
const run = (script) => page.evaluate(new AsyncFn(script));
const wait = (ms) => page.waitForTimeout(ms);

/** In-page helpers: free camera, structure framing, sim stepping. */
const HELPERS = `
window.__gal = {
  free() {
    const f = window.__flow; f.state = 'paused';
    document.querySelectorAll('.screen').forEach(e => e.style.display = 'none');
    document.querySelector('.hud').style.display = 'none';
    document.querySelectorAll('.debug-overlay').forEach(e => e.style.display = 'none');
  },
  cam(px, py, pz, tx, ty, tz) { const c = window.__vw.gfx.camera; c.position.set(px, py, pz); c.lookAt(tx, ty, tz); },
  ground(x, z) { return window.__vw.world.surfaceY(Math.round(x * 2), Math.round(z * 2)) * 0.5 + 0.5; },
  /** Eye-height camera standing on the terrain at (x,z) looking at (tx,tz). */
  stand(x, z, tx, tz, eye = 1.6, lookDown = 0.6) { this.cam(x, this.ground(x, z) + eye, z, tx, this.ground(tx, tz) + eye - lookDown, tz); },
  struct(name, nth = 0) { return window.__vw.world.structures.filter(s => s.name === name)[nth]; },
  frame(name, azDeg, elevDeg, mul = 1.4, nth = 0) {
    const s = this.struct(name, nth); if (!s) return false;
    const b = s.bounds; const ex = (b.x1 - b.x0 + 1) * .5, ey = (b.y1 - b.y0 + 1) * .5, ez = (b.z1 - b.z0 + 1) * .5;
    const c = { x: (b.x0 + b.x1 + 1) * .25, y: (b.y0 + b.y1 + 1) * .25, z: (b.z0 + b.z1 + 1) * .25 };
    const dist = Math.max(ex, ez, ey * 1.2) * mul + 4;
    const az = azDeg * Math.PI / 180, el = elevDeg * Math.PI / 180;
    this.cam(c.x + Math.cos(az) * Math.cos(el) * dist, c.y + Math.sin(el) * dist, c.z + Math.sin(az) * Math.cos(el) * dist, c.x, c.y, c.z);
    return true;
  },
  closeup(name, nth = 0, offset = 3.5) {
    const s = this.struct(name, nth); if (!s) return false;
    const b = s.bounds; const cx = (b.x0 + b.x1 + 1) * .25; const y = b.y0 * .5 + 1.6;
    // Stand in front of the lower-z face, slightly off-axis so faces read in perspective.
    this.cam(cx + 1.5, y + 0.4, b.z0 * .5 - offset, cx, y + 0.6, b.z0 * .5 + 1);
    return true;
  },
  async meshed() { const g = window.__vw; for (let i = 0; i < 300; i++) { if (g.chunks.idle) return; await new Promise(r => setTimeout(r, 50)); } },
  wreck(name, nth, radius, power, count) {
    const g = window.__vw; const s = this.struct(name, nth); const b = s.bounds;
    for (let k = 0; k < count; k++) g.destruction.applyDamage({ x: b.x0 * .5 + 2 + k * ((b.x1 - b.x0) * .5 - 4) / Math.max(1, count - 1), y: (b.y0 + 3) * .5, z: b.z0 * .5 + 1 }, radius, power, 'gallery');
  }
};`;

async function load(query) {
  await page.goto(`${base}/?${query}&headless=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__vwReady === true, null, { timeout: 120000 });
  await page.evaluate(HELPERS);
}

// ---------------------------------------------------------------- screens
await load('theme=desert&seed=1234&screen=menu');
await wait(1500);
await shot('menu', 'Start menu over the orbiting live arena (Desert Highway, seed 1234).', 'Title lettering, button hierarchy, legibility over the world, the best-score strip.');
await page.click('.screen-menu >> text=PLAY');
await wait(900);
await shot('world-picker', 'World picker with Desert Highway selected; seed field and dice.', 'Card art vs the real arena behind, selected-state clarity, spacing.');
await page.click('.theme-card:nth-child(2)');
await wait(2500);
await shot('world-picker-downtown', 'After clicking Downtown: the arena behind the cards rebuilt live.', 'Does the live backdrop sell the theme switch? Card selected state.');
await page.click('.screen-picker >> text=NEXT: LOADOUT');
await wait(1200);
await shot('loadout-fixed', 'Loadout briefing, fixed kit: spinning voxel weapon models in scissored viewports.', 'Model readability at this size, slot hierarchy, the points-standing line.');
await page.click('.modes .btn:nth-child(2)');
await wait(300);
await shot('loadout-point-buy', 'Point-buy mode: +/− per slot with prices, budget readout, sticky grenade toggle.', 'Whether prices and budget read at a glance; button sizing.');
await page.click('.modes .btn:nth-child(1)');
await page.click('.screen-loadout >> text=DEPLOY');
await wait(1400);
await shot('countdown', 'Countdown with the camera swooping onto the spawn pad; control hint visible.', 'Number styling, hint placement, the drop-in camera framing.');
await page.waitForFunction(() => window.__flow.state === 'playing', null, { timeout: 15000 });
await wait(400);
await shot('hud-round-start', 'First seconds of a Downtown round: full HUD with the control hint still up.', 'Score bar, timer, radial hub, ammo panel, crosshair, hint: hierarchy and contrast.');
await run(`const ui = window.__ui; ui.radial.el.classList.add('open'); ui.radial.el.querySelectorAll('.radial-seg')[5].classList.add('hl');`);
await wait(350);
await shot('hud-radial-open', 'Radial weapon picker fanned out (Q held), rocket launcher highlighted.', 'Segment layout, highlight colour, readability of names.');
await run(`const ui = window.__ui; ui.radial.el.classList.remove('open'); ui.radial.el.querySelectorAll('.radial-seg')[5].classList.remove('hl');`);
for (const [slot, id] of [[0, 'pickaxe'], [1, 'bat'], [2, 'pistol'], [3, 'shotgun'], [4, 'rifle'], [5, 'rocket'], [6, 'grenade'], [7, 'c4']]) {
  await run(`window.__vw.weapons.select(${slot}); window.__vw.player.yaw = Math.PI + 0.4; window.__vw.player.pitch = -0.05; window.__vw.player.updateCamera();`);
  await wait(450);
  await shot(`weapon-${id}`, `In-hand view model: ${id} (slot ${slot + 1}), with the ammo panel for it.`, 'Model shape, size and position in frame, outline shading on the tiny voxels, ammo readout.');
}
await run(`window.__vw.weapons.select(2);`);
// Armed C4 on a wall
await run(`
  const g = window.__vw; const s = window.__gal.struct('Office Block'); const b = s.bounds;
  g.player.position.set((b.x0 + b.x1 + 1) * .25, b.y0 * .5, b.z0 * .5 - 2.2); g.player.yaw = Math.PI; g.player.pitch = -0.05; g.player.updateCamera();
  g.weapons.select(7); for (let i = 0; i < 3; i++) { g.weapons.active.cooldown = 0; g.player.yaw = Math.PI + (i - 1) * 0.35; g.player.updateCamera(); g.weapons.fire(g.weapons.active); }
  g.player.yaw = Math.PI; g.player.updateCamera();`);
await wait(500);
await shot('hud-c4-armed', 'Three C4 charges stuck to an office block wall; ammo panel shows 3 ARMED.', 'Charge model on the wall, the ARMED indicator, glass wall material up close.');
await run(`window.__vw.weapons.detonateCharges();`);
await wait(260);
await shot('action-c4-blast', 'The instant after detonation: flash, sparks, debris, glass and concrete carved.', 'Explosion feedback, debris colours, crater shape in the curtain wall.');
await wait(1800);
await run(`window.__vw.weapons.select(2); window.__vw.player.position.z -= 6; window.__vw.player.pitch = 0.12; window.__vw.player.updateCamera();`);
await wait(500);
await shot('hud-structure-readout', 'After the hits: structure readout bar, score ticked up, debris settled against the wall.', 'Readout legibility, score bar fill toward the next milestone, debris at rest.');
// Chain reaction + combo + callout
await run(`
  const g = window.__vw; const s = window.__gal.struct('Convenience Store'); const b = s.bounds;
  g.player.position.set((b.x0 + b.x1 + 1) * .25 - 6, b.y0 * .5, b.z0 * .5 - 14); g.player.yaw = Math.PI - 0.35; g.player.pitch = 0.05; g.player.updateCamera();
  g.destruction.applyDamage({ x: b.x0 * .5 + 1.5, y: (b.y0 + 1) * .5, z: b.z0 * .5 + 1.5 }, 3, 60, 'gallery');`);
await wait(420);
await shot('action-chain-reaction', 'Propane cage outside the convenience store going up: chained detonations in flight.', 'Flash/particle look, combo badge on the score bar, two-tone propane bottles.');
await wait(1600);
await run(`window.__vw.score.score = 990; window.__vw.score.onDestroyed([{x:0,y:0,z:0,mat:15,owner:1},{x:1,y:0,z:0,mat:15,owner:1}]);`);
await wait(450);
await shot('hud-milestone-callout', 'A milestone callout slamming in with its reward.', 'Banner weight, flash intensity, whether it obscures too much.');
await wait(1800);
await run(`window.__flow.round.remaining = 24; window.__flow.round.update(0);`);
await wait(300);
await shot('hud-low-time', 'Under 30 seconds: the timer turns red and pulses.', 'Urgency reads without being obnoxious.');
await run(`window.__flow.pause();`);
await wait(600);
await shot('pause', 'Pause screen over the dimmed HUD.', 'Panel styling, blur, button order.');
await page.click('.screen-pause >> text=SETTINGS');
await wait(500);
await shot('settings', 'Settings overlay: sensitivity, volume, FOV sliders (persisted).', 'Slider affordance, value readouts.');
await page.keyboard.press('Escape');
await wait(400);
await page.click('.screen-pause >> text=QUIT TO MENU');
await wait(1200);
await page.click('.screen-menu >> text=CREDITS');
await wait(500);
await shot('credits', 'Credits overlay.', 'Tone and typography.');
await page.keyboard.press('Escape');

// Results / initials / leaderboard with real rows
for (const [theme, score, initials, mode] of [['desert', 18420, 'ZAC', 'fixed'], ['desert', 9100, 'BOB', 'fixed'], ['downtown', 33600, 'KIM', 'fixed'], ['park', 7700, 'AMY', 'fixed'], ['downtown', 21050, 'PBY', 'custom']]) {
  const s = await (await fetch(`${base}/api/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ theme, seed: 'GALLERY', mode }) })).json();
  await fetch(`${base}/api/score`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: s.token, initials, score, stats: {} }) });
}
await load('theme=desert&seed=1234&screen=results');
await wait(2600);
await shot('results', 'Results card after the count-up (sample numbers), with the top-100 line and SHARE ARENA.', 'Stat hierarchy, final score weight, the note line.');
await page.click('.screen-results >> text=CONTINUE');
await wait(700);
await page.keyboard.type('ZA');
await wait(300);
await shot('initials', 'Arcade initials entry mid-way through typing.', 'Letter columns, active column highlight, hint line.');
await page.keyboard.type('C');
await page.keyboard.press('Enter');
await wait(1600);
await shot('leaderboard', 'Leaderboard (Desert Highway tab) with the new row highlighted; rows replay their arena.', 'Row layout, highlight, tab styling, SHARE button.');
await page.click('.screen-leaderboard >> text=POINT-BUY');
await wait(500);
await shot('leaderboard-point-buy', 'The separate point-buy board.', 'Same, for the custom-loadout board.');

// Desktop-only notice on a touch device
const mobile = await browser.newContext({ viewport: { width: 420, height: 800 }, hasTouch: true, isMobile: true });
const mp = await mobile.newPage();
await mp.goto(`${base}/?theme=park&seed=1`, { waitUntil: 'load' });
await mp.waitForTimeout(1500);
await mp.screenshot({ path: path.join(OUT, `${String(++n).padStart(2, '0')}-desktop-notice.jpg`), type: 'jpeg', quality: 88 });
index.push({ file: `${String(n).padStart(2, '0')}-desktop-notice.jpg`, what: 'What a phone sees: the desktop-only notice.', lookFor: 'Copy and layout at phone width.' });
await mobile.close();

// ---------------------------------------------------------------- arenas and structures
const THEMES = {
  desert: ['Gas Station', 'Diner', 'Billboard', 'Water Tower', 'Propane Cage'],
  downtown: ['Convenience Store', 'Office Block', 'Parking Structure', 'Bus Shelter'],
  park: ['Monument', 'Fountain', 'Gazebo', 'Statue', 'Maintenance Shed']
};
const AERIAL = { desert: [64, 52, -18, 64, 14, 70], downtown: [64, 60, -20, 64, 12, 70], park: [64, 56, -20, 64, 14, 70] };
for (const [theme, names] of Object.entries(THEMES)) {
  await load(`theme=${theme}&seed=1234&screen=menu`);
  await run(`window.__gal.free(); window.__gal.cam(${AERIAL[theme].join(',')});`);
  await wait(1800);
  await shot(`arena-${theme}-aerial`, `${theme}: whole arena from above the spawn edge, seed 1234.`, 'Placement logic (roadside / blocks / paths), terrain stepping, overall palette.');
  for (const name of names) {
    const slug = name.toLowerCase().replace(/ /g, '-');
    const ok = await run(`return window.__gal.frame(${JSON.stringify(name)}, 225, 22);`);
    if (!ok) continue;
    await run(`return window.__gal.meshed();`);
    await wait(600);
    await shot(`structure-${slug}`, `${name}: 3/4 view from the front-left.`, 'Silhouette, proportions, material mix, how it sits on its pad and in its setting.');
    await run(`window.__gal.closeup(${JSON.stringify(name)});`);
    await wait(500);
    await shot(`structure-${slug}-closeup`, `${name}: standing at the front wall.`, 'Per-voxel outlines/bevel/hatch, pattern rows, colour jitter, AO in corners.');
  }
}
// Terrain close-ups
await load('theme=desert&seed=1234&screen=menu');
await run(`window.__gal.free(); window.__gal.stand(20, 48, 34, 60, 2.2, 1.2);`);
await wait(700);
await shot('terrain-desert-road', 'Desert: standing on a dune above the road shoulder, looking along the asphalt.', 'Sand jitter and outlines, road edge blend, dune stepping.');
await run(`window.__gal.stand(28, 24, 40, 36, 1.6, 0.4);`);
await wait(700);
await shot('terrain-desert-dunes', 'Desert: dune terraces at eye height.', 'Half-metre voxel terracing: does it read as terrain or as stairs?');
await load('theme=downtown&seed=1234&screen=menu');
await run(`window.__gal.free(); window.__gal.stand(30, 30, 44, 44, 1.6, 0.9);`);
await wait(700);
await shot('terrain-downtown-street', 'Downtown: standing in a street at a block corner, sidewalk ring ahead.', 'Asphalt vs sidewalk contrast, grid readability, flatness.');
await load('theme=park&seed=1234&screen=menu');
await run(`window.__gal.free(); const g = window.__vw; const f = g.world.structures.find(s => s.name === 'Fountain'); window.__gal.cam(f.center.x - 10, f.center.y + 4, f.center.z - 12, f.center.x, f.center.y - 1, f.center.z);`);
await wait(700);
await shot('terrain-park-path', 'Park: gravel path, grass hill and the fountain.', 'Gravel checker pattern, grass colour, hill stepping, water.');

// Material swatches
await load('theme=desert&seed=1234&screen=menu');
const sw = await run(`window.__gal.free(); const r = window.__vw.stampSwatches(); const g = window.__vw; const sp = g.world.spawn; const n = r.ids.length; const cx = sp.x - n + (n * 2) / 2; window.__gal.cam(cx, sp.y + 7, sp.z - 9, cx, sp.y + 1, sp.z + 7); await window.__gal.meshed(); return r;`);
await wait(900);
await shot('materials-row', `Every material as a 1 m cube. The camera faces +z, so the row reads RIGHT to LEFT: ${sw.names.join(', ')}. Behind: a wall alternating brick, wood, concrete, marble, steel, drywall.`, 'Distinctness of hues, glass and water transparency, neon glow, overall palette against sand.');
const cube = (i) => `const g = window.__vw; const sp = g.world.spawn; const n = ${sw.ids.length}; const x0 = sp.x - n; const cx = x0 + ${i} * 2 + 0.5; window.__gal.stand(cx, sp.z + 0.8, cx, sp.z + 6.5, 1.9, 0.9);`;
await run(cube(sw.ids.indexOf(13)));
await wait(500);
await shot('materials-closeup-structure', `Structure materials up close, centred on Brick; right to left from the right edge: ${sw.names.slice(sw.ids.indexOf(10), sw.ids.indexOf(16) + 1).join(', ')}.`, 'Outline width, bevel highlight, hatch strength, jitter, brick rows, glass transparency.');
await run(cube(sw.ids.indexOf(20)));
await wait(500);
await shot('materials-closeup-volatiles', `Volatile and special materials up close, centred on Fuel tank; right to left: ${sw.names.slice(sw.ids.indexOf(17)).join(', ')}.`, 'Hazard stripes on fuel, colour bands on propane/transformer, neon glow, skin tone.');

// ---------------------------------------------------------------- action: craters, collapse
await load('theme=desert&seed=1234&screen=hud&test=wall');
await run(`const g = window.__vw; g.player.yaw = Math.PI; g.player.pitch = -0.1; g.player.updateCamera(); g.weapons.select(5); g.weapons.fire(g.weapons.active);`);
await wait(380);
await shot('action-rocket-impact', 'Rocket hitting the test brick wall: flash, debris spray, hazard-striped fuel tank behind.', 'Impact feedback and debris spread.');
await wait(2500);
await shot('action-after-chain', 'Same spot after the fuel tank chain-reaction: crater through the wall and the sand.', 'Crater shape, terrain carve, what survived.');
await run(`const g = window.__vw; const sp = g.world.spawn; g.destruction.applyDamage({ x: sp.x + 7, y: sp.y - 0.5, z: sp.z + 3 }, 4, 90, 'gallery'); g.player.position.set(sp.x, sp.y, sp.z - 1); g.player.yaw = Math.PI + 1.05; g.player.pitch = -0.5; g.player.updateCamera();`);
await wait(2200);
await shot('action-crater-terrain', 'A C4 crater dug into the sand next to the spawn pad.', 'Carved terrain faces, debris resting inside the crater.');
await load('theme=downtown&seed=1234&screen=hud');
await run(`
  const g = window.__vw; const s = window.__gal.struct('Office Block'); const b = s.bounds;
  g.player.position.set((b.x0 + b.x1 + 1) * .25 + 12, b.y0 * .5, b.z0 * .5 - 24); g.player.yaw = Math.PI + 0.35; g.player.pitch = 0.28; g.player.updateCamera();
  const y = (b.y0 + 2) * .5;
  for (let x = b.x0 * .5 + 1; x <= b.x1 * .5; x += 3) for (let z = b.z0 * .5 + 1; z <= b.z1 * .5; z += 3) g.destruction.applyDamage({ x, y, z }, 3, 90, 'gallery');`);
await wait(900);
await shot('action-collapse-start', 'Office block with its ground floor blown out: upper floors letting go.', 'Does the cut read? Body tilt, debris, callouts stacking.');
await wait(1500);
await shot('action-collapse-falling', 'The same block a second and a half later, mid-fall.', 'Falling-piece mesh vs the world, LEVELED stamp, readout.');
await wait(2000);
await run(`const g = window.__vw; g.player.pitch = -0.05; g.player.updateCamera();`);
await wait(300);
await shot('action-collapse-landed', 'A few seconds later: the leveled block is gone, the fallen piece has settled low or out of frame, debris scattered across the lot.', 'What is left standing, debris spread, whether the later (quiet) milestones stay out of the way.');

// ---------------------------------------------------------------- index
const md = ['# Visual review gallery', '', `Generated by \`node scripts/gallery.mjs\` (headless Chromium, software GL, 1280×720). ${index.length} images. Re-run after visual changes.`, '', '| # | Image | What it shows | What to look at |', '| --- | --- | --- | --- |'];
index.forEach((e, i) => md.push(`| ${i + 1} | [${e.file}](./${e.file}) | ${e.what} | ${e.lookFor} |`));
md.push('', 'Not capturable headlessly: mouse-look feel, audio, real GPU frame rate.');
writeFileSync(path.join(OUT, 'INDEX.md'), md.join('\n') + '\n');
console.log(`${index.length} images → ${OUT}`);
await browser.close();
server.kill();
