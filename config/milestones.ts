export type MilestoneReward = 'grenade' | 'rocket' | 'c4' | 'time';

export interface MilestoneTier {
  /** Score at which this tier fires. */
  score: number;
  callout: string;
  reward: MilestoneReward;
}

/** Points between milestones; tiers repeat with cycling callouts after the table ends. */
export const MILESTONE_INTERVAL = 1000;

export const MILESTONE_CALLOUTS = [
  'WRECKING',
  'DEMOLITION',
  'TOTAL CHAOS',
  'RAMPAGE',
  'UNSTOPPABLE',
  'ANNIHILATION',
  'APOCALYPSE'
] as const;

export const MILESTONE_REWARDS: MilestoneReward[] = ['grenade', 'rocket', 'c4', 'time'];

/** Seconds added by a 'time' reward. */
export const MILESTONE_TIME_BONUS_S = 5;

export function milestoneFor(index: number): MilestoneTier {
  return {
    score: (index + 1) * MILESTONE_INTERVAL,
    callout: MILESTONE_CALLOUTS[index % MILESTONE_CALLOUTS.length],
    reward: MILESTONE_REWARDS[index % MILESTONE_REWARDS.length]
  };
}
