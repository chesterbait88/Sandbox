import { THEMES, THEME_IDS, type LoadoutMode, type ThemeId } from '@vw/config';
import { Screen } from '../Screen';
import { button, fmt, h } from '../dom';
import type { Flow } from '../../game/Flow';
import { api } from '../../scoring/api';

export class LeaderboardScreen extends Screen {
  private tabs = new Map<ThemeId | 'all' | 'custom', HTMLElement>();
  private list: HTMLElement;
  private current: ThemeId | 'all' | 'custom' = 'all';
  private shareBtn: HTMLButtonElement;

  constructor(private flow: Flow) {
    super('leaderboard');
    const panel = h('div', 'panel leaderboard');
    panel.append(h('h2', 'heading', 'LEADERBOARD'));
    const tabs = h('div', 'tabs');
    for (const id of [...THEME_IDS, 'all', 'custom'] as (ThemeId | 'all' | 'custom')[]) {
      const t = h('button', 'tab', id === 'all' ? 'ALL' : id === 'custom' ? 'POINT-BUY' : THEMES[id].name.toUpperCase());
      t.addEventListener('click', () => this.load(id));
      tabs.append(t);
      this.tabs.set(id, t);
    }
    this.list = h('ol', 'board');
    const nav = h('div', 'nav');
    this.shareBtn = button('SHARE ARENA', '', () => {
      navigator.clipboard?.writeText(flow.shareLink()).then(() => (this.shareBtn.textContent = 'LINK COPIED'), () => (this.shareBtn.textContent = flow.shareLink()));
    });
    nav.append(button('MENU', '', () => flow.toMenu()), this.shareBtn, button('PLAY AGAIN', 'primary big', () => flow.playAgain()));
    panel.append(tabs, h('p', 'note small', 'Click a row to replay that arena'), this.list, nav);
    this.el.append(panel);
  }

  protected override onShow(): void {
    this.shareBtn.textContent = 'SHARE ARENA';
    const r = this.flow.result;
    this.load(r ? (r.mode === 'custom' ? 'custom' : this.flow.theme) : this.current);
  }

  private async load(id: ThemeId | 'all' | 'custom'): Promise<void> {
    this.current = id;
    for (const [k, t] of this.tabs) t.classList.toggle('active', k === id);
    this.list.innerHTML = '<li class="empty">LOADING…</li>';
    try {
      const mode: LoadoutMode = id === 'custom' ? 'custom' : 'fixed';
      const r = await api.leaderboard(id === 'custom' ? 'all' : id, 10, mode);
      this.list.innerHTML = '';
      if (r.entries.length === 0) this.list.innerHTML = '<li class="empty">NO SCORES YET</li>';
      const res = this.flow.result;
      for (const e of r.entries) {
        const li = h('li', 'row');
        const mine = res && (id === 'all' || id === 'custom' || res.theme === id) && e.score === res.score && e.initials === this.flow.lastInitials;
        if (mine) li.classList.add('mine');
        li.append(h('span', 'rank', `${e.rank}`), h('span', 'initials', e.initials), h('span', 'score', fmt(e.score)), h('span', 'date', e.date));
        if (e.seed && e.theme) {
          const theme = e.theme;
          const seed = e.seed;
          li.classList.add('replayable');
          li.title = `Replay ${THEMES[theme]?.name ?? theme} · seed ${seed}`;
          li.addEventListener('click', () => this.flow.replay(theme, seed));
        }
        this.list.append(li);
      }
    } catch {
      this.list.innerHTML = '<li class="empty">OFFLINE</li>';
    }
  }
}
