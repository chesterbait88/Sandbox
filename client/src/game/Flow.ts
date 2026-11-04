import * as THREE from 'three';
import { LOADOUT, PLAYER, SCORING, THEME_IDS, WEAPONS, type LoadoutMode, type ThemeId } from '@vw/config';
import type { Game } from './Game';
import { Round } from '../state/Round';
import { events } from '../state/events';
import { api, type RoundStats, type Session } from '../scoring/api';
import { randomSeedString } from '../util/rng';

export type ScreenName = 'menu' | 'worldPicker' | 'loadout' | 'countdown' | 'playing' | 'paused' | 'results' | 'initials' | 'leaderboard';

export interface RoundResult {
  theme: ThemeId;
  seed: string;
  mode: LoadoutMode;
  score: number;
  voxelsDestroyed: number;
  structuresLeveled: number;
  bestChain: number;
  arenaPercent: number;
  rank: number;
  qualifies: boolean;
  needed: number;
}

/**
 * The state machine: menu → worldPicker → loadout → countdown → playing ⇄ paused → results →
 * initials → leaderboard → menu. Screens call into it; it drives Game (time scale, camera, input).
 */
export class Flow {
  state: ScreenName = 'menu';
  theme: ThemeId = 'desert';
  seed = randomSeedString();
  readonly round = new Round();
  /** Fixed kit or point-buy. */
  mode: LoadoutMode = 'fixed';
  /** Custom ammo counts by weapon id. */
  custom: Record<string, number> = Flow.defaultCustom();
  sticky = false;
  session: Session | null = null;
  result: RoundResult | null = null;
  lastInitials = 'AAA';
  radialOpen = false;
  private onChange: ((s: ScreenName, prev: ScreenName) => void)[] = [];
  private orbitT = 0;
  /** Wall-clock deadlines (ms) so slow frames do not stretch UI timers. */
  private countdownEnd = 0;
  private freezeEnd = 0;
  private worldReady = false;
  private loading: Promise<void> | null = null;

  constructor(private game: Game) {
    events.on('milestone', (m) => {
      if (m.reward === 'time') this.round.addTime();
    });
    game.input.onLockChange = (locked) => {
      // Losing the lock mid-round pauses; losing it because the round ended does not.
      if (!locked && this.state === 'playing' && this.round.running) this.pause();
    };
  }

  static defaultCustom(): Record<string, number> {
    const c: Record<string, number> = {};
    for (const w of WEAPONS) if (Number.isFinite(w.totalAmmo)) c[w.id] = w.totalAmmo;
    return c;
  }

  /** Cost of the current custom loadout. */
  customCost(): number {
    let cost = 0;
    for (const id in this.custom) cost += (LOADOUT.costs[id] ?? 0) * this.custom[id];
    if (this.sticky) cost += LOADOUT.stickyCost;
    return Math.round(cost * 100) / 100;
  }

  setMode(m: LoadoutMode): void {
    this.mode = m;
  }

  /** Buy or sell one step of a weapon's ammo; refuses to exceed the budget or the ceiling. */
  adjust(id: string, dir: 1 | -1): boolean {
    const step = LOADOUT.steps[id] ?? 1;
    const next = Math.max(0, Math.min(LOADOUT.max[id] ?? Infinity, (this.custom[id] ?? 0) + dir * step));
    if (next === this.custom[id]) return false;
    const prev = this.custom[id];
    this.custom[id] = next;
    if (this.customCost() > LOADOUT.budget) {
      this.custom[id] = prev;
      return false;
    }
    return true;
  }

  toggleSticky(): boolean {
    this.sticky = !this.sticky;
    if (this.customCost() > LOADOUT.budget) {
      this.sticky = !this.sticky;
      return false;
    }
    return true;
  }

  /** URL that replays this arena. */
  shareLink(): string {
    const u = new URL(location.href);
    u.search = '';
    u.searchParams.set('arena', `${this.theme}-${this.seed}`);
    return u.toString();
  }

  /** Open the picker with a given arena preselected (from a share link or a leaderboard row). */
  replay(theme: ThemeId, seed: string): void {
    this.theme = theme;
    this.seed = seed.toUpperCase().slice(0, 12) || this.seed;
    void this.loadArena();
    this.set('worldPicker');
  }

