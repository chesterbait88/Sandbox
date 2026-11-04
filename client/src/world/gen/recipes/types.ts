import type { Rng } from '../../../util/rng';
import type { StructureCtx } from '../StructureCtx';

export interface Footprint {
  /** Size in voxels. */
  x: number;
  z: number;
  /** Height in voxels (for clearance only). */
  y: number;
}

export interface Recipe {
  id: string;
  name: string;
  /** Pick random dimensions; the placer flattens a pad this big. */
  footprint(rng: Rng): Footprint;
  /** Draw into the pad. Local x in [0, fp.x), z in [0, fp.z), y ≥ 0. */
  build(ctx: StructureCtx, rng: Rng, fp: Footprint): void;
}
