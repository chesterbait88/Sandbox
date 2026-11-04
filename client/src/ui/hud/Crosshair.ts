import { h, pop } from '../dom';
import { events } from '../../state/events';
import type { Weapons } from '../../player/Weapons';

/** Centre crosshair that spreads with the shotgun and tightens while aiming; hit markers tick. */
export class Crosshair {
  readonly el = h('div', 'hud-crosshair');
  private marker = h('div', 'hit-marker');

  constructor(private weapons: Weapons) {
    this.el.append(h('i', 'ch t'), h('i', 'ch b'), h('i', 'ch l'), h('i', 'ch r'), this.marker);
    events.on('hit', (hit) => {
      if (hit.destroyed.length > 0) pop(this.marker, 'tick');
    });
  }

  update(): void {
    const w = this.weapons.active.def;
    const base = w.kind === 'melee' ? 4 : 8;
    const spread = base + (w.spread ?? 0) * 220 * (this.weapons.aiming ? 0.4 : 1);
    this.el.style.setProperty('--gap', `${spread}px`);
  }
}
