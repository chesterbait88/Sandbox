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
  /** Scenery recipes (prop: true): placed after the structures, low value, not counted as leveled. */
  props: string[];
  propCount: [number, number];
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
    props: ['cactus', 'rock', 'car', 'roadSign'],
    propCount: [10, 16],
    structureCount: [6, 9],
    minGapM: 6,
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
    props: ['lampPost', 'car', 'dumpster', 'hydrant'],
    propCount: [12, 18],
    structureCount: [7, 10],
    minGapM: 6,
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
    props: ['tree', 'bench', 'lampPost', 'rock'],
    propCount: [14, 22],
    structureCount: [6, 9],
    minGapM: 6,
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
  gridCellM: 24,
  /** Props keep this gap (m) from anything else and get no flattened pad margin. */
  propGapM: 1
} as const;

/** Downtown street grid, in metres. Blocks are pitch − 2·(streetHalf + sidewalk) wide. */
export const CITY = {
  pitchM: 32,
  streetHalfM: 4,
  sidewalkM: 2,
  /** Kerb strip width and the dashed centre line (dash length, gap) on each street. */
  kerbM: 0.25,
  laneDashM: 2,
  laneGapM: 2,
  laneWidthM: 0.25
} as const;

/** Desert road, in metres: half width of the asphalt and the shoulder that blends into the dunes. */
export const ROAD = {
  halfWidthM: 5,
  shoulderM: 3,
  /** Buildings sit this far (min, max) beyond the shoulder. */
  setbackM: [1, 4] as [number, number],
  /** Centre line: two yellow stripes this wide, this far apart; white edge lines this far in from the edge. */
  centreLineM: 0.25,
  centreGapM: 0.25,
  edgeLineInsetM: 0.5
} as const;

/** Siting tuning. */
export const SITING = {
  hillSamples: 24,
  pathSamples: 60,
  centerJitterM: 8,
  edgeDepthM: [2, 10] as [number, number],
  besideGapM: 1
} as const;