  onStateChange(fn: (s: ScreenName, prev: ScreenName) => void): void {
    this.onChange.push(fn);
  }

  private set(s: ScreenName): void {
    const prev = this.state;
    this.state = s;
    for (const fn of this.onChange) fn(s, prev);
    const musicStates: ScreenName[] = ['menu', 'worldPicker', 'loadout', 'leaderboard', 'results', 'initials'];
    if (musicStates.includes(s)) this.game.audio.startMusic();
    else this.game.audio.stopMusic();
  }

  /** Called when the canvas is clicked: re-lock the pointer mid-round (e.g. after a rejected lock). */
  canvasClick(): void {
    if (this.state === 'playing') this.game.input.requestLock();
  }

  /** Boot: load a random arena for the menu backdrop. */
  async boot(theme?: ThemeId, seed?: string): Promise<void> {
    this.theme = theme ?? THEME_IDS[Math.floor(Math.random() * THEME_IDS.length)];
    if (seed) this.seed = seed;
    await this.loadArena();
    this.set('menu');
  }

  /** (Re)generate the arena for the current theme + seed; used by the menu backdrop and the picker. */
  loadArena(): Promise<void> {
    this.worldReady = false;
    this.game.weapons.enabled = false;
    const p = this.game.loadWorld(this.theme, this.seed).then(() => {
      if (this.loading === p) this.worldReady = true;
    });
    this.loading = p;
    return p;
  }

  // ---- transitions -------------------------------------------------------

  toMenu(): void {
    this.game.input.releaseLock();
    this.game.timeScale = 1;
    this.round.stop();
    this.set('menu');
  }

  toWorldPicker(): void {
    this.set('worldPicker');
  }

  pickTheme(theme: ThemeId): void {
    if (theme === this.theme) return;
    this.theme = theme;
    void this.loadArena();
  }

  setSeed(seed: string): void {
    const clean = seed.trim().toUpperCase().slice(0, 12) || randomSeedString();
    if (clean === this.seed) return;
    this.seed = clean;
    void this.loadArena();
  }

  randomSeed(): void {
    this.setSeed(randomSeedString());
  }

  toLoadout(): void {
    this.set('loadout');
  }

  async deploy(): Promise<void> {
    // Lock on the DEPLOY click gesture; the countdown camera ignores the mouse anyway.
    this.game.input.requestLock();
    this.game.audio.stopMusic();
    if (!this.worldReady) await this.loading;
    this.session = await api.startSession(this.theme, this.seed, this.mode).catch(() => null);
    this.game.weapons.loadout = this.mode === 'custom' ? { ...this.custom } : null;
    this.game.weapons.sticky = this.mode === 'custom' && this.sticky;
    this.game.weapons.reset();
    this.game.player.spawn(this.game.world.spawn, this.game.world.spawnYaw);
    this.game.score.reset(this.game.world.structures);
    this.countdownEnd = performance.now() + SCORING.countdownSeconds * 1000;
    this.set('countdown');
  }

  private startPlaying(): void {
    this.round.start();
    this.game.weapons.enabled = true;
    this.game.player.frozen = false;
    this.game.timeScale = 1;
    this.game.input.requestLock();
    this.set('playing');
  }

  pausedAt = 0;

  pause(): void {
    if (this.state !== 'playing') return;
    this.pausedAt = performance.now();
    this.game.timeScale = 0;
    this.game.weapons.enabled = false;
    this.game.input.releaseLock();
    this.set('paused');
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.game.timeScale = 1;
    this.game.weapons.enabled = true;
    this.game.input.requestLock();
    this.set('playing');
  }

  quitToMenu(): void {
    this.round.stop();
    this.game.weapons.enabled = false;
    this.game.timeScale = 1;
    this.toMenu();
    void this.loadArena();
  }

