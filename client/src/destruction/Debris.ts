import * as THREE from 'three';
import type RAPIER from '@dimforge/rapier3d-compat';
import { DEBRIS, MATERIALS, VOXEL_SIZE } from '@vw/config';
import type { Vec3 } from '../util/vec';
import type { Destroyed } from '../state/events';
import type { PhysicsWorld } from '../physics/PhysicsWorld';
import { voxelColor } from '../world/mesher';
import { createOpaqueMaterial } from '../world/VoxelMaterial';

interface Piece {
  body: RAPIER.RigidBody;
  born: number;
  size: number;
  slot: number;
}

/**
 * Debris cubes: Rapier dynamic cuboids rendered through one InstancedMesh with per-instance colour.
 * Global cap; the oldest die first.
 */
export class Debris {
  readonly mesh: THREE.InstancedMesh;
  private pieces: Piece[] = [];
  private freeSlots: number[] = [];
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();
  private now = 0;

  constructor(private physics: PhysicsWorld) {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    // Flat normals; emit attribute required by the voxel material.
    const n = geo.attributes.position.count;
    geo.setAttribute('emit', new THREE.BufferAttribute(new Uint8Array(n), 1, true));
    geo.setAttribute('terr', new THREE.BufferAttribute(new Uint8Array(n), 1, true));
    // Vertex colour is white; the per-instance colour carries the material tint.
    geo.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(n * 3).fill(255), 3, true));
    const mat = createOpaqueMaterial();
    this.mesh = new THREE.InstancedMesh(geo, mat, DEBRIS.cap);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;
    this.mesh.castShadow = true;
    this.mesh.frustumCulled = false;
    for (let i = DEBRIS.cap - 1; i >= 0; i--) this.freeSlots.push(i);
    // Initialise instance colours so the attribute exists.
    for (let i = 0; i < DEBRIS.cap; i++) this.mesh.setColorAt(i, this.color.setRGB(1, 1, 1));
  }

  get count(): number {
    return this.pieces.length;
  }

  spawn(list: Destroyed[], center: Vec3, power: number): void {
    if (list.length === 0) return;
    const R = this.physics.R;
    // Bias toward the crater surface: voxels farthest from the centre first, random sample.
    const n = Math.min(DEBRIS.perBlast, list.length);
    const picks: Destroyed[] = [];
    if (list.length <= n) picks.push(...list);
    else {
      const stride = list.length / n;
      for (let i = 0; i < n; i++) picks.push(list[Math.min(list.length - 1, Math.floor(i * stride + Math.random() * stride))]);
    }
    for (const v of picks) {
      const glass = MATERIALS[v.mat]?.shatters;
      const count = glass ? DEBRIS.glassCountMul : 1;
      const size = DEBRIS.sizeM * (glass ? DEBRIS.glassSizeMul : 1);
      for (let k = 0; k < count; k++) {
        const slot = this.allocSlot();
        const px = (v.x + 0.5) * VOXEL_SIZE + (k ? (Math.random() - 0.5) * 0.3 : 0);
        const py = (v.y + 0.5) * VOXEL_SIZE + (k ? (Math.random() - 0.5) * 0.3 : 0);
        const pz = (v.z + 0.5) * VOXEL_SIZE + (k ? (Math.random() - 0.5) * 0.3 : 0);
        const body = this.physics.world.createRigidBody(
          R.RigidBodyDesc.dynamic().setTranslation(px, py, pz).setCcdEnabled(DEBRIS.ccd).setAngularDamping(0.5).setLinearDamping(0.05)
        );
        const shape = DEBRIS.collider === 'ball' ? R.ColliderDesc.ball(size * 0.45) : R.ColliderDesc.cuboid(size / 2, size / 2, size / 2);
        this.physics.world.createCollider(shape.setRestitution(0.25).setFriction(0.8).setDensity(1.5), body);
        let dx = px - center.x;
        let dy = py - center.y;
        let dz = pz - center.z;
        const len = Math.hypot(dx, dy, dz) || 1;
        dx /= len;
        dy = dy / len + 0.6;
        dz /= len;
        const jitter = 1 + (Math.random() * 2 - 1) * DEBRIS.impulseJitter;
        const s = power * DEBRIS.impulseScale * jitter;
        body.setLinvel({ x: dx * s, y: dy * s, z: dz * s }, true);
        body.setAngvel({ x: (Math.random() - 0.5) * DEBRIS.spinMax, y: (Math.random() - 0.5) * DEBRIS.spinMax, z: (Math.random() - 0.5) * DEBRIS.spinMax }, true);
        const c = voxelColor(v.mat, v.x, v.y, v.z);
        this.mesh.setColorAt(slot, this.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255));
        this.pieces.push({ body, born: this.now, size, slot });
      }
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  private allocSlot(): number {
    if (this.freeSlots.length === 0) this.kill(0);
    return this.freeSlots.pop()!;
  }

  private kill(i: number): void {
    const p = this.pieces[i];
    this.physics.world.removeRigidBody(p.body);
    this.freeSlots.push(p.slot);
    this.pieces.splice(i, 1);
  }

  update(now: number): void {
    this.now = now;
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      if (now - this.pieces[i].born > DEBRIS.lifetimeS * 1000) this.kill(i);
    }
    // Pack instances contiguously.
    let n = 0;
    for (const p of this.pieces) {
      const age = (now - p.born) / 1000;
      const shrink = Math.min(1, Math.max(0, (DEBRIS.lifetimeS - age) / DEBRIS.shrinkS));
      const t = p.body.translation();
      const r = p.body.rotation();
      this.dummy.position.set(t.x, t.y, t.z);
      this.dummy.quaternion.set(r.x, r.y, r.z, r.w);
      this.dummy.scale.setScalar(p.size * shrink);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(n, this.dummy.matrix);
      if (this.mesh.instanceColor) {
        // Copy colour from its slot into the packed index.
        const ic = this.mesh.instanceColor;
        ic.setXYZ(n, ic.getX(p.slot), ic.getY(p.slot), ic.getZ(p.slot));
      }
      n++;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  clear(): void {
    while (this.pieces.length) this.kill(0);
    this.mesh.count = 0;
  }
}
