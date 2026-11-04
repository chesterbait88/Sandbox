import { MAT } from '@vw/config';
import { randInt } from '../../../util/rng';
import type { Recipe } from './types';

/** Convenience store: glass front, drywall interior shelves, propane cage outside. */
export const convenienceStore: Recipe = {
  id: 'convenienceStore',
  name: 'Convenience Store',
  footprint: (rng) => ({ x: randInt(rng, 24, 30), z: randInt(rng, 18, 22), y: 10 }),
  build(ctx, rng, fp) {
    const x0 = 6;
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    ctx.box(x0, 0, 0, x1, 0, z1, MAT.CONCRETE);
    ctx.hollowBox(x0, 1, 0, x1, 6, z1, MAT.DRYWALL, 1, false, false);
    ctx.box(x0 + 1, 1, 0, x1 - 1, 5, 0, MAT.GLASS);
    ctx.box(x0, 7, 0, x1, 7, z1, MAT.CONCRETE);
    ctx.box(x0, 1, 0, x0, 6, 0, MAT.BRICK);
    ctx.box(x1, 1, 0, x1, 6, 0, MAT.BRICK);
    ctx.box(x0 + 1, 8, 0, x1 - 1, 8, 0, MAT.NEON);
    // Shelves.
    for (let z = 4; z < z1 - 3; z += 4) ctx.box(x0 + 3, 1, z, x1 - 3, 3, z, MAT.DRYWALL);
    // Back room door and a transformer on the wall.
    ctx.box(x1 - 6, 1, z1 - 1, x1 - 6, 5, z1 - 1, MAT.DRYWALL);
    ctx.box(x1 - 2, 1, z1 - 2, x1 - 1, 3, z1 - 1, MAT.TRANSFORMER);
    // Propane cage out front, left of the door.
    ctx.hollowBox(0, 0, 1, 4, 3, 4, MAT.STEEL, 1, false, true);
    for (let x = 1; x < 4; x++) for (let z = 2; z < 4; z++) if (rng() > 0.3) ctx.box(x, 0, z, x, 1, z, MAT.PROPANE);
  }
};

/** Office block: 3–5 floors, concrete frame, glass curtain wall, steel core, transformer in the alley. */
export const officeBlock: Recipe = {
  id: 'officeBlock',
  name: 'Office Block',
  footprint: (rng) => ({ x: randInt(rng, 24, 32), z: randInt(rng, 20, 26), y: 40 }),
  build(ctx, rng, fp) {
    const floors = randInt(rng, 3, 5);
    const fh = 7;
    const x1 = fp.x - 5;
    const z1 = fp.z - 1;
    for (let f = 0; f < floors; f++) {
      const y0 = f * fh;
      ctx.box(0, y0, 0, x1, y0, z1, MAT.CONCRETE);
      // Columns.
      for (let x = 0; x <= x1; x += Math.floor(x1 / 2)) for (let z = 0; z <= z1; z += Math.floor(z1 / 2)) ctx.box(x, y0 + 1, z, x + 1, y0 + fh - 1, z + 1, MAT.CONCRETE);
      // Curtain wall.
      ctx.hollowBox(0, y0 + 1, 0, x1, y0 + fh - 1, z1, MAT.GLASS, 1, false, false);
      // Spandrel band.
      ctx.hollowBox(0, y0 + fh - 1, 0, x1, y0 + fh - 1, z1, MAT.STEEL, 1, false, false);
      // Interior drywall partitions.
      const px = 4 + Math.floor(rng() * (x1 - 8));
      ctx.box(px, y0 + 1, 2, px, y0 + fh - 2, z1 - 2, MAT.DRYWALL);
      ctx.box(3, y0 + 1, Math.floor(z1 / 2), x1 - 3, y0 + fh - 2, Math.floor(z1 / 2), MAT.DRYWALL);
    }
    ctx.box(0, floors * fh, 0, x1, floors * fh, z1, MAT.CONCRETE);
    // Steel core (stairs/lift) through every floor.
    const cx = Math.floor(x1 / 2);
    const cz = Math.floor(z1 / 2);
    ctx.hollowBox(cx - 2, 0, cz - 2, cx + 2, floors * fh + 2, cz + 2, MAT.STEEL, 1, false, true);
    // Rooftop units.
    ctx.box(2, floors * fh + 1, 2, 5, floors * fh + 3, 5, MAT.STEEL);
    // Transformer in the alley.
    ctx.box(x1 + 2, 0, 2, x1 + 3, 2, 4, MAT.TRANSFORMER);
    ctx.box(x1 + 2, 3, 3, x1 + 2, 3, 3, MAT.STEEL);
  }
};

/** Parking structure: 2–3 open concrete decks on columns with low parapets. */
export const parkingStructure: Recipe = {
  id: 'parkingStructure',
  name: 'Parking Structure',
  footprint: (rng) => ({ x: randInt(rng, 34, 44), z: randInt(rng, 24, 30), y: 20 }),
  build(ctx, rng, fp) {
    const decks = randInt(rng, 2, 3);
    const dh = 6;
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    for (let d = 1; d <= decks; d++) {
      const y = d * dh;
      ctx.box(0, y, 0, x1, y, z1, MAT.CONCRETE);
      ctx.hollowBox(0, y + 1, 0, x1, y + 1, z1, MAT.CONCRETE, 1, false, false);
      for (let x = 1; x < x1; x += 8) for (let z = 1; z < z1; z += 8) ctx.box(x, y - dh + 1, z, x + 1, y - 1, z + 1, MAT.CONCRETE);
    }
    ctx.box(0, 0, 0, x1, 0, z1, MAT.ASPHALT);
    // Ramp wall and a steel stair tower.
    ctx.hollowBox(x1 - 5, 0, z1 - 5, x1, decks * dh + 3, z1, MAT.STEEL, 1, false, true);
    // Parked propane delivery pallets, why not.
    if (rng() > 0.4) ctx.box(4, 1, 4, 5, 2, 5, MAT.PROPANE);
  }
};

/** Bus shelter: glass on three sides, steel frame and roof. */
export const busShelter: Recipe = {
  id: 'busShelter',
  name: 'Bus Shelter',
  footprint: () => ({ x: 9, z: 5, y: 6 }),
  build(ctx) {
    ctx.box(0, 0, 0, 8, 0, 4, MAT.CONCRETE_SIDEWALK);
    for (const [x, z] of [[0, 0], [8, 0], [0, 4], [8, 4]]) ctx.box(x, 1, z, x, 4, z, MAT.STEEL);
    ctx.box(0, 5, 0, 8, 5, 4, MAT.STEEL);
    ctx.box(1, 1, 4, 7, 4, 4, MAT.GLASS);
    ctx.box(0, 1, 1, 0, 4, 3, MAT.GLASS);
    ctx.box(8, 1, 1, 8, 4, 3, MAT.GLASS);
    ctx.box(2, 1, 3, 6, 1, 3, MAT.WOOD);
    ctx.box(1, 2, 4, 3, 3, 4, MAT.NEON);
  }
};
