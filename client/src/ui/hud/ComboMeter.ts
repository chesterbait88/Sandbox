import { LEVELED_REWARD, SCORING } from '@vw/config';
import { h, pop } from '../dom';
import { events } from '../../state/events';
import type { Score } from '../../scoring/Score';
import type { Weapons } from '../../player/Weapons';

/**
 * Bottom edge, left of the structure readout: the multiplier, a meter that fills toward the next
 * level and drains as the combo times out, and the weapon power boost with its own timer.
 */
export class ComboMeter {
  readonly el = h('div', 'hud-combo');
  private mult = h('div', 'combo-mult', '×1');
  private fill = h('div', 'combo-fill');
  private label = h('div', 'combo-label', 'COMBO');
  private boost = h('div', 'combo-boost', '');
  private boostFill = h('div', 'combo-boost-fill');

  constructor() {
    const track = h('div', 'combo-track');
    track.append(this.fill);
    const boostTrack = h('div', 'combo-boost-track');
    boostTrack.append(this.boostFill);
    const body = h('div', 'combo-body');
    body.append(this.label, track, this.boost, boostTrack);
    this.el.append(this.mult, body);
    events.on('combo', (c) => {
      this.mult.textContent = `×${c.multiplier.toFixed(1).replace(/\.0$/, '')}`;
      this.el.classList.toggle('hot', c.multiplier > 1);
      this.el.classList.toggle('max', c.multiplier >= SCORING.comboMax);
      this.label.textContent = c.multiplier >= SCORING.comboMax ? 'MAX COMBO' : c.multiplier > 1 ? `CHAIN ${c.chain}` : 'COMBO';
      pop(this.mult);
    });
    events.on('leveledReward', (r) => {
      this.boost.textContent = `POWER +${Math.round(r.boost * 100)}%`;
      pop(this.el, 'reward');
    });
  }

  reset(): void {
    this.mult.textContent = '×1';
    this.label.textContent = 'COMBO';
    this.el.classList.remove('hot', 'max');
    this.fill.style.width = '0%';
    this.boostFill.style.width = '0%';
    this.boost.textContent = '';
  }

  /** Per frame: read the live meter and boost timer. */
  update(score: Score, weapons: Weapons): void {
    this.fill.style.width = `${score.heatFraction * 100}%`;
    const b = weapons.boost;
    this.el.classList.toggle('boosted', b > 0);
    if (b > 0) {
      this.boost.textContent = `POWER +${Math.round(b * 100)}% · ${Math.ceil(weapons.boostRemaining)}s`;
      this.boostFill.style.width = `${Math.min(1, weapons.boostRemaining / LEVELED_REWARD.boostS) * 100}%`;
    } else if (this.boost.textContent) {
      this.boost.textContent = '';
      this.boostFill.style.width = '0%';
    }
  }
}
