import { THEMES, THEME_IDS, type ThemeId } from '@vw/config';
import { Screen } from '../Screen';
import { button, fmt, h } from '../dom';
import type { Flow } from '../../game/Flow';
import { api } from '../../scoring/api';

export class LeaderboardScreen extends Screen {
  private tabs = new Map<ThemeId | 'all', HTMLElement>();
  private list: HTMLElement;
  private current: ThemeId | 'all' = 'all';

  constructor(private flow: Flow) {
    super('leaderboard');
    const panel = h('div', 'panel leaderboard');
    panel.append(h('h2', 'heading', 'LEADERBOARD'));
    const tabs = h('div', 'tabs');
    for (const id of [...THEME_IDS, 'all'] as (ThemeId | 'all')[]) {
      const t = h('button', 'tab', id === 'all' ? 'ALL' : THEMES[id].name.toUpperCase());
      t.addEventListener('click', () => this.load(id));
      tabs.append(t);
      this.tabs.set(id, t);
    }
    this.list = h('ol', 'board');
    const nav = h('div', 'nav');
    nav.append(button('MENU', '', () => flow.toMenu()), button('PLAY AGAIN', 'primary big', () => flow.playAgain()));
    panel.append(tabs, this.list, nav);
    this.el.append(panel);
  }

  protected override onShow(): void {
    this.load(this.flow.result ? this.flow.theme : this.current);
  }

  private async load(id: ThemeId | 'all'): Promise<void> {
    this.current = id;
    for (const [k, t] of this.tabs) t.classList.toggle('active', k === id);
    this.list.innerHTML = '<li class="empty">LOADING…</li>';
    try {
      const r = await api.leaderboard(id, 10);
      this.list.innerHTML = '';
      if (r.entries.length === 0) this.list.innerHTML = '<li class="empty">NO SCORES YET</li>';
      const res = this.flow.result;
      for (const e of r.entries) {
        const li = h('li', 'row');
        const mine = res && res.theme === (id === 'all' ? res.theme : id) && e.score === res.score && e.initials === this.flow.lastInitials;
        if (mine) li.classList.add('mine');
        li.append(h('span', 'rank', `${e.rank}`), h('span', 'initials', e.initials), h('span', 'score', fmt(e.score)), h('span', 'date', e.date));
        this.list.append(li);
      }
    } catch {
      this.list.innerHTML = '<li class="empty">OFFLINE</li>';
    }
  }
}
