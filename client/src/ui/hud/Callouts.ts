import { h } from '../dom';
import { events } from '../../state/events';

/** Full-width milestone callout that slams in, plus a screen flash. */
export class Callouts {
  readonly el = h('div', 'hud-callouts');
  private flash = h('div', 'screen-flash');
  private banner = h('div', 'callout');

  constructor() {
    this.el.append(this.flash, this.banner);
    events.on('milestone', (m) => {
      const reward = m.reward === 'time' ? '+5 s' : `+1 ${m.reward.toUpperCase()}`;
      this.show(m.callout, reward);
    });
  }

  show(text: string, sub: string): void {
    this.banner.innerHTML = `<b>${text}</b><span>${sub}</span>`;
    this.banner.classList.remove('slam');
    this.flash.classList.remove('go');
    void this.banner.offsetWidth;
    this.banner.classList.add('slam');
    this.flash.classList.add('go');
  }
}
