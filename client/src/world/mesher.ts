import { MATERIALS, MAX_MATERIAL_ID, PATTERNS, RENDER, VOXEL_SIZE } from '@vw/config';
import { hexToRgb } from '../util/color';
import { GrowF32, GrowU32, GrowU8 } from '../util/growable';

/**
 * Greedy voxel mesher with vertex colours, per-material patterns, vertex AO and a transparent pass.
 * Pure: used by the mesher Worker for chunks and on the main thread for tiny view models.
 */

export interface MeshBuffers {
  position: Float32Array;
  normal: Float32Array;
  color: Uint8Array;
  emit: Uint8Array;
  index: Uint32Array;
}

export interface MeshResult {
  opaque: MeshBuffers;
  transparent: MeshBuffers;
}

export interface MeshOptions {
  /** Size of the cube including a 1-voxel padding border on each side. */
  size: number;
  /** World offset of the unpadded origin, in voxels, used for patterns and vertex positions. */
  ox: number;
  oy: number;
  oz: number;
  /** Metres per voxel. */
  voxelSize?: number;
}

const baseRgb: [number, number, number][] = [];
const transparentMat = new Uint8Array(MAX_MATERIAL_ID + 1);
const emissiveMat = new Uint8Array(MAX_MATERIAL_ID + 1);
const patternMat: (string | undefined)[] = [];
for (let i = 0; i <= MAX_MATERIAL_ID; i++) {
  const m = MATERIALS[i];
  baseRgb[i] = m ? hexToRgb(m.color) : [255, 0, 255];
  transparentMat[i] = m?.transparent ? 1 : 0;
  emissiveMat[i] = m?.emissive ? 1 : 0;
  patternMat[i] = m?.pattern;
}

/** Pattern brightness multiplier for a voxel at world voxel coords. */
export function patternFactor(mat: number, x: number, y: number, z: number): number {
  switch (patternMat[mat]) {
    case 'brickRows':
      return (y & 1) === 0 ? 1 : 1 - PATTERNS.brickDarken;
    case 'siding':
      return (y & 1) === 0 ? 1 : 1 - PATTERNS.sidingDarken;
    case 'checker':
      return ((x + z) & 1) === 0 ? 1 : 1 - PATTERNS.checkerDarken;
    case 'marble': {
      const n = Math.sin(x * 0.35 + z * 0.21) * Math.cos(y * 0.27 - x * 0.13) * Math.sin(z * 0.17 + y * 0.31);
      return 1 - PATTERNS.marbleTint * (n * 0.5 + 0.5);
    }
    default:
      return 1;
  }
}

function occludes(n: number, m: number): boolean {
  return n !== 0 && (transparentMat[n] === 0 || n === m);
}

const AO_STEP = RENDER.aoStrength / 3;

