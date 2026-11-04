import { WEAPONS } from '@vw/config';
import { h } from '../dom';
import type { Weapons } from '../../player/Weapons';
import type { Input } from '../../player/Input';
import type { Flow } from '../../game/Flow';
import { events } from '../../state/events';

/** Bottom-left: current weapon icon; holding Q fans the eight weapons out and mouse direction picks. */
export class Radial {
  readonly el = h('div', 'hud-radial');
  private hub: HTMLElement;
  private wheel: HTMLElement;
  private segs: HTMLElement[] = [];
  private open = false;
  private mx = 0;
  private my = 0;
  private highlight = -1;

  constructor(private weapons: Weapons, private flow: Flow) {
    this.hub = h('div', 'radial-hub', '<b>3</b><span>PISTOL</span>');
    this.wheel = h('div', 'radial-wheel');
    WEAPONS.forEach((w, i) => {
      const seg = h('div', 'radial-seg');
      const a = (i / WEAPONS.length) * Math.PI * 2 - Math.PI / 2;
      seg.style.setProperty('--x', `${Math.cos(a) * 110}px`);
      seg.style.setProperty('--y', `${Math.sin(a) * 110}px`);
      seg.innerHTML = `<b>${w.slot}</b><span>${w.name.toUpperCase()}</span>`;
      this.wheel.append(seg);
      this.segs.push(seg);
    });
    this.el.append(this.wheel, this.hub);
    events.on('weaponSwitch', (w) => (this.hub.innerHTML = `<b>${w.slot}</b><span>${w.weapon.toUpperCase()}</span>`));
  }

  update(input: Input): void {
    const want = this.flow.state === 'playing' && input.down('KeyQ');
    if (want && !this.open) {
      this.open = true;
      this.mx = this.my = 0;
      this.highlight = -1;
      this.el.classList.add('open');
      this.flow.setRadial(true);
    }
    if (this.open) {
      this.mx += input.dx;
      this.my += input.dy;
      const len = Math.hypot(this.mx, this.my);
      if (len > 18) {
        const a = Math.atan2(this.my, this.mx) + Math.PI / 2;
        const n = WEAPONS.length;
        this.highlight = ((Math.round((a / (Math.PI * 2)) * n) % n) + n) % n;
      }
      this.segs.forEach((s, i) => s.classList.toggle('hl', i === this.highlight));
      input.dx = 0;
      input.dy = 0;
    }
    if (!want && this.open) {
      this.open = false;
      this.el.classList.remove('open');
      if (this.highlight >= 0) this.weapons.select(this.highlight);
      this.flow.setRadial(false);
    }
  }

  get isOpen(): boolean {
    return this.open;
  }
}
