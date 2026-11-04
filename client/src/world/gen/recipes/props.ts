import { MAT } from '@vw/config';
import { pick, randInt, randRange } from '../../../util/rng';
import { m, type Recipe } from './types';

/**
 * Scenery props: small, many, low value. Each theme lists which ones it uses (THEMES[t].props).
 * All authored in metres; z = 0 is the front.
 */

/** Saguaro: trunk with one or two arms. */
export const cactus: Recipe = {
  id: 'cactus',
  name: 'Cactus',
  siting: { kind: 'any' },
  prop: true,
  footprint: () => ({ x: m(2), z: m(1), y: m(4) }),
  build(ctx, rng) {
    const h = m(randRange(rng, 2, 3.5));
    const cx = m(1) - 1;
    ctx.box(cx, 1, 1, cx + 1, h, 2, MAT.LEAVES);
    const arms = randInt(rng, 1, 2);
    for (let i = 0; i < arms; i++) {
      const side = i === 0 ? 1 : -1;
      const ay = m(randRange(rng, 0.8, 1.6));
      const ax = side > 0 ? cx + 2 : cx - m(0.5);
      ctx.box(ax, ay, 1, ax + 1, ay, 2, MAT.LEAVES);
      ctx.box(side > 0 ? ax + 1 : ax, ay, 1, side > 0 ? ax + 1 : ax, ay + m(randRange(rng, 0.75, 1.5)), 2, MAT.LEAVES);
    }
  }
};

/** Boulder: one or two rock ellipsoids, partly sunk. */
export const rock: Recipe = {
  id: 'rock',
  name: 'Boulder',
  siting: { kind: 'any' },
  prop: true,
  footprint: (rng) => ({ x: m(randRange(rng, 1.5, 3.5)), z: m(randRange(rng, 1.5, 3)), y: m(2) }),
  build(ctx, rng, fp) {
    const rx = fp.x / 2 - 0.5;
    const rz = fp.z / 2 - 0.5;
    const ry = m(randRange(rng, 0.6, 1.2));
    ctx.ellipsoid(fp.x / 2, ry * 0.4, fp.z / 2, rx, ry, rz, MAT.ROCK);
    if (rng() > 0.5) ctx.ellipsoid(fp.x / 2 + rx * 0.4, ry * 0.3, fp.z / 2 - rz * 0.3, rx * 0.5, ry * 0.6, rz * 0.5, MAT.ROCK);
  }
};

/** Parked car: enamel body, glass cabin with pillars, rubber wheels, bumpers and lights. Faces along x. */
export const car: Recipe = {
  id: 'car',
  name: 'Car',
  siting: { kind: 'sidewalk' },
  prop: true,
  footprint: () => ({ x: m(4.25), z: m(2), y: m(2) }),
  build(ctx, rng, fp) {
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    const body = pick(rng, [MAT.ENAMEL_RED, MAT.ENAMEL_WHITE, MAT.ENAMEL_TEAL]);
    const wy = m(0.5);
    // Wheels.
    for (const wx of [m(0.5), x1 - m(0.75)]) for (const wz of [0, z1]) ctx.box(wx, 0, wz, wx + m(0.5), wy, wz, MAT.RUBBER);
    // Body shell and bonnet/boot line.
    ctx.box(0, m(0.25), 1, x1, wy + m(0.5), z1 - 1, body);
    ctx.box(m(0.5), m(0.25), 0, x1 - m(0.5), wy + m(0.25), z1, body);
    // Cabin: glass with pillars and a roof.
    const cx0 = m(1.25);
    const cx1 = x1 - m(1.25);
    const cy0 = wy + m(0.5) + 1;
    const cy1 = cy0 + m(0.5);
    ctx.box(cx0, cy0, 1, cx1, cy1, z1 - 1, MAT.GLASS);
    for (const px of [cx0, Math.floor((cx0 + cx1) / 2), cx1]) ctx.box(px, cy0, 1, px, cy1, 1, MAT.STEEL), ctx.box(px, cy0, z1 - 1, px, cy1, z1 - 1, MAT.STEEL);
    ctx.box(cx0, cy1 + 1, 1, cx1, cy1 + 1, z1 - 1, body);
    // Bumpers and lights.
    ctx.box(0, m(0.25), 1, 0, wy, z1 - 1, MAT.STEEL);
    ctx.box(x1, m(0.25), 1, x1, wy, z1 - 1, MAT.STEEL);
    ctx.set(0, wy + m(0.25), 1, MAT.NEON);
    ctx.set(0, wy + m(0.25), z1 - 1, MAT.NEON);
    ctx.set(x1, wy + m(0.25), 1, MAT.ENAMEL_RED);
    ctx.set(x1, wy + m(0.25), z1 - 1, MAT.ENAMEL_RED);
  }
};

