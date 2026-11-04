import { h } from './dom';
import type { Game } from '../game/Game';
import type { Flow, ScreenName } from '../game/Flow';
import type { Screen } from './Screen';
import { MenuScreen } from './screens/Menu';
import { WorldPickerScreen } from './screens/WorldPicker';
import { LoadoutScreen } from './screens/Loadout';
import { PauseScreen } from './screens/Pause';
import { SettingsScreen } from './screens/Settings';
import { CreditsScreen } from './screens/Credits';
import { ResultsScreen } from './screens/Results';
import { InitialsScreen } from './screens/Initials';
import { LeaderboardScreen } from './screens/Leaderboard';
import { ScoreBar } from './hud/ScoreBar';
import { Timer } from './hud/Timer';
import { Ammo } from './hud/Ammo';
import { Radial } from './hud/Radial';
import { StructureReadout } from './hud/StructureReadout';
import { Crosshair } from './hud/Crosshair';
import { Callouts } from './hud/Callouts';
import { Countdown } from './hud/Countdown';

/** The DOM overlay: one screen at a time plus the HUD during play. Subscribes to Flow and events. */
export class UI {
  readonly screens: Record<string, Screen>;
  readonly hud = h('div', 'hud');
  readonly scoreBar = new ScoreBar();
  readonly timer = new Timer();
  readonly ammo = new Ammo();
  readonly radial: Radial;
  readonly readout = new StructureReadout();
  readonly crosshair: Crosshair;
  readonly callouts = new Callouts();
  readonly countdown = new Countdown();
  readonly loadout: LoadoutScreen;
  private overlay: Screen | null = null;
  private current: Screen | null = null;

  constructor(root: HTMLElement, game: Game, flow: Flow) {
    const openSettings = () => this.showOverlay(this.screens.settings);
    const closeOverlay = () => this.showOverlay(null);
    this.loadout = new LoadoutScreen(flow, game);
    this.screens = {
      menu: new MenuScreen(flow, openSettings, () => this.showOverlay(this.screens.credits)),
      worldPicker: new WorldPickerScreen(flow),
      loadout: this.loadout,
      paused: new PauseScreen(flow, openSettings),
      settings: new SettingsScreen(game, closeOverlay),
      credits: new CreditsScreen(closeOverlay),
      results: new ResultsScreen(flow),
      initials: new InitialsScreen(flow),
      leaderboard: new LeaderboardScreen(flow)
    };
    this.radial = new Radial(game.weapons, flow);
    this.crosshair = new Crosshair(game.weapons);
    for (const s of Object.values(this.screens)) root.append(s.el);
    this.hud.append(this.scoreBar.el, this.timer.el, this.radial.el, this.ammo.el, this.readout.el, this.crosshair.el, this.callouts.el, this.countdown.el);
    this.hud.style.display = 'none';
    root.append(this.hud);
    flow.onStateChange((s) => this.onState(s));
    window.addEventListener('keydown', (e) => {
      if (e.code !== 'Escape') return;
      if (this.overlay) this.showOverlay(null);
      else if (flow.state === 'paused') flow.resume();
    });
    // Pointer-lock exit already pauses; Esc in menus is handled above.
  }

  private onState(s: ScreenName): void {
    const screenFor: Partial<Record<ScreenName, Screen>> = {
      menu: this.screens.menu,
      worldPicker: this.screens.worldPicker,
      loadout: this.screens.loadout,
      paused: this.screens.paused,
      results: this.screens.results,
      initials: this.screens.initials,
      leaderboard: this.screens.leaderboard
    };
    const next = screenFor[s] ?? null;
    if (this.current && this.current !== next) this.current.hide();
    this.current = next;
    next?.show();
    this.showOverlay(null);
    const inRound = s === 'playing' || s === 'paused' || s === 'countdown';
    this.hud.style.display = inRound ? '' : 'none';
    this.hud.classList.toggle('dim', s === 'paused');
    this.countdown.el.style.display = s === 'countdown' ? '' : 'none';
    if (s === 'countdown') this.scoreBar.reset();
  }

  showOverlay(s: Screen | null): void {
    if (this.overlay && this.overlay !== s) this.overlay.hide();
    this.overlay = s;
    s?.show();
  }

  /** Per frame, unscaled dt and game time. */
  update(dt: number, now: number, game: Game, flow: Flow): void {
    if (flow.state === 'countdown') this.countdown.set(flow.countdownValue);
    if (flow.state === 'playing') {
      this.radial.update(game.input);
      this.crosshair.update();
      this.scoreBar.update(dt * game.timeScale);
      this.readout.update(now);
    }
  }
}
