import { Screen } from '../Screen';
import { button, fmt, h } from '../dom';
import type { Flow } from '../../game/Flow';
import { api } from '../../scoring/api';

export class MenuScreen extends Screen {
  private best: HTMLElement;

  constructor(flow: Flow, openSettings: () => void, openCredits: () => void) {
    super('menu');
    const title = h('h1', 'title', '<span>VOXEL</span><span class="accent">WRECK</span>');
    const sub = h('p', 'tagline', 'THREE MINUTES. ONE LOADOUT. LEAVE NOTHING STANDING.');
    const buttons = h('div', 'stack');
    buttons.append(
      button('PLAY', 'primary big', () => flow.toWorldPicker()),
      button('LEADERBOARD', '', () => flow.toLeaderboard()),
      button('SETTINGS', '', openSettings),
      button('CREDITS', '', openCredits)
    );
    this.best = h('div', 'best-strip', 'BEST TODAY · —');
    this.el.append(title, sub, buttons, this.best);
  }

  protected override onShow(): void {
    api
      .leaderboard('all', 1)
      .then((r) => {
        const e = r.entries[0];
        this.best.textContent = e ? `BEST · ${e.initials} · ${fmt(e.score)}` : 'BEST · nobody yet — be first';
      })
      .catch(() => (this.best.textContent = 'OFFLINE · scores will not save'));
  }
}
