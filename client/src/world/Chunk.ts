import * as THREE from 'three';
import { CHUNK_SIZE, VOXEL_SIZE } from '@vw/config';
import { CX, CZ } from './World';

/** Per-chunk render state. Voxel storage lives in World (flat arrays). */
export class Chunk {
  readonly cx: number;
  readonly cy: number;
  readonly cz: number;
  /** World-space origin in metres. */
  readonly origin: THREE.Vector3;
  opaque: THREE.Mesh | null = null;
  transparent: THREE.Mesh | null = null;
  /** True when the last mesh result had no faces. */
  empty = true;
  /** A remesh is in flight for this chunk. */
  pending = false;
  /** Request version, so stale worker results are ignored. */
  version = 0;

  constructor(readonly index: number) {
    this.cx = index % CX;
    this.cz = ((index / CX) | 0) % CZ;
    this.cy = (index / (CX * CZ)) | 0;
    const s = CHUNK_SIZE * VOXEL_SIZE;
    this.origin = new THREE.Vector3(this.cx * s, this.cy * s, this.cz * s);
  }

  /** Squared distance from a point (metres) to the chunk centre. */
  distSq(p: THREE.Vector3): number {
    const h = CHUNK_SIZE * VOXEL_SIZE * 0.5;
    const dx = p.x - (this.origin.x + h);
    const dy = p.y - (this.origin.y + h);
    const dz = p.z - (this.origin.z + h);
    return dx * dx + dy * dy + dz * dz;
  }
}
