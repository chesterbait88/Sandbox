import { createNoise2D } from 'simplex-noise';
import { CITY, ROAD, MAT, TERRAIN, THEMES, VOXEL_SIZE, WORLD_VOXELS, type ThemeId } from '@vw/config';
import type { Rng } from '../../util/rng';

const SX = WORLD_VOXELS.x;
const SY = WORLD_VOXELS.y;
const SZ = WORLD_VOXELS.z;
const idx = (x: number, y: number, z: number) => x + SX * (z + SZ * y);
/** Metres to voxels. */
const v = (metres: number) => Math.round(metres / VOXEL_SIZE);

export interface TerrainResult {
  /** Surface height in voxels per column (x + SX*z). */
  height: Int16Array;
}

type Noise = ReturnType<typeof createNoise2D>;

/** Fill `mat` with the theme's terrain. Heights are in voxels. */
export function generateTerrain(theme: ThemeId, rng: Rng, mat: Uint8Array): TerrainResult {
  const def = THEMES[theme];
  const noise = createNoise2D(rng);
  const detail = createNoise2D(rng);
  const height = new Int16Array(SX * SZ);
  const baseV = TERRAIN.baseLevelM / VOXEL_SIZE;
  const reliefV = def.reliefM / VOXEL_SIZE;

  for (let z = 0; z < SZ; z++) {
    for (let x = 0; x < SX; x++) {
      let n = 0;
      let amp = 1;
      let freq = def.frequency * VOXEL_SIZE;
      let norm = 0;
      for (let o = 0; o < def.octaves; o++) {
        n += noise(x * freq, z * freq) * amp;
        norm += amp;
        amp *= 0.5;
        freq *= 2;
      }
      n /= norm;
      let h = Math.round(baseV + n * reliefV);
      if (theme === 'desert') h = desertRoad(x, z, h);
      height[x + SX * z] = Math.max(2, Math.min(SY - 2, h));
    }
  }

  // Theme overlays that change the surface material.
  for (let z = 0; z < SZ; z++) {
    for (let x = 0; x < SX; x++) {
      const h = height[x + SX * z];
      fillColumn(mat, x, z, h, def.strata, surfaceOverride(theme, x, z, h, height, noise, detail));
    }
  }
  return { height };
}

/** Desert: a flat asphalt road through the middle along x. */
function desertRoad(x: number, z: number, h: number): number {
  const centre = SZ / 2;
  const halfWidth = v(ROAD.halfWidthM);
  const shoulder = v(ROAD.shoulderM);
  const d = Math.abs(z - centre);
  if (d < halfWidth) return TERRAIN.baseLevelM / VOXEL_SIZE;
  if (d < halfWidth + shoulder) {
    const t = (d - halfWidth) / shoulder;
    return Math.round(h * t + (TERRAIN.baseLevelM / VOXEL_SIZE) * (1 - t));
  }
  return h;
}

/** Desert road surface at distance d (voxels) from the centre line: paint or asphalt. */
function desertRoadSurface(x: number, d: number): number {
  const halfWidth = v(ROAD.halfWidthM);
  const line = v(ROAD.centreLineM);
  const gap = v(ROAD.centreGapM);
  // Double yellow centre line.
  if (d >= Math.ceil(gap / 2) && d < Math.ceil(gap / 2) + line) return MAT.LANE_PAINT;
  // White edge lines.
  const inset = v(ROAD.edgeLineInsetM);
  if (d >= halfWidth - inset - line && d < halfWidth - inset) return MAT.ROAD_PAINT;
  void x;
  return MAT.ASPHALT;
}

