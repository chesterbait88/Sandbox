import * as THREE from 'three';
import { PROJECTILE_MODELS, VIEW_MODEL, VOXEL_SIZE, WEAPONS, WEAPON_TUNING, type Weapon } from '@vw/config';
import type { RayHit, World } from '../world/World';
import type { Controller } from './Controller';
import type { Input } from './Input';
import type { Destruction } from '../destruction/damage';
import { events } from '../state/events';
import { buildModelMesh } from './ViewModel';
import type { ViewModel } from './ViewModel';

export interface WeaponState {
  def: Weapon;
  mag: number;
  reserve: number;
  reloading: number;
  cooldown: number;
}

interface Grenade {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  fuse: number;
  mesh: THREE.Object3D;
  spin: THREE.Vector3;
}

interface Rocket {
  pos: THREE.Vector3;
  dir: THREE.Vector3;
  travelled: number;
  mesh: THREE.Object3D;
}

interface Charge {
  pos: THREE.Vector3;
  mesh: THREE.Object3D;
}

const PM = PROJECTILE_MODELS;

/** Thrown and placed weapons keep their whole count in `mag`; guns start with a full magazine. */
function initialMag(w: Weapon, total = w.totalAmmo): number {
  if (!Number.isFinite(total)) return Infinity;
  if (w.kind === 'thrown' || w.kind === 'placed') return total;
  return Math.min(w.magSize, total);
}

function initialReserve(w: Weapon, total = w.totalAmmo): number {
  if (!Number.isFinite(total)) return Infinity;
  if (w.kind === 'thrown' || w.kind === 'placed') return 0;
  return Math.max(0, total - w.magSize);
}
/** Projectile models share the in-hand canvas (see config/weaponModels.ts). */
const PSIZE = VIEW_MODEL.size;

/**
 * The loadout: selection, ammo, reload, firing, and the objects that leave the hands.
 * Grenades and rockets fly on hand-rolled ballistics against the voxel grid so they hit walls;
 * Rapier is reserved for debris. Every hit resolves through Destruction.applyDamage.
 */
export class Weapons {
  slots: WeaponState[] = WEAPONS.map((w) => ({
    def: w,
    mag: initialMag(w),
    reserve: initialReserve(w),
    reloading: 0,
    cooldown: 0
  }));
  current = 2;
  aiming = false;
  readonly group = new THREE.Group();
  private grenades: Grenade[] = [];
  private rockets: Rocket[] = [];
  private charges: Charge[] = [];
  private now = 0;
  /** Input is ignored when false (menus, round over). */
  enabled = true;
  /** Custom loadout: total ammo per weapon id (null = the fixed kit). */
  loadout: Record<string, number> | null = null;
  /** Sticky grenades stick on first contact instead of bouncing. */
  sticky = false;
  private swingTimer = 0;
  private pendingSwing: WeaponState | null = null;
  private tmpV = new THREE.Vector3();

  constructor(
    private world: World,
    private player: Controller,
    private destruction: Destruction,
    private view: ViewModel
  ) {
    this.view.select(this.slots[this.current].def.id);
    this.emitAmmo();
  }

  setWorld(world: World): void {
    this.world = world;
    this.reset();
  }

  reset(): void {
    for (const s of this.slots) {
      const w = s.def;
      const total = this.loadout && Number.isFinite(w.totalAmmo) ? (this.loadout[w.id] ?? 0) : w.totalAmmo;
      s.mag = initialMag(w, total);
      s.reserve = initialReserve(w, total);
      s.reloading = 0;
      s.cooldown = 0;
    }
    for (const g of this.grenades) this.group.remove(g.mesh);
    for (const r of this.rockets) this.group.remove(r.mesh);
    for (const c of this.charges) this.group.remove(c.mesh);
    this.grenades = [];
    this.rockets = [];
    this.charges = [];
    this.select(2);
    this.emitAmmo();
  }

  get active(): WeaponState {
    return this.slots[this.current];
  }

  select(i: number): void {
    if (i < 0 || i >= this.slots.length || i === this.current) return;
    this.current = i;
    this.aiming = false;
    this.view.select(this.slots[i].def.id);
    events.emit('weaponSwitch', { weapon: this.slots[i].def.id, slot: i + 1 });
    this.emitAmmo();
  }

