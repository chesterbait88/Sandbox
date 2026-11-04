import { WEAPON_MODELS } from './weaponModels';

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
  /** Resting rotation of the in-hand model (radians: pitch, yaw, roll) on top of VIEW_MODEL.pose. */
  pose?: [number, number, number];
}

/** Inclusive box of view-model voxels filled with a material. */
export type ModelBox = [x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, mat: number];

export const WEAPONS: Weapon[] = [
  { id: 'pickaxe', slot: 1, name: 'Pickaxe', role: 'precision digger', kind: 'melee', radius: 0.6, power: 6, magSize: Infinity, totalAmmo: Infinity, cooldown: 0.28, reloadTime: 0, range: 2, recoil: 0.02, model: WEAPON_MODELS.pickaxe, pose: [0.35, 0.25, -0.2] },
  { id: 'bat', slot: 2, name: 'Bat', role: 'glass & drywall smasher', kind: 'melee', radius: 1.2, power: 4, magSize: Infinity, totalAmmo: Infinity, cooldown: 0.5, reloadTime: 0, range: 2, recoil: 0.03, model: WEAPON_MODELS.bat, pose: [0.55, 0.3, -0.15] },
  { id: 'pistol', slot: 3, name: 'Pistol', role: 'chain starter', kind: 'hitscan', radius: 0.4, power: 2.5, magSize: 12, totalAmmo: 72, cooldown: 0.18, reloadTime: 1.1, range: 100, spread: 0.01, recoil: 0.025, model: WEAPON_MODELS.pistol },
  { id: 'shotgun', slot: 4, name: 'Shotgun', role: 'wall-eater', kind: 'hitscan', radius: 0.5, power: 5, magSize: 6, totalAmmo: 30, cooldown: 0.7, reloadTime: 1.8, range: 40, pellets: 8, spread: 0.08, recoil: 0.07, model: WEAPON_MODELS.shotgun },
  { id: 'rifle', slot: 5, name: 'Rifle', role: 'brick puncher', kind: 'hitscan', radius: 0.5, power: 6, magSize: 30, totalAmmo: 120, cooldown: 0.1, reloadTime: 1.6, range: 100, spread: 0.02, automatic: true, recoil: 0.015, model: WEAPON_MODELS.rifle },
  { id: 'rocket', slot: 6, name: 'Rocket launcher', role: 'long-range demolition', kind: 'projectile', radius: 3, power: 55, magSize: 1, totalAmmo: 6, cooldown: 0.9, reloadTime: 1.2, range: 200, projectileSpeed: 40, recoil: 0.09, model: WEAPON_MODELS.rocket },
  { id: 'grenade', slot: 7, name: 'Grenade', role: 'bouncing boom', kind: 'thrown', radius: 2.5, power: 40, magSize: 1, totalAmmo: 8, cooldown: 0.6, reloadTime: 0, range: 0, projectileSpeed: 16, fuse: 3, recoil: 0.02, model: WEAPON_MODELS.grenade, pose: [0.1, -0.3, 0] },
  { id: 'c4', slot: 8, name: 'C4', role: 'concrete breaker', kind: 'placed', radius: 4, power: 90, magSize: 1, totalAmmo: 4, cooldown: 0.4, reloadTime: 0, range: 3, recoil: 0.0, model: WEAPON_MODELS.c4, pose: [0.2, -0.35, 0] }
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
  /** Voxel size (m) of thrown/placed object meshes: 1.6× the in-hand voxel so they read at range. */
  projectileVoxelM: 0.02,
  /** Melee swing animation seconds. */
  meleeSwingTime: 0.2,
  /** Reward amounts when milestones grant ammo. */
  rewardGrenade: 1,
  rewardRocket: 1,
  rewardC4: 1
} as const;

/** View model dimensions (voxels at voxelM each). Models live in config/weaponModels.ts. */
export const VIEW_MODEL = {
  size: { x: 32, y: 32, z: 64 },
  /** In-hand voxel (m). Smaller than the projectile voxel on purpose: view models render at ~70 % of
   *  physical size so a 0.8 m rifle does not fill the frame (the usual FPS trick, since the overlay
   *  shares the world camera's FOV). */
  voxelM: 0.0085,
  /** Offset of the model centre from the camera (m): right, down, forward. */
  offset: { x: 0.21, y: -0.17, z: -0.78 },
  /** Resting rotation of the whole view model (pitch, yaw, roll): yaw turns the muzzle toward the crosshair. */
  pose: [0.03, 0.16, 0] as [number, number, number],
  bobAmplitude: 0.015,
  bobFrequency: 9,
  recoilRecovery: 12,
  muzzleFlashMs: 60,
  /** Skin material id used by the hands built into every model. */
  handMat: 18,
  /** Loadout screen showcase camera (m from the model centre) and its vertical FOV. */
  showcase: { x: 0, y: 0.22, z: 0.86, fov: 42 }
} as const;

export { PROJECTILE_MODELS } from './weaponModels';
