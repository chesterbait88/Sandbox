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
  /** View model: boxes in view-model voxel units (x right, y up, z toward the camera), material ids. */
  model: ModelBox[];
}

/** Inclusive box of view-model voxels filled with a material. */
export type ModelBox = [x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: number];

export const WEAPONS: Weapon[] = [
  { id: 'pickaxe', slot: 1, name: 'Pickaxe', role: 'precision digger', kind: 'melee', radius: 0.6, power: 6, magSize: Infinity, totalAmmo: Infinity, cooldown: 0.28, reloadTime: 0, range: 2, recoil: 0.02, model: [[7,0,10,8,1,23,11],[4,0,6,11,2,9,15],[6,2,6,9,3,7,15]] },
  { id: 'bat', slot: 2, name: 'Bat', role: 'glass & drywall smasher', kind: 'melee', radius: 1.2, power: 4, magSize: Infinity, totalAmmo: Infinity, cooldown: 0.5, reloadTime: 0, range: 2, recoil: 0.03, model: [[7,0,12,8,1,23,11],[6,0,2,9,2,11,11],[7,0,0,8,1,1,22]] },
  { id: 'pistol', slot: 3, name: 'Pistol', role: 'chain starter', kind: 'hitscan', radius: 0.4, power: 5, magSize: 12, totalAmmo: 72, cooldown: 0.18, reloadTime: 1.1, range: 100, spread: 0.01, recoil: 0.025, model: [[6,2,4,9,4,14,15],[6,0,11,9,3,15,22],[7,3,0,8,3,3,15]] },
  { id: 'shotgun', slot: 4, name: 'Shotgun', role: 'wall-eater', kind: 'hitscan', radius: 0.5, power: 5, magSize: 6, totalAmmo: 30, cooldown: 0.7, reloadTime: 1.8, range: 40, pellets: 8, spread: 0.08, recoil: 0.07, model: [[6,2,0,9,4,10,15],[6,1,11,9,4,18,11],[5,0,16,10,3,23,11],[7,1,11,8,1,15,15]] },
  { id: 'rifle', slot: 5, name: 'Rifle', role: 'brick puncher', kind: 'hitscan', radius: 0.5, power: 9, magSize: 30, totalAmmo: 120, cooldown: 0.1, reloadTime: 1.6, range: 100, spread: 0.02, automatic: true, recoil: 0.015, model: [[6,2,0,9,4,12,15],[6,1,10,9,5,16,22],[5,0,17,10,4,23,11],[7,0,11,8,0,14,22],[6,5,8,9,5,12,15]] },
  { id: 'rocket', slot: 6, name: 'Rocket launcher', role: 'long-range demolition', kind: 'projectile', radius: 3, power: 55, magSize: 1, totalAmmo: 6, cooldown: 0.9, reloadTime: 1.2, range: 200, projectileSpeed: 40, recoil: 0.09, model: [[4,1,0,11,6,20,15],[5,2,21,10,5,23,22],[4,0,0,11,0,5,20],[5,1,0,10,1,4,20],[6,7,8,9,7,12,15]] },
  { id: 'grenade', slot: 7, name: 'Grenade', role: 'bouncing boom', kind: 'thrown', radius: 2.5, power: 40, magSize: 1, totalAmmo: 8, cooldown: 0.6, reloadTime: 0, range: 0, projectileSpeed: 16, fuse: 3, recoil: 0.02, model: [[6,0,10,9,4,14,22],[5,1,11,10,3,13,22],[7,5,11,8,6,13,15],[6,5,12,9,5,12,15]] },
  { id: 'c4', slot: 8, name: 'C4', role: 'concrete breaker', kind: 'placed', radius: 4, power: 90, magSize: 1, totalAmmo: 4, cooldown: 0.4, reloadTime: 0, range: 3, recoil: 0.0, model: [[4,0,8,11,3,18,12],[5,4,10,10,4,16,17],[7,4,9,8,5,9,22]] }
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
