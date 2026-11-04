import * as THREE from 'three';
import { EFFECTS } from '@vw/config';
import type { Vec3 } from '../util/vec';

/** Screen shake, blast flashes and additive particle bursts. Purely visual; driven by events. */
export class Effects {
  readonly group = new THREE.Group();
  private shake = 0;
  private shakeOffset = new THREE.Vector3();
  private flashes: { sprite: THREE.Sprite; born: number; size: number }[] = [];
  private flashMat: THREE.SpriteMaterial;
  private points: THREE.Points;
  private pos: Float32Array;
  private col: Float32Array;
  private vel: Float32Array;
  private age: Float32Array;
  private cap = 2000;
  private next = 0;
  private now = 0;

  constructor() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.3, 'rgba(255,220,160,0.9)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    this.flashMat = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });

    this.pos = new Float32Array(this.cap * 3);
    this.col = new Float32Array(this.cap * 3);
    this.vel = new Float32Array(this.cap * 3);
    this.age = new Float32Array(this.cap).fill(Infinity);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    const pm = new THREE.PointsMaterial({ size: EFFECTS.particleSize, vertexColors: true, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, sizeAttenuation: true });
    this.points = new THREE.Points(geo, pm);
    this.points.frustumCulled = false;
    this.group.add(this.points);
  }

  /** A blast of `power` at `center`, seen from `viewer`. */
  blast(center: Vec3, power: number, viewer: Vec3, glass = false): void {
    const d = Math.max(1, Math.hypot(center.x - viewer.x, center.y - viewer.y, center.z - viewer.z));
    this.shake = Math.min(EFFECTS.shakeMax, this.shake + (power / d) * EFFECTS.shakeScale);
    const size = Math.max(0.6, Math.sqrt(power) * 0.45);
    const sprite = new THREE.Sprite(this.flashMat);
    sprite.position.set(center.x, center.y, center.z);
    sprite.scale.setScalar(size);
    this.group.add(sprite);
    this.flashes.push({ sprite, born: this.now, size });
    const n = glass ? EFFECTS.glassParticles : Math.min(EFFECTS.particles * 3, Math.round(EFFECTS.particles * Math.max(0.3, power / 40)));
    const speed = EFFECTS.particleSpeed * Math.max(0.4, Math.sqrt(power / 40));
    for (let i = 0; i < n; i++) {
      const k = this.next++ % this.cap;
      this.pos[k * 3] = center.x;
      this.pos[k * 3 + 1] = center.y;
      this.pos[k * 3 + 2] = center.z;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(Math.random() * 2 - 1);
      const s = speed * (0.4 + Math.random() * 0.6);
      this.vel[k * 3] = Math.sin(ph) * Math.cos(th) * s;
      this.vel[k * 3 + 1] = Math.cos(ph) * s + 2;
      this.vel[k * 3 + 2] = Math.sin(ph) * Math.sin(th) * s;
      if (glass) {
        this.col[k * 3] = 0.7;
        this.col[k * 3 + 1] = 0.9;
        this.col[k * 3 + 2] = 1;
      } else {
        this.col[k * 3] = 1;
        this.col[k * 3 + 1] = 0.5 + Math.random() * 0.4;
        this.col[k * 3 + 2] = 0.2;
      }
      this.age[k] = 0;
    }
  }

  /** Apply the shake to the camera after the controller has positioned it. */
  applyShake(camera: THREE.Camera): void {
    if (this.shake <= 0.001) return;
    this.shakeOffset.set((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake * 0.5);
    camera.position.add(this.shakeOffset);
    camera.rotation.z += (Math.random() - 0.5) * this.shake * 0.05;
  }

  update(dt: number, now: number): void {
    this.now = now;
    this.shake = Math.max(0, this.shake - this.shake * EFFECTS.shakeDecay * dt);
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      const t = (now - f.born) / EFFECTS.flashMs;
      if (t >= 1) {
        this.group.remove(f.sprite);
        this.flashes.splice(i, 1);
      } else {
        f.sprite.scale.setScalar(f.size * (1 + t * 1.5));
        f.sprite.material.opacity = 1 - t;
      }
    }
    const g = 12;
    let any = false;
    for (let k = 0; k < this.cap; k++) {
      if (this.age[k] === Infinity) continue;
      any = true;
      this.age[k] += dt;
      if (this.age[k] > EFFECTS.particleLifeS) {
        this.age[k] = Infinity;
        this.pos[k * 3 + 1] = -1000;
        continue;
      }
      this.vel[k * 3 + 1] -= g * dt;
      this.pos[k * 3] += this.vel[k * 3] * dt;
      this.pos[k * 3 + 1] += this.vel[k * 3 + 1] * dt;
      this.pos[k * 3 + 2] += this.vel[k * 3 + 2] * dt;
      const fade = 1 - this.age[k] / EFFECTS.particleLifeS;
      this.col[k * 3 + 1] *= 0.995;
      this.col[k * 3] = fade;
    }
    if (any) {
      (this.points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (this.points.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }
  }
}
