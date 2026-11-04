import { MAT } from '@vw/config';
import { randInt, randRange, pick } from '../../../util/rng';
import { m, type Recipe } from './types';

/** Downtown recipes, authored in metres (z = 0 faces the street). Lots are 20 m square. */

/** Convenience store: glazed front with a door and awning, drywall interior with shelves, fridges and a transformer, propane cage outside. */
export const convenienceStore: Recipe = {
  id: 'convenienceStore',
  name: 'Convenience Store',
  siting: { kind: 'block' },
  footprint: (rng) => ({ x: m(randRange(rng, 12, 15)), z: m(randRange(rng, 9, 11)), y: m(6) }),
  build(ctx, rng, fp) {
    const x0 = m(3.5); // the cage sits left of the building
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    const wallH = m(3.5);
    ctx.box(x0, 0, 0, x1, 0, z1, MAT.CONCRETE);
    // Walls: brick 0.5 m with drywall lining, concrete roof and parapet.
    ctx.hollowBox(x0, 1, 0, x1, wallH, z1, MAT.BRICK, m(0.25), false, false);
    ctx.hollowBox(x0 + m(0.25), 1, m(0.25), x1 - m(0.25), wallH, z1 - m(0.25), MAT.DRYWALL, 1, false, false);
    ctx.box(x0, wallH + 1, 0, x1, wallH + m(0.5), z1, MAT.CONCRETE);
    ctx.hollowBox(x0, wallH + m(0.5) + 1, 0, x1, wallH + m(1), z1, MAT.CONCRETE, 1, false, false);
    // Glazed front with a door.
    const gx0 = x0 + m(1);
    const gx1 = x1 - m(1);
    ctx.box(gx0, 1, 0, gx1, wallH - 1, m(0.5) - 1, MAT.AIR);
    ctx.glazing(gx0, m(0.5), gx1, wallH - 1, 0, false, m(1.5), MAT.STEEL, MAT.GLASS);
    ctx.box(gx0, 1, 0, gx1, m(0.5) - 1, 0, MAT.BRICK);
    const dx = x0 + m(2.5);
    ctx.box(dx - m(0.5), 1, 0, dx + m(0.5), m(2.25), 0, MAT.STEEL);
    ctx.box(dx - m(0.5) + 1, 1, 0, dx + m(0.5) - 1, m(2.25) - 1, 0, MAT.GLASS);
    ctx.set(dx + m(0.5) - 1, m(1), -1, MAT.STEEL);
    // Awning and neon sign band.
    ctx.box(gx0, m(2.5), -m(1), gx1, m(2.5), -1, pick(rng, [MAT.ENAMEL_TEAL, MAT.ENAMEL_RED]));
    ctx.box(gx0, wallH + m(1.25), -1, gx1, wallH + m(2), 0, MAT.DRYWALL);
    for (let x = gx0 + m(0.5); x < gx1 - m(0.5); x += m(1.25)) ctx.box(x, wallH + m(1.5), -2, x + m(0.75), wallH + m(1.75), -2, MAT.NEON);
    // Interior: shelf rows, counter, fridge wall, back room with the transformer.
    const bz = z1 - m(2.5);
    ctx.box(x0 + m(0.5), 1, bz, x1 - m(0.5), wallH - 1, bz, MAT.DRYWALL);
    ctx.box(x1 - m(2.5), 1, bz, x1 - m(1.75), m(2.1), bz, MAT.AIR);
    for (let z = m(2.5); z < bz - m(1.5); z += m(2)) ctx.box(x0 + m(3), 1, z, x1 - m(3), m(1.5), z + 1, MAT.DRYWALL);
    ctx.box(x1 - m(2), 1, m(1.5), x1 - m(1), m(2), bz - m(1), MAT.STEEL);
    ctx.box(x1 - m(2), m(0.5), m(1.5), x1 - m(2), m(1.75), bz - m(1), MAT.GLASS);
    ctx.box(x0 + m(0.75), 1, m(1), x0 + m(2.5), m(1), m(1.5), MAT.WOOD);
    ctx.box(x0 + m(0.75), 1, bz + 1, x0 + m(2.25), m(1.5), z1 - m(0.5) - 1, MAT.TRANSFORMER);
    ctx.box(x1 - m(1.5), 1, bz + 1, x1 - m(1), m(1), bz + m(0.5), MAT.PROPANE);
    // Rooftop unit.
    ctx.box(x1 - m(4), wallH + m(1) + 1, m(2), x1 - m(2), wallH + m(1.75), m(4), MAT.STEEL);
    // Propane cage out front-left.
    ctx.box(0, 0, m(0.5), m(3), 0, m(3), MAT.CONCRETE);
    ctx.cage(0, 1, m(0.5), m(3) - 1, m(1.75), m(3) - 1, MAT.STEEL);
    for (let x = 1; x + 1 < m(3) - 1; x += m(0.5) + 1) for (let z = m(0.5) + 1; z + 1 < m(3) - 1; z += m(0.5) + 1) if (rng() > 0.25) ctx.box(x, 1, z, x + 1, m(1), z + 1, MAT.PROPANE);
  }
};