/** Road sign: steel post with a white panel and a red border. */
export const roadSign: Recipe = {
  id: 'roadSign',
  name: 'Road Sign',
  siting: { kind: 'roadside' },
  prop: true,
  footprint: () => ({ x: m(1.25), z: m(0.5), y: m(3.5) }),
  build(ctx, rng, fp) {
    const cx = Math.floor(fp.x / 2);
    const h = m(randRange(rng, 2, 2.75));
    ctx.box(cx, 1, 0, cx, h, 0, MAT.STEEL);
    const w = m(0.5);
    ctx.box(cx - w, h - m(0.25), 0, cx + w, h + m(0.75), 0, MAT.ENAMEL_WHITE);
    ctx.hollowBox(cx - w, h - m(0.25), 0, cx + w, h + m(0.75), 0, MAT.ENAMEL_RED, 1, true, true);
  }
};

/** Lamp post: tapered steel column, curved arm, lit head. */
export const lampPost: Recipe = {
  id: 'lampPost',
  name: 'Lamp Post',
  siting: { kind: 'sidewalk' },
  prop: true,
  footprint: () => ({ x: m(1.5), z: m(0.5), y: m(5.5) }),
  build(ctx, _rng, fp) {
    const h = m(4.5);
    ctx.box(0, 1, 0, 1, m(0.5), 1, MAT.STEEL); // base
    ctx.box(0, m(0.5) + 1, 0, 0, h, 0, MAT.STEEL);
    ctx.box(0, h, 0, fp.x - 1, h, 0, MAT.STEEL); // arm
    ctx.box(fp.x - 2, h - m(0.25), 0, fp.x - 1, h - 1, 0, MAT.NEON); // head
  }
};

/** Dumpster: steel body with an enamel lid and a wheel at each corner. */
export const dumpster: Recipe = {
  id: 'dumpster',
  name: 'Dumpster',
  siting: { kind: 'beside', near: ['convenienceStore', 'officeBlock'] },
  prop: true,
  footprint: () => ({ x: m(2), z: m(1.5), y: m(2) }),
  build(ctx, rng, fp) {
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    for (const [x, z] of [[0, 0], [x1, 0], [0, z1], [x1, z1]]) ctx.set(x, 1, z, MAT.RUBBER);
    ctx.box(0, m(0.25) + 1, 0, x1, m(1.25), z1, pick(rng, [MAT.ENAMEL_TEAL, MAT.STEEL]));
    ctx.box(0, m(1.25) + 1, 0, x1, m(1.5), z1, MAT.RUBBER);
    if (rng() > 0.5) ctx.box(0, m(1.25) + 1, z1 - m(0.5), x1, m(1.75), z1, MAT.RUBBER); // lid propped open
  }
};

/** Fire hydrant: red body with steel caps. */
export const hydrant: Recipe = {
  id: 'hydrant',
  name: 'Hydrant',
  siting: { kind: 'sidewalk' },
  prop: true,
  footprint: () => ({ x: m(0.75), z: m(0.75), y: m(1.25) }),
  build(ctx) {
    ctx.box(1, 1, 1, 1, m(0.75), 1, MAT.ENAMEL_RED);
    ctx.box(0, m(0.5), 1, 2, m(0.5), 1, MAT.STEEL);
    ctx.set(1, m(0.5), 0, MAT.STEEL);
    ctx.set(1, m(0.75) + 1, 1, MAT.STEEL);
  }
};

/** Tree: bark trunk with a leafy crown of one to three blobs. */
export const tree: Recipe = {
  id: 'tree',
  name: 'Tree',
  siting: { kind: 'any' },
  prop: true,
  footprint: (rng) => {
    const r = randRange(rng, 1.5, 2.5);
    return { x: m(2 * r + 0.5), z: m(2 * r + 0.5), y: m(2 * r + 4) };
  },
  build(ctx, rng, fp) {
    const cx = fp.x / 2;
    const cz = fp.z / 2;
    const r = (fp.x - m(0.5)) / 2;
    const trunkH = m(randRange(rng, 2, 3.5));
    ctx.box(Math.floor(cx) - 1, 1, Math.floor(cz) - 1, Math.floor(cx), trunkH, Math.floor(cz), MAT.BARK);
    ctx.ellipsoid(cx, trunkH + r * 0.8, cz, r, r * 0.9, r, MAT.LEAVES);
    const blobs = randInt(rng, 0, 2);
    for (let i = 0; i < blobs; i++) ctx.ellipsoid(cx + (rng() - 0.5) * r, trunkH + r * 0.8 + (rng() - 0.3) * r * 0.6, cz + (rng() - 0.5) * r, r * 0.6, r * 0.5, r * 0.6, MAT.LEAVES);
  }
};

/** Park bench: wood slats on steel legs. */
export const bench: Recipe = {
  id: 'bench',
  name: 'Bench',
  siting: { kind: 'path' },
  prop: true,
  footprint: () => ({ x: m(1.75), z: m(0.75), y: m(1.25) }),
  build(ctx, _rng, fp) {
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    for (const x of [1, x1 - 1]) ctx.box(x, 1, 0, x, m(0.5), z1, MAT.STEEL), ctx.box(x, m(0.5) + 1, z1, x, m(1), z1, MAT.STEEL);
    ctx.box(0, m(0.5), 0, x1, m(0.5), z1 - 1, MAT.WOOD);
    ctx.box(0, m(0.75), z1, x1, m(1), z1, MAT.WOOD);
  }
};
