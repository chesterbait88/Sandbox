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
  /** Pattern applied by the mesher. */
  pattern?: 'brickRows' | 'siding' | 'marble' | 'checker';
  /** Secondary explosion when destroyed. */
  volatile?: { power: number; radius: number };
}

export const MATERIALS: Record<number, Material> = {
  1: { id: 1, name: 'Grass', color: '#5a9e3c', value: 0, hardness: 1, terrain: true },
  2: { id: 2, name: 'Dirt', color: '#7a5a3a', value: 0, hardness: 1, terrain: true },
  3: { id: 3, name: 'Sand', color: '#d9c27e', value: 0, hardness: 1, terrain: true },
  4: { id: 4, name: 'Stone', color: '#8a8a85', value: 0, hardness: 3, terrain: true },
  5: { id: 5, name: 'Asphalt', color: '#3a3a3c', value: 0, hardness: 2, terrain: true },
  6: { id: 6, name: 'Gravel', color: '#a39e92', value: 0, hardness: 1, terrain: true, pattern: 'checker' },
  8: { id: 8, name: 'Sidewalk', color: '#b5b3aa', value: 0, hardness: 3, terrain: true },
  7: { id: 7, name: 'Water', color: '#4a90c8', value: 0, hardness: 1, terrain: true, transparent: true },
  10: { id: 10, name: 'Glass', color: '#a8d8f0', value: 1, hardness: 1, transparent: true, shatters: true },
  11: { id: 11, name: 'Wood', color: '#a06b3c', value: 2, hardness: 2, pattern: 'siding' },
  12: { id: 12, name: 'Drywall', color: '#e8e4da', value: 1, hardness: 1 },
  13: { id: 13, name: 'Brick', color: '#9b4a35', value: 3, hardness: 3, pattern: 'brickRows' },
  14: { id: 14, name: 'Concrete', color: '#9a9a94', value: 5, hardness: 5 },
  15: { id: 15, name: 'Steel', color: '#6b7280', value: 8, hardness: 8 },
  16: { id: 16, name: 'Marble', color: '#e6e2d8', value: 6, hardness: 5, pattern: 'marble' },
  17: { id: 17, name: 'Neon', color: '#ff4fa3', value: 2, hardness: 1, emissive: true },
  20: { id: 20, name: 'Fuel tank', color: '#c0392b', value: 4, hardness: 2, volatile: { power: 60, radius: 5 } },
  21: { id: 21, name: 'Propane', color: '#e0e0e0', value: 3, hardness: 1, volatile: { power: 35, radius: 3 } },
  22: { id: 22, name: 'Transformer', color: '#4a5568', value: 5, hardness: 3, volatile: { power: 25, radius: 2.5 } }
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
  CONCRETE_SIDEWALK: 8
} as const;

export const MAX_MATERIAL_ID = 32;

/** Pattern tuning */
export const PATTERNS = {
  brickDarken: 0.12,
  sidingDarken: 0.08,
  marbleTint: 0.08,
  checkerDarken: 0.06
} as const;

/** Volatile chain-reaction behaviour */
export const VOLATILE = {
  /** Delay between a tank being destroyed and its detonation (ms). */
  chainDelayMs: 150,
  /** Only one detonation per this radius (m) of volatile voxels. */
  dedupeRadiusM: 1
} as const;

export function materialOf(id: number): Material | undefined {
  return MATERIALS[id];
}
