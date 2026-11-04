import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { api } from './api';

const PORT = Number(process.env.PORT ?? 8080);
const here = path.dirname(fileURLToPath(import.meta.url));
/** Built client: client/dist relative to the repo root, whether running from src (tsx) or dist. */
const candidates = [
  path.resolve(here, '../../client/dist'),
  path.resolve(here, '../client/dist'),
  path.resolve(process.cwd(), 'client/dist')
];
const clientDist = candidates.find((p) => existsSync(p));

const app = new Hono();
app.route('/api', api);

if (clientDist) {
  const root = path.relative(process.cwd(), clientDist) || '.';
  app.use('/*', serveStatic({ root }));
  app.get('*', serveStatic({ root, path: 'index.html' }));
  console.log(`serving client from ${clientDist}`);
} else {
  app.get('/', (c) => c.text('Voxel Wreck API. Client not built; run `pnpm build` or use `pnpm dev`.'));
}

serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`voxel-wreck server listening on http://localhost:${PORT}`);
});
