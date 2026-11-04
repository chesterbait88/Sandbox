/** Growable typed buffers for the mesher. */
export class GrowF32 {
  buf: Float32Array;
  len = 0;
  constructor(cap = 1 << 14) {
    this.buf = new Float32Array(cap);
  }
  push3(a: number, b: number, c: number): void {
    if (this.len + 3 > this.buf.length) this.grow();
    this.buf[this.len++] = a;
    this.buf[this.len++] = b;
    this.buf[this.len++] = c;
  }
  private grow(): void {
    const n = new Float32Array(this.buf.length * 2);
    n.set(this.buf);
    this.buf = n;
  }
  slice(): Float32Array {
    return this.buf.slice(0, this.len);
  }
}

export class GrowU8 {
  buf: Uint8Array;
  len = 0;
  constructor(cap = 1 << 14) {
    this.buf = new Uint8Array(cap);
  }
  push(a: number): void {
    if (this.len + 1 > this.buf.length) this.grow();
    this.buf[this.len++] = a;
  }
  push3(a: number, b: number, c: number): void {
    if (this.len + 3 > this.buf.length) this.grow();
    this.buf[this.len++] = a;
    this.buf[this.len++] = b;
    this.buf[this.len++] = c;
  }
  private grow(): void {
    const n = new Uint8Array(this.buf.length * 2);
    n.set(this.buf);
    this.buf = n;
  }
  slice(): Uint8Array {
    return this.buf.slice(0, this.len);
  }
}

export class GrowU32 {
  buf: Uint32Array;
  len = 0;
  constructor(cap = 1 << 14) {
    this.buf = new Uint32Array(cap);
  }
  push(a: number): void {
    if (this.len + 1 > this.buf.length) this.grow();
    this.buf[this.len++] = a;
  }
  private grow(): void {
    const n = new Uint32Array(this.buf.length * 2);
    n.set(this.buf);
    this.buf = n;
  }
  slice(): Uint32Array {
    return this.buf.slice(0, this.len);
  }
}
