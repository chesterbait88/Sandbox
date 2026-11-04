/** World dimensions and voxel scale. All units in metres unless noted. */
export const VOXEL_SIZE = 0.5;
export const WORLD_SIZE_M = { x: 128, y: 64, z: 128 } as const;
export const CHUNK_SIZE = 32;
export const WORLD_VOXELS = {
  x: WORLD_SIZE_M.x / VOXEL_SIZE,
  y: WORLD_SIZE_M.y / VOXEL_SIZE,
  z: WORLD_SIZE_M.z / VOXEL_SIZE
} as const;
export const WORLD_CHUNKS = {
  x: WORLD_VOXELS.x / CHUNK_SIZE,
  y: WORLD_VOXELS.y / CHUNK_SIZE,
  z: WORLD_VOXELS.z / CHUNK_SIZE
} as const;

/** Rendering */
export const RENDER = {
  /** Per-voxel brightness jitter, ± fraction. */
  colorJitter: 0.06,
  /** Max darkening from vertex ambient occlusion (fraction). */
  aoStrength: 0.35,
  /** Dirty chunks sent to the mesher per frame. */
  remeshPerFrame: 4,
  /** Number of mesher workers. */
  mesherWorkers: 2,
  sunIntensity: 2.2,
  hemiIntensity: 0.9,
  shadowMapSize: 2048,
  /** Camera settings */
  fov: 75,
  near: 0.05,
  far: 400
} as const;

/** Terrain generation shared parameters */
export const TERRAIN = {
  /** Base ground level as a fraction of world height. */
  baseLevelM: 16,
  /** Below this depth from the surface the strata becomes stone. */
  stoneDepthM: 4,
  /** Structure pad clearance around a footprint (m). */
  padMarginM: 2
} as const;
