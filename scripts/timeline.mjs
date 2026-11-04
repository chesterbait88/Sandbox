// Gallery timeline: frozen snapshots of the visual review gallery, one per milestone, and a
// TIMELINE.md that shows the same shots side by side across snapshots.
//
//   node scripts/timeline.mjs                          → rebuild screenshots/TIMELINE.md
//   node scripts/timeline.mjs snapshot <slug> "<title>" ["<notes>"]
//        → copy screenshots/gallery-updated into screenshots/timeline/NN-<slug> (NN = next number,
//          or the existing entry with that slug, which is replaced) and record it in timeline.json
//   node scripts/timeline.mjs import <commit> <slug> "<title>" ["<notes>"]
//        → same, but the images come from that commit's committed gallery (git archive)
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIR = path.join(ROOT, 'screenshots/timeline');
const META = path.join(DIR, 'timeline.json');
const LIVE = path.join(ROOT, 'screenshots/gallery-updated');
/** Shots compared across snapshots, matched by slug (the file name after its number). */
const KEY_SHOTS = [
  'menu', 'world-picker', 'loadout-fixed', 'hud-round-start', 'hud-radial-open', 'weapon-pistol', 'weapon-rifle', 'weapon-rocket',
  'hud-c4-armed', 'action-c4-blast', 'hud-structure-readout', 'hud-combo-meter', 'hud-milestone-callout', 'results', 'leaderboard',
  'arena-desert-aerial', 'structure-gas-station', 'structure-gas-station-closeup', 'structure-diner-closeup', 'structure-water-tower',
  'arena-downtown-aerial', 'structure-office-block', 'structure-office-block-closeup', 'arena-park-aerial', 'structure-gazebo',
  'terrain-desert-road', 'terrain-downtown-street', 'action-collapse-start'
];

mkdirSync(DIR, { recursive: true });
const meta = existsSync(META) ? JSON.parse(readFileSync(META, 'utf8')) : [];
const [cmd, ...args] = process.argv.slice(2);

const slugOf = (file) => file.replace(/^\d+-/, '').replace(/\.jpg$/, '');
const today = () => new Date().toISOString().slice(0, 10);
const head = () => execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT }).toString().trim();

function record(slug, title, notes, commit, srcDir) {
  let entry = meta.find((e) => e.slug === slug);
  if (!entry) {
    entry = { n: meta.length + 1, slug, dir: '', title, notes, commit, date: today() };
    meta.push(entry);
  } else Object.assign(entry, { title, notes, commit, date: today() });
  entry.dir = `${String(entry.n).padStart(2, '0')}-${slug}`;
  const dest = path.join(DIR, entry.dir);
  rmSync(dest, { recursive: true, force: true });
  cpSync(srcDir, dest, { recursive: true });
  entry.images = readdirSync(dest).filter((f) => f.endsWith('.jpg')).length;
  writeFileSync(META, JSON.stringify(meta, null, 2) + '\n');
  console.log(`snapshot ${entry.dir}: ${entry.images} images (${commit})`);
}

if (cmd === 'snapshot') {
  const [slug, title, notes = ''] = args;
  if (!slug || !title) throw new Error('usage: snapshot <slug> "<title>" ["<notes>"]');
  record(slug, title, notes, head(), LIVE);
} else if (cmd === 'import') {
  const [commit, slug, title, notes = ''] = args;
  if (!commit || !slug || !title) throw new Error('usage: import <commit> <slug> "<title>" ["<notes>"]');
  const tmp = mkdtempSync(path.join(tmpdir(), 'vw-gallery-'));
  // The committed gallery folder was screenshots/gallery before the timeline existed, gallery-updated after.
  for (const folder of ['screenshots/gallery', 'screenshots/gallery-updated']) {
    try {
      execFileSync('sh', ['-c', `git archive ${commit} ${folder} | tar -x -C ${tmp}`], { cwd: ROOT, stdio: 'ignore' });
    } catch { /* folder absent at that commit */ }
  }
  const src = ['screenshots/gallery', 'screenshots/gallery-updated'].map((f) => path.join(tmp, f)).find((p) => existsSync(p));
  if (!src) throw new Error(`no committed gallery at ${commit}`);
  record(slug, title, notes, execFileSync('git', ['rev-parse', '--short', commit], { cwd: ROOT }).toString().trim(), src);
  rmSync(tmp, { recursive: true, force: true });
}

// ---- TIMELINE.md
const lines = ['# Gallery timeline', '', 'Frozen snapshots of the visual review gallery, oldest first. Each folder under `screenshots/timeline/` is one milestone; `screenshots/gallery-updated/` is the live output of `pnpm gallery` (the latest run). Images are 1280 × 720 headless captures (software GL), so lighting and frame pacing are approximate.', ''];
lines.push('| # | Snapshot | Commit | Date | Images | What changed |', '| --- | --- | --- | --- | --- | --- |');
for (const e of meta) lines.push(`| ${e.n} | [${e.title}](./timeline/${e.dir}/INDEX.md) | \`${e.commit}\` | ${e.date} | ${e.images} | ${e.notes} |`);
lines.push('', '## Side by side', '', 'Each row is one shot; columns run from the oldest snapshot to the newest. A blank cell means that shot did not exist yet.', '');
const files = Object.fromEntries(meta.map((e) => [e.dir, Object.fromEntries(readdirSync(path.join(DIR, e.dir)).filter((f) => f.endsWith('.jpg')).map((f) => [slugOf(f), f]))]));
lines.push(`| Shot | ${meta.map((e) => `${e.n}. ${e.title}`).join(' | ')} |`);
lines.push(`| --- | ${meta.map(() => '---').join(' | ')} |`);
for (const shot of KEY_SHOTS) {
  const cells = meta.map((e) => {
    const f = files[e.dir][shot];
    return f ? `<a href="./timeline/${e.dir}/${f}"><img src="./timeline/${e.dir}/${f}" width="300" alt="${shot}"></a>` : '';
  });
  if (cells.some(Boolean)) lines.push(`| ${shot} | ${cells.join(' | ')} |`);
}
lines.push('', '## Adding a snapshot', '', '```bash', 'pnpm gallery', 'node scripts/timeline.mjs snapshot <slug> "<title>" "<what changed>"', '```', '', 'Re-running `snapshot` with an existing slug replaces that entry. `node scripts/timeline.mjs import <commit> <slug> "<title>" "<notes>"` pulls a gallery that was committed earlier on the branch.', '');
writeFileSync(path.join(ROOT, 'screenshots/TIMELINE.md'), lines.join('\n'));
console.log(`TIMELINE.md: ${meta.length} snapshots`);
