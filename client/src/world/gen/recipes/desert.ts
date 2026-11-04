import { MAT } from '@vw/config';
import { randInt, randRange } from '../../../util/rng';
import { m, type Recipe } from './types';

/**
 * Desert Highway recipes. Everything is authored in metres through m(); local x runs across the
 * front, z runs back from the road (z = 0 is the front edge), y up from the pad.
 */

/** Gas station: canopy over 2–4 pumps (each with a fuel tank), store with a glazed front, tall neon sign, propane cage. */
export const gasStation: Recipe = {
  id: 'gasStation',
  name: 'Gas Station',
  siting: { kind: 'roadside' },
  footprint: (rng) => ({ x: m(randRange(rng, 18, 22)), z: m(randRange(rng, 15, 18)), y: m(11) }),
  build(ctx, rng, fp) {
    const x1 = fp.x - 1;
    const pumps = randInt(rng, 2, 4);
    // Forecourt slab.
    ctx.box(0, 0, 0, x1, 0, m(8), MAT.CONCRETE);
    // Canopy: 0.5 m slab on four steel posts, neon fascia all round, lights underneath.
    const cy = m(4.5);
    const cz0 = m(1);
    const cz1 = m(7);
    ctx.box(m(1), cy, cz0, x1 - m(1), cy + m(0.5) - 1, cz1, MAT.CONCRETE);
    ctx.hollowBox(m(1), cy + m(0.5), cz0, x1 - m(1), cy + m(0.5), cz1, MAT.NEON, 1, false, false);
    ctx.hollowBox(m(1), cy - 1, cz0, x1 - m(1), cy - 1, cz1, MAT.STEEL, 1, false, false);
    for (const [px, pz] of [[m(2), cz0 + m(1)], [x1 - m(2.5), cz0 + m(1)], [m(2), cz1 - m(1.5)], [x1 - m(2.5), cz1 - m(1.5)]]) {
      ctx.box(px, 1, pz, px + m(0.5) - 1, cy - 1, pz + m(0.5) - 1, MAT.STEEL);
    }
    // Pump islands.
    const span = x1 - m(6);
    for (let i = 0; i < pumps; i++) {
      const x = m(3) + Math.floor(((i + 0.5) * span) / pumps);
      const z = m(3.5);
      ctx.box(x - m(1.25), 1, z - m(0.25), x + m(1.25), m(0.25), z + m(1.75), MAT.CONCRETE); // island kerb
      // Pump body: steel cabinet with a white face, neon price panel, two hoses with nozzles.
      ctx.box(x - m(0.4), m(0.25) + 1, z + m(0.5), x + m(0.4), m(2), z + m(1), MAT.STEEL);
      ctx.box(x - m(0.4) + 1, m(1.25), z + m(0.5), x + m(0.4) - 1, m(1.9), z + m(0.5), MAT.DRYWALL);
      ctx.box(x - m(0.25), m(1.4), z + m(0.5) - 1, x + m(0.25), m(1.6), z + m(0.5) - 1, MAT.NEON);
      ctx.box(x - m(0.4) + 1, m(1.25), z + m(1), x + m(0.4) - 1, m(1.9), z + m(1), MAT.DRYWALL);
      for (const side of [-1, 1]) {
        const hx = x + side * (m(0.4) + 1);
        ctx.box(hx, m(0.5), z + m(0.75), hx, m(1.75), z + m(0.75), MAT.RUBBER);
        ctx.box(hx, m(0.5), z + m(0.75) - 1, hx, m(0.5) + 1, z + m(0.75) - 1, MAT.STEEL);
      }
      // Fuel tank beside the island (the chain-reaction target).
      ctx.box(x - m(1.25), 1, z + m(2.25), x + m(1.25) - 1, m(1), z + m(3.25), MAT.FUEL);
      ctx.box(x - m(0.25), m(1) + 1, z + m(2.5), x + m(0.25) - 1, m(1.25), z + m(2.75), MAT.STEEL);
    }
    // Store at the back: 0.5 m brick walls, glazed front with a door, concrete roof with parapet, neon band.
    const sx0 = m(2);
    const sx1 = x1 - m(2);
    const sz0 = m(9);
    const sz1 = fp.z - 1;
    const wallH = m(3.5);
    ctx.box(sx0, 0, sz0, sx1, 0, sz1, MAT.CONCRETE);
    ctx.hollowBox(sx0, 1, sz0, sx1, wallH, sz1, MAT.BRICK, m(0.5), false, false);
    ctx.box(sx0, wallH + 1, sz0, sx1, wallH + m(0.5), sz1, MAT.CONCRETE);
    ctx.hollowBox(sx0, wallH + m(0.5) + 1, sz0, sx1, wallH + m(1), sz1, MAT.CONCRETE, 1, false, false);
    // Glazed front between the brick corners, mullions every 1.5 m; door in the middle.
    const gx0 = sx0 + m(1);
    const gx1 = sx1 - m(1);
    ctx.box(gx0, 1, sz0, gx1, wallH - 1, sz0 + m(0.5) - 1, MAT.AIR);
    ctx.glazing(gx0, m(0.5), gx1, wallH - 1, sz0, false, m(1.5), MAT.STEEL, MAT.GLASS);
    ctx.box(gx0, 1, sz0, gx1, m(0.5) - 1, sz0, MAT.BRICK);
    const dx = Math.floor((sx0 + sx1) / 2);
    ctx.box(dx - m(0.5), 1, sz0, dx + m(0.5), m(2.25), sz0, MAT.STEEL);
    ctx.box(dx - m(0.5) + 1, 1, sz0, dx + m(0.5) - 1, m(2.25) - 1, sz0, MAT.GLASS);
    ctx.set(dx + m(0.5) - 1, m(1), sz0 - 1, MAT.STEEL); // handle
    // Neon sign band over the door and an awning.
    ctx.box(dx - m(3), wallH + m(1.25), sz0 - 1, dx + m(3), wallH + m(2), sz0, MAT.DRYWALL);
    ctx.box(dx - m(2.75), wallH + m(1.5), sz0 - 2, dx + m(2.75), wallH + m(1.75), sz0 - 2, MAT.NEON);
    ctx.box(gx0, m(2.5), sz0 - m(1), gx1, m(2.5), sz0 - 1, MAT.ENAMEL_RED);
    // Interior: shelves, counter, fridge wall, back-room partition, propane bottles by the back door.
    ctx.box(sx0 + m(0.5), 1, sz0 + m(1), sx1 - m(0.5), 0, sz1 - m(0.5), MAT.CONCRETE);
    const bz = sz1 - m(2.5);
    ctx.box(sx0 + m(0.5), 1, bz, sx1 - m(0.5), wallH - 1, bz, MAT.DRYWALL);
    ctx.box(dx + m(2), 1, bz, dx + m(2.75), m(2.1), bz, MAT.AIR); // back-room doorway
    for (let z = sz0 + m(2.5); z < bz - m(1.5); z += m(2)) ctx.box(sx0 + m(2), 1, z, sx1 - m(3.5), m(1.5), z + 1, MAT.DRYWALL);
    ctx.box(sx1 - m(2.5), 1, sz0 + m(1.5), sx1 - m(0.5) - 1, m(2), bz - m(1), MAT.STEEL); // fridges
    ctx.box(sx1 - m(2.5), m(0.5), sz0 + m(1.5), sx1 - m(2.5), m(1.75), bz - m(1), MAT.GLASS);
    ctx.box(sx0 + m(0.5), 1, sz0 + m(1), sx0 + m(2.5), m(1), sz0 + m(1.5), MAT.WOOD); // counter
    ctx.box(sx0 + m(0.75), 1, bz + 1, sx0 + m(1.25), m(1), bz + m(0.5), MAT.PROPANE);
    ctx.box(sx0 + m(1.5), 1, bz + 1, sx0 + m(2), m(1), bz + m(0.5), MAT.PROPANE);
    ctx.box(sx1 - m(2), 1, bz + 1, sx1 - m(0.75), m(1.5), bz + m(1), MAT.TRANSFORMER);
    // Rooftop units.
    ctx.box(sx0 + m(1.5), wallH + m(1) + 1, sz0 + m(2), sx0 + m(3.5), wallH + m(2), sz0 + m(4), MAT.STEEL);
    ctx.box(sx1 - m(3), wallH + m(1) + 1, sz1 - m(3), sx1 - m(1.5), wallH + m(1.75), sz1 - m(1.5), MAT.STEEL);
    // Tall sign by the front corner: steel pole, white box with a neon border and letters.
    const sgx = x1 - m(1);
    ctx.box(sgx - m(0.25), 1, 0, sgx + m(0.25) - 1, m(8), m(0.5) - 1, MAT.STEEL);
    ctx.box(sgx - m(2.25), m(6.5), 0, sgx + m(1.75), m(10), 0, MAT.DRYWALL);
    ctx.hollowBox(sgx - m(2.25), m(6.5), 0, sgx + m(1.75), m(10), 0, MAT.NEON, 1, true, true);
    for (let i = 0; i < 3; i++) ctx.box(sgx - m(1.75) + i * m(1.25), m(7.5), 0, sgx - m(1.75) + i * m(1.25) + m(0.5), m(9), 0, MAT.NEON);
    ctx.box(sgx - m(2.25), m(6.5), 1, sgx + m(1.75), m(10), 1, MAT.DRYWALL);
    // Propane cage by the front-left corner.
    ctx.cage(0, 1, 0, m(2.5), m(1.5), m(1.5), MAT.STEEL);
    for (let i = 0; i < 4; i++) ctx.box(m(0.5) + i * m(0.5), 1, m(0.5), m(0.5) + i * m(0.5) + 1, m(1), m(0.5) + 1, MAT.PROPANE);
  }
};

