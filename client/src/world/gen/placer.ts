import { CITY, MAT, PLACEMENT, ROAD, SITING, TERRAIN, THEMES, VOXEL_SIZE, WORLD_VOXELS, type ThemeId } from '@vw/config';
import { randInt, type Rng } from '../../util/rng';
import type { StructureInfo } from '../World';
import { StructureCtx } from './StructureCtx';
import { RECIPES, type Recipe } from './recipes';
import type { Footprint, SitingKind } from './recipes/types';

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

interface Spot {
  x0: number;
  z0: number;
  mirror: boolean;
  /** Gap to use against taken rects (voxels); defaults to the theme gap. */
  gap?: number;
  /** Allowed to come this close to the arena edge (voxels). */
  margin?: number;
}

interface PlacedRec {
  id: string;
  rect: Rect;
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
      const surface = mat[idx(x, cur, z)] || strata[0][0];
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
      // Keep the surface look (road, sidewalk, path) when the column only moved a little.
      mat[idx(x, h, z)] = surface;
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
    const half = ROAD.halfWidth + ROAD.shoulder;
    list.push({ x0: 0, z0: SZ / 2 - half, x1: SX - 1, z1: SZ / 2 + half });
  }
  return list;
}

/** Downtown blocks: the lots between sidewalk rings. */
function cityBlocks(): Rect[] {
  const inner = CITY.streetHalf + CITY.sidewalk;
  const list: Rect[] = [];
  for (let gx = 0; gx < SX; gx += CITY.pitch) for (let gz = 0; gz < SZ; gz += CITY.pitch) list.push({ x0: gx + inner, z0: gz + inner, x1: gx + CITY.pitch - inner - 1, z1: gz + CITY.pitch - inner - 1 });
  return list;
}

/** Candidate spots for one siting kind, in priority order. */
function candidates(
  kind: SitingKind,
  near: string[] | undefined,
  theme: ThemeId,
  fp: Footprint,
  rng: Rng,
  height: Int16Array,
  mat: Uint8Array,
  placed: PlacedRec[],
  cells: { x: number; z: number }[],
  margin: number
): Spot[] {
  const out: Spot[] = [];
  const rx = (lo: number, hi: number) => lo + Math.floor(rng() * Math.max(1, hi - lo));
  switch (kind) {
    case 'roadside': {
      if (theme !== 'desert') break;
      const edge = ROAD.halfWidth + ROAD.shoulder;
      for (let i = 0; i < 12; i++) {
        const south = rng() < 0.5;
        const setback = randInt(rng, ROAD.setback[0], ROAD.setback[1]);
        const x0 = rx(margin, SX - margin - fp.x);
        if (south) out.push({ x0, z0: SZ / 2 - edge - setback - fp.z, mirror: true });
        else out.push({ x0, z0: SZ / 2 + edge + setback, mirror: false });
      }
      break;
    }
    case 'block': {
      if (theme !== 'downtown') break;
      const blocks = cityBlocks().sort(() => rng() - 0.5);
      for (const b of blocks) {
        const bw = b.x1 - b.x0 + 1;
        const bd = b.z1 - b.z0 + 1;
        if (fp.x > bw || fp.z > bd) continue;
        const x0 = b.x0 + rx(0, bw - fp.x + 1);
        // Front toward the nearer street: low-z edge, or high-z edge mirrored.
        if (rng() < 0.5) out.push({ x0, z0: b.z0, mirror: false, margin: 2 });
        else out.push({ x0, z0: b.z1 - fp.z + 1, mirror: true, margin: 2 });
      }
      break;
    }
    case 'sidewalk': {
      if (theme !== 'downtown') break;
      const inner = CITY.streetHalf + CITY.sidewalk;
      for (let i = 0; i < 16; i++) {
        const gz = randInt(rng, 1, Math.floor(SZ / CITY.pitch) - 1) * CITY.pitch;
        const gx = randInt(rng, 0, Math.floor(SX / CITY.pitch) - 1) * CITY.pitch;
        const x0 = gx + inner + rx(0, CITY.pitch - 2 * inner - fp.x);
        if (rng() < 0.5) out.push({ x0, z0: gz + CITY.streetHalf, mirror: false, gap: 2, margin: 2 });
        else out.push({ x0, z0: gz - CITY.streetHalf - fp.z, mirror: true, gap: 2, margin: 2 });
      }
      break;
    }
    case 'beside': {
      const hosts = placed.filter((p) => !near || near.includes(p.id));
      const pool = hosts.length ? hosts : placed;
      for (const host of pool.slice().sort(() => rng() - 0.5)) {
        const g = SITING.besideGap;
        const z0 = host.rect.z0 + rx(0, Math.max(1, host.rect.z1 - host.rect.z0 - fp.z));
        out.push({ x0: host.rect.x1 + 1 + g, z0, mirror: false, gap: 0 });
        out.push({ x0: host.rect.x0 - g - fp.x, z0, mirror: false, gap: 0 });
      }
      break;
    }
    case 'path': {
      for (let i = 0; i < SITING.pathSamples; i++) {
        const x = rx(margin, SX - margin);
        const z = rx(margin, SZ - margin);
        const h = height[x + SX * z];
        if (mat[idx(x, h, z)] === MAT.GRAVEL) out.push({ x0: x - (fp.x >> 1), z0: z - (fp.z >> 1), mirror: false });
      }
      break;
    }
    case 'hill': {
      const spots: { x0: number; z0: number; h: number }[] = [];
      for (let i = 0; i < SITING.hillSamples; i++) {
        const x0 = rx(margin, SX - margin - fp.x);
        const z0 = rx(margin, SZ - margin - fp.z);
        spots.push({ x0, z0, h: padHeight(height, { x0, z0, x1: x0 + fp.x - 1, z1: z0 + fp.z - 1 }) });
      }
      spots.sort((a, b) => b.h - a.h);
      for (const s of spots) out.push({ x0: s.x0, z0: s.z0, mirror: false });
      break;
    }
    case 'center': {
      for (let i = 0; i < 10; i++) out.push({ x0: SX / 2 - (fp.x >> 1) + randInt(rng, -SITING.centerJitter, SITING.centerJitter), z0: SZ / 2 - (fp.z >> 1) + randInt(rng, -SITING.centerJitter, SITING.centerJitter), mirror: false });
      break;
    }
    case 'edge': {
      for (let i = 0; i < 12; i++) {
        const d = randInt(rng, SITING.edgeDepth[0], SITING.edgeDepth[1]);
        const side = randInt(rng, 0, 2); // never the spawn side
        if (side === 0) out.push({ x0: margin + d, z0: rx(margin, SZ - margin - fp.z), mirror: false });
        else if (side === 1) out.push({ x0: SX - margin - d - fp.x, z0: rx(margin, SZ - margin - fp.z), mirror: false });
        else out.push({ x0: rx(margin, SX - margin - fp.x), z0: SZ - margin - d - fp.z, mirror: true });
      }
      break;
    }
    default:
      break;
  }
  // Fallback: jittered grid cells then random spots.
  const cell = Math.round(PLACEMENT.gridCellM / VOXEL_SIZE);
  for (const c of cells) out.push({ x0: c.x + rx(0, Math.max(1, cell - fp.x)), z0: c.z + rx(0, Math.max(1, cell - fp.z)), mirror: false });
  for (let i = 0; i < 12; i++) out.push({ x0: rx(margin, SX - margin - fp.x), z0: rx(margin, SZ - margin - fp.z), mirror: rng() < 0.5 });
  return out;
}

