import { Hono } from 'hono';
import { createHash } from 'node:crypto';
import { SCORING } from '@vw/config';
import type { Db } from './db';
import { TokenSigner } from './token';
import { cleanInitials, isTheme, modeOf, RateLimiter, validElapsed, validScore } from './validate';

export interface ApiOptions {
  db: Db;
  signer: TokenSigner;
  /** Dev/e2e only: skip the 150–600 s elapsed-time window. */
  skipTimeCheck?: boolean;
  now?: () => number;
}

/** The game API: sessions, score submission, leaderboard, top-100 check, health. */
export function createApi(opts: ApiOptions): Hono {
  const { db, signer } = opts;
  const now = opts.now ?? (() => Date.now());
  const api = new Hono();
  const limiter = new RateLimiter(SCORING.sessionRateLimitPerMin, 60_000);
  const cache = new Map<string, { at: number; body: unknown }>();

  const ipOf = (c: { req: { header: (n: string) => string | undefined } }): string =>
    c.req.header('x-forwarded-for')?.split(',')[0].trim() || c.req.header('x-real-ip') || 'local';
  const ipHash = (ip: string): string => createHash('sha256').update(ip).digest('hex').slice(0, 16);

  api.get('/health', (c) => c.json({ ok: true }));

  api.post('/session', async (c) => {
    const ip = ipOf(c);
    if (!limiter.allow(ip, now())) return c.json({ error: 'rate limited' }, 429);
    const body = await c.req.json<{ theme?: unknown; seed?: unknown; mode?: unknown }>().catch(() => null);
    if (!body || !isTheme(body.theme)) return c.json({ error: 'bad theme' }, 400);
    const seed = typeof body.seed === 'string' ? body.seed.slice(0, 32) : '';
    const startedAt = now();
    const token = signer.sign({ theme: body.theme, seed, startedAt, nonce: TokenSigner.nonce(), mode: modeOf(body.mode) });
    return c.json({ token, startedAt });
  });

  api.post('/score', async (c) => {
    const body = await c.req.json<{ token?: unknown; initials?: unknown; score?: unknown; stats?: unknown }>().catch(() => null);
    if (!body || typeof body.token !== 'string') return c.json({ accepted: false, reason: 'bad body' }, 400);
    const session = signer.verify(body.token);
    if (!session) return c.json({ accepted: false, reason: 'bad token' }, 403);
    if (!validElapsed(session.startedAt, now(), opts.skipTimeCheck)) return c.json({ accepted: false, reason: 'outside round window' }, 403);
    const initials = cleanInitials(body.initials);
    if (!initials) return c.json({ accepted: false, reason: 'bad initials' }, 400);
    if (!validScore(session.theme, body.score)) return c.json({ accepted: false, reason: 'implausible score' }, 400);
    if (!db.useToken(session.nonce, now())) return c.json({ accepted: false, reason: 'token already used' }, 403);
    db.pruneTokens(now(), SCORING.maxRoundElapsedS * 2000);
    const stats = body.stats && typeof body.stats === 'object' ? JSON.stringify(body.stats).slice(0, 2000) : '{}';
    const mode = modeOf(session.mode);
    db.insertScore({ theme: session.theme, seed: session.seed, initials, score: body.score, stats_json: stats, ip_hash: ipHash(ipOf(c)), mode });
    cache.clear();
    return c.json({ accepted: true, rank: db.rankFor(session.theme, body.score, false, mode), initials });
  });

  api.get('/leaderboard', (c) => {
    const theme = c.req.query('theme') ?? 'all';
    if (theme !== 'all' && !isTheme(theme)) return c.json({ entries: [] });
    const limit = Math.max(1, Math.min(SCORING.leaderboardSize, Number(c.req.query('limit') ?? 10) || 10));
    const mode = modeOf(c.req.query('mode'));
    const key = `${mode}:${theme}:${limit}`;
    const hit = cache.get(key);
    if (hit && now() - hit.at < SCORING.leaderboardCacheMs) return c.json(hit.body as object);
    const body = { entries: db.top(theme, limit, mode) };
    cache.set(key, { at: now(), body });
    return c.json(body);
  });

  api.get('/qualifies', (c) => {
    const theme = c.req.query('theme') ?? 'all';
    if (theme !== 'all' && !isTheme(theme)) return c.json({ rank: 0, qualifies: false, needed: 0 });
    const score = Math.max(0, Math.floor(Number(c.req.query('score') ?? 0) || 0));
    const mode = modeOf(c.req.query('mode'));
    const rank = db.rankFor(theme, score, true, mode);
    const cutoff = db.cutoff(theme, mode);
    const qualifies = rank <= SCORING.leaderboardSize;
    return c.json({ rank, qualifies, needed: qualifies || cutoff === null ? 0 : cutoff - score + 1 });
  });

  return api;
}
