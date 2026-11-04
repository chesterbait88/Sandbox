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
  /** Hemisphere light: sky side is `horizon`, ground side is this. */
  hemiGround: string;
  /** Direction toward the sun (unitless); low y = golden hour. */
  sunDir: [number, number, number];
  /** Sun and hemisphere intensity multipliers on RENDER.sunIntensity / hemiIntensity. */
  sunMul: number;
  hemiMul: number;
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
    // Golden hour: violet sky, pink haze, low gold sun.
    sky: '#6a2f9e',
    horizon: '#ff9fc0',
    fog: '#e58fb0',
    sun: '#ffd28a',
    fogDensity: 0.005,
    hemiGround: '#8a5a30',
    sunDir: [1, 0.42, -0.55],
    sunMul: 1.05,
    hemiMul: 1.1,
    accent: '#ff2fd0'
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
    // Blue hour: deep sky, cool haze, warm sodium-tinted key light so the neon signs carry.
    sky: '#152452',
    horizon: '#5c7fd6',
    fog: '#3b508f',
    sun: '#ffe2b8',
    fogDensity: 0.0055,
    hemiGround: '#2a1d3f',
    sunDir: [0.6, 0.7, 0.35],
    sunMul: 0.95,
    hemiMul: 1.25,
    accent: '#22f4ff'
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
    // Evening: teal-blue sky, soft warm sun just above the trees.
    sky: '#2b5a9a',
    horizon: '#a8d8ff',
    fog: '#8fbde0',
    sun: '#fff0c8',
    fogDensity: 0.0045,
    hemiGround: '#2d4a24',
    sunDir: [-0.7, 0.5, 0.45],
    sunMul: 1.0,
    hemiMul: 1.1,
    accent: '#9dff3a'
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
