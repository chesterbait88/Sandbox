/** Point-buy loadouts (optional mode with its own leaderboard). */
export type LoadoutMode = 'fixed' | 'custom';

export const LOADOUT = {
  /** Points to spend in custom mode. The fixed kit (72 / 30 / 120 / 6 / 8 / 4) costs exactly this much. */
  budget: 128,
  /** Cost per unit of ammo (per round, rocket, grenade, charge). Melee is free. */
  costs: { pistol: 0.25, shotgun: 0.6, rifle: 0.2, rocket: 4, grenade: 2.5, c4: 6 } as Record<string, number>,
  /** Buy step per click (units). */
  steps: { pistol: 12, shotgun: 6, rifle: 30, rocket: 1, grenade: 1, c4: 1 } as Record<string, number>,
  /** Hard ceilings so one slot cannot eat the budget into absurdity. */
  max: { pistol: 240, shotgun: 90, rifle: 300, rocket: 20, grenade: 30, c4: 14 } as Record<string, number>,
  /** Sticky grenades (custom mode only): price for the upgrade. */
  stickyCost: 8
} as const;
