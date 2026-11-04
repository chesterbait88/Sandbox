import * as THREE from 'three';
import { COLLAPSE, MAT, MATERIALS, PHYSICS, PLAYER, RENDER, VOXEL_SIZE, WEAPONS, WEAPON_TUNING, WORLD_SIZE_M, WORLD_VOXELS, type ThemeId } from '@vw/config';
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
import { Collapse } from '../destruction/Collapse';
import { CHUNK_SIZE } from '@vw/config';
import { voxelIndex } from '../world/World';

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
  collapse!: Collapse;
  theme: ThemeId = 'desert';
  seed = 'ALPHA';
  /** Exposed for the gallery and probe scripts, so they never hardcode the scale. */
  readonly voxelSize = VOXEL_SIZE;
  readonly worldSize = WORLD_SIZE_M;
  /** Global time scale (slow-mo). */
  timeScale = 1;
  /** Game time in ms, scaled. */
  time = 0;
  private last = performance.now();
  private ready = false;
  private frameHooks: ((dt: number, now: number) => void)[] = [];
  /** Decides each frame whether the player controller runs and drives menu cameras. */
  flow: { update(rawDt: number): boolean; updateFreeze(rawDt: number): void } | null = null;
  /** Rendering hook after the main pass (loadout model viewports). */
  afterRender: ((dt: number) => void) | null = null;
  /** UI hook with unscaled dt and scaled time. */
  uiUpdate: ((dt: number, now: number) => void) | null = null;
  /** Longest main-thread frame since last reset (ms). */
  worstFrame = 0;
  /** Current FOV multiplier (aim zoom). */
  private zoom = 1;
  /** Terrain columns (x + SX*z) whose surface changed since the heightfield was last rebuilt. */
  private dirtyColumns = new Set<number>();
  private height: Int16Array | null = null;
  private heightfieldT = 0;

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
    this.collapse = new Collapse(this.world, this.physics, this.score, this.chunks);
    this.gfx.scene.add(this.collapse.group);
    // Mirror walls into Rapier for chunks that hold structure voxels.
    this.chunks.onMeshed = (c, opaque) => {
      const hasStructure = this.chunkHasStructure(c.cx, c.cy, c.cz);
      this.physics.queueChunkCollider(c.index, hasStructure && opaque.index.length ? { vertices: opaque.position, indices: opaque.index } : null);
    };
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
    const cx = WORLD_VOXELS.x >> 1;
    const cz = WORLD_VOXELS.z >> 1;
    const r = Math.round(10 / VOXEL_SIZE);
    for (let x = cx - r; x < cx + r; x++) for (let y = 2; y < 2 + 2 * r; y++) for (let z = cz - r; z < cz + r; z++) scratch.mat[voxelIndex(x, y, z)] = MAT.BRICK;
    const d = new Destruction(scratch);
    this.warming = true;
    this.audio.prime();
    for (let k = 0; k < 4; k++) d.applyDamage({ x: cx * VOXEL_SIZE - 6 + k * 3, y: (2 + r) * VOXEL_SIZE, z: cz * VOXEL_SIZE }, 4, 90, 'warmup');
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
      if (h.destroyed.length) {
        this.score.onDestroyed(h.destroyed);
        this.collapse?.notify(h.destroyed);
        for (const v of h.destroyed) if (v.owner === 0) this.dirtyColumns.add(v.x + WORLD_VOXELS.x * v.z);
      }
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
      if (!m.quiet) this.audio.stinger();
      if (m.reward === 'grenade') this.weapons.grant('grenade', WEAPON_TUNING.rewardGrenade);
      else if (m.reward === 'rocket') this.weapons.grant('rocket', WEAPON_TUNING.rewardRocket);
      else if (m.reward === 'c4') this.weapons.grant('c4', WEAPON_TUNING.rewardC4);
      // 'time' is applied by the round clock (phase 4).
    });
    events.on('collapse', (c) => {
      const eye = this.player.eye();
      const dist = Math.hypot(c.center.x - eye.x, c.center.y - eye.y, c.center.z - eye.z);
      this.effects.blast(c.center, COLLAPSE.rumblePower * Math.min(1, c.voxels / 200), eye);
      this.audio.boom(COLLAPSE.rumblePower, dist);
    });
    events.on('weaponFire', (f) => {
      if (f.weapon === 'pistol' || f.weapon === 'shotgun' || f.weapon === 'rifle' || f.weapon === 'rocket') this.audio.shot(f.weapon);
      else if (f.kind === 'thrown' || f.kind === 'placed') this.audio.click(0.6);
    });
    events.on('weaponSwitch', () => this.audio.click(1.2));
  }

  /** Rebuild the terrain heightfield from carved columns, at most every PHYSICS.heightfieldRefreshS. */
  private refreshHeightfield(dt: number): void {
    if (!this.height || this.dirtyColumns.size === 0) return;
    this.heightfieldT += dt;
    if (this.heightfieldT < PHYSICS.heightfieldRefreshS) return;
    this.heightfieldT = 0;
    const SX = WORLD_VOXELS.x;
    for (const col of this.dirtyColumns) {
      const x = col % SX;
      const z = (col / SX) | 0;
      // Scan down from the old surface (terrain only gets lower).
      let y = this.height[col];
      while (y > 0 && this.world.mat[voxelIndex(x, y, z)] === 0) y--;
      this.height[col] = y;
    }
    this.dirtyColumns.clear();
    this.physics.setTerrain(this.height);
  }

  private chunkHasStructure(cx: number, cy: number, cz: number): boolean {
    const owner = this.world.owner;
    const x0 = cx * CHUNK_SIZE;
    const y0 = cy * CHUNK_SIZE;
    const z0 = cz * CHUNK_SIZE;
    for (let y = y0; y < y0 + CHUNK_SIZE; y++)
      for (let z = z0; z < z0 + CHUNK_SIZE; z++) {
        const base = voxelIndex(x0, y, z);
        for (let x = 0; x < CHUNK_SIZE; x++) if (owner[base + x] !== 0) return true;
      }
    return false;
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
    this.height = height;
    this.dirtyColumns.clear();
    this.physics.clearChunkColliders();
    this.debris?.clear();
    this.collapse?.setWorld(world);
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

    const playing = this.flow ? this.flow.update(rawDt) : true;
    if (this.ready) {
      this.uiUpdate?.(rawDt, now);
      if (playing) {
        this.player.look(this.input);
        this.player.update(dt, this.input);
      }
      this.weapons.update(dt, now, this.input);
      this.destruction.update(now);
      this.score.update(dt);
      this.collapse.update(now);
      this.physics.buildQueuedColliders();
      this.refreshHeightfield(rawDt);
      this.physics.update(dt);
      this.debris.update(now);
      this.effects.update(dt, now);
      for (const h of this.frameHooks) h(dt, now);
      const hv = Math.hypot(this.player.velocity.x, this.player.velocity.z);
      this.view.update(dt, now, hv > 0.5 && this.player.onGround, hv);
      const targetZoom = this.weapons.aiming && playing ? WEAPON_TUNING.adsFovMul : 1;
      this.zoom += (targetZoom - this.zoom) * Math.min(1, rawDt * 14);
      this.gfx.setZoom(this.zoom);
      if (playing) this.effects.applyShake(this.gfx.camera);
      this.flow?.updateFreeze(rawDt);
    }
    this.view.root.visible = playing;
    this.chunks.update(this.gfx.camera.position);
    this.gfx.render();
    this.afterRender?.(rawDt);

    const frameMs = performance.now() - t0;
    if (frameMs > this.worstFrame) this.worstFrame = frameMs;
    this.debug.frame(rawDt * 1000);
    this.debug.set(
      `pos ${this.player.position.x.toFixed(1)} ${this.player.position.y.toFixed(1)} ${this.player.position.z.toFixed(1)} · ${this.weapons.active.def.name}\n` +
        `chunks meshed ${this.chunks.stats.meshed} · dirty ${this.chunks.stats.dirty} · inflight ${this.chunks.stats.inFlight} · avg ${this.chunks.stats.avgMs.toFixed(2)} ms\n` +
        `debris ${this.debris?.count ?? 0} · pending chains ${this.destruction.pendingCount} · worst frame ${this.worstFrame.toFixed(1)} ms\n` +
        `score ${this.score.score} ×${this.score.multiplier} · structures ${this.world.structures.length} · arena ${this.score.arenaTotal} pts · ${(this.score.arenaPercent * 100).toFixed(1)}% wrecked\n` +
        `wall colliders ${this.physics.chunkColliderCount} · collapse checks ${this.collapse?.stats.checks ?? 0} (${(this.collapse?.stats.lastCheckMs ?? 0).toFixed(1)} ms) · falling ${this.collapse?.bodyCount ?? 0}`
    );
    this.input.endFrame();
  }

  /** Debug: a row of 1 m cubes, one per material (ascending id), plus a two-tone wall segment, in front of the spawn. */
  stampSwatches(): { ids: number[]; names: string[] } {
    const w = this.world;
    const ids = Object.keys(MATERIALS).map(Number).sort((a, b) => a - b);
    const v = VOXEL_SIZE;
    const c = Math.round(1 / v); // voxels per metre: swatches are 1 m cubes
    const sx = Math.round(w.spawn.x / v) - ids.length * c;
    const sz = Math.round(w.spawn.z / v) + 6 * c;
    // Each cube sits on its own column's surface so the row follows the dunes beyond the pad.
    ids.forEach((id, i) => {
      const x0 = sx + i * 2 * c;
      const base = w.surfaceY(x0, sz) + 1;
      for (let x = x0; x < x0 + c; x++) for (let y = base; y < base + c; y++) for (let z = sz; z < sz + c; z++) w.setVoxel(x, y, z, id, 1);
    });
    // A taller wall segment behind the row to show rows and patterns at scale.
    for (let x = sx; x < sx + ids.length * 2 * c; x++) {
      const base = w.surfaceY(x, sz + 4 * c) + 1;
      for (let y = base; y < base + 3 * c; y++) w.setVoxel(x, y, sz + 4 * c, [MAT.BRICK, MAT.WOOD, MAT.CONCRETE, MAT.MARBLE, MAT.STEEL, MAT.DRYWALL][Math.floor((x - sx) / (6 * c)) % 6], 1);
    }
    return { ids, names: ids.map((id) => MATERIALS[id].name) };
  }

  /** Debug: stamp a brick wall with a fuel tank behind it in front of the spawn. */
  stampTestWall(): void {
    const w = this.world;
    const m = (metres: number) => Math.round(metres / VOXEL_SIZE);
    const sx = m(w.spawn.x);
    const sz = m(w.spawn.z) + m(8);
    const base = w.surfaceY(sx, sz) + 1;
    for (let x = sx - m(4); x <= sx + m(4); x++) for (let y = base; y < base + m(4); y++) for (let z = sz; z < sz + m(1); z++) w.setVoxel(x, y, z, MAT.BRICK, 1);
    for (let x = sx - m(1); x < sx + m(1); x++) for (let y = base; y < base + m(1); y++) for (let z = sz + m(1); z < sz + m(3); z++) w.setVoxel(x, y, z, MAT.FUEL, 1);
    for (let x = sx + m(2.5); x < sx + m(3.5); x++) for (let y = base; y < base + m(1.5); y++) for (let z = sz + m(2); z < sz + m(3); z++) w.setVoxel(x, y, z, MAT.PROPANE, 1);
    for (let x = sx - m(4); x <= sx + m(4); x++) for (let y = base; y < base + m(3); y++) w.setVoxel(x, y, sz + m(5), MAT.GLASS, 1);
    for (let x = sx - m(4); x <= sx + m(4); x++) for (let y = base; y < base + m(3); y++) w.setVoxel(x, y, sz + m(6), MAT.CONCRETE, 1);
    void MATERIALS;
  }
}
