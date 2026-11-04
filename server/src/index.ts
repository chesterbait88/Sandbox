import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { createApi } from './api';
import { Db } from './db';
import { resolveSecret, TokenSigner } from './token';

const PORT = Number(process.env.PORT ?? 8080);
const DATA_DIR = process.env.DATA_DIR ?? path.resolve(process.cwd(), 'data');
const here = path.dirname(fileURLToPath(import.meta.url));
/** Built client: CLIENT_DIST if set (dev builds into a scratch dir), else client/dist relative to the repo root. */
const candidates = [...(process.env.CLIENT_DIST ? [path.resolve(process.env.CLIENT_DIST)] : []), path.resolve(here, '../../client/dist'), path.resolve(here, '../client/dist'), path.resolve(process.cwd(), 'client/dist')];
const clientDist = candidates.find((p) => existsSync(p));

const db = new Db(path.join(DATA_DIR, 'scores.db'));
const signer = new TokenSigner(resolveSecret(process.env));
const app = new Hono();
app.route('/api', createApi({ db, signer, skipTimeCheck: process.env.VW_DEV_NO_TIME_CHECK === '1' }));
if (process.env.VW_DEV_NO_TIME_CHECK === '1') console.warn('VW_DEV_NO_TIME_CHECK=1: round time window is not enforced (dev only)');

if (clientDist) {
  const root = path.relative(process.cwd(), clientDist) || '.';
  app.use('/*', serveStatic({ root }));
  app.get('*', serveStatic({ root, path: 'index.html' }));
  console.log(`serving client from ${clientDist}`);
} else {
  app.get('/', (c) => c.text('Voxel Wreck API. Client not built; run `pnpm build` or use `pnpm dev`.'));
}

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`voxel-wreck server listening on http://localhost:${PORT} · data in ${DATA_DIR}`);
});

process.on('SIGTERM', () => {
  db.close();
  process.exit(0);
});