/** Office block: 3–5 floors on a concrete frame, glass curtain wall with mullions, steel spandrels, lobby, core, rooftop plant, transformer in the alley. */
export const officeBlock: Recipe = {
  id: 'officeBlock',
  name: 'Office Block',
  siting: { kind: 'block' },
  footprint: (rng) => ({ x: m(randRange(rng, 14, 18)), z: m(randRange(rng, 10, 13)), y: m(20) }),
  build(ctx, rng, fp) {
    const floors = randInt(rng, 3, 5);
    const fh = m(3.5);
    const x1 = fp.x - m(2.5); // alley on the right
    const z1 = fp.z - 1;
    const slab = m(0.25);
    for (let f = 0; f < floors; f++) {
      const y0 = f * fh;
      ctx.box(0, y0, 0, x1, y0 + slab - 1, z1, MAT.CONCRETE);
      // Columns every ~4 m.
      const nx = Math.max(2, Math.round(x1 / m(4)));
      const nz = Math.max(2, Math.round(z1 / m(4)));
      for (let i = 0; i <= nx; i++)
        for (let j = 0; j <= nz; j++) {
          const cx = Math.min(x1 - m(0.5) + 1, Math.round((i * (x1 - m(0.5) + 1)) / nx));
          const cz = Math.min(z1 - m(0.5) + 1, Math.round((j * (z1 - m(0.5) + 1)) / nz));
          ctx.box(cx, y0 + slab, cz, cx + m(0.5) - 1, y0 + fh - 1, cz + m(0.5) - 1, MAT.CONCRETE);
        }
      // Curtain wall: glass with mullions on all four faces, steel spandrel band at the top of each floor.
      const gy0 = y0 + slab;
      const gy1 = y0 + fh - m(0.75);
      ctx.glazing(0, gy0, x1, gy1, 0, false, m(2), MAT.STEEL, MAT.GLASS);
      ctx.glazing(0, gy0, x1, gy1, z1, false, m(2), MAT.STEEL, MAT.GLASS);
      ctx.glazing(0, gy0, z1, gy1, 0, true, m(2), MAT.STEEL, MAT.GLASS);
      ctx.glazing(0, gy0, z1, gy1, x1, true, m(2), MAT.STEEL, MAT.GLASS);
      ctx.hollowBox(0, gy1 + 1, 0, x1, y0 + fh - 1, z1, MAT.STEEL, 1, false, false);
      // Interior: drywall partitions and a row of desks.
      const px = m(3) + Math.floor(rng() * (x1 - m(6)));
      ctx.box(px, y0 + slab, m(1), px, y0 + fh - 2, z1 - m(1), MAT.DRYWALL);
      ctx.box(m(1), y0 + slab, Math.floor(z1 / 2), x1 - m(1), y0 + fh - 2, Math.floor(z1 / 2), MAT.DRYWALL);
      ctx.box(px - m(1), y0 + slab, Math.floor(z1 / 2), px + m(1), y0 + fh - 2, Math.floor(z1 / 2), MAT.AIR);
      for (let x = m(1.5); x < px - m(1.5); x += m(2.5)) ctx.box(x, y0 + slab, m(1.5), x + m(1.5), y0 + slab + m(0.75) - 1, m(2.25), MAT.WOOD);
    }
    // Lobby: taller glass doors in the middle of the front, entrance canopy.
    const dx = Math.floor(x1 / 2);
    ctx.box(dx - m(1.5), slab, 0, dx + m(1.5), m(2.5), 0, MAT.STEEL);
    ctx.box(dx - m(1.5) + 1, slab, 0, dx + m(1.5) - 1, m(2.5) - 1, 0, MAT.GLASS);
    ctx.set(dx, slab, 0, MAT.STEEL);
    ctx.box(dx - m(2.5), m(2.75), -m(1.5), dx + m(2.5), m(2.75) + 1, -1, MAT.STEEL);
    ctx.box(dx - m(2.5), m(2.75) + 1, -1, dx + m(2.5), m(2.75) + 1, -1, MAT.NEON);
    // Roof slab, parapet, plant room and units.
    const ry = floors * fh;
    ctx.box(0, ry, 0, x1, ry + slab - 1, z1, MAT.CONCRETE);
    ctx.hollowBox(0, ry + slab, 0, x1, ry + m(1), z1, MAT.CONCRETE, 1, false, false);
    // Steel core through every floor, poking above the roof.
    const cx = Math.floor(x1 * 0.7);
    const cz = Math.floor(z1 / 2);
    ctx.hollowBox(cx - m(1.25), slab, cz - m(1.25), cx + m(1.25), ry + m(2.5), cz + m(1.25), MAT.STEEL, 1, false, true);
    ctx.box(m(1.5), ry + slab, m(1.5), m(4), ry + m(1.5), m(3.5), MAT.STEEL);
    ctx.box(m(2), ry + m(1.5) + 1, m(2), m(2.5), ry + m(2.5), m(2.5), MAT.STEEL);
    ctx.box(x1 - m(4), ry + slab, z1 - m(3), x1 - m(1.5), ry + m(1.25), z1 - m(1.5), MAT.STEEL);
    // Alley: transformer on a pad with a pole, dumpster-sized steel box.
    ctx.box(x1 + m(0.75), 0, m(1), x1 + m(2.25), m(1.5), m(2.5), MAT.TRANSFORMER);
    ctx.box(x1 + m(1.25), m(1.5) + 1, m(1.5), x1 + m(1.25), m(4), m(1.5), MAT.STEEL);
    ctx.box(x1 + m(0.75), 0, z1 - m(2.5), x1 + m(2.25), m(1.25), z1 - m(1), MAT.ENAMEL_TEAL);
  }
};

