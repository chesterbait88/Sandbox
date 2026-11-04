import { WORLD_VOXELS, type ThemeId } from '@vw/config';
import { rngFromSeed } from '../../util/rng';
import type { StructureInfo } from '../World';
import { generateTerrain } from './terrain';
import { placeStructures } from './placer';

export interface GenRequest {
  type: 'gen';
  theme: ThemeId;
  seed: string;
  /** Skip structures (menu backdrop). */
  terrainOnly?: boolean;
}

export interface GenResponse {
  type: 'gen';
  mat: Uint8Array;
  owner: Uint16Array;
  height: Int16Array;
  structures: StructureInfo[];
  spawn: { x: number; y: number; z: number };
  spawnYaw: number;
  ms: number;
}

self.onmessage = (e: MessageEvent<GenRequest>) => {
  const req = e.data;
  if (req.type !== 'gen') return;
  const t0 = performance.now();
  const n = WORLD_VOXELS.x * WORLD_VOXELS.y * WORLD_VOXELS.z;
  const mat = new Uint8Array(n);
  const owner = new Uint16Array(n);
  const rng = rngFromSeed(`${req.theme}:${req.seed}`);
  const terrain = generateTerrain(req.theme, rng, mat);
  const placed = placeStructures(req.theme, rng, mat, owner, terrain.height, !!req.terrainOnly);
  const resp: GenResponse = {
    type: 'gen',
    mat,
    owner,
    height: terrain.height,
    structures: placed.structures,
    spawn: placed.spawn,
    spawnYaw: placed.spawnYaw,
    ms: performance.now() - t0
  };
  (self as unknown as Worker).postMessage(resp, [mat.buffer, owner.buffer, terrain.height.buffer]);
};
