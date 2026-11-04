import { h } from '../dom';
import { events } from '../../state/events';

export class Timer {
  readonly el = h('div', 'hud-timer', '3:00');
  constructor() {
    events.on('tick', (t) => {
      const s = Math.max(0, Math.ceil(t.remaining));
      this.el.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      this.el.classList.toggle('urgent', s <= 30);
    });
  }
}