/** Parking structure: 2–3 open concrete decks on columns, parapets, ramp, stair tower, painted bays with parked cars. */
export const parkingStructure: Recipe = {
  id: 'parkingStructure',
  name: 'Parking Structure',
  siting: { kind: 'block' },
  footprint: (rng) => ({ x: m(randRange(rng, 14, 18)), z: m(randRange(rng, 11, 15)), y: m(12) }),
  build(ctx, rng, fp) {
    const decks = randInt(rng, 2, 3);
    const dh = m(3);
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    const slab = m(0.5);
    ctx.box(0, 0, 0, x1, 0, z1, MAT.ASPHALT);
    const bays = (y: number) => {
      for (let x = m(1); x < x1 - m(4); x += m(2.5)) ctx.box(x, y, m(1), x, y, m(5), MAT.ROAD_PAINT);
      for (let x = m(1); x < x1 - m(4); x += m(2.5)) ctx.box(x, y, z1 - m(5), x, y, z1 - m(1), MAT.ROAD_PAINT);
    };
    const car = (x: number, y: number, z: number) => {
      const body = pick(rng, [MAT.ENAMEL_RED, MAT.ENAMEL_WHITE, MAT.ENAMEL_TEAL]);
      ctx.box(x, y + 1, z, x + m(1.75) - 1, y + m(0.75), z + m(4) - 1, body);
      ctx.box(x + 1, y + m(0.75) + 1, z + m(1), x + m(1.75) - 2, y + m(1.4), z + m(2.75), MAT.GLASS);
      ctx.box(x + 1, y + m(1.4) + 1, z + m(1.25), x + m(1.75) - 2, y + m(1.4) + 1, z + m(2.5), body);
      for (const [wx, wz] of [[x - 0, z + m(0.5)], [x + m(1.75) - 1, z + m(0.5)], [x, z + m(3)], [x + m(1.75) - 1, z + m(3)]]) ctx.box(wx, y, wz, wx, y + m(0.5), wz + m(0.5) - 1, MAT.RUBBER);
    };
    bays(0);
    for (let d = 1; d <= decks; d++) {
      const y = d * dh;
      ctx.box(0, y, 0, x1, y + slab - 1, z1, MAT.CONCRETE);
      ctx.hollowBox(0, y + slab, 0, x1, y + slab + m(1) - 1, z1, MAT.CONCRETE, 1, false, false);
      for (let x = m(0.5); x < x1; x += m(4)) for (let z = m(0.5); z < z1; z += m(4)) ctx.box(x, y - dh + slab, z, x + m(0.5) - 1, y - 1, z + m(0.5) - 1, MAT.CONCRETE);
      if (d < decks) bays(y + slab);
      // Parked cars on this deck and the ground.
      for (let x = m(1.25); x < x1 - m(6); x += m(5)) if (rng() > 0.4) car(x, y - dh + slab - 1, m(1));
    }
    for (let x = m(1.25); x < x1 - m(6); x += m(5)) if (rng() > 0.5) car(x, 0, z1 - m(5));
    // Ramp along the back from the ground to the first deck.
    const rz0 = z1 - m(3);
    ctx.fill(m(1), 1, rz0, x1 - m(6), dh, z1 - m(0.5), (x, y) => (y <= 1 + Math.floor(((x - m(1)) * (dh - 1)) / Math.max(1, x1 - m(7))) ? MAT.CONCRETE : 0));
    // Stair tower: steel frame with glass, through every deck.
    ctx.hollowBox(x1 - m(3), 1, z1 - m(3), x1, decks * dh + m(2), z1, MAT.STEEL, 1, false, true);
    ctx.box(x1 - m(3) + 1, m(1), z1, x1 - 1, decks * dh + m(1), z1, MAT.GLASS);
    ctx.box(x1 - m(3) + 1, m(1), z1 - m(3), x1 - 1, decks * dh + m(1), z1 - m(3), MAT.GLASS);
    // Pay booth by the entrance and a propane delivery pallet, why not.
    ctx.box(m(0.5), 1, m(0.5), m(2), m(2.25), m(2), MAT.STEEL);
    ctx.box(m(0.5) + 1, m(1), m(0.5), m(2) - 1, m(2), m(0.5), MAT.GLASS);
    ctx.box(m(0.5), m(2.5), 0, m(3), m(2.5), m(0.5), MAT.NEON);
    if (rng() > 0.4) for (let i = 0; i < 4; i++) ctx.box(x1 - m(5) + (i % 2) * m(0.75), 1, m(1) + Math.floor(i / 2) * m(0.75), x1 - m(5) + (i % 2) * m(0.75) + 1, m(1), m(1) + Math.floor(i / 2) * m(0.75) + 1, MAT.PROPANE);
  }
};

