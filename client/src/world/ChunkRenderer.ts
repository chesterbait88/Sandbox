import * as THREE from 'three';
import { CHUNK_SIZE, RENDER } from '@vw/config';
import { Chunk } from './Chunk';
import { CHUNK_COUNT, World } from './World';
import type { MeshRequest, MeshResponse } from './mesher.worker';
import { buildGeometry, createOpaqueMaterial, createTransparentMaterial } from './VoxelMaterial';

const PADDED = (CHUNK_SIZE + 2) ** 3;

/** True when every voxel equals the first and that material is air or opaque (no faces possible). */
function isUniformOpaque(vox: Uint8Array): boolean {
  const m = vox[0];
  if (m !== 0 && World.transparent[m] === 1) return false;
  for (let i = 1; i < vox.length; i++) if (vox[i] !== m) return false;
  return true;
}

/**
 * Owns the chunk meshes and the mesher Worker pool. Dirty chunks are remeshed nearest-first,
 * `RENDER.remeshPerFrame` per frame (or `burst` of them when loading a world).
 */
export class ChunkRenderer {
  readonly group = new THREE.Group();
  readonly chunks: Chunk[] = [];
  readonly opaqueMat = createOpaqueMaterial();
  readonly transparentMat = createTransparentMaterial();
  private workers: Worker[] = [];
  private inFlight = 0;
  private pool: Uint8Array[] = [];
  /** Stats for the debug overlay. */
  stats = { meshed: 0, lastMs: 0, avgMs: 0, inFlight: 0, dirty: 0 };
  /** Called with each fresh opaque mesh (world-space buffers) so physics can mirror the walls. */
  onMeshed: ((chunk: Chunk, opaque: { position: Float32Array; index: Uint32Array }) => void) | null = null;
  /** Max requests per frame; raised while a world loads. */
  perFrame: number = RENDER.remeshPerFrame;
  private maxInFlight = RENDER.mesherWorkers * 4;
  private rr = 0;
  private arbitrary = new Map<number, (r: MeshResponse) => void>();
  private arbitraryId = 0;

  /** Mesh an arbitrary padded cube (e.g. a collapsing cluster) on a worker. The array is transferred. */
  meshArbitrary(vox: Uint8Array, size: number, origin: { x: number; y: number; z: number }): Promise<MeshResponse> {
    return new Promise((resolve) => {
      const id = ++this.arbitraryId;
      this.arbitrary.set(id, resolve);
      const msg: MeshRequest = { type: 'mesh', index: -1, version: id, cx: 0, cy: 0, cz: 0, vox, size, origin };
      const w = this.workers[this.rr++ % this.workers.length];
      w.postMessage(msg, [vox.buffer as ArrayBuffer]);
    });
  }

  constructor(private world: World) {
    for (let i = 0; i < CHUNK_COUNT; i++) this.chunks.push(new Chunk(i));
    for (let i = 0; i < RENDER.mesherWorkers; i++) {
      const w = new Worker(new URL('./mesher.worker.ts', import.meta.url), { type: 'module' });
      w.onmessage = (e: MessageEvent<MeshResponse>) => this.onResult(e.data);
      this.workers.push(w);
    }
  }

  setWorld(world: World): void {
    this.world = world;
    for (const c of this.chunks) {
      this.disposeChunk(c);
      c.version++;
      c.pending = false;
    }
    // inFlight is left alone: stale results still come back and decrement it.
  }

  /** Whether every chunk is meshed and nothing is queued. */
  get idle(): boolean {
    return this.inFlight === 0 && !this.world.dirty.some((d) => d === 1);
  }

  /** Send up to `perFrame` dirty chunks to the workers, nearest to `focus` first. */
  update(focus: THREE.Vector3): void {
    const dirty = this.world.dirty;
    let budget = Math.min(this.perFrame, this.maxInFlight - this.inFlight);
    if (budget <= 0) {
      this.stats.inFlight = this.inFlight;
      return;
    }
    const candidates: Chunk[] = [];
    for (let i = 0; i < CHUNK_COUNT; i++) if (dirty[i] === 1 && !this.chunks[i].pending) candidates.push(this.chunks[i]);
    this.stats.dirty = candidates.length;
    if (candidates.length === 0) return;
    if (candidates.length > budget) candidates.sort((a, b) => a.distSq(focus) - b.distSq(focus));
    for (const c of candidates) {
      if (budget-- <= 0) break;
      this.send(c);
    }
    this.stats.inFlight = this.inFlight;
  }

  private send(c: Chunk): void {
    const vox = this.pool.pop() ?? new Uint8Array(PADDED);
    this.world.copyPadded(c.index, vox);
    this.world.dirty[c.index] = 0;
    c.version++;
    // A chunk that is all air, or solid opaque right through its padding, has no faces: skip the worker.
    if (isUniformOpaque(vox)) {
      this.pool.push(vox);
      c.pending = false;
      this.disposeChunk(c);
      c.empty = true;
      this.stats.meshed++;
      return;
    }
    c.pending = true;
    const msg: MeshRequest = { type: 'mesh', index: c.index, version: c.version, cx: c.cx, cy: c.cy, cz: c.cz, vox };
    const w = this.workers[this.rr++ % this.workers.length];
    w.postMessage(msg, [vox.buffer as ArrayBuffer]);
    this.inFlight++;
  }

  private onResult(r: MeshResponse): void {
    if (r.index < 0) {
      const resolve = this.arbitrary.get(r.version);
      this.arbitrary.delete(r.version);
      resolve?.(r);
      return;
    }
    this.inFlight--;
    this.pool.push(r.vox);
    const c = this.chunks[r.index];
    if (r.version !== c.version) return; // stale
    c.pending = false;
    this.stats.meshed++;
    this.stats.lastMs = r.ms;
    this.stats.avgMs = this.stats.avgMs * 0.9 + r.ms * 0.1;
    this.disposeChunk(c);
    c.empty = r.opaque.index.length === 0 && r.transparent.index.length === 0;
    if (r.opaque.index.length > 0) {
      const m = new THREE.Mesh(buildGeometry(r.opaque), this.opaqueMat);
      m.castShadow = true;
      m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      c.opaque = m;
      this.group.add(m);
    }
    this.onMeshed?.(c, { position: r.opaque.position, index: r.opaque.index });
    if (r.transparent.index.length > 0) {
      const m = new THREE.Mesh(buildGeometry(r.transparent), this.transparentMat);
      m.matrixAutoUpdate = false;
      m.renderOrder = 1;
      c.transparent = m;
      this.group.add(m);
    }
  }

  private disposeChunk(c: Chunk): void {
    if (c.opaque) {
      this.group.remove(c.opaque);
      c.opaque.geometry.dispose();
      c.opaque = null;
    }
    if (c.transparent) {
      this.group.remove(c.transparent);
      c.transparent.geometry.dispose();
      c.transparent = null;
    }
  }

  dispose(): void {
    for (const w of this.workers) w.terminate();
    for (const c of this.chunks) this.disposeChunk(c);
  }
}
