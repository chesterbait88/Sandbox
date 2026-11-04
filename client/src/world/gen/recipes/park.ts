import { MAT } from '@vw/config';
import { randInt } from '../../../util/rng';
import type { Recipe } from './types';

/** Monument: marble pedestal and column with a steel core. */
export const monument: Recipe = {
  id: 'monument',
  name: 'Monument',
  footprint: (rng) => ({ x: randInt(rng, 14, 18), z: randInt(rng, 14, 18), y: 30 }),
  build(ctx, rng, fp) {
    const cx = fp.x / 2;
    const cz = fp.z / 2;
    const h = randInt(rng, 14, 20);
    ctx.box(0, 0, 0, fp.x - 1, 0, fp.z - 1, MAT.GRAVEL);
    ctx.box(2, 0, 2, fp.x - 3, 2, fp.z - 3, MAT.MARBLE);
    ctx.box(4, 3, 4, fp.x - 5, 4, fp.z - 5, MAT.MARBLE);
    ctx.cylinder(cx, cz, 3, 5, h, MAT.MARBLE);
    ctx.cylinder(cx, cz, 1, 5, h, MAT.STEEL);
    ctx.cylinder(cx, cz, 4, h + 1, h + 2, MAT.MARBLE);
    ctx.cylinder(cx, cz, 2, h + 3, h + 5, MAT.MARBLE);
  }
};

/** Fountain: marble ring with water, central pillar. */
export const fountain: Recipe = {
  id: 'fountain',
  name: 'Fountain',
  footprint: (rng) => ({ x: randInt(rng, 16, 20), z: randInt(rng, 16, 20), y: 8 }),
  build(ctx, rng, fp) {
    const cx = fp.x / 2;
    const cz = fp.z / 2;
    const r = Math.min(cx, cz) - 1;
    ctx.cylinder(cx, cz, r, 0, 0, MAT.MARBLE);
    ctx.cylinder(cx, cz, r, 1, 2, MAT.MARBLE, 1);
    ctx.cylinder(cx, cz, r - 1, 1, 1, MAT.WATER);
    ctx.cylinder(cx, cz, 2, 1, 5, MAT.MARBLE);
    ctx.cylinder(cx, cz, 3, 6, 6, MAT.MARBLE);
    ctx.cylinder(cx, cz, 1, 7, 7 + randInt(rng, 1, 3), MAT.MARBLE);
  }
};

/** Gazebo: wood posts, wood floor, stepped wood roof. */
export const gazebo: Recipe = {
  id: 'gazebo',
  name: 'Gazebo',
  footprint: (rng) => ({ x: randInt(rng, 12, 16), z: randInt(rng, 12, 16), y: 14 }),
  build(ctx, _rng, fp) {
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    ctx.box(0, 0, 0, x1, 0, z1, MAT.WOOD);
    for (const [x, z] of [[1, 1], [x1 - 1, 1], [1, z1 - 1], [x1 - 1, z1 - 1], [Math.floor(x1 / 2), 1], [Math.floor(x1 / 2), z1 - 1]]) ctx.box(x, 1, z, x, 6, z, MAT.WOOD);
    ctx.hollowBox(1, 1, 1, x1 - 1, 2, z1 - 1, MAT.WOOD, 1, false, false);
    ctx.box(Math.floor(x1 / 2) - 1, 1, 1, Math.floor(x1 / 2) + 1, 2, 1, MAT.AIR);
    let step = 0;
    for (let y = 7; step < Math.min(x1, z1) / 2; y++, step++) ctx.hollowBox(step, y, step, x1 - step, y, z1 - step, MAT.WOOD, 2, true, false);
  }
};

/** Statue: marble figure on a concrete base. */
export const statue: Recipe = {
  id: 'statue',
  name: 'Statue',
  footprint: () => ({ x: 10, z: 10, y: 16 }),
  build(ctx, rng) {
    ctx.box(1, 0, 1, 8, 2, 8, MAT.CONCRETE);
    ctx.box(3, 3, 3, 6, 4, 6, MAT.MARBLE);
    // A blocky figure.
    ctx.box(4, 5, 4, 5, 9, 5, MAT.MARBLE);
    ctx.box(3, 7, 4, 3, 9, 5, MAT.MARBLE);
    ctx.box(6, 7, 4, 6, 11, 5, MAT.MARBLE);
    ctx.box(4, 10, 4, 5, 11, 5, MAT.MARBLE);
    if (rng() > 0.5) ctx.box(6, 11, 3, 6, 13, 3, MAT.STEEL);
  }
};

/** Maintenance shed: wood walls and roof, fuel tank inside. */
export const shed: Recipe = {
  id: 'shed',
  name: 'Maintenance Shed',
  footprint: (rng) => ({ x: randInt(rng, 12, 16), z: randInt(rng, 8, 12), y: 10 }),
  build(ctx, rng, fp) {
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    ctx.box(0, 0, 0, x1, 0, z1, MAT.CONCRETE);
    ctx.hollowBox(0, 1, 0, x1, 5, z1, MAT.WOOD, 1, false, false);
    ctx.box(0, 6, 0, x1, 6, z1, MAT.WOOD);
    ctx.box(2, 1, 0, 3, 4, 0, MAT.AIR);
    ctx.box(x1 - 3, 2, 0, x1 - 2, 3, 0, MAT.GLASS);
    ctx.box(2, 1, z1 - 2, 5, 2, z1 - 1, MAT.FUEL);
    ctx.box(x1 - 3, 1, 2, x1 - 1, 1, 3, MAT.WOOD);
    if (rng() > 0.5) ctx.box(x1 - 2, 1, z1 - 1, x1 - 2, 2, z1 - 1, MAT.PROPANE);
  }
};