/** Bus shelter: steel frame, glass back and sides, bench, lit ad panel, stop pole. */
export const busShelter: Recipe = {
  id: 'busShelter',
  name: 'Bus Shelter',
  siting: { kind: 'sidewalk' },
  footprint: () => ({ x: m(4.5), z: m(2), y: m(3.5) }),
  build(ctx) {
    const x1 = m(4.5) - 1;
    const z1 = m(2) - 1;
    const h = m(2.5);
    for (const [x, z] of [[0, 0], [x1, 0], [0, z1], [x1, z1]]) ctx.box(x, 1, z, x, h, z, MAT.STEEL);
    ctx.box(0, h + 1, -1, x1, h + 1, z1, MAT.STEEL); // roof with a front overhang
    ctx.box(1, 1, z1, x1 - 1, h, z1, MAT.GLASS);
    ctx.box(0, 1, 1, 0, h, z1 - 1, MAT.GLASS);
    ctx.box(x1, 1, 1, x1, h, z1 - 1, MAT.GLASS);
    ctx.box(0, m(1.25), 1, x1, m(1.25), z1 - 1, MAT.STEEL); // rail through the glass
    ctx.box(m(0.5), m(0.5), z1 - 1, x1 - m(0.5), m(0.5), z1 - 1, MAT.WOOD); // bench
    ctx.box(m(0.5), 1, z1 - 1, m(0.5), m(0.5) - 1, z1 - 1, MAT.STEEL);
    ctx.box(x1 - m(0.5), 1, z1 - 1, x1 - m(0.5), m(0.5) - 1, z1 - 1, MAT.STEEL);
    ctx.box(x1, m(0.75), 1, x1, h - 1, z1 - 1, MAT.NEON); // lit ad panel on the end
    ctx.box(x1 + 1, 1, 0, x1 + 1, m(3), 0, MAT.STEEL); // stop pole
    ctx.box(x1 + 1, m(2.5), -1, x1 + 1, m(3), -1, MAT.ENAMEL_WHITE);
  }
};
