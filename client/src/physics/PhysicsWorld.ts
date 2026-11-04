import RAPIER from '@dimforge/rapier3d-compat';
import { VOXEL_SIZE, WORLD_SIZE_M, WORLD_VOXELS } from '@vw/config';

/**
 * Rapier world for debris only. The voxel world is represented by one static heightfield of the
 * terrain surface; walls are not Rapier bodies (phase-2 trimesh upgrade).
 */
export class PhysicsWorld {
  static ready: Promise<typeof RAPIER> | null = null;
  world!: RAPIER.World;
  private terrain: RAPIER.Collider | null = null;
  R!: typeof RAPIER;
  private accumulator = 0;
  readonly step = 1 / 60;

  static init(): Promise<typeof RAPIER> {
    if (!PhysicsWorld.ready) PhysicsWorld.ready = RAPIER.init().then(() => RAPIER);
    return PhysicsWorld.ready;
  }

  async create(gravity: number): Promise<void> {
    this.R = await PhysicsWorld.init();
    this.world = new this.R.World({ x: 0, y: -gravity, z: 0 });
    this.world.timestep = this.step;
  }

  /** Build the terrain heightfield from per-column surface heights (voxel units, x + SX*z). */
  setTerrain(height: Int16Array): void {
    if (this.terrain) this.world.removeCollider(this.terrain, false);
    const nx = WORLD_VOXELS.x;
    const nz = WORLD_VOXELS.z;
    const nrows = nz - 1;
    const ncols = nx - 1;
    const heights = new Float32Array(nx * nz);
    // Column-major: heights[col * (nrows + 1) + row], columns along x, rows along z.
    for (let col = 0; col < nx; col++) {
      for (let row = 0; row < nz; row++) heights[col * (nrows + 1) + row] = (height[col + nx * row] + 1) * VOXEL_SIZE;
    }
    const desc = this.R.ColliderDesc.heightfield(nrows, ncols, heights, { x: WORLD_SIZE_M.x, y: 1, z: WORLD_SIZE_M.z })
      .setTranslation(WORLD_SIZE_M.x / 2, 0, WORLD_SIZE_M.z / 2)
      .setFriction(0.9)
      .setRestitution(0.2);
    this.terrain = this.world.createCollider(desc);
  }

  /** Fixed-step the simulation. */
  update(dt: number): void {
    this.accumulator += dt;
    let n = 0;
    while (this.accumulator >= this.step && n < 4) {
      this.world.step();
      this.accumulator -= this.step;
      n++;
    }
    if (n === 4) this.accumulator = 0;
  }
}
