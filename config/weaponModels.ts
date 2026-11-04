import { MAT } from './materials';
import type { ModelBox } from './weapons';

/**
 * Weapon view models as inclusive voxel boxes on a 32 × 32 × 64 canvas (x right, y up, z toward
 * the camera; the muzzle is at low z). One voxel is VIEW_MODEL.voxelM (1.25 cm). Boxes paint in
 * order, so details are drawn after the part they sit on and the hands last so they wrap the grip.
 */

const SKIN = 18;
const CUFF = MAT.RUBBER;
const STEEL = MAT.STEEL;
const DARK = MAT.RUBBER;
const WOOD = MAT.WOOD;
const WHITE = MAT.ENAMEL_WHITE;
const RED = MAT.ENAMEL_RED;
const TEAL = MAT.ENAMEL_TEAL;
const NEON = MAT.NEON;
const YELLOW = MAT.LANE_PAINT;
const PUTTY = MAT.DRYWALL;

const B = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, m: number): ModelBox => [x0, y0, z0, x1, y1, z1, m];

/** A rounded bar along z: width/height 2r, centred between voxels cx-1|cx and cy-1|cy. */
function tube(cx: number, cy: number, r: number, z0: number, z1: number, m: number): ModelBox[] {
  if (r <= 1) return [B(cx - r, cy - r, z0, cx + r - 1, cy + r - 1, z1, m)];
  return [B(cx - r, cy - r + 1, z0, cx + r - 1, cy + r - 2, z1, m), B(cx - r + 1, cy - r, z0, cx + r - 2, cy + r - 1, z1, m)];
}

/** A rounded vertical post along y. */
function post(cx: number, cz: number, r: number, y0: number, y1: number, m: number): ModelBox[] {
  if (r <= 1) return [B(cx - r, y0, cz - r, cx + r - 1, y1, cz + r - 1, m)];
  return [B(cx - r, y0, cz - r + 1, cx + r - 1, y1, cz + r - 2, m), B(cx - r + 1, y0, cz - r, cx + r - 2, y1, cz + r - 1, m)];
}

/** A raked grip: `rows` voxel rows from yTop downward, drifting back one voxel every `rake` rows. */
function grip(cx: number, yTop: number, zFront: number, depth: number, rows: number, rake: number, m: number, w = 2): ModelBox[] {
  const out: ModelBox[] = [];
  for (let i = 0; i < rows; i++) {
    const s = Math.floor(i / rake);
    out.push(B(cx - w, yTop - i, zFront + s, cx + w - 1, yTop - i, zFront + depth + s, m));
  }
  return out;
}

/**
 * A fist around a grip centred at (cx, cy, cz): palm, four finger ridges toward the muzzle, a thumb
 * on the inside and a dark cuff either behind the hand (toward the camera) or below it.
 */
function hand(cx: number, cy: number, cz: number, cuff: 'back' | 'below' = 'back', mirror = false): ModelBox[] {
  const out: ModelBox[] = [];
  out.push(B(cx - 3, cy - 3, cz - 3, cx + 2, cy + 3, cz + 3, SKIN));
  for (let i = 0; i < 4; i++) out.push(B(cx - 3, cy - 3 + i * 2, cz - 5, cx + 2, cy - 3 + i * 2, cz - 4, SKIN));
  // Knuckle line.
  out.push(B(cx - 3, cy + 3, cz - 4, cx + 2, cy + 3, cz - 3, SKIN));
  if (mirror) out.push(B(cx + 2, cy + 1, cz - 2, cx + 3, cy + 4, cz + 2, SKIN));
  else out.push(B(cx - 4, cy + 1, cz - 2, cx - 3, cy + 4, cz + 2, SKIN));
  if (cuff === 'back') out.push(B(cx - 4, cy - 4, cz + 4, cx + 3, cy + 3, cz + 8, CUFF));
  else out.push(B(cx - 4, cy - 9, cz - 3, cx + 3, cy - 4, cz + 3, CUFF));
  return out;
}

const CX = 16;

