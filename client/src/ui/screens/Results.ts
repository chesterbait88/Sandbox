import { THEMES } from '@vw/config';
import { Screen } from '../Screen';
import { button, fmt, h, tickNumber } from '../dom';
import type { Flow } from '../../game/Flow';

export class ResultsScreen extends Screen {
  private rows: { el: HTMLElement; get: () => number; suffix: string }[] = [];
  private header: HTMLElement;
  private note: HTMLElement;
  private cont: HTMLButtonElement;

  constructor(private flow: Flow) {
    super('results');
    const panel = h('div', 'panel results');
    this.header = h('h2', 'heading', 'TIME!');
    panel.append(this.header);
    const grid = h('div', 'stat-grid');
    const row = (label: string, get: () => number, suffix = '') => {
      const v = h('div', 'stat-val', '0');
      grid.append(h('div', 'stat-label', label), v);
      this.rows.push({ el: v, get, suffix });
    };
    row('STRUCTURES LEVELED', () => flow.result?.structuresLeveled ?? 0);
    row('VOXELS DESTROYED', () => flow.result?.voxelsDestroyed ?? 0);
    row('BIGGEST CHAIN', () => flow.result?.bestChain ?? 0);
    row('ARENA WRECKED', () => Math.round((flow.result?.arenaPercent ?? 0) * 100), '%');
    panel.append(grid);
    const final = h('div', 'final-score');
    final.append(h('div', 'stat-label', 'FINAL SCORE'));
    const fv = h('div', 'final-val', '0');
    final.append(fv);
    this.rows.push({ el: fv, get: () => flow.result?.score ?? 0, suffix: '' });
    panel.append(final);
    this.note = h('p', 'note', '');
    this.cont = button('CONTINUE', 'primary big', () => flow.afterResults());
    panel.append(this.note, this.cont);
    this.el.append(panel);
  }

  protected override onShow(): void {
    const r = this.flow.result;
    this.header.textContent = `TIME! · ${THEMES[this.flow.theme].name.toUpperCase()}`;
    this.rows.forEach((row, i) => {
      row.el.dataset.value = '0';
      row.el.textContent = '0' + row.suffix;
      setTimeout(() => tickNumber(row.el, row.get(), 700, row.suffix), 250 + i * 350);
    });
    if (!r) this.note.textContent = '';
    else if (r.qualifies) this.note.innerHTML = `<b>TOP ${r.rank}!</b> Enter your initials.`;
    else this.note.innerHTML = `You'd need <b>${fmt(r.needed)}</b> more for the top 100.`;
  }
}
