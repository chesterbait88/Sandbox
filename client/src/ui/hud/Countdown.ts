import { h } from '../dom';

export class Countdown {
  readonly el = h('div', 'hud-countdown');
  private last = -1;
  set(n: number): void {
    if (n === this.last) return;
    this.last = n;
    this.el.textContent = n > 0 ? String(n) : 'WRECK!';
    this.el.animate(
      [
        { transform: 'translate(-50%, -50%) scale(2)', opacity: 0, offset: 0 },
        { opacity: 1, offset: 0.2 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1, offset: 1 }
      ],
      { duration: 900, easing: 'ease-out' }
    );
  }
}
