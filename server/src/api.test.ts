import { describe, expect, it, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { SCORING } from '@vw/config';
import { createApi } from './api';
import { Db } from './db';
import { TokenSigner } from './token';
import { cleanInitials, validScore } from './validate';

function make(skipTime = false) {
  let t = 1_700_000_000_000;
  const db = new Db(':memory:');
  const signer = new TokenSigner('test-secret-12345');
  const app = new Hono();
  app.route('/api', createApi({ db, signer, skipTimeCheck: skipTime, now: () => t }));
  const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
    app.request(path, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', ...headers } });
  const get = (path: string) => app.request(path);
  return { app, db, signer, post, get, advance: (ms: number) => (t += ms), now: () => t };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function json(r: Response | Promise<Response>): Promise<any> {
  return (await r).json();
}

describe('tokens', () => {
  it('round-trip and tamper detection', () => {
    const s = new TokenSigner('secret-abc');
    const tok = s.sign({ theme: 'desert', seed: 'X', startedAt: 1, nonce: 'n' });
    expect(s.verify(tok)?.theme).toBe('desert');
    expect(s.verify(tok.slice(0, -2) + 'zz')).toBeNull();
    const [body] = tok.split('.');
    expect(s.verify(body + '.forged')).toBeNull();
    expect(new TokenSigner('other').verify(tok)).toBeNull();
  });
});

describe('validate', () => {
  it('initials', () => {
    expect(cleanInitials('ZAC')).toBe('ZAC');
    expect(cleanInitials('A B')).toBe('A B');
    expect(cleanInitials('ass')).toBeNull();
    expect(cleanInitials('ASS')).toBe('???');
    expect(cleanInitials('ABCD')).toBeNull();
  });
  it('score cap', () => {
    expect(validScore('desert', 1000)).toBe(true);
    expect(validScore('desert', 60000 * SCORING.maxScoreMultiplier + 1)).toBe(false);
    expect(validScore('desert', -1)).toBe(false);
    expect(validScore('desert', 1.5)).toBe(false);
  });
});

describe('api', () => {
  let m: ReturnType<typeof make>;
  beforeEach(() => (m = make()));

  it('a forged score is rejected, a real round is accepted once', async () => {
    const forged = await m.post('/api/score', { token: 'nope.nope', initials: 'ZAC', score: 999 });
    expect(forged.status).toBe(403);
    const s = await json(m.post('/api/session', { theme: 'desert', seed: 'S1' }));
    expect(typeof s.token).toBe('string');
    const early = await m.post('/api/score', { token: s.token, initials: 'ZAC', score: 1200 });
    expect(early.status).toBe(403); // under 150 s
    m.advance(200_000);
    const ok = await json(m.post('/api/score', { token: s.token, initials: 'ZAC', score: 1200, stats: { bestChain: 2 } }));
    expect(ok).toMatchObject({ accepted: true, rank: 1 });
    const again = await m.post('/api/score', { token: s.token, initials: 'ZAC', score: 5000 });
    expect(again.status).toBe(403);
    const board = await json(m.get('/api/leaderboard?theme=desert'));
    expect(board.entries).toHaveLength(1);
    expect(board.entries[0]).toMatchObject({ rank: 1, initials: 'ZAC', score: 1200 });
  });

  it('rejects implausible scores, bad initials and stale tokens', async () => {
    const s = await json(m.post('/api/session', { theme: 'park', seed: 'S' }));
    m.advance(200_000);
    expect((await m.post('/api/score', { token: s.token, initials: 'ZAC', score: 10_000_000 })).status).toBe(400);
    expect((await m.post('/api/score', { token: s.token, initials: 'zac', score: 10 })).status).toBe(400);
    m.advance(500_000);
    expect((await m.post('/api/score', { token: s.token, initials: 'ZAC', score: 10 })).status).toBe(403);
  });

  it('rate limits session creation per IP', async () => {
    for (let i = 0; i < SCORING.sessionRateLimitPerMin; i++) expect((await m.post('/api/session', { theme: 'desert', seed: 'S' }, { 'x-forwarded-for': '1.2.3.4' })).status).toBe(200);
    expect((await m.post('/api/session', { theme: 'desert', seed: 'S' }, { 'x-forwarded-for': '1.2.3.4' })).status).toBe(429);
    expect((await m.post('/api/session', { theme: 'desert', seed: 'S' }, { 'x-forwarded-for': '5.6.7.8' })).status).toBe(200);
  });

  it('qualifies reports rank and the points needed; all merges themes', async () => {
    const submit = async (theme: string, score: number, initials = 'AAA') => {
      const s = await json(m.post('/api/session', { theme, seed: 'S' }));
      m.advance(200_000);
      return json(m.post('/api/score', { token: s.token, initials, score }));
    };
    await submit('desert', 500);
    await submit('downtown', 900);
    const q = await json(m.get('/api/qualifies?theme=desert&score=400'));
    expect(q).toMatchObject({ rank: 2, qualifies: true, needed: 0 });
    const all = await json(m.get('/api/leaderboard?theme=all&limit=10'));
    expect(all.entries.map((e: { score: number }) => e.score)).toEqual([900, 500]);
    expect(cleanInitials('ASS')).toBe('???');
  });

  it('leaderboard is cached for 5 s and invalidated by a submission', async () => {
    const first = await json(m.get('/api/leaderboard?theme=all'));
    expect(first.entries).toHaveLength(0);
    const s = await json(m.post('/api/session', { theme: 'desert', seed: 'S' }));
    m.advance(200_000);
    await m.post('/api/score', { token: s.token, initials: 'BBB', score: 10 });
    const second = await json(m.get('/api/leaderboard?theme=all'));
    expect(second.entries).toHaveLength(1);
  });
});
