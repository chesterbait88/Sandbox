import RAPIER from '@dimforge/rapier3d-compat';
import { COLLAPSE, PHYSICS, VOXEL_SIZE, WORLD_SIZE_M, WORLD_VOXELS } from '@vw/config';

/**
 * Rapier world for debris only. The voxel world is represented by one static heightfield of the
 * terrain surface; walls are not Rapier bodies (phase-2 trimesh upgrade).
 */
export class PhysicsWorld {
  static ready: Promise<typeof RAPIER> | null = null;
  world!: RAPIER.World;
  private terrain: RAPIER.Collider | null = null;
  private chunkColliders = new Map<number, RAPIER.Collider>();
  private colliderQueue = new Map<number, { vertices: Float32Array; indices: Uint32Array } | null>();
  R!: typeof RAPIER;
  private accumulator = 0;
  readonly step: number = PHYSICS.step;

  static init(): Promise<typeof RAPIER> {
    if (!PhysicsWorld.ready) PhysicsWorld.ready = RAPIER.init().then(() => RAPIER);
    return PhysicsWorld.ready;
  }

  async create(gravity: number): Promise<void> {
    this.R = await PhysicsWorld.init();
    this.world = new this.R.World({ x: 0, y: -gravity, z: 0 });
    this.world.timestep = this.step;
  }

  /** Build the terrain heightfield from per-column surface heights (voxel units, x + SX*z), sampled every
   *  PHYSICS.heightfieldStepM with the highest column in each cell so debris never sinks into a step. */
  setTerrain(height: Int16Array): void {
    if (this.terrain) this.world.removeCollider(this.terrain, false);
    const SX = WORLD_VOXELS.x;
    const SZ = WORLD_VOXELS.z;
    const sv = Math.max(1, Math.round(PHYSICS.heightfieldStepM / VOXEL_SIZE));
    const nx = Math.floor((SX - 1) / sv) + 1;
    const nz = Math.floor((SZ - 1) / sv) + 1;
    const nrows = nz - 1;
    const ncols = nx - 1;
    const heights = new Float32Array(nx * nz);
    // Column-major: heights[col * (nrows + 1) + row], columns along x, rows along z.
    for (let col = 0; col < nx; col++) {
      for (let row = 0; row < nz; row++) {
        let h = -1;
        for (let dz = 0; dz < sv; dz++) for (let dx = 0; dx < sv; dx++) {
          const x = Math.min(SX - 1, col * sv + dx);
          const z = Math.min(SZ - 1, row * sv + dz);
          const v = height[x + SX * z];
          if (v > h) h = v;
        }
        heights[col * (nrows + 1) + row] = (h + 1) * VOXEL_SIZE;
      }
    }
    const desc = this.R.ColliderDesc.heightfield(nrows, ncols, heights, { x: WORLD_SIZE_M.x, y: 1, z: WORLD_SIZE_M.z })
      .setTranslation(WORLD_SIZE_M.x / 2, 0, WORLD_SIZE_M.z / 2)
      .setFriction(0.9)
      .setRestitution(0.2);
    this.terrain = this.world.createCollider(desc);
  }

  /** Queue a chunk's wall geometry (world-space triangles) for a static trimesh collider; null removes it. */
  queueChunkCollider(index: number, mesh: { vertices: Float32Array; indices: Uint32Array } | null): void {
    this.colliderQueue.set(index, mesh);
  }

  /** Build at most PHYSICS.chunkCollidersPerFrame queued colliders. Returns ms spent. */
  buildQueuedColliders(): number {
    const t0 = performance.now();
    let n = 0;
    for (const [index, mesh] of this.colliderQueue) {
      this.colliderQueue.delete(index);
      const old = this.chunkColliders.get(index);
      if (old) {
        this.world.removeCollider(old, false);
        this.chunkColliders.delete(index);
      }
      if (mesh && mesh.indices.length >= 3) {
        const c = this.world.createCollider(this.R.ColliderDesc.trimesh(mesh.vertices, mesh.indices).setFriction(0.8).setRestitution(0.2));
        this.chunkColliders.set(index, c);
      }
      if (++n >= PHYSICS.chunkCollidersPerFrame) break;
    }
    return performance.now() - t0;
  }

  get chunkColliderCount(): number {
    return this.chunkColliders.size;
  }

  clearChunkColliders(): void {
    for (const c of this.chunkColliders.values()) this.world.removeCollider(c, false);
    this.chunkColliders.clear();
    this.colliderQueue.clear();
  }

  /** A dynamic body with a convex hull (or box fallback) for a collapsing cluster. */
  createClusterBody(center: { x: number; y: number; z: number }, points: Float32Array, half: { x: number; y: number; z: number }): RAPIER.RigidBody {
    const body = this.world.createRigidBody(this.R.RigidBodyDesc.dynamic().setTranslation(center.x, center.y, center.z).setAngularDamping(0.8).setLinearDamping(0.1));
    const hull = COLLAPSE.collider === 'hull' && points.length >= 12 ? this.R.ColliderDesc.convexHull(points) : null;
    const desc = hull ?? this.R.ColliderDesc.cuboid(half.x, half.y, half.z);
    this.world.createCollider(desc.setFriction(0.9).setRestitution(0.05).setDensity(2), body);
    return body;
  }

  removeBody(body: RAPIER.RigidBody): void {
    this.world.removeRigidBody(body);
  }

  /** Fixed-step the simulation. */
  update(dt: number): void {
    this.accumulator += dt;
    let n = 0;
    while (this.accumulator >= this.step && n < PHYSICS.maxSubSteps) {
      this.world.step();
      this.accumulator -= this.step;
      n++;
    }
    if (n === PHYSICS.maxSubSteps) this.accumulator = 0;
  }
}
