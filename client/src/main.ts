import { THEMES, THEME_IDS, type ThemeId } from '@vw/config';
import './ui/styles.css';
import { Game } from './game/Game';

declare global {
  interface Window {
    __vwReady?: boolean;
    __vw?: Game;
  }
}

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('game') as HTMLCanvasElement;
const ui = document.getElementById('ui')!;
const game = new Game(canvas, ui);
window.__vw = game;

const theme = (THEME_IDS.includes(params.get('theme') as ThemeId) ? params.get('theme') : 'desert') as ThemeId;
const seed = params.get('seed') ?? 'ALPHA';

const hint = document.createElement('div');
hint.className = 'phase0';
hint.textContent = `Voxel Wreck — phase 3 · ${THEMES[theme].name} · seed ${seed} · click to play · 1-8 weapons · G grenade · F3 debug`;
ui.appendChild(hint);

canvas.addEventListener('click', () => game.input.requestLock());

(async () => {
  await game.init();
  game.start();
  await game.loadWorld(theme, seed);
  if (params.get('test') === 'wall') game.stampTestWall();
  await game.whenMeshed();
  window.__vwReady = true;
})();
