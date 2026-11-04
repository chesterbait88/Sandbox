import * as THREE from 'three';
import { PLAYER, VOXEL_SIZE } from '@vw/config';
import type { World } from '../world/World';
import type { Input } from './Input';

/**
 * First-person controller: an AABB swept per axis against the voxel grid. No Rapier.
 * `position` is the feet centre in metres.
 */
export class Controller {
  position = new THREE.Vector3();
  velocity = new THREE.Vector3();
  yaw = 0;
  pitch = 0;
  onGround = false;
  sensitivity: number = PLAYER.sensitivity;
  /** Frozen controllers ignore input but still fall. */
  frozen = false;
  private halfW = PLAYER.width / 2;
  private height = PLAYER.height;
  readonly camera: THREE.PerspectiveCamera;
  /** Time scale multiplier applied by the game (radial picker slow-mo). */
  timeScale = 1;

  constructor(private world: World, camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  setWorld(world: World): void {
    this.world = world;
  }

  spawn(pos: { x: number; y: number; z: number }, yaw: number): void {
    this.position.set(pos.x, pos.y, pos.z);
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.pitch = 0;
    this.updateCamera();
  }

  /** Eye position in metres. */
  eye(): THREE.Vector3 {
    return new THREE.Vector3(this.position.x, this.position.y + PLAYER.eyeHeight, this.position.z);
  }

  forward(): THREE.Vector3 {
    return new THREE.Vector3(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch));
  }

  look(input: Input): void {
    if (this.frozen) return;
    this.yaw -= input.dx * this.sensitivity;
    this.pitch -= input.dy * this.sensitivity;
    this.pitch = Math.max(-PLAYER.maxPitch, Math.min(PLAYER.maxPitch, this.pitch));
  }

  update(dt: number, input: Input): void {
    // Wish direction in the horizontal plane.
    let fx = 0;
    let fz = 0;
    if (!this.frozen) {
      if (input.down('KeyW')) fz -= 1;
      if (input.down('KeyS')) fz += 1;
      if (input.down('KeyA')) fx -= 1;
      if (input.down('KeyD')) fx += 1;
    }
    const len = Math.hypot(fx, fz);
    const sprint = input.down('ShiftLeft') || input.down('ShiftRight');
    const speed = sprint ? PLAYER.sprintSpeed : PLAYER.walkSpeed;
    let wx = 0;
    let wz = 0;
    if (len > 0) {
      fx /= len;
      fz /= len;
      const s = Math.sin(this.yaw);
      const c = Math.cos(this.yaw);
      wx = (fx * c - fz * s) * speed;
      wz = (fx * s + fz * c) * speed;
    }
    const accel = this.onGround ? PLAYER.groundAccel : PLAYER.airAccel;
    const ax = wx - this.velocity.x;
    const az = wz - this.velocity.z;
    const alen = Math.hypot(ax, az);
    const maxStep = accel * dt;
    if (alen > maxStep && alen > 0) {
      this.velocity.x += (ax / alen) * maxStep;
      this.velocity.z += (az / alen) * maxStep;
    } else {
      this.velocity.x = wx;
      this.velocity.z = wz;
    }

    if (!this.frozen && this.onGround && input.down('Space')) {
      this.velocity.y = Math.sqrt(2 * PLAYER.gravity * PLAYER.jumpHeight);
      this.onGround = false;
    }
    this.velocity.y -= PLAYER.gravity * dt;
    if (this.velocity.y < -60) this.velocity.y = -60;

    this.move(this.velocity.x * dt, this.velocity.y * dt, this.velocity.z * dt);
    this.updateCamera();
  }

