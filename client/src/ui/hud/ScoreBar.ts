import { MILESTONE_INTERVAL, SCORING } from '@vw/config';
import { fmt, h, pop, tickNumber } from '../dom';
import { events } from '../../state/events';

/** Top bar: score, next milestone, fill racing toward it, combo badge with a shrinking ring. */
export class ScoreBar {
  readonly el = h('div', 'hud-score');
  private scoreEl: HTMLElement;
  private nextEl: HTMLElement;
  private fill: HTMLElement;
  private combo: HTMLElement;
  private comboVal: HTMLElement;
  private ring: HTMLElement;
  private score = 0;
  private multiplier = 1;
  private comboRemaining = 0;

  constructor() {
    this.scoreEl = h('div', 'score-val', '0');
    this.nextEl = h('div', 'score-next', fmt(MILESTONE_INTERVAL));
    const track = h('div', 'score-track');
    this.fill = h('div', 'score-fill');
    track.append(this.fill);
    this.combo = h('div', 'combo');
    this.ring = h('div', 'combo-ring');
    this.comboVal = h('div', 'combo-val', '×1.5');
    this.combo.append(this.ring, this.comboVal);
    this.el.append(this.scoreEl, track, this.nextEl, this.combo);
    events.on('scoreChanged', (e) => {
      this.score = e.score;
      tickNumber(this.scoreEl, e.score, 250);
      pop(this.scoreEl);
      pop(this.el, 'flash');
      this.multiplier = e.multiplier;
      this.comboRemaining = e.comboRemaining;
      this.refresh();
    });
    events.on('combo', (c) => {
      this.multiplier = c.multiplier;
      this.comboRemaining = c.multiplier > 1 ? SCORING.comboWindowS : 0;
      this.comboVal.textContent = `×${c.multiplier.toFixed(1).replace(/\.0$/, '')}`;
      if (c.multiplier > 1) pop(this.combo);
      this.refresh();
    });
  }

  reset(): void {
    this.score = 0;
    this.multiplier = 1;
    this.scoreEl.dataset.value = '0';
    this.scoreEl.textContent = '0';
    this.refresh();
  }

  private refresh(): void {
    const next = (Math.floor(this.score / MILESTONE_INTERVAL) + 1) * MILESTONE_INTERVAL;
    this.nextEl.textContent = fmt(next);
    this.fill.style.width = `${((this.score % MILESTONE_INTERVAL) / MILESTONE_INTERVAL) * 100}%`;
    this.combo.classList.toggle('on', this.multiplier > 1);
  }

  update(dt: number): void {
    if (this.multiplier > 1) {
      this.comboRemaining = Math.max(0, this.comboRemaining - dt);
      const t = this.comboRemaining / SCORING.comboWindowS;
      this.ring.style.setProperty('--t', String(t));
    }
  }
}
