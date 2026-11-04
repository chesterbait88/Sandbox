import { describe, expect, it, beforeEach } from 'vitest';
import { MAT, VOXEL_SIZE } from '@vw/config';
import { World } from '../world/World';
import { Destruction } from './damage';
import { events } from '../state/events';

/** Metres of a voxel coordinate (its low face) and of its centre. */
const M = (v: number) => v * VOXEL_SIZE;
const C = (v: number) => (v + 0.5) * VOXEL_SIZE;

function wall(w: World, mat: number, x0: number, x1: number, y0: number, y1: number, z: number, owner = 0) {
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) w.setVoxel(x, y, z, mat, owner);
}

describe('applyDamage', () => {
  let world: World;
  let d: Destruction;
  beforeEach(() => {
    world = new World();
    d = new Destruction(world);
    events.clear();
  });

  it('a grenade clears drywall deeper than concrete and tags owners', () => {
    // Two 10 m × 5 m × 4 m walls, 20 voxels apart in x, hit from the front at 2.5 m / 40 power.
    const s = Math.round(0.5 / VOXEL_SIZE);
    for (let z = 40 * s; z < 48 * s; z++) wall(world, MAT.DRYWALL, 20 * s, 40 * s, 20 * s, 30 * s, z, 1);
    const a = d.applyDamage({ x: M(30 * s), y: C(25 * s), z: M(40 * s) - 0.2 }, 2.5, 40, 'test');
    expect(a.length).toBeGreaterThan(50);
    expect(a.every((v) => v.owner === 1)).toBe(true);
    for (let z = 40 * s; z < 48 * s; z++) wall(world, MAT.CONCRETE, 60 * s, 80 * s, 20 * s, 30 * s, z, 2);
    const b = d.applyDamage({ x: M(70 * s), y: C(25 * s), z: M(40 * s) - 0.2 }, 2.5, 40, 'test');
    expect(b.length).toBeGreaterThan(0);
    expect(b.length).toBeLessThan(a.length);
    // Drywall is carved to the full 2.5 m depth; concrete keeps its back half.
    expect(world.getVoxel(30 * s, 25 * s, 43 * s)).toBe(0);
    expect(world.getVoxel(70 * s, 25 * s, 44 * s)).toBe(MAT.CONCRETE);
  });

  it('C4 punches through concrete', () => {
    const s = Math.round(0.5 / VOXEL_SIZE);
    for (let z = 40 * s; z < 42 * s; z++) wall(world, MAT.CONCRETE, 20 * s, 60 * s, 20 * s, 40 * s, z);
    const r = d.applyDamage({ x: M(40 * s), y: M(30 * s), z: M(40 * s) - 0.1 }, 4, 90, 'c4');
    expect(r.length).toBeGreaterThan(100);
    expect(world.getVoxel(40 * s, 30 * s, 42 * s - 1)).toBe(0);
  });

  it('glass shatters on any hit and is reported', () => {
    world.setVoxel(10, 10, 10, MAT.GLASS);
    const r = d.applyDamage({ x: C(10) + 0.05, y: C(10), z: C(10) }, VOXEL_SIZE * 0.8, 1, 'pistol');
    expect(r.length).toBe(1);
  });

  it('volatile voxels queue one delayed detonation per tank', () => {
    // 1 m × 1 m × 2 m fuel tank
    const s = Math.round(0.5 / VOXEL_SIZE);
    for (let x = 10; x < 10 + 2 * s; x++) for (let y = 10; y < 10 + 2 * s; y++) for (let z = 10; z < 10 + 4 * s; z++) world.setVoxel(x, y, z, MAT.FUEL);
    let detonations = 0;
    events.on('detonation', () => detonations++);
    d.update(0);
    d.applyDamage({ x: C(10), y: C(10), z: C(10) }, VOXEL_SIZE * 0.8, 5, 'pistol');
    expect(d.pendingCount).toBe(1);
    d.update(100);
    expect(detonations).toBe(0);
    d.update(200);
    expect(detonations).toBe(1);
    // The detonation destroys the rest of the tank without re-triggering.
    d.update(400);
    d.update(600);
    expect(detonations).toBe(1);
    expect(world.getVoxel(10 + 2 * s - 1, 10 + 2 * s - 1, 10 + 4 * s - 1)).toBe(0);
  });
});
