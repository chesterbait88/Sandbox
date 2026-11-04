import { PLACEMENT, VOXEL_SIZE, WORLD_VOXELS, type ThemeId } from '@vw/config';
import type { Rng } from '../../util/rng';
import type { StructureInfo } from '../World';

export interface Placed {
  structures: StructureInfo[];
  spawn: { x: number; y: number; z: number };
  spawnYaw: number;
}

const SX = WORLD_VOXELS.x;
const SZ = WORLD_VOXELS.z;

/** Phase 1: no structures yet; just a spawn pad at the -z edge facing +z. */
export function placeStructures(_theme: ThemeId, _rng: Rng, _mat: Uint8Array, _owner: Uint16Array, height: Int16Array, _terrainOnly: boolean): Placed {
  const sx = SX / 2;
  const sz = Math.round(PLACEMENT.spawnEdgeM / VOXEL_SIZE);
  const h = height[sx + SX * sz];
  return {
    structures: [],
    spawn: { x: sx * VOXEL_SIZE, y: (h + 1) * VOXEL_SIZE, z: sz * VOXEL_SIZE },
    spawnYaw: Math.PI
  };
}
