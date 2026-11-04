import * as THREE from 'three';
import { MAT, MATERIALS, PLAYER, RENDER, WEAPONS, WEAPON_TUNING, type ThemeId } from '@vw/config';
import { GameRenderer } from '../render/Renderer';
import { ChunkRenderer } from '../world/ChunkRenderer';
import { World } from '../world/World';
import { generateWorld } from '../world/WorldGen';
import { Controller } from '../player/Controller';
import { Input } from '../player/Input';
import { Destruction } from '../destruction/damage';
import { Debris } from '../destruction/Debris';
import { Effects } from '../destruction/effects';
import { PhysicsWorld } from '../physics/PhysicsWorld';
import { Weapons } from '../player/Weapons';
import { ViewModel } from '../player/ViewModel';
import { Synth } from '../audio/Synth';
import { events } from '../state/events';
import { DebugOverlay } from '../debug/DebugOverlay';
import { Score } from '../scoring/Score';

/** Owns every runtime system and the frame loop. The state machine (phase 4) drives it. */
export class Game {
  readonly gfx: GameRenderer;
  readonly input: Input;
  readonly debug: DebugOverlay;
  world = new World();
  readonly chunks: ChunkRenderer;
  readonly player: Controller;
  readonly destruction: Destruction;
  readonly physics = new PhysicsWorld();
  debris!: Debris;
  readonly effects = new Effects();
  readonly view: ViewModel;
  readonly weapons: Weapons;
  readonly audio = new Synth();
  readonly score = new Score();
  theme: ThemeId = 'desert';
  seed = 'ALPHA';
  /** Global time scale (slow-mo). */
  timeScale = 1;
  /** Game time in ms, scaled. */
  time = 0;
  private last = performance.now();
  private ready = false;
  private frameHooks: ((dt: number, now: number) => void)[] = [];
  /** Longest main-thread frame since last reset (ms). */
  worstFrame = 0;

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.gfx = new GameRenderer(canvas);
    this.input = new Input(canvas);
    this.debug = new DebugOverlay(uiRoot);
    this.chunks = new ChunkRenderer(this.world);
    this.gfx.scene.add(this.chunks.group, this.effects.group);
    this.player = new Controller(this.world, this.gfx.camera);
    this.destruction = new Destruction(this.world);
    this.view = new ViewModel(WEAPONS);
    this.gfx.overlayScene.add(this.view.root);
    this.weapons = new Weapons(this.world, this.player, this.destruction, this.view);
    this.gfx.scene.add(this.weapons.group);
    this.subscribe();
  }

  async init(): Promise<void> {
    await this.physics.create(PLAYER.gravity);
    this.debris = new Debris(this.physics);
    this.gfx.scene.add(this.debris.mesh);
    this.ready = true;
  }

  /** True while the warm-up carve runs: handlers skip visuals and audio. */
  private warming = false;

  /**
   * First calls into the carve, Rapier and the effects are 10× slower than warm ones (JIT, first
   * body, first sprite). Run them once on a scratch world so the first real blast stays under budget.
   */
  warmup(): void {
    const scratch = new World();
    for (let x = 100; x < 140; x++) for (let y = 10; y < 40; y++) for (let z = 100; z < 140; z++) scratch.mat[x + 256 * (z + 256 * y)] = MAT.BRICK;
    const d = new Destruction(scratch);
    this.warming = true;
    this.audio.prime();
    for (let k = 0; k < 4; k++) d.applyDamage({ x: 55 + k * 3, y: 12, z: 60 }, 4, 90, 'warmup');
    // Step the physics with live bodies so the first real blast does not pay the first-contact cost.
    for (let k = 0; k < 6; k++) {
      this.physics.world.step();
      this.debris?.update(this.time);
    }
    this.warming = false;
    this.debris?.clear();
  }

  private subscribe(): void {
    events.on('hit', (h) => {
      if (this.warming) {
        this.debris?.spawn(h.destroyed, h.center, h.power);
        return;
      }
      if (h.destroyed.length) this.score.onDestroyed(h.destroyed);
      if (h.destroyed.length === 0 && h.power === 0) {
        this.audio.swing(false);
        return;
      }
      const eye = this.player.eye();
      const dist = Math.hypot(h.center.x - eye.x, h.center.y - eye.y, h.center.z - eye.z);
      if (h.destroyed.length) this.debris?.spawn(h.destroyed, h.center, h.power);
      const glassOnly = h.glass > 0 && h.glass === h.destroyed.length;
      if (h.power >= 20) {
        this.effects.blast(h.center, h.power, eye);
        this.audio.boom(h.power, dist);
      } else if (h.destroyed.length) {
        this.effects.blast(h.center, Math.max(4, h.power * 0.4), eye, glassOnly);
      }
      if (h.glass > 0) this.audio.tink(dist);
      if ((h.source === 'pickaxe' || h.source === 'bat') && h.power > 0) this.audio.swing(h.destroyed.length > 0);
    });
    events.on('detonation', (d) => {
      const eye = this.player.eye();
      this.effects.blast(d.center, d.power * 1.3, eye);
      this.score.onDetonation();
    });
    events.on('milestone', (m) => {
      this.audio.stinger();
      if (m.reward === 'grenade') this.weapons.grant('grenade', WEAPON_TUNING.rewardGrenade);
      else if (m.reward === 'rocket') this.weapons.grant('rocket', WEAPON_TUNING.rewardRocket);
      else if (m.reward === 'c4') this.weapons.grant('c4', WEAPON_TUNING.rewardC4);
      // 'time' is applied by the round clock (phase 4).
    });
    events.on('weaponFire', (f) => {
      if (f.weapon === 'pistol' || f.weapon === 'shotgun' || f.weapon === 'rifle' || f.weapon === 'rocket') this.audio.shot(f.weapon);
      else if (f.kind === 'thrown' || f.kind === 'placed') this.audio.click(0.6);
    });
    events.on('weaponSwitch', () => this.audio.click(1.2));
  }

  /** Generate and install a new arena. Resolves when every chunk is meshed. */
  async loadWorld(theme: ThemeId, seed: string, terrainOnly = false): Promise<void> {
    this.theme = theme;
    this.seed = seed;
    this.gfx.setTheme(theme);
    const { world, height } = await generateWorld(theme, seed, terrainOnly);
    this.world = world;
    this.chunks.setWorld(world);
    this.player.setWorld(world);
    this.destruction.setWorld(world);
    this.weapons.setWorld(world);
    this.score.reset(world.structures);
    this.physics.setTerrain(height);
    this.debris?.clear();
    this.player.spawn(world.spawn, world.spawnYaw);
    this.chunks.perFrame = RENDER.remeshBurst;
    this.warmup();
    await this.whenMeshed();
    this.chunks.perFrame = RENDER.remeshPerFrame;
  }

  whenMeshed(): Promise<void> {
    return new Promise((resolve) => {
      const check = () => (this.chunks.idle && this.chunks.stats.meshed > 0 ? resolve() : requestAnimationFrame(check));
      requestAnimationFrame(check);
    });
  }

  onFrame(fn: (dt: number, now: number) => void): void {
    this.frameHooks.push(fn);
  }

  start(): void {
    this.last = performance.now();
    this.gfx.renderer.setAnimationLoop(() => this.frame());
  }

  private frame(): void {
    const t0 = performance.now();
    const rawDt = Math.min((t0 - this.last) / 1000, 0.05);
    this.last = t0;
    const dt = rawDt * this.timeScale;
    this.time += dt * 1000;
    const now = this.time;

    if (this.ready) {
      this.player.look(this.input);
      this.player.update(dt, this.input);
      this.weapons.update(dt, now, this.input);
      this.destruction.update(now);
      this.score.update(dt);
      this.physics.update(dt);
      this.debris.update(now);
      this.effects.update(dt, now);
      for (const h of this.frameHooks) h(dt, now);
      const hv = Math.hypot(this.player.velocity.x, this.player.velocity.z);
      this.view.update(dt, now, hv > 0.5 && this.player.onGround, hv);
      this.effects.applyShake(this.gfx.camera);
    }
    this.chunks.update(this.gfx.camera.position);
    this.gfx.render();

    const frameMs = performance.now() - t0;
    if (frameMs > this.worstFrame) this.worstFrame = frameMs;
    this.debug.frame(rawDt * 1000);
    this.debug.set(
      `pos ${this.player.position.x.toFixed(1)} ${this.player.position.y.toFixed(1)} ${this.player.position.z.toFixed(1)} · ${this.weapons.active.def.name}\n` +
        `chunks meshed ${this.chunks.stats.meshed} · dirty ${this.chunks.stats.dirty} · inflight ${this.chunks.stats.inFlight} · avg ${this.chunks.stats.avgMs.toFixed(2)} ms\n` +
        `debris ${this.debris?.count ?? 0} · pending chains ${this.destruction.pendingCount} · worst frame ${this.worstFrame.toFixed(1)} ms\n` +
        `score ${this.score.score} ×${this.score.multiplier} · structures ${this.world.structures.length} · arena ${this.score.arenaTotal} pts · ${(this.score.arenaPercent * 100).toFixed(1)}% wrecked`
    );
    this.input.endFrame();
  }

  /** Debug: stamp a brick wall with a fuel tank behind it in front of the spawn. */
  stampTestWall(): void {
    const w = this.world;
    const sx = Math.round(w.spawn.x * 2);
    const sz = Math.round(w.spawn.z * 2) + 16;
    const base = w.surfaceY(sx, sz) + 1;
    for (let x = sx - 8; x <= sx + 8; x++) for (let y = base; y < base + 8; y++) for (let z = sz; z < sz + 2; z++) w.setVoxel(x, y, z, MAT.BRICK, 1);
    for (let x = sx - 2; x <= sx + 1; x++) for (let y = base; y < base + 2; y++) for (let z = sz + 2; z < sz + 6; z++) w.setVoxel(x, y, z, MAT.FUEL, 1);
    for (let x = sx + 5; x <= sx + 6; x++) for (let y = base; y < base + 3; y++) for (let z = sz + 4; z < sz + 6; z++) w.setVoxel(x, y, z, MAT.PROPANE, 1);
    for (let x = sx - 8; x <= sx + 8; x++) for (let y = base; y < base + 6; y++) w.setVoxel(x, y, sz + 10, MAT.GLASS, 1);
    for (let x = sx - 8; x <= sx + 8; x++) for (let y = base; y < base + 6; y++) w.setVoxel(x, y, sz + 12, MAT.CONCRETE, 1);
    void MATERIALS;
  }
}
