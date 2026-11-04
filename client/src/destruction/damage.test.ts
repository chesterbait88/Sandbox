import { describe, expect, it, beforeEach } from 'vitest';
import { MAT } from '@vw/config';
import { World } from '../world/World';
import { Destruction } from './damage';
import { events } from '../state/events';

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

  it('a grenade clears drywall fully but barely marks concrete', () => {
    wall(world, MAT.DRYWALL, 20, 40, 20, 30, 40, 1);
    const a = d.applyDamage({ x: 15, y: 12.5, z: 19.8 }, 2.5, 40, 'test');
    expect(a.length).toBeGreaterThan(50);
    expect(a.every((v) => v.owner === 1)).toBe(true);
    wall(world, MAT.CONCRETE, 60, 80, 20, 30, 40, 2);
    const b = d.applyDamage({ x: 35, y: 12.5, z: 19.8 }, 2.5, 40, 'test');
    expect(b.length).toBeGreaterThan(0);
    expect(b.length).toBeLessThan(a.length / 2);
    expect(world.getVoxel(70, 25, 40)).toBe(MAT.CONCRETE);
  });

  it('C4 punches through concrete', () => {
    wall(world, MAT.CONCRETE, 20, 60, 20, 40, 40);
    wall(world, MAT.CONCRETE, 20, 60, 20, 40, 41);
    const r = d.applyDamage({ x: 20, y: 15, z: 19.9 }, 4, 90, 'c4');
    expect(r.length).toBeGreaterThan(100);
    expect(world.getVoxel(40, 30, 41)).toBe(0);
  });

  it('glass shatters on any hit and is reported', () => {
    world.setVoxel(10, 10, 10, MAT.GLASS);
    const r = d.applyDamage({ x: 5.3, y: 5.25, z: 5.25 }, 0.4, 1, 'pistol');
    expect(r.length).toBe(1);
  });

  it('volatile voxels queue one delayed detonation per tank', () => {
    // 2x2x4 fuel tank
    for (let x = 10; x < 12; x++) for (let y = 10; y < 12; y++) for (let z = 10; z < 14; z++) world.setVoxel(x, y, z, MAT.FUEL);
    let detonations = 0;
    events.on('detonation', () => detonations++);
    d.update(0);
    d.applyDamage({ x: 5.25, y: 5.25, z: 5.25 }, 0.4, 5, 'pistol');
    expect(d.pendingCount).toBe(1);
    d.update(100);
    expect(detonations).toBe(0);
    d.update(200);
    expect(detonations).toBe(1);
    // The detonation destroys the rest of the tank without re-triggering.
    d.update(400);
    d.update(600);
    expect(detonations).toBe(1);
    expect(world.getVoxel(11, 11, 13)).toBe(0);
  });
});
