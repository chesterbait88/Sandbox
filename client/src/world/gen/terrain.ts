import { createNoise2D } from 'simplex-noise';
import { CITY, ROAD, MAT, TERRAIN, THEMES, VOXEL_SIZE, WORLD_VOXELS, type ThemeId } from '@vw/config';
import type { Rng } from '../../util/rng';

const SX = WORLD_VOXELS.x;
const SY = WORLD_VOXELS.y;
const SZ = WORLD_VOXELS.z;
const idx = (x: number, y: number, z: number) => x + SX * (z + SZ * y);

export interface TerrainResult {
  /** Surface height in voxels per column (x + SX*z). */
  height: Int16Array;
}

/** Fill `mat` with the theme's terrain. Heights are in voxels. */
export function generateTerrain(theme: ThemeId, rng: Rng, mat: Uint8Array): TerrainResult {
  const def = THEMES[theme];
  const noise = createNoise2D(rng);
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
      fillColumn(mat, x, z, h, def.strata, surfaceOverride(theme, x, z, noise));
    }
  }
  return { height };
}

/** Desert: a flat asphalt road through the middle along x. */
function desertRoad(x: number, z: number, h: number): number {
  const centre = SZ / 2;
  const halfWidth = ROAD.halfWidth;
  const d = Math.abs(z - centre);
  if (d < halfWidth) return TERRAIN.baseLevelM / VOXEL_SIZE;
  if (d < halfWidth + ROAD.shoulder) {
    const t = (d - halfWidth) / ROAD.shoulder;
    return Math.round(h * t + (TERRAIN.baseLevelM / VOXEL_SIZE) * (1 - t));
  }
  return h;
}

function surfaceOverride(theme: ThemeId, x: number, z: number, noise: ReturnType<typeof createNoise2D>): number {
  if (theme === 'desert') {
    const d = Math.abs(z - SZ / 2);
    if (d < ROAD.halfWidth) return MAT.ASPHALT;
  }
  if (theme === 'downtown') {
    // Streets on a 32 m grid: 8 m of asphalt centred on each grid line, 2 m sidewalks either side,
    // 20 m blocks between. See CITY in config.
    const mx = x % CITY.pitch;
    const mz = z % CITY.pitch;
    const onSidewalk = (m: number) => (m >= CITY.streetHalf && m < CITY.streetHalf + CITY.sidewalk) || (m >= CITY.pitch - CITY.streetHalf - CITY.sidewalk && m < CITY.pitch - CITY.streetHalf);
    const onStreet = (m: number) => m < CITY.streetHalf || m >= CITY.pitch - CITY.streetHalf;
    if (onStreet(mx) || onStreet(mz)) return MAT.ASPHALT;
    if (onSidewalk(mx) || onSidewalk(mz)) return MAT.CONCRETE_SIDEWALK;
    return MAT.ASPHALT;
  }
  if (theme === 'park') {
    // Winding gravel paths from low-frequency noise ridges.
    const n = noise(x * 0.02, z * 0.02);
    if (Math.abs(n) < 0.04) return MAT.GRAVEL;
  }
  return 0;
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