// ---------------------------------------------------------------- pistol
const pistol: ModelBox[] = [
  // Slide, muzzle, chamfer.
  B(14, 16, 18, 17, 21, 44, STEEL),
  B(15, 17, 16, 16, 20, 17, STEEL),
  B(15, 18, 16, 16, 19, 16, DARK),
  // Frame and dust cover.
  B(14, 12, 22, 17, 15, 46, DARK),
  B(14, 12, 20, 17, 13, 22, DARK),
  // Serrations on the rear of the slide.
  ...[36, 38, 40, 42].flatMap((z) => [B(14, 17, z, 14, 20, z, DARK), B(17, 17, z, 17, 20, z, DARK)]),
  // Ejection port and an accent line.
  B(17, 19, 30, 17, 21, 35, DARK),
  B(14, 18, 20, 14, 18, 34, TEAL),
  B(17, 18, 20, 17, 18, 30, TEAL),
  // Trigger guard and trigger.
  B(14, 8, 30, 17, 8, 38, DARK),
  B(14, 8, 30, 17, 11, 30, DARK),
  B(15, 9, 35, 16, 11, 35, STEEL),
  // Grip and magazine base plate.
  ...grip(CX, 11, 38, 8, 10, 3, DARK),
  B(13, 1, 41, 18, 1, 50, STEEL),
  // Sights.
  B(14, 22, 42, 17, 22, 44, STEEL),
  B(15, 22, 42, 16, 22, 44, DARK),
  B(15, 22, 18, 16, 22, 19, NEON),
  ...hand(CX, 6, 43)
];

// ---------------------------------------------------------------- shotgun
const shotgun: ModelBox[] = [
  // Barrel and magazine tube.
  ...tube(CX, 20, 2, 0, 40, STEEL),
  B(15, 20, 0, 16, 21, 0, DARK),
  ...tube(CX, 16, 2, 4, 40, STEEL),
  B(15, 16, 4, 16, 17, 4, DARK),
  // Pump fore-end with grooves.
  B(12, 13, 14, 19, 21, 27, WOOD),
  ...[16, 19, 22, 25].flatMap((z) => [B(12, 14, z, 12, 20, z, DARK), B(19, 14, z, 19, 20, z, DARK), B(13, 13, z, 18, 13, z, DARK)]),
  // Receiver, ejection port, loading gate.
  B(13, 13, 40, 18, 23, 52, STEEL),
  B(18, 17, 43, 18, 20, 48, DARK),
  B(14, 13, 44, 17, 13, 49, DARK),
  // Trigger guard and trigger.
  B(14, 10, 46, 17, 10, 54, DARK),
  B(14, 10, 46, 17, 12, 46, DARK),
  B(15, 11, 50, 16, 12, 50, STEEL),
  // Stock: wrist, comb, drop, butt pad.
  B(13, 12, 52, 18, 22, 63, WOOD),
  B(13, 8, 57, 18, 12, 63, WOOD),
  B(13, 9, 54, 18, 11, 57, WOOD),
  B(12, 7, 62, 19, 22, 63, DARK),
  // Bead sight and a brand stripe.
  B(15, 22, 1, 16, 22, 2, NEON),
  B(13, 23, 42, 18, 23, 50, TEAL),
  ...hand(CX, 15, 21, 'below'),
  ...hand(CX, 13, 55)
];