export function meshVoxels(vox: Uint8Array, opts: MeshOptions): MeshResult {
  const P = opts.size;
  const N = P - 2;
  const vs = opts.voxelSize ?? VOXEL_SIZE;
  const idx = (x: number, y: number, z: number) => x + 1 + P * (z + 1 + P * (y + 1));
  const solidAt = (x: number, y: number, z: number) => {
    const m = vox[idx(x, y, z)];
    return m !== 0 && transparentMat[m] === 0;
  };

  const out = {
    opaque: { pos: new GrowF32(), nrm: new GrowF32(), col: new GrowU8(), emit: new GrowU8(), idx: new GrowU32(), count: 0 },
    transparent: { pos: new GrowF32(), nrm: new GrowF32(), col: new GrowU8(), emit: new GrowU8(), idx: new GrowU32(), count: 0 }
  };

  // Mask per slice: colour key (-1 = none), ao bits, direction sign, transparency.
  const maskColor = new Int32Array(N * N);
  const maskAO = new Uint8Array(N * N);
  const maskDir = new Int8Array(N * N);
  const maskMat = new Uint8Array(N * N);
  const pos = [0, 0, 0];
  const q = [0, 0, 0];

  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3;
    const v = (d + 2) % 3;
    q[0] = q[1] = q[2] = 0;
    q[d] = 1;

    for (let s = 0; s <= N; s++) {
      // Build the mask for the plane between slice s-1 and s.
      let n = 0;
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++, n++) {
          pos[d] = s;
          pos[u] = i;
          pos[v] = j;
          const a = vox[idx(pos[0], pos[1], pos[2])];
          const b = vox[idx(pos[0] - q[0], pos[1] - q[1], pos[2] - q[2])];
          maskColor[n] = -1;
          let faceMat = 0;
          let dir = 0;
          if (s < N && a !== 0 && !occludes(b, a)) {
            faceMat = a;
            dir = -1;
          } else if (s > 0 && b !== 0 && !occludes(a, b)) {
            faceMat = b;
            dir = 1;
          }
          if (faceMat === 0) continue;
          // Voxel that owns the face.
          const vx = pos[0] - (dir === 1 ? q[0] : 0);
          const vy = pos[1] - (dir === 1 ? q[1] : 0);
          const vz = pos[2] - (dir === 1 ? q[2] : 0);
          // Neighbour position on the outside of the face.
          const nx = vx + q[0] * dir;
          const ny = vy + q[1] * dir;
          const nz = vz + q[2] * dir;
          // AO for the 4 corners (su, sv) in order (-,-), (+,-), (+,+), (-,+).
          let ao = 0;
          for (let c = 0; c < 4; c++) {
            const su = c === 1 || c === 2 ? 1 : -1;
            const sv = c >= 2 ? 1 : -1;
            const o1 = [nx, ny, nz];
            o1[u] += su;
            const o2 = [nx, ny, nz];
            o2[v] += sv;
            const o3 = [nx, ny, nz];
            o3[u] += su;
            o3[v] += sv;
            const s1 = solidAt(o1[0], o1[1], o1[2]) ? 1 : 0;
            const s2 = solidAt(o2[0], o2[1], o2[2]) ? 1 : 0;
            const s3 = solidAt(o3[0], o3[1], o3[2]) ? 1 : 0;
            const val = s1 && s2 ? 0 : 3 - (s1 + s2 + s3);
            ao |= val << (c * 2);
          }
          const f = patternFactor(faceMat, vx + opts.ox, vy + opts.oy, vz + opts.oz);
          const base = baseRgb[faceMat];
          const r = Math.min(255, (base[0] * f) | 0);
          const g = Math.min(255, (base[1] * f) | 0);
          const bl = Math.min(255, (base[2] * f) | 0);
          maskColor[n] = (r << 16) | (g << 8) | bl;
          maskAO[n] = ao;
          maskDir[n] = dir;
          maskMat[n] = faceMat;
        }
      }

      // Greedy merge.
      n = 0;
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; ) {
          const c = maskColor[n];
          if (c === -1) {
            i++;
            n++;
            continue;
          }
          const ao = maskAO[n];
          const dir = maskDir[n];
          const mat = maskMat[n];
          let w = 1;
          while (i + w < N && maskColor[n + w] === c && maskAO[n + w] === ao && maskDir[n + w] === dir && maskMat[n + w] === mat) w++;
          let h = 1;
          outer: for (; j + h < N; h++) {
            for (let k = 0; k < w; k++) {
              const m = n + k + h * N;
              if (maskColor[m] !== c || maskAO[m] !== ao || maskDir[m] !== dir || maskMat[m] !== mat) break outer;
            }
          }

          const target = transparentMat[mat] ? out.transparent : out.opaque;
          const r = (c >> 16) & 255;
          const g = (c >> 8) & 255;
          const b = c & 255;
          const em = emissiveMat[mat] ? 255 : 0;
          const a0 = ao & 3;
          const a1 = (ao >> 2) & 3;
          const a2 = (ao >> 4) & 3;
          const a3 = (ao >> 6) & 3;
          const shade = (a: number) => 1 - (3 - a) * AO_STEP;
          const base = target.count;
          pos[d] = s;
          pos[u] = i;
          pos[v] = j;
          const du = [0, 0, 0];
          const dv = [0, 0, 0];
          du[u] = w;
          dv[v] = h;
          const bx = (pos[0] + opts.ox) * vs;
          const by = (pos[1] + opts.oy) * vs;
          const bz = (pos[2] + opts.oz) * vs;
          const corners = [
            [bx, by, bz],
            [bx + du[0] * vs, by + du[1] * vs, bz + du[2] * vs],
            [bx + (du[0] + dv[0]) * vs, by + (du[1] + dv[1]) * vs, bz + (du[2] + dv[2]) * vs],
            [bx + dv[0] * vs, by + dv[1] * vs, bz + dv[2] * vs]
          ];
          const aos = [a0, a1, a2, a3];
          for (let k = 0; k < 4; k++) {
            target.pos.push3(corners[k][0], corners[k][1], corners[k][2]);
            target.nrm.push3(q[0] * dir, q[1] * dir, q[2] * dir);
            const sh = shade(aos[k]);
            target.col.push3((r * sh) | 0, (g * sh) | 0, (b * sh) | 0);
            target.emit.push(em);
          }
          // Flip the diagonal to avoid AO anisotropy artefacts.
          const flip = a0 + a2 > a1 + a3;
          if (dir > 0) {
            if (flip) {
              target.idx.push(base + 1); target.idx.push(base + 2); target.idx.push(base + 3);
              target.idx.push(base + 1); target.idx.push(base + 3); target.idx.push(base + 0);
            } else {
              target.idx.push(base + 0); target.idx.push(base + 1); target.idx.push(base + 2);
              target.idx.push(base + 0); target.idx.push(base + 2); target.idx.push(base + 3);
            }
          } else if (flip) {
            target.idx.push(base + 3); target.idx.push(base + 2); target.idx.push(base + 1);
            target.idx.push(base + 0); target.idx.push(base + 3); target.idx.push(base + 1);
          } else {
            target.idx.push(base + 2); target.idx.push(base + 1); target.idx.push(base + 0);
            target.idx.push(base + 3); target.idx.push(base + 2); target.idx.push(base + 0);
          }
          target.count += 4;

          for (let hh = 0; hh < h; hh++) for (let k = 0; k < w; k++) maskColor[n + k + hh * N] = -1;
          i += w;
          n += w;
        }
      }
    }
  }

  const pack = (o: typeof out.opaque): MeshBuffers => ({
    position: o.pos.slice(),
    normal: o.nrm.slice(),
    color: o.col.slice(),
    emit: o.emit.slice(),
    index: o.idx.slice()
  });
  return { opaque: pack(out.opaque), transparent: pack(out.transparent) };
}

export function transferables(r: MeshResult): ArrayBuffer[] {
  const list: ArrayBuffer[] = [];
  for (const b of [r.opaque, r.transparent]) {
    list.push(b.position.buffer as ArrayBuffer, b.normal.buffer as ArrayBuffer, b.color.buffer as ArrayBuffer, b.emit.buffer as ArrayBuffer, b.index.buffer as ArrayBuffer);
  }
  return list;
}