  /** Milestone rewards. */
  grant(id: string, n: number): void {
    const s = this.slots.find((x) => x.def.id === id);
    if (!s) return;
    if (s.def.kind === 'thrown' || s.def.kind === 'placed') s.mag += n;
    else s.reserve += n;
    this.emitAmmo();
  }

  private count(s: WeaponState): number {
    return s.def.kind === 'thrown' || s.def.kind === 'placed' ? s.mag : s.mag;
  }

  emitAmmo(): void {
    const s = this.active;
    const gren = this.slots.find((x) => x.def.id === 'grenade')!;
    const c4 = this.slots.find((x) => x.def.id === 'c4')!;
    events.emit('ammoChanged', {
      weapon: s.def.id,
      mag: this.count(s),
      reserve: s.reserve,
      reloading: s.reloading > 0 ? 1 - s.reloading / s.def.reloadTime : 0,
      grenades: gren.mag,
      c4: c4.mag,
      charges: this.charges.length
    });
  }

  update(dt: number, now: number, input: Input): void {
    this.now = now;
    for (const s of this.slots) {
      if (s.cooldown > 0) s.cooldown -= dt;
      if (s.reloading > 0) {
        s.reloading -= dt;
        if (s.reloading <= 0) {
          const need = s.def.magSize - s.mag;
          const take = Math.min(need, s.reserve);
          s.mag += take;
          s.reserve -= take;
          s.reloading = 0;
          this.emitAmmo();
        }
      }
    }
    if (this.swingTimer > 0) {
      this.swingTimer -= dt;
      if (this.swingTimer <= 0 && this.pendingSwing) {
        this.resolveMelee(this.pendingSwing);
        this.pendingSwing = null;
      }
    }

    if (this.enabled) {
      for (let i = 0; i < 8; i++) if (input.wasPressed(`Digit${i + 1}`)) this.select(i);
      if (input.wheel !== 0) this.select((this.current + Math.sign(input.wheel) + 8) % 8);
      if (input.wasPressed('KeyR')) this.reload(this.active);
      if (input.wasPressed('KeyG')) this.throwGrenade();
      const s = this.active;
      this.aiming = s.def.kind !== 'placed' && input.mouseDown[2];
      if (s.def.kind === 'placed' && input.mousePressed[2]) this.detonateCharges();
      const trigger = s.def.automatic ? input.mouseDown[0] : input.mousePressed[0];
      if (trigger) this.fire(s);
    }

    this.updateGrenades(dt);
    this.updateRockets(dt);
  }

  reload(s: WeaponState): void {
    if (s.reloading > 0 || !Number.isFinite(s.def.magSize) || s.def.kind === 'thrown' || s.def.kind === 'placed') return;
    if (s.mag >= s.def.magSize || s.reserve <= 0) return;
    s.reloading = s.def.reloadTime;
    this.emitAmmo();
  }

  fire(s: WeaponState): boolean {
    if (s.cooldown > 0 || s.reloading > 0) return false;
    const w = s.def;
    if (w.kind === 'melee') {
      s.cooldown = w.cooldown;
      this.view.startSwing();
      this.swingTimer = WEAPON_TUNING.meleeSwingTime * 0.5;
      this.pendingSwing = s;
      events.emit('weaponFire', { weapon: w.id, kind: w.kind });
      return true;
    }
    if (w.kind === 'placed') {
      if (s.mag <= 0) {
        if (this.charges.length) this.detonateCharges();
        return false;
      }
      const hit = this.world.raycast(this.player.eye(), this.player.forward(), w.range);
      if (!hit) {
        if (this.charges.length) this.detonateCharges();
        return false;
      }
      s.cooldown = w.cooldown;
      s.mag--;
      this.placeCharge(hit.point, hit.face);
      events.emit('weaponFire', { weapon: w.id, kind: w.kind });
      this.emitAmmo();
      return true;
    }
    if (w.kind === 'thrown') {
      if (s.mag <= 0) return false;
      s.cooldown = w.cooldown;
      s.mag--;
      this.spawnGrenade();
      this.view.kick(w.recoil, this.now, false);
      events.emit('weaponFire', { weapon: w.id, kind: w.kind });
      this.emitAmmo();
      return true;
    }
    if (s.mag <= 0) {
      this.reload(s);
      return false;
    }
    s.cooldown = w.cooldown;
    s.mag--;
    this.view.kick(w.recoil, this.now);
    this.player.pitch += w.recoil;
    if (w.kind === 'hitscan') {
      const pellets = w.pellets ?? 1;
      const spread = (w.spread ?? 0) * (this.aiming ? WEAPON_TUNING.adsSpreadMul : 1);
      const eye = this.player.eye();
      for (let i = 0; i < pellets; i++) {
        const dir = this.spreadDir(spread);
        const hit = this.world.raycast(eye, dir, w.range);
        if (hit) this.destruction.applyDamage(this.centreFor(hit), w.radius, w.power, w.id);
      }
    } else if (w.kind === 'projectile') {
      this.spawnRocket();
    }
    events.emit('weaponFire', { weapon: w.id, kind: w.kind });
    if (s.mag <= 0 && s.reserve > 0) this.reload(s);
    this.emitAmmo();
    return true;
  }

