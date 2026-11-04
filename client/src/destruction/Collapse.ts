import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { COLLAPSE, VOXEL_SIZE } from '@vw/config';
import { voxelIndex, World, type StructureInfo } from '../world/World';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import { buildGeometry, createOpaqueMaterial, createTransparentMaterial } from '../world/VoxelMaterial';
import type { ChunkRenderer } from '../world/ChunkRenderer';
import { events, type Destroyed } from '../state/events';
import type { Score } from '../scoring/Score';

interface Falling {
  body: RAPIER.RigidBody;
  mesh: THREE.Group;
  born: number;
  dead?: boolean;
}

/**
 * Structural collapse: after a blast touches a structure, flood-fill support from voxels that rest on
 * terrain; anything unreachable is cut out of the world, scored, and dropped as one rigid body.
 */
export class Collapse {
  readonly group = new THREE.Group();
  private pending = new Set<number>();
  /** Clusters found by a check, released one per frame so a whole building does not land in one frame. */
  private releaseQueue: { info: StructureInfo; cluster: number[]; W: number; H: number }[] = [];
  private falling: Falling[] = [];
  private mats = { opaque: createOpaqueMaterial(), transparent: createTransparentMaterial() };
  private dummy = new THREE.Object3D();
  private now = 0;
  stats = { checks: 0, lastCheckMs: 0, clusters: 0, fillMs: 0, cutMs: 0, scoreMs: 0, meshMs: 0, bodyMs: 0 };

  constructor(
    private world: World,
    private physics: PhysicsWorld,
    private score: Score,
    private mesher: ChunkRenderer
  ) {}

  setWorld(world: World): void {
    this.world = world;
    this.pending.clear();
    this.releaseQueue = [];
    this.clear();
  }

  /** Called with every destroyed list; structures touched get a support check. */
  notify(list: Destroyed[]): void {
    for (const v of list) if (v.owner) this.pending.add(v.owner);
  }

  update(now: number): void {
    this.now = now;
    const q = this.releaseQueue.shift();
    if (q) this.release(q.info, q.cluster, q.W, q.H);
    else {
      let n = 0;
      for (const id of this.pending) {
        this.pending.delete(id);
        this.check(id);
        if (++n >= COLLAPSE.checksPerFrame) break;
      }
    }
    // Sync falling bodies.
    for (let i = this.falling.length - 1; i >= 0; i--) {
      const f = this.falling[i];
      const age = (now - f.born) / 1000;
      if (age > COLLAPSE.lifetimeS) {
        this.remove(i);
        continue;
      }
      const t = f.body.translation();
      const r = f.body.rotation();
      f.mesh.position.set(t.x, t.y, t.z);
      f.mesh.quaternion.set(r.x, r.y, r.z, r.w);
      const shrink = Math.min(1, Math.max(0.001, (COLLAPSE.lifetimeS - age) / COLLAPSE.shrinkS));
      f.mesh.scale.setScalar(shrink);
    }
  }

  private check(id: number): void {
    const info = this.world.structures.find((s) => s.id === id);
    if (!info) return;
    const t0 = performance.now();
    const b = info.bounds;
    const W = b.x1 - b.x0 + 1;
    const H = b.y1 - b.y0 + 1;
    const D = b.z1 - b.z0 + 1;
    const n = W * H * D;
    const mat = this.world.mat;
    const owner = this.world.owner;
    // 0 = not this structure, 1 = unvisited structure voxel, 2 = supported
    const mark = new Uint8Array(n);
    const stack = new Int32Array(n);
    let sp = 0;
    let count = 0;
    const li = (x: number, y: number, z: number) => x - b.x0 + W * (y - b.y0 + H * (z - b.z0));
    for (let z = b.z0; z <= b.z1; z++)
      for (let y = b.y0; y <= b.y1; y++)
        for (let x = b.x0; x <= b.x1; x++) {
          const wi = voxelIndex(x, y, z);
          if (owner[wi] !== id || mat[wi] === 0) continue;
          const k = li(x, y, z);
          mark[k] = 1;
          count++;
          // Seed: touching terrain (anything solid that is not this structure).
          if (this.touchesGround(x, y, z, id)) {
            mark[k] = 2;
            stack[sp++] = k;
          }
        }
    if (count === 0) return;
    const tFill = performance.now();
    // Flood fill support through 6-neighbours.
    while (sp > 0) {
      const k = stack[--sp];
      const x = k % W;
      const y = ((k / W) | 0) % H;
      const z = (k / (W * H)) | 0;
      const tryN = (nx: number, ny: number, nz: number) => {
        if (nx < 0 || ny < 0 || nz < 0 || nx >= W || ny >= H || nz >= D) return;
        const nk = nx + W * (ny + H * nz);
        if (mark[nk] === 1) {
          mark[nk] = 2;
          stack[sp++] = nk;
        }
      };
      tryN(x - 1, y, z);
      tryN(x + 1, y, z);
      tryN(x, y - 1, z);
      tryN(x, y + 1, z);
      tryN(x, y, z - 1);
      tryN(x, y, z + 1);
    }
    this.stats.fillMs = performance.now() - tFill;
    // Unsupported voxels → connected clusters.
    for (let k = 0; k < n; k++) {
      if (mark[k] !== 1) continue;
      const cluster: number[] = [];
      mark[k] = 3;
      stack[0] = k;
      sp = 1;
      while (sp > 0) {
        const c = stack[--sp];
        cluster.push(c);
        const x = c % W;
        const y = ((c / W) | 0) % H;
        const z = (c / (W * H)) | 0;
        const tryN = (nx: number, ny: number, nz: number) => {
          if (nx < 0 || ny < 0 || nz < 0 || nx >= W || ny >= H || nz >= D) return;
          const nk = nx + W * (ny + H * nz);
          if (mark[nk] === 1) {
            mark[nk] = 3;
            stack[sp++] = nk;
          }
        };
        tryN(x - 1, y, z);
        tryN(x + 1, y, z);
        tryN(x, y - 1, z);
        tryN(x, y + 1, z);
        tryN(x, y, z - 1);
        tryN(x, y, z + 1);
      }
      this.releaseQueue.push({ info, cluster, W, H });
    }
    this.stats.checks++;
    this.stats.lastCheckMs = performance.now() - t0;
  }