/** Diner: brick base, wrap-around glass band with chrome mullions, steel roof with neon trim, rooftop sign, booths and counter. */
export const diner: Recipe = {
  id: 'diner',
  name: 'Diner',
  siting: { kind: 'roadside' },
  footprint: (rng) => ({ x: m(randRange(rng, 16, 22)), z: m(randRange(rng, 7, 9)), y: m(7) }),
  build(ctx, rng, fp) {
    const x1 = fp.x - 1;
    const z1 = fp.z - 1;
    const base = m(1);
    const top = m(3);
    ctx.box(0, 0, 0, x1, 0, z1, MAT.CONCRETE);
    ctx.hollowBox(0, 1, 0, x1, base, z1, MAT.BRICK, m(0.25), false, false);
    // Glass band on all four sides with steel mullions every 1.5 m.
    ctx.glazing(0, base + 1, x1, top, 0, false, m(1.5), MAT.STEEL, MAT.GLASS);
    ctx.glazing(0, base + 1, x1, top, z1, false, m(1.5), MAT.STEEL, MAT.GLASS);
    ctx.glazing(0, base + 1, z1, top, 0, true, m(1.5), MAT.STEEL, MAT.GLASS);
    ctx.glazing(0, base + 1, z1, top, x1, true, m(1.5), MAT.STEEL, MAT.GLASS);
    // Roof: steel slab, chrome fascia, neon trim front and back.
    ctx.box(0, top + 1, 0, x1, top + m(0.5), z1, MAT.STEEL);
    ctx.box(0, top + m(0.5) + 1, 0, x1, top + m(0.5) + 1, 0, MAT.NEON);
    ctx.box(0, top + m(0.5) + 1, z1, x1, top + m(0.5) + 1, z1, MAT.NEON);
    // Front door with frame and a red awning.
    const dx = Math.floor(x1 / 2);
    ctx.box(dx - m(0.5), 1, 0, dx + m(0.5), m(2.25), 0, MAT.STEEL);
    ctx.box(dx - m(0.5) + 1, 1, 0, dx + m(0.5) - 1, m(2.25) - 1, 0, MAT.GLASS);
    ctx.box(dx - m(1.25), m(2.5), -1, dx + m(1.25), m(2.5), 0, MAT.ENAMEL_RED);
    // Rooftop sign: white panel on two posts with neon letters.
    ctx.box(dx - m(2.5), top + m(0.5) + 1, m(2), dx - m(2.5) + 1, top + m(2), m(2), MAT.STEEL);
    ctx.box(dx + m(2.5) - 1, top + m(0.5) + 1, m(2), dx + m(2.5), top + m(2), m(2), MAT.STEEL);
    ctx.box(dx - m(3), top + m(2), m(2), dx + m(3), top + m(3.5), m(2), MAT.DRYWALL);
    for (let i = 0; i < 4; i++) ctx.box(dx - m(2.5) + i * m(1.5), top + m(2.5), m(2) - 1, dx - m(2.5) + i * m(1.5) + m(0.75), top + m(3), m(2) - 1, MAT.NEON);
    // Interior: counter with stools along the back, booths along the front, kitchen at one end.
    const kz = Math.floor(z1 * 0.6);
    ctx.box(m(1.5), 1, kz, x1 - m(4), m(1), kz + m(0.5), MAT.DRYWALL);
    ctx.box(m(1.5), m(1) + 1, kz, x1 - m(4), m(1) + 1, kz + m(0.5), MAT.WOOD);
    for (let x = m(2); x < x1 - m(4); x += m(1)) ctx.box(x, 1, kz - m(0.75), x, m(0.75), kz - m(0.75), MAT.STEEL), ctx.set(x, m(0.75) + 1, kz - m(0.75), MAT.ENAMEL_RED);
    for (let x = m(1); x < x1 - m(5); x += m(2.5)) {
      ctx.box(x, 1, m(0.75), x + m(1.5), m(0.5), m(1.5), MAT.WOOD); // table
      ctx.box(x, 1, m(0.5), x + m(1.5), m(1), m(0.5), MAT.ENAMEL_RED); // bench backs
      ctx.box(x, 1, m(1.75), x + m(1.5), m(1), m(1.75), MAT.ENAMEL_RED);
    }
    // Kitchen: drywall partition, steel range, propane bottles.
    ctx.box(x1 - m(3.5), 1, m(0.5), x1 - m(3.5), top, z1 - m(0.5), MAT.DRYWALL);
    ctx.box(x1 - m(3.5), 1, Math.floor(z1 / 2) - m(0.5), x1 - m(3.5), m(2.1), Math.floor(z1 / 2) + m(0.5), MAT.AIR);
    ctx.box(x1 - m(3), 1, z1 - m(1.5), x1 - m(1), m(1), z1 - m(1), MAT.STEEL);
    ctx.box(x1 - m(1.25), 1, m(0.5), x1 - m(0.75), m(1), m(1), MAT.PROPANE);
    if (rng() > 0.5) ctx.box(x1 - m(2), 1, m(0.5), x1 - m(1.5), m(1), m(1), MAT.PROPANE);
    ctx.box(x1 - m(3), 1, Math.floor(z1 / 2), x1 - m(2), m(1.25), Math.floor(z1 / 2) + m(0.5), MAT.TRANSFORMER);
  }
};