  private async endRound(): Promise<void> {
    const s = this.game.score;
    s.active = false;
    this.game.weapons.enabled = false;
    this.game.player.frozen = true;
    this.game.timeScale = SCORING.endFreezeScale;
    this.freezeEnd = performance.now() + SCORING.endFreezeS * 1000;
    events.emit('roundEnd', { score: s.score });
    this.game.input.releaseLock();
    const q = await api.qualifies(this.theme, s.score, this.mode).catch(() => ({ rank: 0, qualifies: false, needed: 0 }));
    this.result = {
      theme: this.theme,
      seed: this.seed,
      mode: this.mode,
      score: s.score,
      voxelsDestroyed: s.voxelsDestroyed,
      structuresLeveled: s.structuresLeveled,
      bestChain: s.bestChain,
      arenaPercent: s.arenaPercent,
      rank: q.rank,
      qualifies: q.qualifies,
      needed: q.needed
    };
  }

  toResults(): void {
    this.game.timeScale = 1;
    this.set('results');
  }

  afterResults(): void {
    if (this.result?.qualifies && this.session) this.set('initials');
    else this.set('leaderboard');
  }

  async submitInitials(initials: string): Promise<{ accepted: boolean; rank: number }> {
    this.lastInitials = initials;
    if (!this.session || !this.result) return { accepted: false, rank: 0 };
    const stats: RoundStats = {
      voxelsDestroyed: this.result.voxelsDestroyed,
      structuresLeveled: this.result.structuresLeveled,
      bestChain: this.result.bestChain,
      arenaPercent: this.result.arenaPercent,
      seed: this.seed
    };
    const r = await api.submitScore(this.session.token, initials, this.result.score, stats).catch(() => ({ accepted: false, rank: 0 }));
    if (r.accepted) this.result.rank = r.rank;
    this.session = null;
    return r;
  }

  toLeaderboard(): void {
    this.set('leaderboard');
  }

  playAgain(): void {
    this.seed = randomSeedString();
    void this.loadArena();
    this.set('worldPicker');
  }

  /** Radial picker open/close (Q). Slows the game while open. */
  setRadial(open: boolean): void {
    if (this.radialOpen === open) return;
    this.radialOpen = open;
    if (this.state === 'playing') this.game.timeScale = open ? PLAYER.radialTimeScale : 1;
  }

  // ---- per frame ---------------------------------------------------------

  /** Called by the Game loop with unscaled dt. Returns whether the player controller should run. */
  update(rawDt: number): boolean {
    const cam = this.game.gfx.camera;
    switch (this.state) {
      case 'menu':
      case 'worldPicker':
      case 'loadout':
      case 'leaderboard': {
        this.orbitT += rawDt * 0.08;
        const w = this.game.world;
        const cx = 64;
        const cz = 64;
        const r = 70;
        const h = (w.spawn.y ?? 20) + 26;
        cam.position.set(cx + Math.cos(this.orbitT) * r, h, cz + Math.sin(this.orbitT) * r);
        cam.lookAt(cx, (w.spawn.y ?? 20) - 4, cz);
        return false;
      }
      case 'countdown': {
        const left = (this.countdownEnd - performance.now()) / 1000;
        const t = 1 - Math.max(0, left) / SCORING.countdownSeconds;
        const ease = t * t * (3 - 2 * t);
        const sp = this.game.world.spawn;
        const eye = this.game.player.eye();
        cam.position.set(sp.x, eye.y + (1 - ease) * 40, sp.z - (1 - ease) * 30);
        cam.rotation.set(0, 0, 0);
        cam.rotation.order = 'YXZ';
        cam.rotation.y = this.game.player.yaw;
        cam.rotation.x = -(1 - ease) * 0.9;
        if (left <= 0) this.startPlaying();
        return false;
      }
      case 'playing': {
        if (this.round.update(rawDt * this.game.timeScale)) void this.endRound();
        return true;
      }
      case 'paused':
        return false;
      case 'results':
      case 'initials':
        return false;
    }
    return false;
  }

  /** Called every frame while the round-end freeze runs; moves to results when it elapses. */
  updateFreeze(_rawDt: number): void {
    if (this.freezeEnd > 0 && this.state === 'playing' && performance.now() >= this.freezeEnd && this.result) {
      this.freezeEnd = 0;
      this.toResults();
    }
  }

  /** Debug: end the countdown now. */
  skipCountdown(): void {
    this.countdownEnd = 0;
  }

  get countdownValue(): number {
    return Math.ceil((this.countdownEnd - performance.now()) / 1000);
  }

  static readonly THEMES = THEME_IDS;
  static readonly V = THREE.Vector3;
}
