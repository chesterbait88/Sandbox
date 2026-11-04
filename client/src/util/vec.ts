export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const v3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
export const dist3 = (a: Vec3, b: Vec3): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
