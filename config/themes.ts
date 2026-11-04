export type ThemeId = 'desert' | 'downtown' | 'park';

export interface ThemeDef {
  id: ThemeId;
  name: string;
  description: string;
  /** Terrain relief amplitude (m, ±). */
  reliefM: number;
  /** Noise octaves and base frequency (cycles per metre). */
  octaves: number;
  frequency: number;
  /** Strata from the surface downward: [material, thickness in metres]; last one fills to bedrock. */
  strata: [number, number][];
  /** Structure recipe ids in the pool. */
  pool: string[];
  /** How many structures to place. */
  structureCount: [number, number];
  /** Min gap between structure footprints (m). */
  minGapM: number;
  /** Sky, fog and sun colours. */
  sky: string;
  horizon: string;
  fog: string;
  sun: string;
  fogDensity: number;
  /** Card accent colour in the picker. */
  accent: string;
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  desert: {
    id: 'desert',
    name: 'Desert Highway',
    description: 'Rolling dunes, one lonely road, and a gas station full of fuel tanks.',
    reliefM: 6,
    octaves: 3,
    frequency: 1 / 48,
    strata: [
      [3, 3],
      [4, 99]
    ],
    pool: ['gasStation', 'diner', 'billboard', 'waterTower', 'propaneCage'],
    structureCount: [6, 9],
    minGapM: 10,
    sky: '#ffb36b',
    horizon: '#ffe3b0',
    fog: '#f0c995',
    sun: '#fff1d6',
    fogDensity: 0.0035,
    accent: '#ff8a3c'
  },
  downtown: {
    id: 'downtown',
    name: 'Downtown',
    description: 'Flat asphalt grid, glass office blocks, and transformers humming in the alleys.',
    reliefM: 1,
    octaves: 2,
    frequency: 1 / 64,
    strata: [
      [5, 1],
      [2, 2],
      [4, 99]
    ],
    pool: ['convenienceStore', 'officeBlock', 'parkingStructure', 'busShelter', 'propaneCage'],
    structureCount: [7, 10],
    minGapM: 10,
    sky: '#6a8fc9',
    horizon: '#c9d9ef',
    fog: '#b8c6da',
    sun: '#ffffff',
    fogDensity: 0.004,
    accent: '#4fc3ff'
  },
  park: {
    id: 'park',
    name: 'Memorial Park',
    description: 'Gentle hills, marble monuments, and a maintenance shed nobody should have put fuel in.',
    reliefM: 3,
    octaves: 3,
    frequency: 1 / 40,
    strata: [
      [1, 1],
      [2, 3],
      [4, 99]
    ],
    pool: ['monument', 'fountain', 'gazebo', 'statue', 'shed'],
    structureCount: [6, 9],
    minGapM: 10,
    sky: '#7fb8ff',
    horizon: '#e4f0ff',
    fog: '#cfe2f3',
    sun: '#fff8e6',
    fogDensity: 0.003,
    accent: '#6ee37a'
  }
};

export const THEME_IDS: ThemeId[] = ['desert', 'downtown', 'park'];

/** Placement tuning */
export const PLACEMENT = {
  /** Keep this many metres of the arena edge clear. */
  edgeMarginM: 10,
  /** Spawn pad size (m) and its distance from the arena edge. */
  spawnPadM: 8,
  spawnEdgeM: 6,
  /** Max placement attempts per structure. */
  maxAttempts: 40,
  /** Grid cell size for jittered placement (m). */
  gridCellM: 36
} as const;

/** Downtown street grid, in voxels. Blocks are pitch − 2·(streetHalf + sidewalk) wide. */
export const CITY = {
  pitch: 64,
  streetHalf: 8,
  sidewalk: 4
} as const;

/** Desert road, in voxels: half width of the asphalt and the shoulder that blends into the dunes. */
export const ROAD = {
  halfWidth: 12,
  shoulder: 6,
  /** Buildings sit this far (min, max) beyond the shoulder. */
  setback: [2, 8] as [number, number]
} as const;

/** Siting tuning. */
export const SITING = {
  hillSamples: 24,
  pathSamples: 60,
  centerJitter: 16,
  edgeDepth: [4, 20] as [number, number],
  besideGap: 2
} as const;
