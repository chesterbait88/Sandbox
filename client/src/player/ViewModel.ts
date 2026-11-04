import * as THREE from 'three';
import { RENDER, VIEW_MODEL, WEAPON_TUNING, type ModelBox, type Weapon } from '@vw/config';
import { meshVoxels } from '../world/mesher';
import { buildGeometry, createOpaqueMaterial, createTransparentMaterial } from '../world/VoxelMaterial';

/** Inclusive voxel bounds of a box list, clamped to the canvas. */
function boundsOf(boxes: ModelBox[], size: { x: number; y: number; z: number }) {
  let minX = Infinity, minY = Infinity, minZ = Infinity, maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (const [x0, y0, z0, x1, y1, z1] of boxes) {
    minX = Math.min(minX, Math.max(0, x0)); minY = Math.min(minY, Math.max(0, y0)); minZ = Math.min(minZ, Math.max(0, z0));
    maxX = Math.max(maxX, Math.min(size.x - 1, x1)); maxY = Math.max(maxY, Math.min(size.y - 1, y1)); maxZ = Math.max(maxZ, Math.min(size.z - 1, z1));
  }
  return { minX, minY, minZ, maxX, maxY, maxZ };
}

/**
 * Fill a padded voxel array from inclusive boxes. The cube is sized to the boxes' own extent
 * (not the canvas) so small models mesh fast; `origin` is the canvas voxel at the cube's (0,0,0).
 */
export function voxelsFromBoxes(boxes: ModelBox[], size: { x: number; y: number; z: number }): { vox: Uint8Array; P: number; origin: { x: number; y: number; z: number } } {
  const b = boundsOf(boxes, size);
  const origin = { x: b.minX, y: b.minY, z: b.minZ };
  const P = Math.max(b.maxX - b.minX, b.maxY - b.minY, b.maxZ - b.minZ) + 3;
  const vox = new Uint8Array(P ** 3);
  const idx = (x: number, y: number, z: number) => x + 1 + P * (z + 1 + P * (y + 1));
  for (const [x0, y0, z0, x1, y1, z1, m] of boxes) {
    for (let y = Math.max(0, y0); y <= Math.min(size.y - 1, y1); y++)
      for (let z = Math.max(0, z0); z <= Math.min(size.z - 1, z1); z++)
        for (let x = Math.max(0, x0); x <= Math.min(size.x - 1, x1); x++) vox[idx(x - origin.x, y - origin.y, z - origin.z)] = m;
  }
  return { vox, P, origin };
}

/** Meshed buffers per box list and voxel size: the loadout screen reuses the in-hand meshing. */
const meshCache = new WeakMap<ModelBox[], Map<number, ReturnType<typeof meshVoxels>>>();

const modelMats = { opaque: createOpaqueMaterial(VIEW_MODEL.voxelM, RENDER.viewModelStyle), transparent: createTransparentMaterial(VIEW_MODEL.voxelM, RENDER.viewModelStyle) };

/** Mesh a small voxel model on the main thread (tiny arrays, not chunks). Centred on its bounds. */
export function buildModelMesh(boxes: ModelBox[], size: { x: number; y: number; z: number }, voxelM: number): THREE.Group {
  let byVoxel = meshCache.get(boxes);
  if (!byVoxel) meshCache.set(boxes, (byVoxel = new Map()));
  let r = byVoxel.get(voxelM);
  if (!r) {
    const { vox, P, origin } = voxelsFromBoxes(boxes, size);
    r = meshVoxels(vox, { size: P, ox: origin.x, oy: origin.y, oz: origin.z, voxelSize: voxelM });
    byVoxel.set(voxelM, r);
  }
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
  /** Milliseconds spent meshing the models at construction (debug). */
  readonly buildMs: number;

  constructor(weapons: Weapon[]) {
    const t0 = performance.now();
    for (const w of weapons) {
      // The hands are part of every model (config/weaponModels.ts), so nothing floats.
      const g = buildModelMesh(w.model, VIEW_MODEL.size, VIEW_MODEL.voxelM);
      g.visible = false;
      const [px, py, pz] = w.pose ?? [0, 0, 0];
      g.rotation.set(px, py, pz);
      this.models.set(w.id, g);
      this.root.add(g);
    }
    this.buildMs = performance.now() - t0;
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
      const ext = this.current?.userData.extent as { y: number; z: number } | undefined;
      // Barrels sit in the upper third of the canvas; the muzzle is the model's low-z end.
      this.flash.position.set(0, (ext?.y ?? 0.4) * 0.15, -(ext?.z ?? 0.8) / 2 - 0.06);
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
    const [pp, py, pr] = VIEW_MODEL.pose;
    this.root.rotation.set(pp - this.recoil * 0.25, py, pr);
    if (this.swing > 0) {
      const s = Math.sin(this.swing * Math.PI);
      this.root.rotation.x -= s * 0.9;
      this.root.rotation.y -= s * 0.5;
      this.root.position.x -= s * 0.15;
    }
    if (this.flash.visible && now > this.flashUntil) this.flash.visible = false;
  }
}
