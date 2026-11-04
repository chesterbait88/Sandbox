// Validate every ```mermaid block in docs/*.md renders with mmdc.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const docs = readdirSync('docs').filter((f) => f.endsWith('.md'));
const out = path.resolve('node_modules/.cache/diagrams');
mkdirSync(out, { recursive: true });
const cfg = path.join(out, 'puppeteer.json');
writeFileSync(cfg, JSON.stringify({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--disable-gpu'] }));
let failed = 0;
let total = 0;
for (const f of docs) {
  const text = readFileSync(path.join('docs', f), 'utf8');
  const blocks = [...text.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]);
  blocks.forEach((src, i) => {
    total++;
    const inFile = path.join(out, `${f}-${i}.mmd`);
    writeFileSync(inFile, src);
    try {
      execFileSync('node_modules/.bin/mmdc', ['-i', inFile, '-o', `${inFile}.svg`, '-p', cfg, '-q'], { stdio: 'pipe' });
      const lines = src.trim().split('\n').length;
      console.log(`ok   ${f} #${i + 1} (${lines} lines)`);
    } catch (e) {
      failed++;
      console.error(`FAIL ${f} #${i + 1}\n${String(e.stderr ?? e.message).slice(0, 800)}`);
    }
  });
}
console.log(`${total - failed}/${total} diagrams render`);
process.exit(failed ? 1 : 0);
