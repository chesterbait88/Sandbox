import { describe, expect, it } from 'vitest';
import { World } from './World';

describe('World', () => {
  it('get/set voxel and dirty tracking across chunk borders', () => {
    const w = new World();
    w.dirty.fill(0);
    w.setVoxel(31, 5, 5, 13, 7);
    expect(w.getVoxel(31, 5, 5)).toBe(13);
    expect(w.getOwner(31, 5, 5)).toBe(7);
    expect(w.dirty[0]).toBe(1);
    expect(w.dirty[1]).toBe(1); // +x neighbour chunk
  });

  it('raycast hits the first solid voxel and reports the entry face', () => {
    const w = new World();
    for (let x = 0; x < 20; x++) for (let z = 0; z < 20; z++) w.setVoxel(x, 10, z, 14);
    const hit = w.raycast({ x: 5, y: 10, z: 5 }, { x: 0, y: -1, z: 0 }, 50);
    expect(hit).not.toBeNull();
    expect(hit!.y).toBe(10);
    expect(hit!.face.y).toBe(1);
    expect(hit!.mat).toBe(14);
    expect(hit!.dist).toBeCloseTo(10 - 5.5, 3);
    expect(w.raycast({ x: 5, y: 10, z: 5 }, { x: 0, y: 1, z: 0 }, 50)).toBeNull();
  });

  it('copyPadded includes neighbour voxels in the border', () => {
    const w = new World();
    w.setVoxel(32, 0, 0, 5);
    const out = new Uint8Array(34 ** 3);
    w.copyPadded(0, out);
    expect(out[33 + 34 * (1 + 34 * 1)]).toBe(5);
  });
});
