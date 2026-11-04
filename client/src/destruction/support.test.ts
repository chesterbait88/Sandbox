import { describe, expect, it } from 'vitest';
import { findUnsupported, type SupportInput } from './support';

/** Build a padded box with a helper to set voxels in local (unpadded) coordinates. */
function box(W: number, H: number, D: number, bedrockBelow = false) {
  const PW = W + 2;
  const PH = H + 2;
  const mat = new Uint8Array(PW * PH * (D + 2));
  const owner = new Uint16Array(mat.length);
  const set = (x: number, y: number, z: number, m: number, o: number) => {
    const i = x + 1 + PW * (y + 1 + PH * (z + 1));
    mat[i] = m;
    owner[i] = o;
  };
  const input: SupportInput = { W, H, D, mat, owner, id: 1, bedrockBelow };
  return { input, set };
}

describe('findUnsupported', () => {
  it('a column standing on terrain is supported; a floating slab is one cluster', () => {
    const { input, set } = box(5, 6, 5);
    // Terrain row under the box (padding y = -1) only under x = 0.
    set(0, -1, 2, 4, 0);
    for (let y = 0; y < 6; y++) set(0, y, 2, 14, 1);
    // Floating 3 × 1 × 1 slab at y = 3, not touching the column.
    for (let x = 2; x < 5; x++) set(x, 3, 2, 14, 1);
    const r = findUnsupported(input);
    expect(r.clusters.length).toBe(1);
    expect(r.clusters[0].length).toBe(3);
  });

  it('a slab attached to a grounded column stays up; bedrock counts as ground', () => {
    const { input, set } = box(5, 6, 5, true);
    for (let y = 0; y < 6; y++) set(0, y, 2, 14, 1);
    for (let x = 1; x < 5; x++) set(x, 3, 2, 14, 1);
    expect(findUnsupported(input).clusters.length).toBe(0);
  });

  it('another structure next to ours counts as support (owner differs)', () => {
    const { input, set } = box(3, 3, 3);
    set(-1, 1, 1, 14, 2); // neighbour structure in the padding
    set(0, 1, 1, 14, 1);
    set(1, 1, 1, 14, 1);
    expect(findUnsupported(input).clusters.length).toBe(0);
  });
});
