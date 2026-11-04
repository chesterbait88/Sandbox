import type { LoadoutMode, ThemeId } from '@vw/config';

export interface LeaderboardEntry {
  rank: number;
  initials: string;
  score: number;
  date: string;
  seed?: string;
  theme?: ThemeId;
}

export interface RoundStats {
  voxelsDestroyed: number;
  structuresLeveled: number;
  bestChain: number;
  arenaPercent: number;
  seed: string;
}

export interface Session {
  token: string;
  startedAt: number;
}

const base = '/api';

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(base + path, { headers: { 'content-type': 'application/json' }, ...init });
  if (!r.ok) throw new Error(`${path}: ${r.status}`);
  return (await r.json()) as T;
}

export const api = {
  health: () => json<{ ok: boolean }>('/health'),
  startSession: (theme: ThemeId, seed: string, mode: LoadoutMode = 'fixed') => json<Session>('/session', { method: 'POST', body: JSON.stringify({ theme, seed, mode }) }),
  submitScore: (token: string, initials: string, score: number, stats: RoundStats) =>
    json<{ rank: number; accepted: boolean; reason?: string }>('/score', { method: 'POST', body: JSON.stringify({ token, initials, score, stats }) }),
  leaderboard: (theme: ThemeId | 'all', limit = 10, mode: LoadoutMode = 'fixed') => json<{ entries: LeaderboardEntry[] }>(`/leaderboard?theme=${theme}&limit=${limit}&mode=${mode}`),
  /** Rank a score would get and the score needed for the top N. */
  qualifies: (theme: ThemeId, score: number, mode: LoadoutMode = 'fixed') => json<{ rank: number; qualifies: boolean; needed: number }>(`/qualifies?theme=${theme}&score=${score}&mode=${mode}`)
};
