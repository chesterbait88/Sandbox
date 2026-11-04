/**
 * Structural support analysis, pure so it runs on a worker. Input is a structure's bounding box
 * copied out of the world with a one-voxel padding on every side (so neighbours outside the box
 * are visible). Voxels of the structure that cannot reach a terrain-touching voxel through
 * 6-connectivity are unsupported; they come back grouped into connected clusters of local
 * (unpadded) indices x + W * (y + H * z).
 */
export interface SupportInput {
  /** Padded box dimensions: (W + 2) × (H + 2) × (D + 2). */
  W: number;
  H: number;
  D: number;
  mat: Uint8Array;
  owner: Uint16Array;
  id: number;
  /** True when the box's y0 is world y = 0 (below it is bedrock, which counts as ground). */
  bedrockBelow: boolean;
}

export interface SupportResult {
  clusters: Int32Array[];
  fillMs: number;
}

export function findUnsupported(input: SupportInput): SupportResult {
  const { W, H, D, mat, owner, id, bedrockBelow } = input;
  const PW = W + 2;
  const PH = H + 2;
  const pi = (x: number, y: number, z: number) => x + 1 + PW * (y + 1 + PH * (z + 1));
  const n = W * H * D;
  // 0 = not this structure, 1 = unvisited structure voxel, 2 = supported, 3 = clustered
  const mark = new Uint8Array(n);
  const stack = new Int32Array(n);
  let sp = 0;
  let count = 0;
  const ground = (x: number, y: number, z: number): boolean => {
    if (y === -1 && bedrockBelow) return true;
    const i = pi(x, y, z);
    return mat[i] !== 0 && owner[i] !== id;
  };
  for (let z = 0; z < D; z++)
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const i = pi(x, y, z);
        if (owner[i] !== id || mat[i] === 0) continue;
        const k = x + W * (y + H * z);
        mark[k] = 1;
        count++;
        if (ground(x, y - 1, z) || ground(x - 1, y, z) || ground(x + 1, y, z) || ground(x, y, z - 1) || ground(x, y, z + 1)) {
          mark[k] = 2;
          stack[sp++] = k;
        }
      }
  if (count === 0) return { clusters: [], fillMs: 0 };
  const t0 = performance.now();
  const WH = W * H;
  const visit = (nk: number, from: number) => {
    if (mark[nk] === 1) {
      mark[nk] = from;
      stack[sp++] = nk;
    }
  };
  // Flood fill support through 6-neighbours.
  while (sp > 0) {
    const k = stack[--sp];
    const x = k % W;
    const y = ((k / W) | 0) % H;
    const z = (k / WH) | 0;
    if (x > 0) visit(k - 1, 2);
    if (x < W - 1) visit(k + 1, 2);
    if (y > 0) visit(k - W, 2);
    if (y < H - 1) visit(k + W, 2);
    if (z > 0) visit(k - WH, 2);
    if (z < D - 1) visit(k + WH, 2);
  }
  const fillMs = performance.now() - t0;
  // Unsupported voxels → connected clusters.
  const clusters: Int32Array[] = [];
  for (let k0 = 0; k0 < n; k0++) {
    if (mark[k0] !== 1) continue;
    const list: number[] = [];
    mark[k0] = 3;
    stack[0] = k0;
    sp = 1;
    while (sp > 0) {
      const k = stack[--sp];
      list.push(k);
      const x = k % W;
      const y = ((k / W) | 0) % H;
      const z = (k / WH) | 0;
      if (x > 0) visit(k - 1, 3);
      if (x < W - 1) visit(k + 1, 3);
      if (y > 0) visit(k - W, 3);
      if (y < H - 1) visit(k + W, 3);
      if (z > 0) visit(k - WH, 3);
      if (z < D - 1) visit(k + WH, 3);
    }
    clusters.push(Int32Array.from(list));
  }
  return { clusters, fillMs };
}
