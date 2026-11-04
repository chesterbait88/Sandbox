import { PLAYER, RENDER } from '@vw/config';
import { Screen } from '../Screen';
import { button, h, settings } from '../dom';
import type { Game } from '../../game/Game';

export class SettingsScreen extends Screen {
  constructor(game: Game, close: () => void) {
    super('settings');
    const panel = h('div', 'panel');
    panel.append(h('h2', 'heading', 'SETTINGS'));
    const saved = settings.load() ?? { sensitivity: PLAYER.sensitivity, volume: game.audio.volume, fov: RENDER.fov };
    game.player.sensitivity = saved.sensitivity;
    game.audio.setVolume(saved.volume);
    game.gfx.setFov(saved.fov);
    const cur = { ...saved };
    const slider = (label: string, min: number, max: number, step: number, value: number, onInput: (v: number) => void) => {
      const row = h('label', 'slider-row');
      const input = h('input') as HTMLInputElement;
      input.type = 'range';
      input.min = String(min);
      input.max = String(max);
      input.step = String(step);
      input.value = String(value);
      const val = h('span', 'slider-val', String(value));
      input.addEventListener('input', () => {
        const v = Number(input.value);
        val.textContent = step < 0.01 ? v.toFixed(4) : String(v);
        onInput(v);
        settings.save(cur);
      });
      row.append(h('span', '', label), input, val);
      return row;
    };
    panel.append(
      slider('MOUSE SENSITIVITY', PLAYER.sensitivityMin, PLAYER.sensitivityMax, 0.0001, cur.sensitivity, (v) => (game.player.sensitivity = cur.sensitivity = v)),
      slider('VOLUME', 0, 1, 0.05, cur.volume, (v) => game.audio.setVolume((cur.volume = v))),
      slider('FIELD OF VIEW', 60, 110, 1, cur.fov, (v) => game.gfx.setFov((cur.fov = v))),
      button('DONE', 'primary', close)
    );
    this.el.append(panel);
  }
}
