import { MAT } from '@vw/config';
import { randInt } from '../../../util/rng';
import type { Recipe } from './types';

/** Gas station: canopy on steel posts, 2–4 pumps each beside a fuel tank, store with a glass front, tall neon sign. */
export const gasStation: Recipe = {
  id: 'gasStation',
  name: 'Gas Station',
  siting: { kind: 'roadside' },
  footprint: (rng) => ({ x: randInt(rng, 36, 44), z: randInt(rng, 30, 36), y: 22 }),
  build(ctx, rng, fp) {
    const pumps = randInt(rng, 2, 4);
    // Canopy over the forecourt (front half).
    const cz0 = 2;
    const cz1 = 14;
    const canopyY = 10;
    ctx.box(2, canopyY, cz0, fp.x - 3, canopyY + 1, cz1, MAT.CONCRETE);
    ctx.box(2, canopyY + 2, cz0, fp.x - 3, canopyY + 2, cz0, MAT.NEON);
    for (const [px, pz] of [[3, cz0 + 1], [fp.x - 5, cz0 + 1], [3, cz1 - 2], [fp.x - 5, cz1 - 2]]) ctx.box(px, 0, pz, px + 1, canopyY - 1, pz + 1, MAT.STEEL);
    // Pumps on a concrete island, each with a fuel tank beside it.
    const spacing = Math.floor((fp.x - 8) / pumps);
    for (let i = 0; i < pumps; i++) {
      const x = 5 + i * spacing + Math.floor(spacing / 2);
      ctx.box(x - 2, 0, 6, x + 3, 0, 9, MAT.CONCRETE);
      ctx.box(x, 1, 7, x + 1, 4, 8, MAT.STEEL);
      ctx.box(x, 3, 6, x + 1, 3, 6, MAT.NEON);
      ctx.box(x - 2, 1, 7, x - 1, 2, 9, MAT.FUEL);
    }
    // Store at the back: brick walls, glass front, drywall interior partition, concrete roof.
    const sx0 = 4;
    const sx1 = fp.x - 5;
    const sz0 = 18;
    const sz1 = fp.z - 2;
    ctx.hollowBox(sx0, 0, sz0, sx1, 7, sz1, MAT.BRICK, 1, false, false);
    ctx.box(sx0, 7, sz0, sx1, 7, sz1, MAT.CONCRETE);
    ctx.box(sx0 + 2, 1, sz0, sx1 - 2, 5, sz0, MAT.GLASS);
    ctx.box(sx0 + 1, 0, sz0 + 1, sx1 - 1, 0, sz1 - 1, MAT.CONCRETE);
    const mid = Math.floor((sx0 + sx1) / 2);
    ctx.box(mid, 1, sz0 + 4, mid, 5, sz1 - 1, MAT.DRYWALL);
    ctx.box(sx0 + 1, 1, sz0 + 6, sx1 - 1, 2, sz0 + 6, MAT.DRYWALL);
    ctx.box(sx0 + 2, 8, sz0 - 1, sx1 - 2, 8, sz0, MAT.NEON);
    // Tall sign by the front corner.
    const sgx = fp.x - 3;
    ctx.box(sgx, 0, 0, sgx, 18, 0, MAT.STEEL);
    ctx.box(sgx - 4, 15, 0, sgx + 1, 19, 0, MAT.NEON);
    ctx.box(sgx - 3, 16, 0, sgx, 18, 0, MAT.DRYWALL);
    // Propane cage out front.
    ctx.cage(0, 0, 0, 3, 3, 3, MAT.STEEL);
    for (let i = 0; i < 3; i++) ctx.box(1 + (i % 2), 0, 1 + Math.floor(i / 2), 1 + (i % 2), 1, 1 + Math.floor(i / 2), MAT.PROPANE);
  }
};

