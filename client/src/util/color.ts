export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function packRgb(r: number, g: number, b: number): number {
  return (r << 16) | (g << 8) | b;
}

export function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}
