import { CHUNK_SIZE } from '@vw/config';
import { meshVoxels, transferables } from './mesher';

export interface MeshRequest {
  type: 'mesh';
  index: number;
  version: number;
  cx: number;
  cy: number;
  cz: number;
  /** Padded (CHUNK_SIZE+2)^3 voxel array. Transferred. */
  vox: Uint8Array;
  /** Arbitrary (non-chunk) request: padded cube size and voxel origin. index is negative. */
  size?: number;
  origin?: { x: number; y: number; z: number };
}

export interface MeshResponse {
  type: 'mesh';
  index: number;
  version: number;
  ms: number;
  vox: Uint8Array;
  opaque: ReturnType<typeof meshVoxels>['opaque'];
  transparent: ReturnType<typeof meshVoxels>['transparent'];
}

self.onmessage = (e: MessageEvent<MeshRequest>) => {
  const msg = e.data;
  if (msg.type !== 'mesh') return;
  const t0 = performance.now();
  const res = msg.size && msg.origin
    ? meshVoxels(msg.vox, { size: msg.size, ox: msg.origin.x, oy: msg.origin.y, oz: msg.origin.z })
    : meshVoxels(msg.vox, { size: CHUNK_SIZE + 2, ox: msg.cx * CHUNK_SIZE, oy: msg.cy * CHUNK_SIZE, oz: msg.cz * CHUNK_SIZE });
  const resp: MeshResponse = {
    type: 'mesh',
    index: msg.index,
    version: msg.version,
    ms: performance.now() - t0,
    vox: msg.vox,
    opaque: res.opaque,
    transparent: res.transparent
  };
  (self as unknown as Worker).postMessage(resp, [...transferables(res), msg.vox.buffer as ArrayBuffer]);
};