/** Billboard: two steel posts, catwalk, white panel with neon letters and a row of lamps. */
export const billboard: Recipe = {
  id: 'billboard',
  name: 'Billboard',
  siting: { kind: 'roadside' },
  footprint: (rng) => ({ x: m(randRange(rng, 9, 12)), z: m(1.5), y: m(12) }),
  build(ctx, rng, fp) {
    const h = m(randRange(rng, 5, 7));
    const x1 = fp.x - 1;
    const panelH = m(4.5);
    for (const px of [m(1.5), x1 - m(2)]) ctx.box(px, 1, m(0.5), px + m(0.5) - 1, h + panelH, m(1) - 1, MAT.STEEL);
    // Cross brace between the posts.
    ctx.fill(m(2), m(1), m(0.5), x1 - m(2), h - 1, m(0.5), (x, y) => (Math.abs((x - m(2)) - ((y - m(1)) * (x1 - m(4))) / Math.max(1, h - m(1) - 1)) < m(0.25) + 1 ? MAT.STEEL : 0));
    // Catwalk and panel.
    ctx.box(0, h, 0, x1, h, m(1) - 1, MAT.STEEL);
    ctx.box(0, h + 1, m(0.5) - 1, x1, h + panelH, m(0.5) - 1, MAT.WOOD);
    ctx.box(1, h + 1, m(0.5) - 2, x1 - 1, h + panelH - 1, m(0.5) - 2, MAT.DRYWALL);
    // Neon "letters": blocks of varying height along the panel.
    for (let x = m(1); x < x1 - m(1); x += m(1.25)) if (rng() > 0.25) ctx.box(x, h + m(1.25), m(0.5) - 3, x + m(0.75), h + m(1.25) + m(randRange(rng, 1.5, 2.5)), m(0.5) - 3, MAT.NEON);
    // Lamps along the top edge.
    for (let x = m(0.5); x < x1; x += m(2)) ctx.box(x, h + panelH + 1, m(0.5) - 3, x, h + panelH + 1, m(0.5) - 1, MAT.STEEL), ctx.set(x, h + panelH, m(0.5) - 3, MAT.NEON);
  }
};

