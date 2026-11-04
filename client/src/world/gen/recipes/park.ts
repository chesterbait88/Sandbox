import { MAT } from '@vw/config';
import { randInt, randRange } from '../../../util/rng';
import { m, type Recipe } from './types';

/** Memorial Park recipes, authored in metres. */

/** Monument: gravel apron, three marble tiers, fluted column with a capital and a steel core, bollards and chain. */
export const monument: Recipe = {
  id: 'monument',
  name: 'Monument',
  siting: { kind: 'center' },
  footprint: (rng) => ({ x: m(randRange(rng, 7, 9)), z: m(randRange(rng, 7, 9)), y: m(14) }),
  build(ctx, rng, fp) {
    const cx = fp.x / 2;
    const cz = fp.z / 2;
    const h = m(randRange(rng, 7, 9));
    ctx.box(0, 0, 0, fp.x - 1, 0, fp.z - 1, MAT.GRAVEL);
    // Tiers.
    ctx.box(m(1), 1, m(1), fp.x - m(1) - 1, m(0.5), fp.z - m(1) - 1, MAT.MARBLE);
    ctx.box(m(1.75), m(0.5) + 1, m(1.75), fp.x - m(1.75) - 1, m(1), fp.z - m(1.75) - 1, MAT.MARBLE);
    ctx.box(m(2.5), m(1) + 1, m(2.5), fp.x - m(2.5) - 1, m(2), fp.z - m(2.5) - 1, MAT.MARBLE);
    ctx.hollowBox(m(2.5), m(1.5), m(2.5), fp.x - m(2.5) - 1, m(1.75), fp.z - m(2.5) - 1, MAT.STEEL, 1, false, false); // inscription band
    // Column with a base ring, flutes, capital and a steel core.
    ctx.cylinder(cx, cz, m(1.5), m(2) + 1, m(2.5), MAT.MARBLE);
    ctx.cylinder(cx, cz, m(1.25), m(2.5) + 1, h, MAT.MARBLE);
    ctx.cylinder(cx, cz, m(0.5), m(2) + 1, h, MAT.STEEL);
    ctx.fill(Math.floor(cx - m(1.25)) - 1, m(2.5) + 1, Math.floor(cz - m(1.25)) - 1, Math.ceil(cx + m(1.25)) + 1, h, Math.ceil(cz + m(1.25)) + 1, (x, _y, z) => {
      const d = Math.hypot(x + 0.5 - cx, z + 0.5 - cz);
      const a = Math.atan2(z + 0.5 - cz, x + 0.5 - cx);
      return d <= m(1.25) + 1 && d > m(1.25) && Math.abs(Math.sin(a * 8)) > 0.9 ? MAT.MARBLE : 0;
    });
    ctx.cylinder(cx, cz, m(1.75), h + 1, h + m(0.5), MAT.MARBLE);
    ctx.cylinder(cx, cz, m(1), h + m(0.5) + 1, h + m(1.25), MAT.MARBLE);
    ctx.ellipsoid(cx, h + m(2.25), cz, m(0.75), m(0.75), m(0.75), MAT.MARBLE);
    // Bollards with a chain around the apron.
    for (const [x, z] of [[m(0.5), m(0.5)], [fp.x - m(0.5) - 1, m(0.5)], [m(0.5), fp.z - m(0.5) - 1], [fp.x - m(0.5) - 1, fp.z - m(0.5) - 1]]) ctx.box(x, 1, z, x, m(0.75), z, MAT.STEEL);
    ctx.hollowBox(m(0.5), m(0.5), m(0.5), fp.x - m(0.5) - 1, m(0.5), fp.z - m(0.5) - 1, MAT.STEEL, 1, false, false);
  }
};

/** Fountain: marble basin ring with water, three tiered bowls on a pillar, jets. */
export const fountain: Recipe = {
  id: 'fountain',
  name: 'Fountain',
  siting: { kind: 'path' },
  footprint: (rng) => ({ x: m(randRange(rng, 8, 10)), z: m(randRange(rng, 8, 10)), y: m(5) }),
  build(ctx, rng, fp) {
    const cx = fp.x / 2;
    const cz = fp.z / 2;
    const r = Math.min(cx, cz) - m(0.25);
    ctx.cylinder(cx, cz, r, 0, 0, MAT.MARBLE);
    ctx.cylinder(cx, cz, r, 1, m(0.75), MAT.MARBLE, m(0.5));
    ctx.cylinder(cx, cz, r + 1, m(0.75), m(0.75), MAT.MARBLE, 1); // lip
    ctx.cylinder(cx, cz, r - m(0.5), 1, m(0.5), MAT.WATER);
    // Pillar and bowls.
    ctx.cylinder(cx, cz, m(0.5), 1, m(1.5), MAT.MARBLE);
    ctx.cylinder(cx, cz, m(1.75), m(1.5) + 1, m(1.75), MAT.MARBLE);
    ctx.cylinder(cx, cz, m(1.5), m(1.75) + 1, m(2), MAT.WATER);
    ctx.cylinder(cx, cz, m(0.4), m(2) + 1, m(2.75), MAT.MARBLE);
    ctx.cylinder(cx, cz, m(1), m(2.75) + 1, m(3), MAT.MARBLE);
    ctx.cylinder(cx, cz, m(0.75), m(3) + 1, m(3.25), MAT.WATER);
    ctx.cylinder(cx, cz, m(0.25), m(3.25) + 1, m(3.25) + m(randRange(rng, 0.5, 1)), MAT.MARBLE);
    ctx.box(Math.floor(cx), m(3.25) + m(1) + 1, Math.floor(cz), Math.floor(cx), m(4.5), Math.floor(cz), MAT.WATER);
    // Four jets from the basin edge.
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const jx = Math.floor(cx + dx * (r - m(1)));
      const jz = Math.floor(cz + dz * (r - m(1)));
      ctx.box(jx, m(0.75) + 1, jz, jx, m(1.5), jz, MAT.WATER);
    }
  }
};

