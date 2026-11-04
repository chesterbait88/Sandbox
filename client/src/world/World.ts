import { CHUNK_SIZE, MATERIALS, VOXEL_SIZE, WORLD_CHUNKS, WORLD_VOXELS, MAT } from '@vw/config';
import type { Vec3 } from '../util/vec';

export const SX = WORLD_VOXELS.x;
export const SY = WORLD_VOXELS.y;
export const SZ = WORLD_VOXELS.z;
export const CX = WORLD_CHUNKS.x;
export const CY = WORLD_CHUNKS.y;
export const CZ = WORLD_CHUNKS.z;
export const CHUNK_COUNT = CX * CY * CZ;
const CS = CHUNK_SIZE;
const CSHIFT = Math.log2(CS);

export interface RayHit {
  x: number;
  y: number;
  z: number;
  /** Face normal of the hit voxel (unit axis). */
  face: Vec3;
  mat: number;
  owner: number;
  /** Hit point in metres. */
  point: Vec3;
  dist: number;
}

export interface StructureInfo {
  id: number;
  name: string;
  totalValue: number;
  /** Centre of the structure in metres. */
  center: Vec3;
  /** Voxel count at generation. */
  voxels: number;
  /** Inclusive voxel bounds at generation (voxels only ever leave a structure). */
  bounds: { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number };
}

export const voxelIndex = (x: number, y: number, z: number): number => x + SX * (z + SZ * y);
export const chunkIndex = (cx: number, cy: number, cz: number): number => cx + CX * (cz + CZ * cy);

/**
 * The arena: one flat material array plus an owner array for structure tagging.
 * Chunks are a view over this storage (see Chunk.ts); the flat layout keeps padding copies trivial.
 */
export class World {
  readonly mat: Uint8Array;
  readonly owner: Uint16Array;
  /** 1 = chunk needs a remesh. */
  readonly dirty = new Uint8Array(CHUNK_COUNT);
  structures: StructureInfo[] = [];
  /** Spawn position in metres (feet). */
  spawn: Vec3 = { x: SX * VOXEL_SIZE * 0.5, y: 40, z: 4 };
  spawnYaw = 0;
  /** Solid mask by material id, precomputed for hot loops. */
  static readonly solid = World.buildSolid();
  static readonly transparent = World.buildTransparent();

  constructor(mat?: Uint8Array, owner?: Uint16Array) {
    this.mat = mat ?? new Uint8Array(SX * SY * SZ);
    this.owner = owner ?? new Uint16Array(SX * SY * SZ);
    this.dirty.fill(1);
  }

  private static buildSolid(): Uint8Array {
    const s = new Uint8Array(256);
    for (const m of Object.values(MATERIALS)) s[m.id] = m.id === MAT.WATER ? 0 : 1;
    return s;
  }

  private static buildTransparent(): Uint8Array {
    const s = new Uint8Array(256);
    for (const m of Object.values(MATERIALS)) s[m.id] = m.transparent ? 1 : 0;
    return s;
  }

  inBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && y >= 0 && z >= 0 && x < SX && y < SY && z < SZ;
  }

  getVoxel(x: number, y: number, z: number): number {
    if (!this.inBounds(x, y, z)) return 0;
    return this.mat[voxelIndex(x, y, z)];
  }

  getOwner(x: number, y: number, z: number): number {
    if (!this.inBounds(x, y, z)) return 0;
    return this.owner[voxelIndex(x, y, z)];
  }

  /** Collision query: outside the arena horizontally and below bedrock counts as solid. */
  isSolidAt(x: number, y: number, z: number): boolean {
    if (y >= SY) return false;
    if (x < 0 || z < 0 || x >= SX || z >= SZ || y < 0) return true;
    return World.solid[this.mat[voxelIndex(x, y, z)]] === 1;
  }

  setVoxel(x: number, y: number, z: number, m: number, owner = 0): void {
    if (!this.inBounds(x, y, z)) return;
    const i = voxelIndex(x, y, z);
    this.mat[i] = m;
    this.owner[i] = owner;
    this.markDirty(x, y, z);
  }

  /** Mark the chunk containing (x,y,z) dirty, plus neighbours when on a border. */
  markDirty(x: number, y: number, z: number): void {
    const cx = x >> CSHIFT;
    const cy = y >> CSHIFT;
    const cz = z >> CSHIFT;
    this.dirty[chunkIndex(cx, cy, cz)] = 1;
    const lx = x & (CS - 1);
    const ly = y & (CS - 1);
    const lz = z & (CS - 1);
    if (lx === 0 && cx > 0) this.dirty[chunkIndex(cx - 1, cy, cz)] = 1;
    if (lx === CS - 1 && cx < CX - 1) this.dirty[chunkIndex(cx + 1, cy, cz)] = 1;
    if (ly === 0 && cy > 0) this.dirty[chunkIndex(cx, cy - 1, cz)] = 1;
    if (ly === CS - 1 && cy < CY - 1) this.dirty[chunkIndex(cx, cy + 1, cz)] = 1;
    if (lz === 0 && cz > 0) this.dirty[chunkIndex(cx, cy, cz - 1)] = 1;
    if (lz === CS - 1 && cz < CZ - 1) this.dirty[chunkIndex(cx, cy, cz + 1)] = 1;
  }

  /** Highest solid voxel y at a column, or -1. */
  surfaceY(x: number, z: number): number {
    if (x < 0 || z < 0 || x >= SX || z >= SZ) return -1;
    for (let y = SY - 1; y >= 0; y--) if (this.mat[voxelIndex(x, y, z)] !== 0) return y;
    return -1;
  }

  /**
   * Copy a chunk with a one-voxel border into `out` (size (CS+2)^3), index px + P*(pz + P*py).
   */
  copyPadded(ci: number, out: Uint8Array): void {
    const P = CS + 2;
    const cx = ci % CX;
    const cz = ((ci / CX) | 0) % CZ;
    const cy = (ci / (CX * CZ)) | 0;
    const x0 = cx * CS - 1;
    const y0 = cy * CS - 1;
    const z0 = cz * CS - 1;
    out.fill(0);
    for (let py = 0; py < P; py++) {
      const y = y0 + py;
      if (y < 0 || y >= SY) continue;
      for (let pz = 0; pz < P; pz++) {
        const z = z0 + pz;
        if (z < 0 || z >= SZ) continue;
        const xs = Math.max(0, x0);
        const xe = Math.min(SX, x0 + P);
        const src = voxelIndex(xs, y, z);
        out.set(this.mat.subarray(src, src + (xe - xs)), xs - x0 + P * (pz + P * py));
      }
    }
  }

  /** Amanatides–Woo DDA raycast in metres. */
  raycast(origin: Vec3, dir: Vec3, maxDist: number): RayHit | null {
    const inv = 1 / VOXEL_SIZE;
    let ox = origin.x * inv;
    let oy = origin.y * inv;
    let oz = origin.z * inv;
    const len = Math.hypot(dir.x, dir.y, dir.z);
    if (len === 0) return null;
    const dx = dir.x / len;
    const dy = dir.y / len;
    const dz = dir.z / len;
    let x = Math.floor(ox);
    let y = Math.floor(oy);
    let z = Math.floor(oz);
    const stepX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    const stepY = dy > 0 ? 1 : dy < 0 ? -1 : 0;
    const stepZ = dz > 0 ? 1 : dz < 0 ? -1 : 0;
    const tDeltaX = stepX !== 0 ? Math.abs(1 / dx) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dy) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dz) : Infinity;
    let tMaxX = stepX > 0 ? (x + 1 - ox) * tDeltaX : stepX < 0 ? (ox - x) * tDeltaX : Infinity;
    let tMaxY = stepY > 0 ? (y + 1 - oy) * tDeltaY : stepY < 0 ? (oy - y) * tDeltaY : Infinity;
    let tMaxZ = stepZ > 0 ? (z + 1 - oz) * tDeltaZ : stepZ < 0 ? (oz - z) * tDeltaZ : Infinity;
    const maxT = maxDist * inv;
    let t = 0;
    let fx = 0;
    let fy = 0;
    let fz = 0;
    for (let i = 0; i < 2048; i++) {
      if (this.inBounds(x, y, z)) {
        const m = this.mat[voxelIndex(x, y, z)];
        if (m !== 0 && m !== MAT.WATER) {
          return {
            x,
            y,
            z,
            face: { x: fx, y: fy, z: fz },
            mat: m,
            owner: this.owner[voxelIndex(x, y, z)],
            point: { x: (ox + dx * t) * VOXEL_SIZE, y: (oy + dy * t) * VOXEL_SIZE, z: (oz + dz * t) * VOXEL_SIZE },
            dist: t * VOXEL_SIZE
          };
        }
      } else if (t > 0 && (y < 0 || (y >= SY && dy > 0))) {
        return null;
      }
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        t = tMaxX;
        tMaxX += tDeltaX;
        x += stepX;
        fx = -stepX;
        fy = 0;
        fz = 0;
      } else if (tMaxY < tMaxZ) {
        t = tMaxY;
        tMaxY += tDeltaY;
        y += stepY;
        fx = 0;
        fy = -stepY;
        fz = 0;
      } else {
        t = tMaxZ;
        tMaxZ += tDeltaZ;
        z += stepZ;
        fx = 0;
        fy = 0;
        fz = -stepZ;
      }
      if (t > maxT) return null;
    }
    return null;
  }
}
