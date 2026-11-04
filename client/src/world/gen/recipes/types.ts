import type { Rng } from '../../../util/rng';
import type { StructureCtx } from '../StructureCtx';

export interface Footprint {
  /** Size in voxels. */
  x: number;
  z: number;
  /** Height in voxels (for clearance only). */
  y: number;
}

/**
 * Where a structure belongs. The placer turns each into candidate spots:
 * roadside — a band beside the desert road, front toward the road (mirrored on the far side)
 * block — inside a downtown block, front toward a street
 * sidewalk — on a downtown sidewalk band, front toward the street
 * beside — next to an already placed structure (optionally one of `near`)
 * path — on a park gravel path
 * hill — the highest of several random spots, away from roads
 * center — around the arena centre
 * edge — near the arena margin
 * any — jittered grid (fallback for every kind)
 */
export type SitingKind = 'roadside' | 'block' | 'sidewalk' | 'beside' | 'path' | 'hill' | 'center' | 'edge' | 'any';

export interface Siting {
  kind: SitingKind;
  /** For 'beside': preferred neighbour recipe ids. */
  near?: string[];
}

export interface Recipe {
  id: string;
  name: string;
  siting: Siting;
  /** Pick random dimensions; the placer flattens a pad this big. */
  footprint(rng: Rng): Footprint;
  /** Draw into the pad. Local x in [0, fp.x), z in [0, fp.z), y ≥ 0. */
  build(ctx: StructureCtx, rng: Rng, fp: Footprint): void;
}