  private spreadDir(spread: number): THREE.Vector3 {
    const f = this.player.forward();
    if (spread <= 0) return f;
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(f, up).normalize();
    const u = new THREE.Vector3().crossVectors(right, f).normalize();
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * spread;
    return f.clone().addScaledVector(right, Math.cos(a) * r).addScaledVector(u, Math.sin(a) * r).normalize();
  }

  private resolveMelee(s: WeaponState): void {
    const w = s.def;
    const hit = this.world.raycast(this.player.eye(), this.player.forward(), w.range);
    if (!hit) {
      events.emit('hit', { center: this.player.eye(), radius: 0, power: 0, destroyed: [], source: w.id, glass: 0 });
      return;
    }
    this.destruction.applyDamage(this.centreFor(hit), w.radius, w.power, w.id);
  }

  /** Damage centre for a ray hit: the hit voxel's centre (or the surface point if snapping is off). */
  private centreFor(hit: RayHit): { x: number; y: number; z: number } {
    if (WEAPON_TUNING.snapToVoxelCentre) return { x: (hit.x + 0.5) * VOXEL_SIZE, y: (hit.y + 0.5) * VOXEL_SIZE, z: (hit.z + 0.5) * VOXEL_SIZE };
    return hit.point;
  }

  /** G: throw from any weapon. */
  throwGrenade(): void {
    const s = this.slots.find((x) => x.def.id === 'grenade')!;
    if (s.mag <= 0 || s.cooldown > 0) return;
    s.cooldown = s.def.cooldown;
    s.mag--;
    this.spawnGrenade();
    events.emit('weaponFire', { weapon: 'grenade', kind: 'thrown' });
    this.emitAmmo();
  }

  private spawnGrenade(): void {
    const w = this.slots.find((x) => x.def.id === 'grenade')!.def;
    const eye = this.player.eye();
    const dir = this.player.forward();
    dir.y += WEAPON_TUNING.grenadeArc;
    dir.normalize();
    const mesh = buildModelMesh(PM.grenade, PSIZE, WEAPON_TUNING.projectileVoxelM);
    this.group.add(mesh);
    const vel = dir.clone().multiplyScalar(w.projectileSpeed ?? 16).add(this.player.velocity);
    this.grenades.push({ pos: eye.clone().addScaledVector(dir, 0.4), vel, fuse: w.fuse ?? 3, mesh, spin: new THREE.Vector3(Math.random() * 6, Math.random() * 6, 0) });
  }

  private spawnRocket(): void {
    const eye = this.player.eye();
    const dir = this.player.forward();
    const mesh = buildModelMesh(PM.rocket, PSIZE, WEAPON_TUNING.projectileVoxelM);
    mesh.lookAt(dir);
    this.group.add(mesh);
    this.rockets.push({ pos: eye.clone().addScaledVector(dir, 0.6).add(new THREE.Vector3(0, -0.15, 0)), dir, travelled: 0, mesh });
  }

  private placeCharge(point: { x: number; y: number; z: number }, face: { x: number; y: number; z: number }): void {
    const mesh = buildModelMesh(PM.c4, PSIZE, WEAPON_TUNING.projectileVoxelM);
    const pos = new THREE.Vector3(point.x + face.x * 0.12, point.y + face.y * 0.12, point.z + face.z * 0.12);
    mesh.position.copy(pos);
    mesh.lookAt(pos.clone().add(new THREE.Vector3(face.x, face.y, face.z)));
    mesh.rotateX(Math.PI / 2);
    this.group.add(mesh);
    this.charges.push({ pos, mesh });
    events.emit('placedCharge', { count: this.charges.length });
  }