  updateCamera(): void {
    this.camera.position.set(this.position.x, this.position.y + PLAYER.eyeHeight, this.position.z);
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  /** Sweep the AABB along each axis in turn with one-voxel step-up. */
  private move(dx: number, dy: number, dz: number): void {
    const wasGround = this.onGround;
    // Vertical first.
    this.onGround = false;
    if (dy !== 0) {
      const hit = this.sweep(1, dy);
      if (hit) {
        if (dy < 0) this.onGround = true;
        this.velocity.y = 0;
      }
    }
    // Horizontal with step-up.
    for (const [axis, d] of [[0, dx], [2, dz]] as const) {
      if (d === 0) continue;
      const before = axis === 0 ? this.position.x : this.position.z;
      const blocked = this.sweep(axis, d);
      if (blocked && (this.onGround || wasGround)) {
        const moved = (axis === 0 ? this.position.x : this.position.z) - before;
        const remaining = d - moved;
        if (Math.abs(remaining) > 1e-4 && this.tryStepUp(axis, remaining)) continue;
        if (axis === 0) this.velocity.x = 0;
        else this.velocity.z = 0;
      } else if (blocked) {
        if (axis === 0) this.velocity.x = 0;
        else this.velocity.z = 0;
      }
    }
  }

  private tryStepUp(axis: 0 | 2, d: number): boolean {
    const saved = this.position.clone();
    // Lift by one voxel, try the horizontal move, then settle down.
    if (this.sweep(1, PLAYER.stepUp + 0.01)) {
      this.position.copy(saved);
      return false;
    }
    const before = axis === 0 ? this.position.x : this.position.z;
    this.sweep(axis, d);
    const moved = Math.abs((axis === 0 ? this.position.x : this.position.z) - before);
    if (moved < Math.abs(d) * 0.5) {
      this.position.copy(saved);
      return false;
    }
    if (this.sweep(1, -(PLAYER.stepUp + 0.02))) this.onGround = true;
    return true;
  }

  /** Move along one axis in sub-steps, stopping at the first solid voxel. Returns true if blocked. */
  private sweep(axis: 0 | 1 | 2, d: number): boolean {
    const vs = VOXEL_SIZE;
    const eps = 1e-3;
    const maxStep = vs * 0.8;
    const steps = Math.max(1, Math.ceil(Math.abs(d) / maxStep));
    const step = d / steps;
    const sign = d > 0 ? 1 : -1;
    const p = this.position;
    const pos = [0, 0, 0];
    for (let i = 0; i < steps; i++) {
      this.setAxis(axis, this.getAxis(axis) + step);
      const mins = [p.x - this.halfW, p.y, p.z - this.halfW];
      const maxs = [p.x + this.halfW, p.y + this.height, p.z + this.halfW];
      const lo = [Math.floor(mins[0] / vs), Math.floor(mins[1] / vs), Math.floor(mins[2] / vs)];
      const hi = [Math.floor((maxs[0] - eps) / vs), Math.floor((maxs[1] - eps) / vs), Math.floor((maxs[2] - eps) / vs)];
      const u = (axis + 1) % 3;
      const v = (axis + 2) % 3;
      // Scan from the leading face inward so the first solid layer found is the nearest.
      const from = sign > 0 ? hi[axis] : lo[axis];
      const to = sign > 0 ? lo[axis] : hi[axis];
      for (let a = from; sign > 0 ? a >= to : a <= to; a -= sign) {
        let hit = false;
        for (let b = lo[u]; b <= hi[u] && !hit; b++) {
          for (let c = lo[v]; c <= hi[v]; c++) {
            pos[axis] = a;
            pos[u] = b;
            pos[v] = c;
            if (this.world.isSolidAt(pos[0], pos[1], pos[2])) {
              hit = true;
              break;
            }
          }
        }
        if (hit) {
          const extent = sign > 0 ? maxs[axis] - this.getAxis(axis) : this.getAxis(axis) - mins[axis];
          const face = sign > 0 ? a * vs - eps : (a + 1) * vs + eps;
          this.setAxis(axis, sign > 0 ? face - extent : face + extent);
          return true;
        }
      }
    }
    return false;
  }

  private getAxis(axis: number): number {
    return axis === 0 ? this.position.x : axis === 1 ? this.position.y : this.position.z;
  }

  private setAxis(axis: number, v: number): void {
    if (axis === 0) this.position.x = v;
    else if (axis === 1) this.position.y = v;
    else this.position.z = v;
  }
}