// ---------------------------------------------------------------- rifle
const rifle: ModelBox[] = [
  // Barrel, muzzle brake with slots, front sight.
  B(15, 17, 0, 16, 19, 10, STEEL),
  B(14, 16, 0, 17, 20, 4, DARK),
  B(14, 17, 1, 14, 19, 1, STEEL),
  B(17, 17, 1, 17, 19, 1, STEEL),
  B(15, 20, 8, 16, 22, 9, STEEL),
  B(15, 23, 8, 16, 23, 9, WHITE),
  // Handguard with vents.
  B(13, 14, 10, 18, 22, 34, DARK),
  ...[14, 18, 22, 26, 30].flatMap((z) => [B(13, 16, z, 13, 20, z + 1, STEEL), B(18, 16, z, 18, 20, z + 1, STEEL)]),
  B(13, 14, 10, 18, 14, 34, TEAL),
  // Receiver, port, rail and carry handle.
  B(13, 13, 34, 18, 22, 50, STEEL),
  B(18, 17, 36, 18, 20, 42, DARK),
  B(14, 23, 30, 17, 24, 48, DARK),
  B(14, 25, 44, 17, 26, 48, STEEL),
  B(15, 25, 45, 16, 25, 47, DARK),
  // Magazine (curved) with a teal base plate.
  ...grip(CX, 13, 38, 6, 10, 4, DARK),
  B(14, 3, 40, 17, 3, 47, TEAL),
  // Trigger guard and trigger.
  B(14, 11, 44, 17, 11, 50, DARK),
  B(15, 12, 47, 16, 12, 47, STEEL),
  // Pistol grip.
  ...grip(CX, 12, 48, 5, 11, 3, DARK),
  // Stock and butt pad.
  B(13, 14, 50, 18, 22, 63, DARK),
  B(14, 10, 56, 17, 13, 63, DARK),
  B(12, 9, 62, 19, 23, 63, STEEL),
  // Red dot.
  B(15, 25, 36, 16, 25, 36, NEON),
  ...hand(CX, 15, 20, 'below'),
  ...hand(CX, 7, 51)
];

// ---------------------------------------------------------------- rocket launcher
const rocket: ModelBox[] = [
  // Tube with a neon band and a flared muzzle; rocket nose visible in the bore.
  ...tube(CX, 20, 6, 6, 58, STEEL),
  ...tube(CX, 20, 6, 34, 35, NEON),
  ...tube(CX, 20, 8, 0, 5, RED),
  ...tube(CX, 20, 5, 0, 0, DARK),
  ...tube(CX, 20, 3, 0, 3, WHITE),
  // Exhaust cone.
  ...tube(CX, 20, 7, 59, 63, RED),
  ...tube(CX, 20, 4, 63, 63, DARK),
  // Grips.
  ...grip(CX, 13, 40, 6, 11, 3, DARK),
  B(14, 10, 38, 17, 10, 47, DARK),
  B(15, 11, 44, 16, 12, 44, STEEL),
  ...post(CX, 23, 2, 8, 13, DARK),
  // Shoulder rest.
  B(12, 10, 50, 19, 13, 58, DARK),
  // Sight.
  B(14, 26, 28, 17, 31, 30, STEEL),
  B(15, 31, 29, 16, 31, 29, NEON),
  B(14, 26, 44, 17, 30, 46, STEEL),
  B(15, 29, 44, 16, 30, 46, DARK),
  ...hand(CX, 10, 23, 'below'),
  ...hand(CX, 7, 43)
];

// ---------------------------------------------------------------- grenade
/** Grenade body without a hand (also the thrown object). */
const grenadeBody: ModelBox[] = [
  ...post(CX, 41, 4, 10, 21, STEEL),
  // Pineapple grooves: rings and verticals.
  ...[13, 16, 19].flatMap((y) => [B(12, y, 37, 19, y, 45, DARK), B(13, y, 36, 18, y, 46, DARK)]),
  ...[38, 41, 44].map((z) => B(12, 11, z, 19, 20, z, DARK)),
  ...[13, 16, 19].map((x) => B(x, 11, 37, x, 20, 45, DARK)),
  // Neck, fuse head, lever, pin ring.
  B(14, 22, 39, 17, 23, 43, STEEL),
  B(13, 24, 38, 18, 26, 44, WHITE),
  B(18, 12, 39, 19, 26, 43, WHITE),
  B(12, 25, 40, 13, 27, 43, YELLOW),
  B(11, 26, 41, 11, 27, 42, YELLOW)
];
const grenade: ModelBox[] = [...grenadeBody, ...hand(CX, 13, 41, 'below')];