  detonateCharges(): void {
    if (!this.charges.length) return;
    const w = this.slots.find((x) => x.def.id === 'c4')!.def;
    const list = this.charges;
    this.charges = [];
    for (const c of list) {
      this.group.remove(c.mesh);
      this.destruction.applyDamage(c.pos, w.radius, w.power, 'c4');
    }
    events.emit('placedCharge', { count: 0 });
    this.emitAmmo();
  }

  get chargeCount(): number {
    return this.charges.length;
  }

  private updateGrenades(dt: number): void {
    const w = this.slots.find((x) => x.def.id === 'grenade')!.def;
    const r = WEAPON_TUNING.grenadeRadiusM;
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.fuse -= dt;
      const stuck = this.sticky && g.vel.lengthSq() === 0 && g.spin.lengthSq() === 0;
      if (!stuck) g.vel.y -= WEAPON_TUNING.gravity * dt;
      const step = this.tmpV.copy(g.vel).multiplyScalar(dt);
      const len = step.length();
      if (len > 1e-5) {
        const dir = step.clone().divideScalar(len);
        const hit = this.world.raycast(g.pos, dir, len + r);
        if (hit) {
          g.pos.addScaledVector(dir, Math.max(0, hit.dist - r));
          if (this.sticky) {
            // Sticky: stop dead on the first surface.
            g.vel.set(0, 0, 0);
            g.spin.set(0, 0, 0);
          } else {
            const n = new THREE.Vector3(hit.face.x, hit.face.y, hit.face.z);
            const vn = g.vel.dot(n);
            // Reflect the normal component and damp the tangential one.
            g.vel.addScaledVector(n, -(1 + WEAPON_TUNING.grenadeRestitution) * vn);
            const tangential = g.vel.clone().addScaledVector(n, -g.vel.dot(n));
            g.vel.addScaledVector(tangential, -WEAPON_TUNING.grenadeFriction * 0.5);
            if (g.vel.length() < WEAPON_TUNING.grenadeRestSpeed) g.vel.set(0, 0, 0);
          }
        } else {
          g.pos.add(step);
        }
      }
      g.mesh.position.copy(g.pos);
      g.mesh.rotation.x += g.spin.x * dt;
      g.mesh.rotation.y += g.spin.y * dt;
      if (g.fuse <= 0 || g.pos.y < -5) {
        this.group.remove(g.mesh);
        this.grenades.splice(i, 1);
        if (g.pos.y >= -5) this.destruction.applyDamage({ x: g.pos.x, y: g.pos.y, z: g.pos.z }, w.radius, w.power, 'grenade');
      }
    }
  }

  private updateRockets(dt: number): void {
    const w = this.slots.find((x) => x.def.id === 'rocket')!.def;
    const speed = w.projectileSpeed ?? 40;
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rk = this.rockets[i];
      const len = speed * dt;
      const hit = this.world.raycast(rk.pos, rk.dir, len);
      if (hit) {
        const b = WEAPON_TUNING.rocketBiteM;
        this.group.remove(rk.mesh);
        this.rockets.splice(i, 1);
        this.destruction.applyDamage({ x: hit.point.x + rk.dir.x * b, y: hit.point.y + rk.dir.y * b, z: hit.point.z + rk.dir.z * b }, w.radius, w.power, 'rocket');
        continue;
      }
      rk.pos.addScaledVector(rk.dir, len);
      rk.travelled += len;
      rk.mesh.position.copy(rk.pos);
      if (rk.travelled > WEAPON_TUNING.rocketMaxRange || rk.pos.y < -5 || rk.pos.y > 200) {
        this.group.remove(rk.mesh);
        this.rockets.splice(i, 1);
        if (rk.pos.y >= -5 && rk.pos.y <= 200) this.destruction.applyDamage({ x: rk.pos.x, y: rk.pos.y, z: rk.pos.z }, w.radius, w.power, 'rocket');
      }
    }
  }
}