/** Diner: long brick base, glass band windows, steel roof, neon trim, drywall interior. */
export const diner: Recipe = {
  id: 'diner',
  name: 'Diner',
  siting: { kind: 'roadside' },
  footprint: (rng) => ({ x: randInt(rng, 32, 44), z: randInt(rng, 14, 18), y: 10 }),
  build(ctx, rng, fp) {
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    ctx.box(0, 0, 0, x1, 0, z1, MAT.CONCRETE);
    ctx.hollowBox(0, 1, 0, x1, 2, z1, MAT.BRICK, 1, false, false);
    ctx.hollowBox(0, 3, 0, x1, 5, z1, MAT.GLASS, 1, false, false);
    for (let x = 0; x <= x1; x += 6) ctx.box(x, 3, 0, x, 5, 0, MAT.STEEL), ctx.box(x, 3, z1, x, 5, z1, MAT.STEEL);
    ctx.box(0, 3, 0, 0, 5, z1, MAT.STEEL);
    ctx.box(x1, 3, 0, x1, 5, z1, MAT.STEEL);
    ctx.box(0, 6, 0, x1, 6, z1, MAT.STEEL);
    ctx.box(0, 7, 0, x1, 7, 0, MAT.NEON);
    ctx.box(0, 7, z1, x1, 7, z1, MAT.NEON);
    // Counter and booths.
    const half = Math.floor(z1 / 2);
    ctx.box(3, 1, half, x1 - 3, 2, half, MAT.DRYWALL);
    for (let x = 3; x < x1 - 3; x += 5) ctx.box(x, 1, 1, x, 1, 3, MAT.WOOD);
    // Kitchen with a propane bottle.
    ctx.box(x1 - 4, 1, 1, x1 - 4, 5, z1 - 1, MAT.DRYWALL);
    ctx.box(x1 - 2, 1, 1, x1 - 2, 2, 1, MAT.PROPANE);
    if (rng() > 0.5) ctx.box(x1 - 2, 1, z1 - 1, x1 - 2, 2, z1 - 1, MAT.PROPANE);
  }
};

/** Billboard: two steel posts and a wood face with neon letters. */
export const billboard: Recipe = {
  id: 'billboard',
  name: 'Billboard',
  siting: { kind: 'roadside' },
  footprint: (rng) => ({ x: randInt(rng, 18, 24), z: 3, y: 24 }),
  build(ctx, rng, fp) {
    const h = randInt(rng, 10, 14);
    const x1 = fp.x - 1;
    ctx.box(2, 0, 1, 3, h, 1, MAT.STEEL);
    ctx.box(x1 - 3, 0, 1, x1 - 2, h, 1, MAT.STEEL);
    ctx.box(0, h, 1, x1, h + 10, 1, MAT.WOOD);
    ctx.box(0, h, 0, x1, h, 0, MAT.STEEL);
    for (let x = 2; x < x1 - 2; x += 3) if (rng() > 0.3) ctx.box(x, h + 3, 0, x + 1, h + 7, 0, MAT.NEON);
  }
};

/** Water tower: four steel legs with braces, steel tank. */
export const waterTower: Recipe = {
  id: 'waterTower',
  name: 'Water Tower',
  siting: { kind: 'hill' },
  footprint: () => ({ x: 14, z: 14, y: 30 }),
  build(ctx, rng) {
    const legH = randInt(rng, 14, 18);
    for (const [x, z] of [[2, 2], [11, 2], [2, 11], [11, 11]]) ctx.box(x, 0, z, x, legH, z, MAT.STEEL);
    for (const y of [5, 10]) {
      ctx.box(2, y, 2, 11, y, 2, MAT.STEEL);
      ctx.box(2, y, 11, 11, y, 11, MAT.STEEL);
      ctx.box(2, y, 2, 2, y, 11, MAT.STEEL);
      ctx.box(11, y, 2, 11, y, 11, MAT.STEEL);
    }
    ctx.cylinder(7, 7, 6, legH, legH + 7, MAT.STEEL, 1);
    ctx.cylinder(7, 7, 6, legH, legH, MAT.STEEL);
    ctx.cylinder(7, 7, 5, legH + 8, legH + 8, MAT.STEEL);
    ctx.cylinder(7, 7, 3, legH + 9, legH + 9, MAT.STEEL);
    // Full of water.
    ctx.cylinder(7, 7, 5, legH + 1, legH + 6, MAT.WATER);
  }
};

/** Propane cage: steel frame full of bottles. */
export const propaneCage: Recipe = {
  id: 'propaneCage',
  name: 'Propane Cage',
  siting: { kind: 'beside', near: ['gasStation', 'diner', 'convenienceStore'] },
  footprint: (rng) => ({ x: randInt(rng, 5, 7), z: randInt(rng, 4, 6), y: 5 }),
  build(ctx, rng, fp) {
    ctx.cage(0, 0, 0, fp.x - 1, 3, fp.z - 1, MAT.STEEL);
    for (let x = 1; x < fp.x - 1; x++) for (let z = 1; z < fp.z - 1; z++) if (rng() > 0.25) ctx.box(x, 0, z, x, 1, z, MAT.PROPANE);
  }
};
