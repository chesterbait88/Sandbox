import { THEMES } from '@vw/config';
import { Screen } from '../Screen';
import { button, fmt, h } from '../dom';
import type { Flow } from '../../game/Flow';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';

/** Arcade initials entry: three letter columns, W/S or arrows cycle, A/D move, Enter confirms. */
export class InitialsScreen extends Screen {
  private cols: HTMLElement[] = [];
  private idx = [0, 0, 0];
  private cur = 0;
  private score: HTMLElement;
  private meta: HTMLElement;
  private status: HTMLElement;
  private submitting = false;

  constructor(private flow: Flow) {
    super('initials');
    const panel = h('div', 'panel initials');
    panel.append(h('h2', 'heading', 'NEW HIGH SCORE'));
    this.score = h('div', 'final-val', '0');
    panel.append(this.score);
    const row = h('div', 'letters');
    for (let i = 0; i < 3; i++) {
      const col = h('div', 'letter-col');
      const up = h('button', 'arrow', '▲');
      const letter = h('div', 'letter', 'A');
      const down = h('button', 'arrow', '▼');
      up.addEventListener('click', () => this.cycle(i, -1));
      down.addEventListener('click', () => this.cycle(i, 1));
      col.append(up, letter, down);
      col.addEventListener('click', () => this.focus(i));
      row.append(col);
      this.cols.push(col);
    }
    panel.append(row);
    this.meta = h('p', 'note', '');
    this.status = h('p', 'note', 'TYPE YOUR INITIALS · ↑↓ cycle · ←→ move · ENTER confirms');
    panel.append(this.meta, this.status, button('SUBMIT', 'primary big', () => void this.submit()));
    this.el.append(panel);
    window.addEventListener('keydown', (e) => this.onKey(e));
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.visible || this.submitting) return;
    // Letters always type (so W/A/S/D can be initials); arrows navigate; Enter confirms.
    if (e.code === 'ArrowUp') this.cycle(this.cur, -1);
    else if (e.code === 'ArrowDown') this.cycle(this.cur, 1);
    else if (e.code === 'ArrowLeft') this.focus((this.cur + 2) % 3);
    else if (e.code === 'ArrowRight') this.focus((this.cur + 1) % 3);
    else if (e.code === 'Backspace') this.focus((this.cur + 2) % 3);
    else if (e.code === 'Enter') void this.submit();
    else if (e.key.length === 1 && LETTERS.includes(e.key.toUpperCase())) {
      this.idx[this.cur] = LETTERS.indexOf(e.key.toUpperCase());
      this.render();
      this.focus((this.cur + 1) % 3);
    } else return;
    e.preventDefault();
  }

  private cycle(i: number, d: number): void {
    this.idx[i] = (this.idx[i] + d + LETTERS.length) % LETTERS.length;
    this.focus(i);
    this.render();
  }

  private focus(i: number): void {
    this.cur = i;
    this.cols.forEach((c, k) => c.classList.toggle('active', k === i));
  }

  private render(): void {
    this.cols.forEach((c, k) => (c.querySelector('.letter')!.textContent = LETTERS[this.idx[k]]));
  }

  get initials(): string {
    return this.idx.map((i) => LETTERS[i]).join('');
  }

  private async submit(): Promise<void> {
    if (this.submitting) return;
    this.submitting = true;
    this.status.textContent = 'SUBMITTING…';
    const r = await this.flow.submitInitials(this.initials);
    this.status.textContent = r.accepted ? `SAVED · RANK ${r.rank}` : 'COULD NOT SAVE (offline?)';
    setTimeout(() => {
      this.submitting = false;
      this.flow.toLeaderboard();
    }, 900);
  }

  protected override onShow(): void {
    const r = this.flow.result;
    this.score.textContent = fmt(r?.score ?? 0);
    this.meta.textContent = `${THEMES[this.flow.theme].name.toUpperCase()} · SEED ${this.flow.seed}`;
    const last = this.flow.lastInitials.padEnd(3, 'A');
    this.idx = [0, 1, 2].map((i) => Math.max(0, LETTERS.indexOf(last[i])));
    this.submitting = false;
    this.status.textContent = 'TYPE YOUR INITIALS · ↑↓ cycle · ←→ move · ENTER confirms';
    this.render();
    this.focus(0);
  }
}
