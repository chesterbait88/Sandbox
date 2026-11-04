export const SCORING = {
  /** Round length in seconds. */
  roundSeconds: 180,
  /** Combo window length after a detonation (s). */
  comboWindowS: 2,
  comboStep: 0.5,
  comboMax: 5,
  /** Bonus fraction of a structure's total value when fully leveled. */
  leveledBonus: 0.5,
  /** Fraction of a structure's value that must be destroyed to count as leveled. */
  leveledThreshold: 1.0,
  /** Slow-motion freeze at round end (s) and its time scale. */
  endFreezeS: 1.5,
  endFreezeScale: 0.15,
  /** How long the structure readout stays visible (s). */
  readoutSeconds: 3,
  /** Leaderboard size per theme. */
  leaderboardSize: 100,
  /** Session token must be between these ages (s) when a score is posted. */
  minRoundElapsedS: 150,
  maxRoundElapsedS: 600,
  /** Server rejects scores above themeMaxScore × this. */
  maxScoreMultiplier: 5,
  /** Rate limit for session creation, per IP per minute. */
  sessionRateLimitPerMin: 10,
  leaderboardCacheMs: 5000,
  /** Milestones earned in one burst are announced one per this many seconds. */
  milestoneDripS: 0.6,
  /** Countdown before the round starts (s). */
  countdownSeconds: 3
} as const;

/** Plausibility ceiling per theme (sum of structure values × leveled bonus, with headroom). */
export const THEME_MAX_SCORE: Record<string, number> = {
  desert: 60000,
  downtown: 120000,
  park: 60000
};