/** Gazebo: raised wood deck with steps, turned posts, balustrade, stepped roof with a finial. */
export const gazebo: Recipe = {
  id: 'gazebo',
  name: 'Gazebo',
  siting: { kind: 'hill' },
  footprint: (rng) => ({ x: m(randRange(rng, 6, 8)), z: m(randRange(rng, 6, 8)), y: m(7) }),
  build(ctx, _rng, fp) {
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    const deck = m(0.5);
    ctx.box(0, 0, 0, x1, deck, z1, MAT.WOOD);
    // Steps at the front.
    const mid = Math.floor(x1 / 2);
    ctx.box(mid - m(0.75), 0, -1, mid + m(0.75), 0, -1, MAT.WOOD);
    ctx.box(mid - m(0.75), 0, -2, mid + m(0.75), 0, -2, MAT.CONCRETE);
    // Posts with capitals.
    const posts: [number, number][] = [[m(0.5), m(0.5)], [x1 - m(0.5), m(0.5)], [m(0.5), z1 - m(0.5)], [x1 - m(0.5), z1 - m(0.5)], [mid, m(0.5)], [mid, z1 - m(0.5)], [m(0.5), Math.floor(z1 / 2)], [x1 - m(0.5), Math.floor(z1 / 2)]];
    const top = deck + m(2.75);
    for (const [x, z] of posts) {
      ctx.box(x, deck + 1, z, x, top, z, MAT.WOOD);
      ctx.box(x - 1, top - 1, z - 1, x + 1, top, z + 1, MAT.WOOD);
    }
    // Balustrade: rail with balusters, open at the front steps.
    ctx.hollowBox(m(0.5), deck + m(1), m(0.5), x1 - m(0.5), deck + m(1), z1 - m(0.5), MAT.WOOD, 1, false, false);
    ctx.fill(m(0.5), deck + 1, m(0.5), x1 - m(0.5), deck + m(1) - 1, z1 - m(0.5), (x, _y, z) => {
      const edge = x === m(0.5) || x === x1 - m(0.5) || z === m(0.5) || z === z1 - m(0.5);
      return edge && (x + z) % 2 === 0 ? MAT.WOOD : 0;
    });
    ctx.box(mid - m(0.75), deck + 1, m(0.5), mid + m(0.75), deck + m(1), m(0.5), MAT.AIR);
    // Roof: fascia beam, then stepped pyramid, finial.
    ctx.hollowBox(0, top + 1, 0, x1, top + 1, z1, MAT.WOOD, 2, false, false);
    let step = 0;
    for (let y = top + 2; step * 2 < Math.min(x1, z1); y++, step += 2) ctx.hollowBox(step, y, step, x1 - step, y, z1 - step, MAT.WOOD, 3, true, false);
    const cy = top + 2 + Math.floor(Math.min(x1, z1) / 4);
    ctx.box(mid, cy, Math.floor(z1 / 2), mid, cy + m(0.75), Math.floor(z1 / 2), MAT.STEEL);
  }
};