/** Downtown: streets on a grid with kerbs, sidewalk rings and dashed lane lines. */
function downtownSurface(x: number, z: number): number {
  const pitch = v(CITY.pitchM);
  const streetHalf = v(CITY.streetHalfM);
  const sidewalk = v(CITY.sidewalkM);
  const kerb = v(CITY.kerbM);
  const mx = x % pitch;
  const mz = z % pitch;
  // Distance from the nearest street centre line on each axis.
  const dx = Math.min(mx, pitch - mx);
  const dz = Math.min(mz, pitch - mz);
  const onStreetX = dx < streetHalf;
  const onStreetZ = dz < streetHalf;
  if (onStreetX || onStreetZ) {
    // Dashed centre line along whichever street this is, not through intersections.
    const dash = v(CITY.laneDashM);
    const dgap = v(CITY.laneGapM);
    const lw = v(CITY.laneWidthM);
    if (onStreetX && !onStreetZ && dx < lw && (z % (dash + dgap)) < dash) return MAT.LANE_PAINT;
    if (onStreetZ && !onStreetX && dz < lw && (x % (dash + dgap)) < dash) return MAT.LANE_PAINT;
    return MAT.ASPHALT;
  }
  const onWalkX = dx < streetHalf + sidewalk;
  const onWalkZ = dz < streetHalf + sidewalk;
  if (onWalkX || onWalkZ) {
    // Kerb: the first strip of sidewalk against the street.
    if ((onWalkX && dx < streetHalf + kerb) || (onWalkZ && dz < streetHalf + kerb)) return MAT.KERB;
    return MAT.CONCRETE_SIDEWALK;
  }
  return MAT.ASPHALT;
}

function surfaceOverride(theme: ThemeId, x: number, z: number, h: number, height: Int16Array, noise: Noise, detail: Noise): number {
  if (theme === 'desert') {
    const d = Math.abs(z - SZ / 2);
    if (d < v(ROAD.halfWidthM)) return desertRoadSurface(x, d);
    // Rock outcrops on the steep bits, darker sand in the hollows between dunes.
    const slope = slopeAt(x, z, height);
    if (slope >= 2) return MAT.ROCK;
    const n = detail(x * 0.035, z * 0.035);
    if (n > 0.45) return MAT.SAND_DARK;
    return 0;
  }
  if (theme === 'downtown') return downtownSurface(x, z);
  if (theme === 'park') {
    // Winding gravel paths from low-frequency noise ridges.
    const n = noise(x * 0.01, z * 0.01);
    if (Math.abs(n) < 0.02) return MAT.GRAVEL;
    // Dry grass on the tops, flower patches in the dips, a rock here and there.
    const d = detail(x * 0.04, z * 0.04);
    if (d > 0.5) return MAT.DRY_GRASS;
    if (d < -0.62) return MAT.FLOWERS;
    if (slopeAt(x, z, height) >= 2 && detail(x * 0.2, z * 0.2) > 0.3) return MAT.ROCK;
    return 0;
  }
  void h;
  return 0;
}

/** Height difference to the lowest 4-neighbour (voxels): a proxy for slope. */
function slopeAt(x: number, z: number, height: Int16Array): number {
  const h = height[x + SX * z];
  let lo = h;
  if (x > 0) lo = Math.min(lo, height[x - 1 + SX * z]);
  if (x < SX - 1) lo = Math.min(lo, height[x + 1 + SX * z]);
  if (z > 0) lo = Math.min(lo, height[x + SX * (z - 1)]);
  if (z < SZ - 1) lo = Math.min(lo, height[x + SX * (z + 1)]);
  return h - lo;
}

function fillColumn(mat: Uint8Array, x: number, z: number, h: number, strata: [number, number][], surface: number): void {
  let y = h;
  let si = 0;
  let remaining = strata[0][1] / VOXEL_SIZE;
  let first = true;
  while (y >= 0) {
    let m = strata[si][0];
    if (first && surface) m = surface;
    mat[idx(x, y, z)] = m;
    first = false;
    y--;
    remaining--;
    if (remaining <= 0 && si < strata.length - 1) {
      si++;
      remaining = strata[si][1] / VOXEL_SIZE;
    }
  }
}
