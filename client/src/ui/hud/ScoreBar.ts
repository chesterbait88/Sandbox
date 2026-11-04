import { MILESTONE_INTERVAL } from '@vw/config';
import { fmt, h, pop, tickNumber } from '../dom';
import { events } from '../../state/events';

/** Top bar: score, next milestone, fill racing toward it. The combo lives in ComboMeter. */
export class ScoreBar {
  readonly el = h('div', 'hud-score');
  private scoreEl: HTMLElement;
  private nextEl: HTMLElement;
  private fill: HTMLElement;
  private score = 0;

  constructor() {
    this.scoreEl = h('div', 'score-val', '0');
    this.nextEl = h('div', 'score-next', fmt(MILESTONE_INTERVAL));
    const track = h('div', 'score-track');
    this.fill = h('div', 'score-fill');
    track.append(this.fill);
    this.el.append(this.scoreEl, track, this.nextEl);
    events.on('scoreChanged', (e) => {
      this.score = e.score;
      tickNumber(this.scoreEl, e.score, 250);
      pop(this.scoreEl);
      pop(this.el, 'flash');
      this.refresh();
    });
  }

  reset(): void {
    this.score = 0;
    this.scoreEl.dataset.value = '0';
    this.scoreEl.textContent = '0';
    this.refresh();
  }

  private refresh(): void {
    const next = (Math.floor(this.score / MILESTONE_INTERVAL) + 1) * MILESTONE_INTERVAL;
    this.nextEl.textContent = fmt(next);
    this.fill.style.width = `${((this.score % MILESTONE_INTERVAL) / MILESTONE_INTERVAL) * 100}%`;
  }
}
