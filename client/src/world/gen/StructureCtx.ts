import { MATERIALS, VOXEL_SIZE, WORLD_VOXELS, voxelValue } from '@vw/config';

const SX = WORLD_VOXELS.x;
const SY = WORLD_VOXELS.y;
const SZ = WORLD_VOXELS.z;
const valueOf = new Float32Array(256);
for (const m of Object.values(MATERIALS)) valueOf[m.id] = voxelValue(m);

/**
 * Recipe drawing context. Coordinates are local voxels: x across, z deep, y up from the pad
 * surface (y = 0 is the first voxel above ground). Every placed voxel is tagged with the
 * structure id and its material value is summed into totalValue.
 */
export class StructureCtx {
  totalValue = 0;
  voxels = 0;
  minX = Infinity;
  minY = Infinity;
  minZ = Infinity;
  maxX = -Infinity;
  maxY = -Infinity;
  maxZ = -Infinity;

  constructor(
    private mat: Uint8Array,
    private owner: Uint16Array,
    readonly id: number,
    readonly origin: { x: number; y: number; z: number },
    /** Depth of the footprint in voxels; with `mirror` the recipe's front (z = 0) faces +z instead of −z. */
    private depth = 0,
    private mirror = false
  ) {}

  /** Helper: metres to voxels. */
  m(v: number): number {
    return Math.round(v / VOXEL_SIZE);
  }

  set(x: number, y: number, z: number, m: number): void {
    const wx = this.origin.x + x;
    const wy = this.origin.y + y;
    const wz = this.origin.z + (this.mirror ? this.depth - 1 - z : z);
    if (wx < 0 || wy < 0 || wz < 0 || wx >= SX || wy >= SY || wz >= SZ) return;
    const i = wx + SX * (wz + SZ * wy);
    const prev = this.mat[i];
    if (prev !== 0 && this.owner[i] === this.id) {
      this.totalValue -= valueOf[prev];
      this.voxels--;
    }
    this.mat[i] = m;
    if (m === 0) {
      this.owner[i] = 0;
      return;
    }
    this.owner[i] = this.id;
    this.totalValue += valueOf[m];
    this.voxels++;
    if (wx < this.minX) this.minX = wx;
    if (wy < this.minY) this.minY = wy;
    if (wz < this.minZ) this.minZ = wz;
    if (wx > this.maxX) this.maxX = wx;
    if (wy > this.maxY) this.maxY = wy;
    if (wz > this.maxZ) this.maxZ = wz;
  }

  /** Inclusive box. */
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: number): void {
    for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++)
      for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++)
        for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) this.set(x, y, z, m);
  }

  /** Walls, floor and roof of thickness t; interior left as is. */
  hollowBox(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: number, t = 1, floor = true, roof = true): void {
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) {
          const wall = x < x0 + t || x > x1 - t || z < z0 + t || z > z1 - t;
          const fl = floor && y < y0 + t;
          const rf = roof && y > y1 - t;
          if (wall || fl || rf) this.set(x, y, z, m);
        }
  }

  /** A cage: solid corner posts and roof, checkered bars for the walls so the contents show through. */
  cage(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: number): void {
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) {
          const wall = x === x0 || x === x1 || z === z0 || z === z1;
          if (!wall) continue;
          const post = (x === x0 || x === x1) && (z === z0 || z === z1);
          const roof = y === y1;
          if (post || roof || ((x + y + z) & 1) === 0) this.set(x, y, z, m);
        }
  }

  /** Vertical cylinder of radius r (voxels) centred at (cx, cz), from y0 to y1 inclusive. */
  cylinder(cx: number, cz: number, r: number, y0: number, y1: number, m: number, hollow = 0): void {
    const r2 = r * r;
    const inner = Math.max(0, r - hollow) ** 2;
    for (let y = y0; y <= y1; y++)
      for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++)
        for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          const d = (x + 0.5 - cx) ** 2 + (z + 0.5 - cz) ** 2;
          if (d <= r2 && (hollow === 0 || d >= inner)) this.set(x, y, z, m);
        }
  }

  /** Solid ellipsoid centred at (cx, cy, cz) with radii (rx, ry, rz), all in voxels (centre may be fractional). */
  ellipsoid(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, m: number): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let z = Math.floor(cz - rz); z <= Math.ceil(cz + rz); z++)
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x + 0.5 - cx) / rx;
          const dy = (y + 0.5 - cy) / ry;
          const dz = (z + 0.5 - cz) / rz;
          if (dx * dx + dy * dy + dz * dz <= 1) this.set(x, y, z, m);
        }
  }

  /**
   * A glazed wall panel in the x/y plane at depth z (or the z/y plane at x when `alongZ`): glass with
   * frame bars of `frameMat` every `pitch` voxels and around the edge.
   */
  glazing(a0: number, y0: number, a1: number, y1: number, fixed: number, alongZ: boolean, pitch: number, frameMat: number, glassMat: number): void {
    for (let y = y0; y <= y1; y++)
      for (let a = a0; a <= a1; a++) {
        const edge = a === a0 || a === a1 || y === y0 || y === y1;
        const bar = (a - a0) % pitch === 0 || (y - y0) % pitch === 0;
        const mat = edge || bar ? frameMat : glassMat;
        if (alongZ) this.set(fixed, y, a, mat);
        else this.set(a, y, fixed, mat);
      }
  }

  /** Fill every voxel in the box where fn returns a non-zero material. */
  fill(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, fn: (x: number, y: number, z: number) => number): void {
    for (let y = y0; y <= y1; y++)
      for (let z = z0; z <= z1; z++)
        for (let x = x0; x <= x1; x++) {
          const m = fn(x, y, z);
          if (m) this.set(x, y, z, m);
        }
  }

  bounds(): { x0: number; y0: number; z0: number; x1: number; y1: number; z1: number } {
    if (this.voxels === 0) return { x0: this.origin.x, y0: this.origin.y, z0: this.origin.z, x1: this.origin.x, y1: this.origin.y, z1: this.origin.z };
    return { x0: this.minX, y0: this.minY, z0: this.minZ, x1: this.maxX, y1: this.maxY, z1: this.maxZ };
  }

  /** Centre of everything placed, in metres. */
  center(): { x: number; y: number; z: number } {
    const v = VOXEL_SIZE;
    if (this.voxels === 0) return { x: this.origin.x * v, y: this.origin.y * v, z: this.origin.z * v };
    return { x: ((this.minX + this.maxX + 1) / 2) * v, y: ((this.minY + this.maxY + 1) / 2) * v, z: ((this.minZ + this.maxZ + 1) / 2) * v };
  }
}
