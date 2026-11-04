import { SCORING, THEME_IDS, THEME_MAX_SCORE } from '@vw/config';

/** Short list; rejected initials are stored as "???". */
const PROFANITY = new Set(['ASS', 'FUK', 'FUC', 'FCK', 'CUM', 'DIK', 'DIC', 'COK', 'KKK', 'FAG', 'NIG', 'JEW', 'SEX', 'TIT', 'VAG', 'WTF', 'GAY', 'HOR', 'POO', 'PIS', 'SHT', 'DAM', 'NAZ', 'CNT', 'KYS', 'DIE']);

export const INITIALS_RE = /^[A-Z ]{3}$/;

export function isTheme(t: unknown): t is (typeof THEME_IDS)[number] {
  return typeof t === 'string' && (THEME_IDS as string[]).includes(t);
}

export function cleanInitials(initials: unknown): string | null {
  if (typeof initials !== 'string' || !INITIALS_RE.test(initials)) return null;
  return PROFANITY.has(initials.replace(/ /g, '')) ? '???' : initials;
}

export function maxScoreFor(theme: string): number {
  return (THEME_MAX_SCORE[theme] ?? 0) * SCORING.maxScoreMultiplier;
}

export function validScore(theme: string, score: unknown): score is number {
  return typeof score === 'number' && Number.isFinite(score) && score >= 0 && Math.floor(score) === score && score <= maxScoreFor(theme);
}

/** Elapsed seconds since the session started must fit the round window. */
export function validElapsed(startedAt: number, now: number, skip = false): boolean {
  if (skip) return true;
  const elapsed = (now - startedAt) / 1000;
  return elapsed >= SCORING.minRoundElapsedS && elapsed <= SCORING.maxRoundElapsedS;
}

/** Sliding-window per-key counter. */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  constructor(
    private limit: number,
    private windowMs: number
  ) {}

  allow(key: string, now: number): boolean {
    const list = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (list.length >= this.limit) {
      this.hits.set(key, list);
      return false;
    }
    list.push(now);
    this.hits.set(key, list);
    return true;
  }
}
