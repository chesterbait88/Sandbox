import * as THREE from 'three';
import { RENDER, VIEW_MODEL, WEAPON_TUNING, type ModelBox, type Weapon } from '@vw/config';
import { meshVoxels } from '../world/mesher';
import { buildGeometry, createOpaqueMaterial, createTransparentMaterial } from '../world/VoxelMaterial';

/** Fill a padded voxel array from inclusive boxes. */
export function voxelsFromBoxes(boxes: ModelBox[], size: { x: number; y: number; z: number }): { vox: Uint8Array; P: number } {
  const P = Math.max(size.x, size.y, size.z) + 2;
  const vox = new Uint8Array(P ** 3);
  const idx = (x: number, y: number, z: number) => x + 1 + P * (z + 1 + P * (y + 1));
  for (const [x0, y0, z0, x1, y1, z1, m] of boxes) {
    for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) if (x < size.x && y < size.y && z < size.z) vox[idx(x, y, z)] = m;
  }
  return { vox, P };
}

const modelMats = { opaque: createOpaqueMaterial(VIEW_MODEL.voxelM, RENDER.viewModelStyle), transparent: createTransparentMaterial(VIEW_MODEL.voxelM, RENDER.viewModelStyle) };

/** Mesh a small voxel model on the main thread (tiny arrays, not chunks). Centred on its bounds. */
export function buildModelMesh(boxes: ModelBox[], size: { x: number; y: number; z: number }, voxelM: number): THREE.Group {
  const { vox, P } = voxelsFromBoxes(boxes, size);
  const r = meshVoxels(vox, { size: P, ox: 0, oy: 0, oz: 0, voxelSize: voxelM });
  const g = new THREE.Group();
  if (r.opaque.index.length) g.add(new THREE.Mesh(buildGeometry(r.opaque), modelMats.opaque));
  if (r.transparent.index.length) g.add(new THREE.Mesh(buildGeometry(r.transparent), modelMats.transparent));
  // Centre on the model's own extent.
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const [x0, y0, z0, x1, y1, z1] of boxes) {
    minX = Math.min(minX, x0); minY = Math.min(minY, y0); minZ = Math.min(minZ, z0);
    maxX = Math.max(maxX, x1 + 1); maxY = Math.max(maxY, y1 + 1); maxZ = Math.max(maxZ, z1 + 1);
  }
  for (const c of g.children) c.position.set(-(minX + maxX) / 2 * voxelM, -(minY + maxY) / 2 * voxelM, -(minZ + maxZ) / 2 * voxelM);
  g.userData.extent = { x: (maxX - minX) * voxelM, y: (maxY - minY) * voxelM, z: (maxZ - minZ) * voxelM };
  return g;
}

/** The weapon in the player's hands: meshed once per weapon, attached to the overlay camera. */
export class ViewModel {
  readonly root = new THREE.Group();
  private models = new Map<string, THREE.Group>();
  private current: THREE.Group | null = null;
  private recoil = 0;
  private swing = 0;
  private bobT = 0;
  private flash: THREE.Mesh;
  private flashUntil = 0;
  private hands: THREE.Group;

  constructor(weapons: Weapon[]) {
    for (const w of weapons) {
      const g = buildModelMesh(w.model, VIEW_MODEL.size, VIEW_MODEL.voxelM);
      g.visible = false;
      this.models.set(w.id, g);
      this.root.add(g);
    }
    const hm = VIEW_MODEL.handMat;
    this.hands = buildModelMesh([[0, 0, 0, 2, 2, 3, hm], [9, 0, 0, 11, 2, 3, hm]], { x: 12, y: 3, z: 4 }, VIEW_MODEL.voxelM);
    this.hands.position.set(0, -0.22, 0.45);
    this.root.add(this.hands);
    this.flash = new THREE.Mesh(
      new THREE.PlaneGeometry(0.25, 0.25),
      new THREE.MeshBasicMaterial({ color: '#ffd080', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    this.flash.visible = false;
    this.root.add(this.flash);
    this.root.position.set(VIEW_MODEL.offset.x, VIEW_MODEL.offset.y, VIEW_MODEL.offset.z);
  }

  select(id: string): void {
    if (this.current) this.current.visible = false;
    this.current = this.models.get(id) ?? null;
    if (this.current) this.current.visible = true;
    this.swing = 0;
    this.recoil = 0.3;
  }

  kick(amount: number, now: number, muzzle = true): void {
    this.recoil = Math.min(1, this.recoil + amount * 8);
    if (muzzle) {
      this.flashUntil = now + VIEW_MODEL.muzzleFlashMs;
      this.flash.visible = true;
      const ext = this.current?.userData.extent as { z: number } | undefined;
      this.flash.position.set(0, 0.05, -(ext?.z ?? 1.2) / 2 - 0.1);
      this.flash.rotation.z = Math.random() * Math.PI;
      this.flash.scale.setScalar(0.8 + Math.random() * 0.6);
    }
  }

  startSwing(): void {
    this.swing = 1;
  }

  update(dt: number, now: number, moving: boolean, speed: number): void {
    this.recoil = Math.max(0, this.recoil - this.recoil * VIEW_MODEL.recoilRecovery * dt);
    this.swing = Math.max(0, this.swing - dt / WEAPON_TUNING.meleeSwingTime);
    this.bobT += dt * VIEW_MODEL.bobFrequency * (moving ? Math.max(0.6, speed / 6) : 0);
    const bob = moving ? VIEW_MODEL.bobAmplitude : 0;
    const bx = Math.sin(this.bobT) * bob;
    const by = Math.abs(Math.cos(this.bobT)) * bob;
    this.root.position.set(VIEW_MODEL.offset.x + bx, VIEW_MODEL.offset.y + by, VIEW_MODEL.offset.z + this.recoil * 0.12);
    this.root.rotation.set(-this.recoil * 0.25, 0, 0);
    if (this.swing > 0) {
      const s = Math.sin(this.swing * Math.PI);
      this.root.rotation.x -= s * 0.9;
      this.root.rotation.y -= s * 0.5;
      this.root.position.x -= s * 0.15;
    }
    if (this.flash.visible && now > this.flashUntil) this.flash.visible = false;
  }
}
