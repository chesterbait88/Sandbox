export const SCORING = {
  /** Round length in seconds. */
  roundSeconds: 180,
  /** Combo meter. Heat is continuous: level = floor(heat), multiplier = 1 + level × comboStep (capped),
   *  the HUD bar shows the fraction toward the next level. Gains are sub-linear in destroyed value so a
   *  pistol shot still moves the bar and a C4 blast is about one level; each chain detonation adds a
   *  fixed amount. After a grace period the meter drains, dropping the multiplier level by level. */
  comboStep: 0.5,
  comboMax: 5,
  comboHeatPerSqrtPoint: 0.025,
  comboHeatPerDetonation: 0.5,
  comboGraceS: 1.5,
  /** One level drains in this many seconds. */
  comboDrainS: 4,
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
  /** After this many loud callouts in one burst, the rest grant their rewards quietly and quickly. */
  milestoneLoudPerBurst: 3,
  milestoneQuietDripS: 0.15,
  /** A burst ends (loud callouts allowed again) after this long without a milestone. */
  milestoneBurstResetS: 2.5,
  /** Countdown before the round starts (s). */
  countdownSeconds: 3
} as const;

/** Rewards for leveling a real structure (props excluded), on top of the leveled point bonus. */
export const LEVELED_REWARD = {
  /** Magazines added to the current weapon's reserve (one charge/grenade for thrown and placed weapons). */
  magazines: 1,
  /** Weapon power boost (fraction) and how long it lasts (s); boosts stack up to boostMax. */
  boost: 0.25,
  boostS: 12,
  boostMax: 1
} as const;

/** Plausibility ceiling per theme (sum of structure values × leveled bonus, with headroom). */
export const THEME_MAX_SCORE: Record<string, number> = {
  desert: 60000,
  downtown: 120000,
  park: 60000
};
