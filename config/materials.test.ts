import { describe, expect, it } from 'vitest';
import { MATERIALS, MAT } from './materials';

describe('materials', () => {
  it('terrain materials carry no score', () => {
    for (const m of Object.values(MATERIALS)) if (m.terrain) expect(m.value).toBe(0);
  });
  it('volatile materials have explosion params', () => {
    expect(MATERIALS[MAT.FUEL].volatile?.power).toBe(60);
    expect(MATERIALS[MAT.PROPANE].volatile?.radius).toBe(3);
  });
});
