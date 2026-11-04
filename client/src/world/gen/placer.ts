import { PLACEMENT, TERRAIN, THEMES, VOXEL_SIZE, WORLD_VOXELS, type ThemeId } from '@vw/config';
import { randInt, type Rng } from '../../util/rng';
import type { StructureInfo } from '../World';
import { StructureCtx } from './StructureCtx';
import { RECIPES } from './recipes';

export interface Placed {
  structures: StructureInfo[];
  spawn: { x: number; y: number; z: number };
  spawnYaw: number;
}

const SX = WORLD_VOXELS.x;
const SY = WORLD_VOXELS.y;
const SZ = WORLD_VOXELS.z;
const idx = (x: number, y: number, z: number) => x + SX * (z + SZ * y);

interface Rect {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}

function overlaps(a: Rect, b: Rect, gap: number): boolean {
  return a.x0 - gap < b.x1 && a.x1 + gap > b.x0 && a.z0 - gap < b.z1 && a.z1 + gap > b.z0;
}

/** Flatten a rectangle of terrain to height h and refill its strata; keeps the height map in sync. */
function stampPad(theme: ThemeId, mat: Uint8Array, height: Int16Array, r: Rect, h: number): void {
  const strata = THEMES[theme].strata;
  for (let z = Math.max(0, r.z0); z <= Math.min(SZ - 1, r.z1); z++) {
    for (let x = Math.max(0, r.x0); x <= Math.min(SX - 1, r.x1); x++) {
      const cur = height[x + SX * z];
      if (cur === h) continue;
      for (let y = h + 1; y <= Math.max(cur, h); y++) mat[idx(x, y, z)] = 0;
      let y = h;
      let si = 0;
      let remaining = strata[0][1] / VOXEL_SIZE;
      while (y >= 0 && y > cur - 1) {
        mat[idx(x, y, z)] = strata[si][0];
        y--;
        remaining--;
        if (remaining <= 0 && si < strata.length - 1) {
          si++;
          remaining = strata[si][1] / VOXEL_SIZE;
        }
      }
      // Below the previous surface the strata already exist except for the surface voxel itself.
      if (cur > h) {
        // Columns that were cut down: convert the new top voxel to the surface material.
        mat[idx(x, h, z)] = strata[0][0];
      }
      height[x + SX * z] = h;
    }
  }
}

/** Median terrain height over a rectangle (voxels). */
function padHeight(height: Int16Array, r: Rect): number {
  const hs: number[] = [];
  for (let z = Math.max(0, r.z0); z <= Math.min(SZ - 1, r.z1); z += 2) for (let x = Math.max(0, r.x0); x <= Math.min(SX - 1, r.x1); x += 2) hs.push(height[x + SX * z]);
  hs.sort((a, b) => a - b);
  return hs[Math.floor(hs.length / 2)];
}

/** Rectangles no structure may touch: the spawn pad and, in the desert, the road. */
function reserved(theme: ThemeId): Rect[] {
  const list: Rect[] = [];
  const pad = Math.round(PLACEMENT.spawnPadM / VOXEL_SIZE);
  const sz = Math.round(PLACEMENT.spawnEdgeM / VOXEL_SIZE);
  list.push({ x0: SX / 2 - pad, z0: 0, x1: SX / 2 + pad, z1: sz + pad });
  if (theme === 'desert') {
    const half = Math.round(6 / VOXEL_SIZE) + 2;
    list.push({ x0: 0, z0: SZ / 2 - half, x1: SX - 1, z1: SZ / 2 + half });
  }
  return list;
}

/**
 * Place 6–10 structures from the theme's pool on a jittered grid with a minimum gap, flattening a
 * pad under each, and clear a spawn pad at the −z edge facing the arena.
 */
export function placeStructures(theme: ThemeId, rng: Rng, mat: Uint8Array, owner: Uint16Array, height: Int16Array, terrainOnly: boolean): Placed {
  const def = THEMES[theme];
  const structures: StructureInfo[] = [];
  const taken: Rect[] = reserved(theme);
  const gap = Math.round(def.minGapM / VOXEL_SIZE);
  const margin = Math.round(PLACEMENT.edgeMarginM / VOXEL_SIZE);
  const padMargin = Math.round(TERRAIN.padMarginM / VOXEL_SIZE);

  // Spawn pad.
  const spawnR = taken[0];
  const spawnH = padHeight(height, spawnR);
  stampPad(theme, mat, height, spawnR, spawnH);

  if (!terrainOnly) {
    const count = randInt(rng, def.structureCount[0], def.structureCount[1]);
    // Jittered grid cells, shuffled, as first candidates; random spots after.
    const cell = Math.round(PLACEMENT.gridCellM / VOXEL_SIZE);
    const cells: { x: number; z: number }[] = [];
    for (let cx = margin; cx + cell <= SX - margin; cx += cell) for (let cz = margin + gap; cz + cell <= SZ - margin; cz += cell) cells.push({ x: cx, z: cz });
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    const pool = def.pool.slice();
    let id = 1;
    for (let n = 0; n < count; n++) {
      const recipe = RECIPES[pool[n % pool.length]];
      if (!recipe) continue;
      const fp = recipe.footprint(rng);
      let placedRect: Rect | null = null;
      for (let attempt = 0; attempt < PLACEMENT.maxAttempts && !placedRect; attempt++) {
        let x0: number;
        let z0: number;
        const c = cells[attempt];
        if (c) {
          x0 = c.x + Math.floor(rng() * Math.max(1, cell - fp.x));
          z0 = c.z + Math.floor(rng() * Math.max(1, cell - fp.z));
        } else {
          x0 = margin + Math.floor(rng() * (SX - 2 * margin - fp.x));
          z0 = margin + Math.floor(rng() * (SZ - 2 * margin - fp.z));
        }
        const r: Rect = { x0, z0, x1: x0 + fp.x - 1, z1: z0 + fp.z - 1 };
        if (r.x1 >= SX - margin || r.z1 >= SZ - margin) continue;
        if (taken.some((t) => overlaps(r, t, gap))) continue;
        placedRect = r;
      }
      if (!placedRect) continue;
      const padRect: Rect = { x0: placedRect.x0 - padMargin, z0: placedRect.z0 - padMargin, x1: placedRect.x1 + padMargin, z1: placedRect.z1 + padMargin };
      const h = Math.min(SY - fp.y - 2, padHeight(height, padRect));
      stampPad(theme, mat, height, padRect, h);
      const ctx = new StructureCtx(mat, owner, id, { x: placedRect.x0, y: h + 1, z: placedRect.z0 });
      recipe.build(ctx, rng, fp);
      structures.push({ id, name: recipe.name, totalValue: Math.round(ctx.totalValue), center: ctx.center(), voxels: ctx.voxels });
      taken.push(placedRect);
      id++;
      // Shuffle the pool order used by the next pass so counts above the pool size vary.
      if ((n + 1) % pool.length === 0) pool.sort(() => rng() - 0.5);
    }
  }

  const sx = SX / 2;
  const sz = Math.round(PLACEMENT.spawnEdgeM / VOXEL_SIZE);
  return {
    structures,
    spawn: { x: sx * VOXEL_SIZE, y: (height[sx + SX * sz] + 1) * VOXEL_SIZE, z: sz * VOXEL_SIZE },
    spawnYaw: Math.PI
  };
}
