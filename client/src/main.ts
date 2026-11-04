import { THEME_IDS, type ThemeId } from '@vw/config';
import './ui/styles.css';
import { Game } from './game/Game';
import { Flow } from './game/Flow';
import { UI } from './ui/UI';

declare global {
  interface Window {
    __vwReady?: boolean;
    __vw?: Game;
    __flow?: Flow;
    __ui?: UI;
  }
}

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('game') as HTMLCanvasElement;
const root = document.getElementById('ui')!;
const game = new Game(canvas, root);
const flow = new Flow(game);
const ui = new UI(root, game, flow);
game.flow = flow;
game.uiUpdate = (dt, now) => ui.update(dt, now, game, flow);
game.afterRender = (dt) => ui.loadout.renderViews(game.gfx.renderer, dt);
canvas.addEventListener('click', () => flow.canvasClick());
if (matchMedia('(pointer: coarse)').matches && !params.has('headless')) {
  const n = document.createElement('div');
  n.className = 'desktop-notice';
  n.innerHTML = '<b>DESKTOP ONLY</b><span>Voxel Wreck needs a mouse and keyboard. Come back on a computer.</span>';
  root.append(n);
}
window.__vw = game;
window.__flow = flow;
window.__ui = ui;

const theme = THEME_IDS.includes(params.get('theme') as ThemeId) ? (params.get('theme') as ThemeId) : undefined;
const seed = params.get('seed') ?? undefined;

/** Debug jump points for screenshots: ?screen=menu|picker|loadout|hud|pause|results|initials|leaderboard */
async function jump(screen: string): Promise<void> {
  const fakeResult = () => {
    flow.result = { theme: flow.theme, seed: flow.seed, mode: 'fixed', score: 12480, voxelsDestroyed: 3120, structuresLeveled: 2, bestChain: 4, arenaPercent: 0.21, rank: 3, qualifies: true, needed: 0 };
    flow.session = { token: 'debug', startedAt: Date.now() };
  };
  switch (screen) {
    case 'picker':
      flow.toWorldPicker();
      break;
    case 'loadout':
      flow.toLoadout();
      break;
    case 'hud':
    case 'pause': {
      await flow.deploy();
      // Skip the countdown.
      flow.skipCountdown();
      flow.update(0);
      if (params.get('test') === 'wall') game.stampTestWall();
      if (screen === 'pause') flow.pause();
      break;
    }
    case 'results':
      fakeResult();
      flow.toResults();
      break;
    case 'initials':
      fakeResult();
      flow.afterResults();
      break;
    case 'leaderboard':
      flow.toLeaderboard();
      break;
    default:
      break;
  }
}

(async () => {
  await game.init();
  game.start();
  await flow.boot(theme, seed);
  const screen = params.get('screen');
  if (screen && screen !== 'menu') await jump(screen);
  else {
    // A share link (?arena=theme-SEED) lands on the picker with that arena preselected.
    const arena = params.get('arena');
    const m = arena?.match(/^([a-z]+)-([A-Z0-9]{1,12})$/i);
    if (m && THEME_IDS.includes(m[1] as ThemeId)) flow.replay(m[1] as ThemeId, m[2]);
  }
  await game.whenMeshed();
  window.__vwReady = true;
})();
