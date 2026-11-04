import { SCORING } from '@vw/config';
import { fmt, h, pop } from '../dom';
import { events } from '../../state/events';

/** Centre-bottom: structure name, percent bar and value for 3 s after a hit; LEVELED stamp. */
export class StructureReadout {
  readonly el = h('div', 'hud-readout');
  private name = h('div', 'readout-name', '');
  private fill = h('div', 'readout-fill');
  private pts = h('div', 'readout-pts', '');
  private stamp = h('div', 'readout-stamp', '');
  private hideAt = 0;
  private now = 0;

  constructor() {
    const track = h('div', 'readout-track');
    track.append(this.fill);
    this.el.append(this.name, track, this.pts, this.stamp);
    events.on('structureDamaged', (s) => {
      this.name.textContent = `${s.name.toUpperCase()} ${Math.round(s.percent * 100)} %`;
      this.fill.style.width = `${s.percent * 100}%`;
      this.pts.textContent = `${fmt(s.totalValue)} pts`;
      this.el.classList.add('on');
      this.hideAt = this.now + SCORING.readoutSeconds * 1000;
    });
    events.on('structureLeveled', (s) => {
      this.stamp.textContent = `LEVELED +${fmt(s.bonus)}`;
      pop(this.stamp, 'stamp');
      this.hideAt = this.now + SCORING.readoutSeconds * 1000;
    });
    events.on('leveledReward', (r) => {
      const mags = r.magazines === 1 ? '+1 MAG' : `+${r.magazines} MAGS`;
      this.stamp.textContent = `${this.stamp.textContent} · ${mags} · POWER +${Math.round(r.boost * 100)}%`;
    });
  }

  update(now: number): void {
    this.now = now;
    if (this.hideAt && now > this.hideAt) {
      this.el.classList.remove('on');
      this.hideAt = 0;
    }
  }
}
