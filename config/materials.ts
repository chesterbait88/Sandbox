export interface Material {
  id: number;
  name: string;
  /** CSS hex colour. */
  color: string;
  /** Score per destroyed voxel. */
  value: number;
  /** Energy needed to destroy a voxel. */
  hardness: number;
  terrain?: boolean;
  transparent?: boolean;
  /** Glass: any hit destroys it regardless of energy. */
  shatters?: boolean;
  emissive?: boolean;
  /** Pattern applied by the mesher. 'stripes' and 'band' alternate rows of color/color2 (band is the
   *  bottle/transformer variant, colour on odd rows so a 2-voxel bottle gets a coloured top); the
   *  rest darken or tint the base colour. */
  pattern?: 'brickRows' | 'siding' | 'marble' | 'checker' | 'stripes' | 'band';
  /** Second colour for two-tone patterns. */
  color2?: string;
  /** Secondary explosion when destroyed. */
  volatile?: { power: number; radius: number };
}

export const MATERIALS: Record<number, Material> = {
  1: { id: 1, name: 'Grass', color: '#5fc94a', value: 0, hardness: 1, terrain: true },
  2: { id: 2, name: 'Dirt', color: '#9a6239', value: 0, hardness: 1, terrain: true },
  3: { id: 3, name: 'Sand', color: '#f2d27c', value: 0, hardness: 1, terrain: true },
  4: { id: 4, name: 'Stone', color: '#7c8697', value: 0, hardness: 3, terrain: true },
  5: { id: 5, name: 'Asphalt', color: '#2f3342', value: 0, hardness: 2, terrain: true },
  6: { id: 6, name: 'Gravel', color: '#b9ac96', value: 0, hardness: 1, terrain: true, pattern: 'checker' },
  8: { id: 8, name: 'Sidewalk', color: '#cfc6b2', value: 0, hardness: 3, terrain: true },
  7: { id: 7, name: 'Water', color: '#36b4f0', value: 0, hardness: 1, terrain: true, transparent: true },
  10: { id: 10, name: 'Glass', color: '#86ecff', value: 1, hardness: 1, transparent: true, shatters: true },
  11: { id: 11, name: 'Wood', color: '#e0862e', value: 2, hardness: 2, pattern: 'siding' },
  12: { id: 12, name: 'Drywall', color: '#fff3c4', value: 1, hardness: 1 },
  13: { id: 13, name: 'Brick', color: '#e84e2c', value: 3, hardness: 3, pattern: 'brickRows' },
  14: { id: 14, name: 'Concrete', color: '#aab4c6', value: 5, hardness: 5 },
  15: { id: 15, name: 'Steel', color: '#4f7ad6', value: 8, hardness: 8 },
  16: { id: 16, name: 'Marble', color: '#fbeef4', value: 6, hardness: 5, pattern: 'marble' },
  18: { id: 18, name: 'Skin', color: '#f0b88a', value: 0, hardness: 1 },
  17: { id: 17, name: 'Neon', color: '#ff3fa4', value: 2, hardness: 1, emissive: true },
  20: { id: 20, name: 'Fuel tank', color: '#ff2e3b', value: 4, hardness: 2, pattern: 'stripes', color2: '#ffd400', volatile: { power: 60, radius: 5 } },
  21: { id: 21, name: 'Propane', color: '#f4fff8', value: 3, hardness: 1, pattern: 'band', color2: '#19d3a0', volatile: { power: 35, radius: 3 } },
  22: { id: 22, name: 'Transformer', color: '#5a46e0', value: 5, hardness: 3, pattern: 'band', color2: '#ffd400', volatile: { power: 25, radius: 2.5 } },
  // Props and scenery.
  23: { id: 23, name: 'Leaves', color: '#3fae4e', value: 1, hardness: 1 },
  24: { id: 24, name: 'Bark', color: '#6b4a2b', value: 1, hardness: 2, pattern: 'siding' },
  25: { id: 25, name: 'Rubber', color: '#23242b', value: 1, hardness: 2 },
  26: { id: 26, name: 'Enamel red', color: '#e8342a', value: 3, hardness: 3 },
  27: { id: 27, name: 'Enamel white', color: '#f2f3f5', value: 3, hardness: 3 },
  28: { id: 28, name: 'Enamel teal', color: '#1fb8b0', value: 3, hardness: 3 },
  // Terrain variety: worth nothing.
  29: { id: 29, name: 'Rock', color: '#5f6470', value: 0, hardness: 4, terrain: true },
  30: { id: 30, name: 'Dark sand', color: '#d9b45f', value: 0, hardness: 1, terrain: true },
  31: { id: 31, name: 'Road paint', color: '#e9e6d6', value: 0, hardness: 2, terrain: true },
  32: { id: 32, name: 'Lane paint', color: '#f0c419', value: 0, hardness: 2, terrain: true },
  33: { id: 33, name: 'Kerb', color: '#e3dccb', value: 0, hardness: 3, terrain: true },
  34: { id: 34, name: 'Dry grass', color: '#9cc24b', value: 0, hardness: 1, terrain: true },
  35: { id: 35, name: 'Flowers', color: '#ff6fa8', value: 0, hardness: 1, terrain: true }
};

export const MAT = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  SAND: 3,
  STONE: 4,
  ASPHALT: 5,
  GRAVEL: 6,
  WATER: 7,
  GLASS: 10,
  WOOD: 11,
  DRYWALL: 12,
  BRICK: 13,
  CONCRETE: 14,
  STEEL: 15,
  MARBLE: 16,
  NEON: 17,
  FUEL: 20,
  PROPANE: 21,
  TRANSFORMER: 22,
  /** Downtown sidewalk: terrain-valued concrete look-alike. */
  CONCRETE_SIDEWALK: 8,
  LEAVES: 23,
  BARK: 24,
  RUBBER: 25,
  ENAMEL_RED: 26,
  ENAMEL_WHITE: 27,
  ENAMEL_TEAL: 28,
  ROCK: 29,
  SAND_DARK: 30,
  ROAD_PAINT: 31,
  LANE_PAINT: 32,
  KERB: 33,
  DRY_GRASS: 34,
  FLOWERS: 35
} as const;

export const MAX_MATERIAL_ID = 40;

/** Pattern tuning */
export const PATTERNS = {
  brickDarken: 0.18,
  sidingDarken: 0.08,
  marbleTint: 0.08,
  checkerDarken: 0.06
} as const;

/** Volatile chain-reaction behaviour */
export const VOLATILE = {
  /** Delay between a tank being destroyed and its detonation (ms). */
  chainDelayMs: 150,
  /** Only one detonation per this radius (m) of volatile voxels: a 1 × 1 × 2 m tank's far voxel
   *  centres are 2.2 m apart at 0.25 m voxels. */
  dedupeRadiusM: 2.5
} as const;

export function materialOf(id: number): Material | undefined {
  return MATERIALS[id];
}
