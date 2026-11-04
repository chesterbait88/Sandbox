/** World dimensions and voxel scale. All units in metres unless noted. */
export const VOXEL_SIZE = 0.25;
export const WORLD_SIZE_M = { x: 96, y: 40, z: 96 } as const;
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
  /** Per-voxel edge outline: width as a fraction of a voxel, darkening at the edge. */
  outlineWidth: 0.07,
  outlineStrength: 0.42,
  /** Light bevel along the top and left edge of each face. */
  bevelWidth: 0.16,
  bevelStrength: 0.14,
  /** Diagonal cross-hatch inside each face: lines per voxel and darkening. 0 disables. */
  hatchLines: 3,
  hatchStrength: 0.07,
  /** Multipliers on outline / bevel / hatch strength for terrain faces (the `terr` vertex attribute),
   *  so ground reads as ground and buildings keep the full voxel treatment. */
  terrainStyle: { outline: 0.3, bevel: 0.5, hatch: 0 },
  /** Same multipliers for the weapon in hand, so it reads as a solid object rather than a grid. */
  viewModelStyle: { outline: 0.35, bevel: 0.8, hatch: 0 },
  /** Dirty chunks sent to the mesher per frame. */
  remeshPerFrame: 4,
  /** Chunks per frame while a whole world is loading. */
  remeshBurst: 64,
  /** Number of mesher workers. */
  mesherWorkers: 2,
  sunIntensity: 2.2,
  hemiIntensity: 0.9,
  shadowMapSize: 2048,
  shadowBias: -0.0002,
  shadowNormalBias: 0.6,
  /** Camera settings */
  fov: 75,
  near: 0.05,
  far: 400
} as const;

/** Terrain generation shared parameters */
export const TERRAIN = {
  /** Base ground level (m). */
  baseLevelM: 8,
  /** Below this depth from the surface the strata becomes stone. */
  stoneDepthM: 4,
  /** Structure pad clearance around a footprint (m). */
  padMarginM: 2
} as const;

/** Menu backdrop camera: orbit around the arena centre. */
export const MENU_CAMERA = {
  orbitSpeed: 0.08,
  radiusM: 70,
  heightM: 26,
  lookDownM: -4
} as const;
