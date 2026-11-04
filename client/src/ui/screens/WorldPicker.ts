import { THEMES, THEME_IDS, type ThemeId } from '@vw/config';
import { Screen } from '../Screen';
import { button, fmt, h } from '../dom';
import type { Flow } from '../../game/Flow';
import { api } from '../../scoring/api';

export class WorldPickerScreen extends Screen {
  private cards = new Map<ThemeId, HTMLElement>();
  private tops = new Map<ThemeId, HTMLElement>();
  private seedInput: HTMLInputElement;

  constructor(private flow: Flow) {
    super('picker');
    this.el.append(h('h2', 'heading', 'PICK YOUR ARENA'));
    const row = h('div', 'cards');
    for (const id of THEME_IDS) {
      const t = THEMES[id];
      const card = h('div', 'card theme-card');
      card.style.setProperty('--accent', t.accent);
      card.style.setProperty('--sky', t.sky);
      card.style.setProperty('--ground', t.strata[0][0] === 3 ? '#f2d27c' : t.strata[0][0] === 5 ? '#2f3342' : '#5fc94a');
      const art = h('div', 'card-art');
      art.append(...Array.from({ length: 5 }, (_, i) => h('i', `blk b${i}`)));
      const top = h('div', 'card-top', 'TOP · —');
      card.append(art, h('h3', '', t.name), h('p', '', t.description), top);
      card.addEventListener('click', () => this.select(id));
      row.append(card);
      this.cards.set(id, card);
      this.tops.set(id, top);
    }
    const seedRow = h('div', 'seed-row');
    this.seedInput = h('input', 'seed') as HTMLInputElement;
    this.seedInput.maxLength = 12;
    this.seedInput.placeholder = 'SEED';
    this.seedInput.addEventListener('change', () => flow.setSeed(this.seedInput.value));
    const dice = button('🎲', 'dice', () => {
      flow.randomSeed();
      this.seedInput.value = flow.seed;
    });
    seedRow.append(h('label', '', 'SEED'), this.seedInput, dice);
    const nav = h('div', 'nav');
    nav.append(button('BACK', '', () => flow.toMenu()), button('NEXT: LOADOUT', 'primary', () => flow.toLoadout()));
    this.el.append(row, seedRow, nav);
  }

  private select(id: ThemeId): void {
    this.flow.pickTheme(id);
    this.refresh();
  }

  private refresh(): void {
    for (const [id, card] of this.cards) card.classList.toggle('selected', id === this.flow.theme);
    this.seedInput.value = this.flow.seed;
  }

  protected override onShow(): void {
    this.refresh();
    for (const id of THEME_IDS) {
      api
        .leaderboard(id, 1)
        .then((r) => {
          const e = r.entries[0];
          this.tops.get(id)!.textContent = e ? `TOP · ${e.initials} · ${fmt(e.score)}` : 'TOP · unclaimed';
        })
        .catch(() => {});
    }
  }
}
