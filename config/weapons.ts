export type WeaponKind = 'melee' | 'hitscan' | 'projectile' | 'thrown' | 'placed';

export interface Weapon {
  id: string;
  slot: number;
  name: string;
  role: string;
  kind: WeaponKind;
  /** Damage sphere radius (m). */
  radius: number;
  power: number;
  /** Shots per magazine; Infinity for melee. */
  magSize: number;
  /** Total ammo including the first magazine; Infinity for melee. */
  totalAmmo: number;
  /** Seconds between uses. */
  cooldown: number;
  /** Seconds to reload. */
  reloadTime: number;
  /** Reach (melee) or max raycast distance (m). */
  range: number;
  /** Shotgun pellets. */
  pellets?: number;
  /** Spread cone half-angle in radians (hip). */
  spread?: number;
  /** Projectile speed (m/s). */
  projectileSpeed?: number;
  /** Fuse seconds for thrown. */
  fuse?: number;
  automatic?: boolean;
  /** Camera recoil kick in radians. */
  recoil: number;
  /** Colour used for the view model body. */
  color: string;
  accent: string;
}

export const WEAPONS: Weapon[] = [
  { id: 'pickaxe', slot: 1, name: 'Pickaxe', role: 'precision digger', kind: 'melee', radius: 0.6, power: 6, magSize: Infinity, totalAmmo: Infinity, cooldown: 0.28, reloadTime: 0, range: 2, recoil: 0.02, color: '#8a6a3a', accent: '#9aa0a6' },
  { id: 'bat', slot: 2, name: 'Bat', role: 'glass & drywall smasher', kind: 'melee', radius: 1.2, power: 4, magSize: Infinity, totalAmmo: Infinity, cooldown: 0.5, reloadTime: 0, range: 2, recoil: 0.03, color: '#c69c6d', accent: '#222222' },
  { id: 'pistol', slot: 3, name: 'Pistol', role: 'chain starter', kind: 'hitscan', radius: 0.4, power: 5, magSize: 12, totalAmmo: 72, cooldown: 0.18, reloadTime: 1.1, range: 100, spread: 0.01, recoil: 0.025, color: '#3b3f46', accent: '#6b4a2a' },
  { id: 'shotgun', slot: 4, name: 'Shotgun', role: 'wall-eater', kind: 'hitscan', radius: 0.5, power: 5, magSize: 6, totalAmmo: 30, cooldown: 0.7, reloadTime: 1.8, range: 40, pellets: 8, spread: 0.08, recoil: 0.07, color: '#4a3a2a', accent: '#2b2b2b' },
  { id: 'rifle', slot: 5, name: 'Rifle', role: 'brick puncher', kind: 'hitscan', radius: 0.5, power: 9, magSize: 30, totalAmmo: 120, cooldown: 0.1, reloadTime: 1.6, range: 100, spread: 0.02, automatic: true, recoil: 0.015, color: '#2f3b2f', accent: '#1b1b1b' },
  { id: 'rocket', slot: 6, name: 'Rocket launcher', role: 'long-range demolition', kind: 'projectile', radius: 3, power: 55, magSize: 1, totalAmmo: 6, cooldown: 0.9, reloadTime: 1.2, range: 200, projectileSpeed: 40, recoil: 0.09, color: '#5a5f3a', accent: '#c0392b' },
  { id: 'grenade', slot: 7, name: 'Grenade', role: 'bouncing boom', kind: 'thrown', radius: 2.5, power: 40, magSize: 1, totalAmmo: 8, cooldown: 0.6, reloadTime: 0, range: 0, projectileSpeed: 16, fuse: 3, recoil: 0.02, color: '#3d5a3d', accent: '#9a9a9a' },
  { id: 'c4', slot: 8, name: 'C4', role: 'concrete breaker', kind: 'placed', radius: 4, power: 90, magSize: 1, totalAmmo: 4, cooldown: 0.4, reloadTime: 0, range: 3, recoil: 0.0, color: '#b8a070', accent: '#d0342c' }
];

export const WEAPON_BY_ID: Record<string, Weapon> = Object.fromEntries(WEAPONS.map((w) => [w.id, w]));

/** Shared projectile / melee tuning */
export const WEAPON_TUNING = {
  /** Aim-down-sights spread multiplier. */
  adsSpreadMul: 0.35,
  adsFovMul: 0.8,
  /** Grenade bounce restitution and friction. */
  grenadeRestitution: 0.45,
  grenadeFriction: 0.6,
  grenadeRadiusM: 0.15,
  /** Grenade throw upward angle bias (radians). */
  grenadeArc: 0.12,
  /** Rocket self-destruct distance (m). */
  rocketMaxRange: 220,
  /** Gravity for thrown objects (m/s²). */
  gravity: 20,
  /** Melee swing animation seconds. */
  meleeSwingTime: 0.2,
  /** Reward amounts when milestones grant ammo. */
  rewardGrenade: 1,
  rewardRocket: 1,
  rewardC4: 1
} as const;

/** View model dimensions (voxels at viewModelVoxelM each). */
export const VIEW_MODEL = {
  size: { x: 16, y: 8, z: 24 },
  voxelM: 0.1,
  /** Offset from camera (m): right, down, forward. */
  offset: { x: 0.32, y: -0.28, z: -0.5 },
  bobAmplitude: 0.015,
  bobFrequency: 9,
  recoilRecovery: 12,
  muzzleFlashMs: 60
} as const;
