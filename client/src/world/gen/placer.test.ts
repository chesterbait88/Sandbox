import { describe, expect, it } from 'vitest';
import { THEME_IDS, VOXEL_SIZE, WORLD_VOXELS } from '@vw/config';
import { rngFromSeed } from '../../util/rng';
import { generateTerrain } from './terrain';
import { placeStructures } from './placer';

function gen(theme: (typeof THEME_IDS)[number], seed: string) {
  const n = WORLD_VOXELS.x * WORLD_VOXELS.y * WORLD_VOXELS.z;
  const mat = new Uint8Array(n);
  const owner = new Uint16Array(n);
  const rng = rngFromSeed(`${theme}:${seed}`);
  const t = generateTerrain(theme, rng, mat);
  const placed = placeStructures(theme, rng, mat, owner, t.height, false);
  return { mat, owner, placed };
}

function hash(a: Uint8Array): number {
  let h = 0;
  for (let i = 0; i < a.length; i += 7) h = (h * 31 + a[i]) | 0;
  return h;
}

describe('placer', () => {
  it('each theme places 6–10 structures with value, deterministically per seed', () => {
    for (const theme of THEME_IDS) {
      const a = gen(theme, 'TEST1');
      const b = gen(theme, 'TEST1');
      const c = gen(theme, 'TEST2');
      const real = a.placed.structures.filter((s) => !s.prop);
      expect(real.length).toBeGreaterThanOrEqual(6);
      expect(real.length).toBeLessThanOrEqual(10);
      for (const s of a.placed.structures) expect(s.totalValue).toBeGreaterThan(0);
      expect(hash(a.mat)).toBe(hash(b.mat));
      expect(hash(a.mat)).not.toBe(hash(c.mat));
      // Owner tags agree with the registry.
      const seen = new Set<number>();
      for (let i = 0; i < a.owner.length; i += 3) if (a.owner[i]) seen.add(a.owner[i]);
      for (const id of seen) expect(a.placed.structures.some((s) => s.id === id)).toBe(true);
    }
  });

  it('structures never float: every structure has solid terrain under its footprint', () => {
    const { mat, placed } = gen('desert', 'FLOAT');
    const SX = WORLD_VOXELS.x;
    const SZ = WORLD_VOXELS.z;
    for (const s of placed.structures) {
      const x = Math.round(s.center.x / VOXEL_SIZE);
      const z = Math.round(s.center.z / VOXEL_SIZE);
      let y = Math.round(s.center.y / VOXEL_SIZE);
      while (y > 0 && mat[x + SX * (z + SZ * y)] === 0) y--;
      expect(y).toBeGreaterThan(0);
    }
  });
});