/**
 * Place 6–10 structures from the theme's pool where they belong (see Siting), flattening a pad
 * under each, and clear a spawn pad at the −z edge facing the arena.
 */
export function placeStructures(theme: ThemeId, rng: Rng, mat: Uint8Array, owner: Uint16Array, height: Int16Array, terrainOnly: boolean): Placed {
  const def = THEMES[theme];
  const structures: StructureInfo[] = [];
  const taken: Rect[] = reserved(theme);
  const reservedCount = taken.length;
  const placed: PlacedRec[] = [];
  const gap = Math.round(def.minGapM / VOXEL_SIZE);
  const margin = Math.round(PLACEMENT.edgeMarginM / VOXEL_SIZE);
  const padMargin = Math.round(TERRAIN.padMarginM / VOXEL_SIZE);

  const spawnR = taken[0];
  stampPad(theme, mat, height, spawnR, padHeight(height, spawnR));

  if (!terrainOnly) {
    const count = randInt(rng, def.structureCount[0], def.structureCount[1]);
    const cell = Math.round(PLACEMENT.gridCellM / VOXEL_SIZE);
    const cells: { x: number; z: number }[] = [];
    for (let cx = margin; cx + cell <= SX - margin; cx += cell) for (let cz = margin + gap; cz + cell <= SZ - margin; cz += cell) cells.push({ x: cx, z: cz });
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    // Hosts first so 'beside' structures have something to lean on.
    const order = def.pool.slice().sort((a, b) => (RECIPES[a].siting.kind === 'beside' ? 1 : 0) - (RECIPES[b].siting.kind === 'beside' ? 1 : 0));
    let id = 1;
    for (let n = 0; n < count; n++) {
      const recipe: Recipe | undefined = RECIPES[order[n % order.length]];
      if (!recipe) continue;
      const fp = recipe.footprint(rng);
      const spots = candidates(recipe.siting.kind, recipe.siting.near, theme, fp, rng, height, mat, placed, cells, margin);
      let chosen: Spot | null = null;
      let rect: Rect | null = null;
      for (const sp of spots.slice(0, PLACEMENT.maxAttempts)) {
        const m = sp.margin ?? margin;
        const r: Rect = { x0: sp.x0, z0: sp.z0, x1: sp.x0 + fp.x - 1, z1: sp.z0 + fp.z - 1 };
        if (r.x0 < m || r.z0 < m || r.x1 >= SX - m || r.z1 >= SZ - m) continue;
        const g = sp.gap ?? gap;
        // The spawn pad keeps the full gap; the road only needs the setback; other structures use the spot's gap.
        if (taken.some((t, ti) => overlaps(r, t, ti === 0 ? gap : ti < reservedCount ? 0 : g))) continue;
        chosen = sp;
        rect = r;
        break;
      }
      if (!chosen || !rect) continue;
      const padRect: Rect = { x0: rect.x0 - padMargin, z0: rect.z0 - padMargin, x1: rect.x1 + padMargin, z1: rect.z1 + padMargin };
      const h = Math.min(SY - fp.y - 2, padHeight(height, padRect));
      stampPad(theme, mat, height, padRect, h);
      const ctx = new StructureCtx(mat, owner, id, { x: rect.x0, y: h + 1, z: rect.z0 }, fp.z, chosen.mirror);
      recipe.build(ctx, rng, fp);
      structures.push({ id, name: recipe.name, totalValue: Math.round(ctx.totalValue), center: ctx.center(), voxels: ctx.voxels, bounds: ctx.bounds() });
      taken.push(rect);
      placed.push({ id: recipe.id, rect });
      id++;
      if ((n + 1) % order.length === 0) order.sort(() => rng() - 0.5);
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
