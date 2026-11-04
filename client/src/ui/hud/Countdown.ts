import { h } from '../dom';

export class Countdown {
  readonly el = h('div', 'hud-countdown');
  private last = -1;
  set(n: number): void {
    if (n === this.last) return;
    this.last = n;
    this.el.textContent = n > 0 ? String(n) : 'WRECK!';
    this.el.classList.remove('pulse');
    void this.el.offsetWidth;
    this.el.classList.add('pulse');
  }
}
