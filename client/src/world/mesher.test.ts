import { describe, expect, it } from 'vitest';
import { meshVoxels } from './mesher';

function cube(size: number): Uint8Array {
  return new Uint8Array((size + 2) ** 3);
}
const idx = (P: number, x: number, y: number, z: number) => x + 1 + P * (z + 1 + P * (y + 1));

describe('mesher', () => {
  it('a single voxel yields 6 quads (24 verts, 36 indices)', () => {
    const vox = cube(4);
    vox[idx(6, 1, 1, 1)] = 13;
    const r = meshVoxels(vox, { size: 6, ox: 0, oy: 0, oz: 0 });
    expect(r.opaque.position.length).toBe(24 * 3);
    expect(r.opaque.index.length).toBe(36);
    expect(r.transparent.index.length).toBe(0);
  });

  it('greedy merges a flat 4x4 slab top into one quad', () => {
    const vox = cube(4);
    for (let x = 0; x < 4; x++) for (let z = 0; z < 4; z++) vox[idx(6, x, 0, z)] = 14;
    const r = meshVoxels(vox, { size: 6, ox: 0, oy: 0, oz: 0 });
    // Top and bottom are one quad each; 4 sides are one quad each → 6 quads.
    expect(r.opaque.index.length).toBe(6 * 6);
  });

  it('culls faces hidden by padding neighbours and puts glass in the transparent pass', () => {
    const vox = cube(4);
    vox[idx(6, 0, 0, 0)] = 14;
    vox[idx(6, -1, 0, 0)] = 14; // neighbour chunk voxel hides the -x face
    vox[idx(6, 1, 0, 0)] = 10; // glass next to it: concrete's +x face stays visible
    const r = meshVoxels(vox, { size: 6, ox: 0, oy: 0, oz: 0 });
    expect(r.opaque.index.length).toBe(5 * 6);
    expect(r.transparent.index.length).toBe(5 * 6);
  });

  it('brick rows alternate tone by y', () => {
    const vox = cube(4);
    vox[idx(6, 0, 0, 0)] = 13;
    vox[idx(6, 0, 1, 0)] = 13;
    const r = meshVoxels(vox, { size: 6, ox: 0, oy: 0, oz: 0 });
    const colors = new Set<string>();
    for (let i = 0; i < r.opaque.color.length; i += 3) colors.add(`${r.opaque.color[i]}`);
    expect(colors.size).toBeGreaterThan(1);
  });
});
