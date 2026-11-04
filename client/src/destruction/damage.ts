import { MATERIALS, VOLATILE, VOXEL_SIZE } from '@vw/config';
import type { Vec3 } from '../util/vec';
import { voxelIndex, World } from '../world/World';
import { events, type Destroyed } from '../state/events';

interface Pending {
  center: Vec3;
  mat: number;
  power: number;
  radius: number;
  at: number;
}

const hardnessOf = new Float32Array(256);
const shattersOf = new Uint8Array(256);
const volatileOf: ({ power: number; radius: number } | null)[] = [];
for (let i = 0; i < 256; i++) {
  const m = MATERIALS[i];
  hardnessOf[i] = m ? m.hardness : 0;
  shattersOf[i] = m?.shatters ? 1 : 0;
  volatileOf[i] = m?.volatile ?? null;
}

/**
 * Every hit in the game goes through applyDamage(). Carves a sphere, records destroyed voxels,
 * and queues secondary explosions for volatile materials.
 */
export class Destruction {
  private pending: Pending[] = [];
  /** Recent detonation sites, for one-per-tank dedupe. */
  private recent: { x: number; y: number; z: number; at: number }[] = [];
  private now = 0;
  /** Detonations resolved this frame (for stats). */
  detonationsThisFrame = 0;
  /** Pooled Destroyed records: the records in a returned list are reused by the next applyDamage call. */
  private pool: Destroyed[] = [];
  private result: Destroyed[] = [];

  constructor(private world: World) {}

  setWorld(world: World): void {
    this.world = world;
    this.pending = [];
    this.recent = [];
  }

  get pendingCount(): number {
    return this.pending.length;
  }

  /** Advance the chain-reaction queue. `now` in ms. */
  update(now: number): void {
    this.now = now;
    this.detonationsThisFrame = 0;
    if (this.pending.length === 0) return;
    const due = this.pending.filter((p) => p.at <= now);
    if (due.length === 0) return;
    this.pending = this.pending.filter((p) => p.at > now);
    for (const p of due) {
      this.detonationsThisFrame++;
      events.emit('detonation', { center: p.center, mat: p.mat, power: p.power, radius: p.radius });
      this.applyDamage(p.center, p.radius, p.power, 'chain');
    }
    this.recent = this.recent.filter((r) => now - r.at < VOLATILE.chainDelayMs * 4);
  }

  applyDamage(center: Vec3, radius: number, power: number, source: string): Destroyed[] {
    const world = this.world;
    const inv = 1 / VOXEL_SIZE;
    const cx = center.x * inv;
    const cy = center.y * inv;
    const cz = center.z * inv;
    const rv = radius * inv;
    const x0 = Math.max(0, Math.floor(cx - rv));
    const y0 = Math.max(0, Math.floor(cy - rv));
    const z0 = Math.max(0, Math.floor(cz - rv));
    const x1 = Math.min(world.mat.length ? 255 : 0, Math.ceil(cx + rv));
    const y1 = Math.min(127, Math.ceil(cy + rv));
    const z1 = Math.min(255, Math.ceil(cz + rv));
    const destroyed = this.result;
    destroyed.length = 0;
    const pool = this.pool;
    let used = 0;
    const queuedHere: Vec3[] = [];
    let glass = 0;
    const mat = world.mat;
    const owner = world.owner;
    const dedupe = VOLATILE.dedupeRadiusM;

    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) {
          const i = voxelIndex(x, y, z);
          const m = mat[i];
          if (m === 0) continue;
          const dx = x + 0.5 - cx;
          const dy = y + 0.5 - cy;
          const dz = z + 0.5 - cz;
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) * VOXEL_SIZE;
          if (d > radius) continue;
          const energy = power * (1 - d / radius);
          if (!(shattersOf[m] && energy > 0) && energy < hardnessOf[m]) continue;
          let rec = pool[used];
          if (!rec) rec = pool[used] = { x: 0, y: 0, z: 0, mat: 0, owner: 0 };
          used++;
          rec.x = x;
          rec.y = y;
          rec.z = z;
          rec.mat = m;
          rec.owner = owner[i];
          destroyed.push(rec);
          if (shattersOf[m]) glass++;
          mat[i] = 0;
          owner[i] = 0;
          world.markDirty(x, y, z);
          const vol = volatileOf[m];
          if (vol) {
            const p = { x: (x + 0.5) * VOXEL_SIZE, y: (y + 0.5) * VOXEL_SIZE, z: (z + 0.5) * VOXEL_SIZE };
            if (!this.nearQueued(p, queuedHere, dedupe)) {
              queuedHere.push(p);
              this.pending.push({ center: p, mat: m, power: vol.power, radius: vol.radius, at: this.now + VOLATILE.chainDelayMs });
              this.recent.push({ x: p.x, y: p.y, z: p.z, at: this.now });
            }
          }
        }
      }
    }
    events.emit('hit', { center, radius, power, destroyed, source, glass });
    // The list is a fresh array (cheap); the records in it are pooled and reused on the next call.
    return destroyed.slice();
  }

  private nearQueued(p: Vec3, local: Vec3[], r: number): boolean {
    const r2 = r * r;
    for (const q of local) if ((q.x - p.x) ** 2 + (q.y - p.y) ** 2 + (q.z - p.z) ** 2 < r2) return true;
    for (const q of this.pending) if ((q.center.x - p.x) ** 2 + (q.center.y - p.y) ** 2 + (q.center.z - p.z) ** 2 < r2) return true;
    for (const q of this.recent) if ((q.x - p.x) ** 2 + (q.y - p.y) ** 2 + (q.z - p.z) ** 2 < r2) return true;
    return false;
  }
}
