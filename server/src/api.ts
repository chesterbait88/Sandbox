import { Hono } from 'hono';
import { SCORING, THEME_IDS } from '@vw/config';

/**
 * Phase 4: in-memory implementation of the API so the client flow runs end to end.
 * Phase 5 replaces storage with SQLite, signed tokens, validation, rate limiting and caching.
 */
interface Row {
  theme: string;
  seed: string;
  initials: string;
  score: number;
  date: string;
}

const rows: Row[] = [];
const sessions = new Map<string, { theme: string; seed: string; startedAt: number; used: boolean }>();

export const api = new Hono();

api.get('/health', (c) => c.json({ ok: true }));

api.post('/session', async (c) => {
  const body = await c.req.json<{ theme: string; seed: string }>().catch(() => null);
  if (!body || !THEME_IDS.includes(body.theme as (typeof THEME_IDS)[number])) return c.json({ error: 'bad theme' }, 400);
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const startedAt = Date.now();
  sessions.set(token, { theme: body.theme, seed: String(body.seed ?? ''), startedAt, used: false });
  return c.json({ token, startedAt });
});

function sorted(theme: string): Row[] {
  return rows.filter((r) => theme === 'all' || r.theme === theme).sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
}

api.post('/score', async (c) => {
  const body = await c.req.json<{ token: string; initials: string; score: number }>().catch(() => null);
  if (!body) return c.json({ accepted: false, reason: 'bad body' }, 400);
  const s = sessions.get(body.token);
  if (!s || s.used) return c.json({ accepted: false, reason: 'bad token' }, 403);
  if (!/^[A-Z ]{3}$/.test(body.initials)) return c.json({ accepted: false, reason: 'bad initials' }, 400);
  if (typeof body.score !== 'number' || body.score < 0) return c.json({ accepted: false, reason: 'bad score' }, 400);
  s.used = true;
  rows.push({ theme: s.theme, seed: s.seed, initials: body.initials, score: Math.floor(body.score), date: new Date().toISOString() });
  const rank = sorted(s.theme).findIndex((r) => r.score === Math.floor(body.score) && r.initials === body.initials) + 1;
  return c.json({ accepted: true, rank });
});

api.get('/leaderboard', (c) => {
  const theme = c.req.query('theme') ?? 'all';
  const limit = Math.min(100, Number(c.req.query('limit') ?? 10));
  const entries = sorted(theme)
    .slice(0, limit)
    .map((r, i) => ({ rank: i + 1, initials: r.initials, score: r.score, date: r.date.slice(0, 10), seed: r.seed }));
  return c.json({ entries });
});

api.get('/qualifies', (c) => {
  const theme = c.req.query('theme') ?? 'all';
  const score = Number(c.req.query('score') ?? 0);
  const list = sorted(theme);
  const rank = list.filter((r) => r.score > score).length + 1;
  const cutoff = list[SCORING.leaderboardSize - 1];
  const qualifies = rank <= SCORING.leaderboardSize;
  return c.json({ rank, qualifies, needed: qualifies ? 0 : cutoff.score - score + 1 });
});