  private touchesGround(x: number, y: number, z: number, id: number): boolean {
    const w = this.world;
    const g = (nx: number, ny: number, nz: number) => {
      if (ny < 0) return true;
      if (!w.inBounds(nx, ny, nz)) return false;
      const i = voxelIndex(nx, ny, nz);
      return w.mat[i] !== 0 && w.owner[i] !== id;
    };
    return g(x, y - 1, z) || g(x - 1, y, z) || g(x + 1, y, z) || g(x, y, z - 1) || g(x, y, z + 1);
  }

  /** Cut a cluster out of the world, score it, and drop it as a body (or just delete it). */
  private release(info: StructureInfo, cluster: number[], W: number, H: number): void {
    const b = info.bounds;
    const world = this.world;
    const destroyed: Destroyed[] = [];
    let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (const k of cluster) {
      const x = b.x0 + (k % W);
      const y = b.y0 + (((k / W) | 0) % H);
      const z = b.z0 + ((k / (W * H)) | 0);
      const wi = voxelIndex(x, y, z);
      destroyed.push({ x, y, z, mat: world.mat[wi], owner: info.id });
      if (x < minX) minX = x; if (y < minY) minY = y; if (z < minZ) minZ = z;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
    }
    let t = performance.now();
    const makeBody = cluster.length >= COLLAPSE.minBodyVoxels && cluster.length <= COLLAPSE.maxBodyVoxels && this.falling.length < COLLAPSE.maxBodies;
    let vox: Uint8Array | null = null;
    let P = 0;
    if (makeBody) {
      P = Math.max(maxX - minX, maxY - minY, maxZ - minZ) + 3;
      vox = new Uint8Array(P * P * P);
      for (const d of destroyed) vox[d.x - minX + 1 + P * (d.z - minZ + 1 + P * (d.y - minY + 1))] = d.mat;
    }
    for (const d of destroyed) world.setVoxel(d.x, d.y, d.z, 0, 0);
    this.stats.cutMs = performance.now() - t;
    t = performance.now();
    this.score.onDestroyed(destroyed);
    this.stats.scoreMs = performance.now() - t;
    t = performance.now();
    this.stats.clusters++;
    const center = { x: ((minX + maxX + 1) / 2) * VOXEL_SIZE, y: ((minY + maxY + 1) / 2) * VOXEL_SIZE, z: ((minZ + maxZ + 1) / 2) * VOXEL_SIZE };
    events.emit('collapse', { center, voxels: cluster.length, name: info.name });
    if (!vox) return;

    // Mesh on a worker; the body starts falling now and the mesh attaches when it arrives.
    const g = new THREE.Group();
    g.position.set(center.x, center.y, center.z);
    this.group.add(g);
    const tMesh = performance.now();
    void this.mesher.meshArbitrary(vox, P, { x: minX, y: minY, z: minZ }).then((r) => {
      this.stats.meshMs = performance.now() - tMesh;
      const f = this.falling.find((x) => x.mesh === g);
      if (!f || f.dead) return;
      // Recentre geometry on the body's origin.
      for (const buf of [r.opaque.position, r.transparent.position]) for (let i = 0; i < buf.length; i += 3) { buf[i] -= center.x; buf[i + 1] -= center.y; buf[i + 2] -= center.z; }
      if (r.opaque.index.length) { const m = new THREE.Mesh(buildGeometry(r.opaque), this.mats.opaque); m.castShadow = true; g.add(m); }
      if (r.transparent.index.length) g.add(new THREE.Mesh(buildGeometry(r.transparent), this.mats.transparent));
    });
    // Hull points: a stride sample of voxel centres relative to the body origin.
    const stride = Math.max(1, Math.floor(destroyed.length / COLLAPSE.hullSamples));
    const pts: number[] = [];
    for (let i = 0; i < destroyed.length; i += stride) {
      const d = destroyed[i];
      pts.push((d.x + 0.5) * VOXEL_SIZE - center.x, (d.y + 0.5) * VOXEL_SIZE - center.y, (d.z + 0.5) * VOXEL_SIZE - center.z);
    }
    const half = { x: ((maxX - minX + 1) * VOXEL_SIZE) / 2, y: ((maxY - minY + 1) * VOXEL_SIZE) / 2, z: ((maxZ - minZ + 1) * VOXEL_SIZE) / 2 };
    const body = this.physics.createClusterBody(center, new Float32Array(pts), half);
    this.falling.push({ body, mesh: g, born: this.now });
    this.stats.bodyMs = performance.now() - t;
    void this.dummy;
  }

  private remove(i: number): void {
    const f = this.falling[i];
    f.dead = true;
    this.physics.removeBody(f.body);
    this.group.remove(f.mesh);
    f.mesh.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
    this.falling.splice(i, 1);
  }

  get bodyCount(): number {
    return this.falling.length;
  }

  clear(): void {
    while (this.falling.length) this.remove(0);
  }
}