// ---------------------------------------------------------------- C4
/** Charge without a hand (also the placed object). */
const c4Body: ModelBox[] = [
  B(8, 8, 34, 23, 14, 52, PUTTY),
  // Tape bands.
  B(8, 8, 40, 23, 14, 41, DARK),
  B(8, 8, 46, 23, 14, 47, DARK),
  // Detonator, lamp, arm button, wires.
  B(12, 15, 38, 19, 18, 46, STEEL),
  B(13, 19, 40, 14, 19, 41, NEON),
  B(17, 19, 43, 18, 19, 44, RED),
  B(11, 13, 37, 11, 16, 38, YELLOW),
  B(12, 16, 37, 12, 16, 37, YELLOW),
  B(20, 13, 48, 20, 16, 49, YELLOW),
  B(19, 16, 48, 19, 16, 48, YELLOW)
];
const c4: ModelBox[] = [
  ...c4Body,
  // Hand underneath, fingers curling up the front, thumb over the top edge.
  B(9, 3, 38, 20, 7, 50, SKIN),
  B(9, 7, 32, 20, 12, 33, SKIN),
  B(9, 3, 32, 20, 7, 37, SKIN),
  B(9, 12, 34, 11, 15, 44, SKIN),
  B(8, 0, 44, 21, 3, 54, CUFF)
];

// ---------------------------------------------------------------- pickaxe
const pickaxe: ModelBox[] = (() => {
  const out: ModelBox[] = [];
  // Handle: rises toward the head, two voxels forward per row.
  for (let i = 0; i < 26; i++) {
    const z = 62 - i * 2;
    const y = 2 + i;
    out.push(B(14, y, z - 1, 17, y + 1, z, WOOD));
  }
  // Grip wrap.
  for (let i = 5; i < 12; i++) if (i % 2) out.push(B(13, 2 + i, 61 - i * 2, 18, 3 + i, 62 - i * 2, DARK));
  // Head: bar, pick point to the left, adze to the right.
  out.push(B(6, 25, 8, 25, 28, 12, STEEL));
  out.push(B(2, 26, 9, 5, 27, 11, STEEL), B(0, 26, 10, 1, 26, 10, STEEL));
  out.push(B(26, 25, 8, 31, 28, 12, STEEL), B(28, 23, 8, 31, 24, 12, STEEL));
  out.push(B(14, 29, 9, 17, 29, 11, STEEL));
  out.push(B(13, 26, 8, 18, 27, 8, NEON));
  out.push(...hand(CX, 17, 34, 'below', true), ...hand(CX, 11, 46));
  return out;
})();

// ---------------------------------------------------------------- bat
const bat: ModelBox[] = [
  ...tube(CX, 16, 4, 0, 22, WOOD),
  ...tube(CX, 16, 3, 23, 38, WOOD),
  ...tube(CX, 16, 2, 39, 58, WOOD),
  ...tube(CX, 16, 3, 59, 62, WOOD),
  B(14, 14, 0, 17, 17, 0, WHITE),
  ...tube(CX, 16, 4, 19, 20, NEON),
  ...[42, 45, 48, 51].flatMap((z) => tube(CX, 16, 2, z, z, DARK)),
  ...hand(CX, 16, 42, 'below', true),
  ...hand(CX, 16, 51)
];

export const WEAPON_MODELS: Record<string, ModelBox[]> = { pickaxe, bat, pistol, shotgun, rifle, rocket, grenade, c4 };

/** Objects that leave the hands, on the same canvas and voxel size as the in-hand models. */
export const PROJECTILE_MODELS: Record<string, ModelBox[]> = {
  grenade: grenadeBody,
  rocket: [
    ...tube(CX, 16, 3, 4, 28, WHITE),
    ...tube(CX, 16, 2, 0, 3, RED),
    ...tube(CX, 16, 3, 14, 15, RED),
    B(13, 15, 24, 18, 16, 30, STEEL),
    B(15, 13, 24, 16, 18, 30, STEEL),
    ...tube(CX, 16, 2, 29, 30, DARK)
  ],
  c4: c4Body
};
