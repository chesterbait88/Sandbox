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
      if (m.quiet) return;
      const reward = m.reward === 'time' ? '+5 s' : `+1 ${m.reward.toUpperCase()}`;
      this.show(m.callout, reward);
    });
  }

  /** Slide the band up from the bottom edge and fade it; flash the screen faintly. Web Animations, so no layout is forced. */
  show(text: string, sub: string): void {
    this.banner.innerHTML = `<b>${text}</b><span>${sub}</span>`;
    this.banner.animate(
      [
        { transform: 'translate(-50%, 40px)', opacity: 0, offset: 0 },
        { transform: 'translate(-50%, 0)', opacity: 1, offset: 0.14 },
        { transform: 'translate(-50%, 0)', opacity: 1, offset: 0.82 },
        { transform: 'translate(-50%, -10px)', opacity: 0, offset: 1 }
      ],
      { duration: 1800, easing: 'cubic-bezier(.1,.9,.2,1)', fill: 'forwards' }
    );
    this.flash.animate([{ opacity: 0.22 }, { opacity: 0 }], { duration: 400, easing: 'ease-out' });
  }
}
