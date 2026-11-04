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
  { id: 'pickaxe', slot: 1, name: 'Pickaxe', role: 'precision digger', kind: 'melee', radius: 0.6, power: 6, magSize: Infinity, totalAmmo: Infinity, cooldown: 0.28, reloadTime: 0, range: 2, recoil: 0.02, model: [[7,0,6,8,1,23,11],[3,1,5,12,2,7,15],[2,1,6,2,1,6,15],[13,1,6,13,1,6,15]] },
  { id: 'bat', slot: 2, name: 'Bat', role: 'glass & drywall smasher', kind: 'melee', radius: 1.2, power: 4, magSize: Infinity, totalAmmo: Infinity, cooldown: 0.5, reloadTime: 0, range: 2, recoil: 0.03, model: [[7,1,14,8,2,23,11],[6,1,0,9,3,13,11],[7,2,0,8,3,13,11],[6,0,22,9,3,23,22]] },
  { id: 'pistol', slot: 3, name: 'Pistol', role: 'chain starter', kind: 'hitscan', radius: 0.4, power: 2.5, magSize: 12, totalAmmo: 72, cooldown: 0.18, reloadTime: 1.1, range: 100, spread: 0.01, recoil: 0.025, model: [[6,4,6,9,6,16,15],[7,5,3,8,5,5,15],[6,0,13,9,3,16,11],[7,3,10,8,3,12,15],[7,7,6,7,7,6,15]] },
  { id: 'shotgun', slot: 4, name: 'Shotgun', role: 'wall-eater', kind: 'hitscan', radius: 0.5, power: 5, magSize: 6, totalAmmo: 30, cooldown: 0.7, reloadTime: 1.8, range: 40, pellets: 8, spread: 0.08, recoil: 0.07, model: [[7,5,0,8,6,13,15],[6,3,5,9,4,10,11],[6,3,14,9,6,18,15],[6,2,19,9,5,23,11],[7,4,11,8,4,13,15]] },
  { id: 'rifle', slot: 5, name: 'Rifle', role: 'brick puncher', kind: 'hitscan', radius: 0.5, power: 6, magSize: 30, totalAmmo: 120, cooldown: 0.1, reloadTime: 1.6, range: 100, spread: 0.02, automatic: true, recoil: 0.015, model: [[7,5,0,8,5,8,15],[6,4,4,9,6,11,22],[6,3,12,9,6,17,15],[7,0,13,8,2,15,22],[6,3,18,9,5,23,22],[7,7,13,8,7,15,15],[7,7,2,8,7,2,15]] },
  { id: 'rocket', slot: 6, name: 'Rocket launcher', role: 'long-range demolition', kind: 'projectile', radius: 3, power: 55, magSize: 1, totalAmmo: 6, cooldown: 0.9, reloadTime: 1.2, range: 200, projectileSpeed: 40, recoil: 0.09, model: [[5,3,0,10,6,20,15],[6,2,0,9,7,20,15],[6,3,0,9,6,3,20],[7,0,12,8,2,14,22],[7,7,8,8,7,12,15],[6,0,17,9,1,19,22]] },
  { id: 'grenade', slot: 7, name: 'Grenade', role: 'bouncing boom', kind: 'thrown', radius: 2.5, power: 40, magSize: 1, totalAmmo: 8, cooldown: 0.6, reloadTime: 0, range: 0, projectileSpeed: 16, fuse: 3, recoil: 0.02, model: [[6,1,12,9,4,15,22],[7,5,12,8,5,15,15],[9,5,13,9,6,13,15],[7,0,13,8,0,14,22]] },
  { id: 'c4', slot: 8, name: 'C4', role: 'concrete breaker', kind: 'placed', radius: 4, power: 90, magSize: 1, totalAmmo: 4, cooldown: 0.4, reloadTime: 0, range: 3, recoil: 0.0, model: [[5,0,10,10,3,17,12],[5,2,12,10,2,14,20],[7,4,13,8,4,13,22],[8,4,13,8,5,13,17]] }
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
  /** Bullets and melee centre their damage sphere on the hit voxel's centre, so the hit voxel
   *  always receives the full power and neighbours get the falloff. */
  snapToVoxelCentre: true,
  /** Rockets explode this far past the contact point so the sphere bites the surface (m). */
  rocketBiteM: 0.25,
  /** A grenade comes to rest below this speed (m/s). */
  grenadeRestSpeed: 0.6,
  /** Scale of thrown/placed object meshes relative to view-model voxels. */
  projectileVoxelM: 0.06,
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
  voxelM: 0.025,
  /** Offset from camera (m): right, down, forward. */
  offset: { x: 0.28, y: -0.24, z: -0.75 },
  bobAmplitude: 0.015,
  bobFrequency: 9,
  recoilRecovery: 12,
  muzzleFlashMs: 60,
  /** Hands: two skin blocks either side of the grip. */
  handMat: 18,
  /** Loadout screen showcase camera (m from the model centre) and its vertical FOV. */
  showcase: { x: 0, y: 0.16, z: 0.72, fov: 42 }
} as const;

/** Small voxel models for things that leave the player's hands. */
export const PROJECTILE_MODELS: Record<string, ModelBox[]> = {
  grenade: [[0, 0, 0, 3, 4, 3, 22], [1, 5, 1, 2, 5, 2, 15]],
  rocket: [[0, 0, 0, 2, 2, 8, 15], [0, 0, 9, 2, 2, 11, 20]],
  c4: [[0, 0, 0, 5, 2, 4, 12], [1, 3, 1, 4, 3, 3, 17]]
};