/** Statue: stepped concrete base, marble pedestal with a plaque, a figure holding a steel spear. */
export const statue: Recipe = {
  id: 'statue',
  name: 'Statue',
  siting: { kind: 'path' },
  footprint: () => ({ x: m(5), z: m(5), y: m(8) }),
  build(ctx, rng, fp) {
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    const cx = Math.floor(x1 / 2);
    const cz = Math.floor(z1 / 2);
    ctx.box(0, 0, 0, x1, m(0.25), z1, MAT.CONCRETE);
    ctx.box(m(0.5), m(0.25) + 1, m(0.5), x1 - m(0.5), m(0.5), z1 - m(0.5), MAT.CONCRETE);
    ctx.box(m(1.25), m(0.5) + 1, m(1.25), x1 - m(1.25), m(2), z1 - m(1.25), MAT.MARBLE);
    ctx.box(cx - m(0.5), m(1), m(1.25) - 1, cx + m(0.5), m(1.5), m(1.25) - 1, MAT.STEEL); // plaque
    const y0 = m(2) + 1;
    // Figure: legs, torso, arms, head.
    ctx.box(cx - m(0.3), y0, cz - m(0.2), cx - 1, y0 + m(1), cz + m(0.2), MAT.MARBLE);
    ctx.box(cx + 1, y0, cz - m(0.2), cx + m(0.3), y0 + m(1), cz + m(0.2), MAT.MARBLE);
    ctx.box(cx - m(0.4), y0 + m(1) + 1, cz - m(0.25), cx + m(0.4), y0 + m(2), cz + m(0.25), MAT.MARBLE);
    ctx.box(cx - m(0.7), y0 + m(1.25), cz - m(0.15), cx - m(0.4) - 1, y0 + m(2), cz + m(0.15), MAT.MARBLE); // left arm down
    ctx.box(cx + m(0.4) + 1, y0 + m(1.5), cz - m(0.15), cx + m(0.7), y0 + m(2.5), cz + m(0.15), MAT.MARBLE); // right arm raised
    ctx.box(cx - m(0.25), y0 + m(2) + 1, cz - m(0.25), cx + m(0.25), y0 + m(2.5), cz + m(0.25), MAT.MARBLE); // head
    if (rng() > 0.4) ctx.box(cx + m(0.7), y0 + m(1), cz, cx + m(0.7), y0 + m(3.75), cz, MAT.STEEL);
  }
};

/** Maintenance shed: wood walls with a gable roof, door and window, workbench, fuel tank and propane inside. */
export const shed: Recipe = {
  id: 'shed',
  name: 'Maintenance Shed',
  siting: { kind: 'edge' },
  footprint: (rng) => ({ x: m(randRange(rng, 6, 8)), z: m(randRange(rng, 4, 6)), y: m(6) }),
  build(ctx, rng, fp) {
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    const wallH = m(2.75);
    ctx.box(0, 0, 0, x1, 0, z1, MAT.CONCRETE);
    ctx.hollowBox(0, 1, 0, x1, wallH, z1, MAT.WOOD, 1, false, false);
    // Gable roof along x: stepped slabs meeting at a ridge.
    const half = Math.ceil(z1 / 2);
    for (let i = 0; i <= half; i++) {
      const y = wallH + 1 + i;
      ctx.box(-1, y, i, x1 + 1, y, i, MAT.WOOD);
      ctx.box(-1, y, z1 - i, x1 + 1, y, z1 - i, MAT.WOOD);
      ctx.box(0, Math.min(y, wallH + 1 + i), i, 0, y, z1 - i, MAT.WOOD); // gable ends
      ctx.box(x1, Math.min(y, wallH + 1 + i), i, x1, y, z1 - i, MAT.WOOD);
    }
    ctx.box(-1, wallH + 1 + half + 1, half - 1, x1 + 1, wallH + 1 + half + 1, z1 - half + 1, MAT.STEEL); // ridge cap
    // Door with frame and a window with a cross mullion on the front.
    ctx.box(m(1), 1, 0, m(2), m(2.1), 0, MAT.STEEL);
    ctx.box(m(1) + 1, 1, 0, m(2) - 1, m(2.1) - 1, 0, MAT.AIR);
    ctx.box(x1 - m(2.25), m(1), 0, x1 - m(0.75), m(2), 0, MAT.STEEL);
    ctx.box(x1 - m(2.25) + 1, m(1) + 1, 0, x1 - m(0.75) - 1, m(2) - 1, 0, MAT.GLASS);
    ctx.box(x1 - m(1.5), m(1) + 1, 0, x1 - m(1.5), m(2) - 1, 0, MAT.STEEL);
    ctx.box(x1 - m(2.25) + 1, m(1.5), 0, x1 - m(0.75) - 1, m(1.5), 0, MAT.STEEL);
    // Inside: workbench, shelves, fuel tank, propane, a mower-sized steel box.
    ctx.box(1, m(0.75), 1, m(2.5), m(0.75) + 1, m(0.75), MAT.WOOD);
    ctx.box(1, 1, 1, 1, m(0.75) - 1, m(0.75), MAT.STEEL);
    ctx.box(m(2.5), 1, 1, m(2.5), m(0.75) - 1, m(0.75), MAT.STEEL);
    ctx.box(x1 - m(2.5), 1, z1 - m(1.5), x1 - 1, m(1), z1 - 1, MAT.FUEL);
    ctx.box(x1 - m(1.5), m(1) + 1, z1 - m(1), x1 - m(1.25), m(1.25), z1 - m(0.75), MAT.STEEL);
    ctx.box(1, 1, z1 - m(1), m(0.5), m(1), z1 - m(0.5), MAT.PROPANE);
    if (rng() > 0.5) ctx.box(m(0.75), 1, z1 - m(1), m(1.25), m(1), z1 - m(0.5), MAT.PROPANE);
    ctx.box(1, m(1.5), z1 - 1, m(2.5), m(1.5), z1 - 1, MAT.WOOD);
    ctx.box(m(3), 1, m(1.5), m(4), m(0.75), m(2.5), MAT.ENAMEL_RED);
    ctx.box(m(3), 1, m(1.5) - 1, m(4), m(0.25), m(2.5) + 1, MAT.RUBBER);
  }
};
