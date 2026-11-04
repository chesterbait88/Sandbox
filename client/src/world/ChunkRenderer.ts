import * as THREE from 'three';
import { CHUNK_SIZE, RENDER } from '@vw/config';
import { Chunk } from './Chunk';
import { CHUNK_COUNT, World } from './World';
import type { MeshRequest, MeshResponse } from './mesher.worker';
import { buildGeometry, createOpaqueMaterial, createTransparentMaterial } from './VoxelMaterial';

const PADDED = (CHUNK_SIZE + 2) ** 3;

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
  /** Max requests per frame; raised while a world loads. */
  perFrame: number = RENDER.remeshPerFrame;
  private maxInFlight = RENDER.mesherWorkers * 4;
  private rr = 0;

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
    c.pending = true;
    c.version++;
    const msg: MeshRequest = { type: 'mesh', index: c.index, version: c.version, cx: c.cx, cy: c.cy, cz: c.cz, vox };
    const w = this.workers[this.rr++ % this.workers.length];
    w.postMessage(msg, [vox.buffer as ArrayBuffer]);
    this.inFlight++;
  }

  private onResult(r: MeshResponse): void {
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