/** Water tower: four braced steel legs, ladder, catwalk, riveted tank full of water, conical roof. */
export const waterTower: Recipe = {
  id: 'waterTower',
  name: 'Water Tower',
  siting: { kind: 'hill' },
  footprint: () => ({ x: m(7), z: m(7), y: m(16) }),
  build(ctx, rng) {
    const legH = m(randRange(rng, 7, 9));
    const c = m(3.5);
    const legs: [number, number][] = [[m(1), m(1)], [m(6) - 1, m(1)], [m(1), m(6) - 1], [m(6) - 1, m(6) - 1]];
    for (const [x, z] of legs) ctx.box(x, 1, z, x + 1, legH, z + 1, MAT.STEEL);
    // Horizontal rings and X braces at two heights.
    for (const y of [m(2.5), m(5.5)]) {
      ctx.hollowBox(m(1), y, m(1), m(6), y, m(6), MAT.STEEL, 1, false, false);
      ctx.fill(m(1), y - m(1.5), m(1), m(6), y + m(1.5) - 1, m(1), (x, yy) => (Math.abs((x - m(1)) - ((yy - (y - m(1.5))) * (m(5))) / m(3)) <= 1 || Math.abs((m(6) - x) - ((yy - (y - m(1.5))) * (m(5))) / m(3)) <= 1 ? MAT.STEEL : 0));
      ctx.fill(m(1), y - m(1.5), m(1), m(1), y + m(1.5) - 1, m(6), (x, yy, z) => (Math.abs((z - m(1)) - ((yy - (y - m(1.5))) * (m(5))) / m(3)) <= 1 || Math.abs((m(6) - z) - ((yy - (y - m(1.5))) * (m(5))) / m(3)) <= 1 ? MAT.STEEL : 0));
    }
    // Ladder up one leg.
    for (let y = m(0.5); y < legH + m(1); y += 2) ctx.box(m(1) - 1, y, m(1) - 2, m(1), y, m(1) - 2, MAT.STEEL);
    ctx.box(m(1) - 1, 1, m(1) - 3, m(1) - 1, legH + m(1), m(1) - 3, MAT.STEEL);
    ctx.box(m(1), 1, m(1) - 3, m(1), legH + m(1), m(1) - 3, MAT.STEEL);
    // Catwalk ring and tank.
    const r = m(3.25);
    ctx.cylinder(c, c, r + m(0.5), legH, legH, MAT.STEEL, m(0.5));
    ctx.cylinder(c, c, r, legH, legH + m(5), MAT.STEEL, 1);
    ctx.cylinder(c, c, r, legH, legH, MAT.STEEL);
    ctx.cylinder(c, c, r - 1, legH + 1, legH + m(4.5), MAT.WATER);
    // Riveted bands.
    for (const y of [legH + m(1.5), legH + m(3.5)]) ctx.cylinder(c, c, r + 1, y, y, MAT.STEEL, 1);
    // Conical roof in steps, finial.
    for (let i = 0; i <= m(1.5); i++) ctx.cylinder(c, c, Math.max(1, r - i * (r / m(1.5))), legH + m(5) + 1 + i, legH + m(5) + 1 + i, MAT.STEEL);
    ctx.box(Math.floor(c), legH + m(5) + m(1.5) + 2, Math.floor(c), Math.floor(c), legH + m(5) + m(2.5), Math.floor(c), MAT.STEEL);
    ctx.set(Math.floor(c), legH + m(5) + m(2.5) + 1, Math.floor(c), MAT.NEON);
  }
};

/** Propane cage: steel lattice full of bottles on a concrete pad. */
export const propaneCage: Recipe = {
  id: 'propaneCage',
  name: 'Propane Cage',
  siting: { kind: 'beside', near: ['gasStation', 'diner', 'convenienceStore'] },
  footprint: (rng) => ({ x: m(randRange(rng, 2.5, 3.5)), z: m(randRange(rng, 2, 3)), y: m(2.5) }),
  build(ctx, rng, fp) {
    ctx.box(0, 0, 0, fp.x - 1, 0, fp.z - 1, MAT.CONCRETE);
    ctx.cage(0, 1, 0, fp.x - 1, m(1.75), fp.z - 1, MAT.STEEL);
    for (let x = 1; x + 1 < fp.x - 1; x += m(0.5) + 1) for (let z = 1; z + 1 < fp.z - 1; z += m(0.5) + 1) if (rng() > 0.2) ctx.box(x, 1, z, x + 1, m(1), z + 1, MAT.PROPANE);
  }
};
