import { h } from '../dom';
import { events } from '../../state/events';

/** Bottom-right quarter-circle plate: weapon, magazine, reserve, reload bar, grenade count, C4 pips stacked on the right edge. */
export class Ammo {
  readonly el = h('div', 'hud-ammo');
  private mag = h('div', 'ammo-mag', '12');
  private reserve = h('div', 'ammo-reserve', '72');
  private reload = h('div', 'ammo-reload');
  private c4 = h('div', 'ammo-c4');
  private grenades = h('span', 'ammo-g', '');
  private weaponName = h('span', 'ammo-weapon', 'PISTOL');

  constructor() {
    const main = h('div', 'ammo-main');
    main.append(this.mag, this.reserve);
    const bar = h('div', 'ammo-reload-track');
    bar.append(this.reload);
    const head = h('div', 'ammo-head');
    head.append(this.grenades, this.weaponName);
    this.el.append(head, main, bar, this.c4);
    events.on('ammoChanged', (a) => {
      const inf = !Number.isFinite(a.mag);
      this.mag.textContent = inf ? '∞' : String(a.mag);
      this.reserve.textContent = inf || a.weapon === 'grenade' || a.weapon === 'c4' ? '' : String(a.reserve);
      this.el.classList.toggle('empty', !inf && a.mag <= 0 && (a.reserve <= 0 || a.weapon === 'grenade' || a.weapon === 'c4'));
      this.reload.style.width = `${a.reloading * 100}%`;
      this.el.classList.toggle('reloading', a.reloading > 0);
      this.grenades.textContent = a.weapon === 'grenade' ? '' : `G ${a.grenades}`;
      this.c4.innerHTML = `${a.charges ? `<span class="charges">${a.charges} ARMED</span>` : ''}${'<i class="pip c"></i>'.repeat(Math.min(8, a.c4))}`;
      this.c4.classList.toggle('on', a.c4 > 0 || a.charges > 0);
    });
    events.on('weaponSwitch', (w) => (this.weaponName.textContent = w.weapon.toUpperCase()));
  }
}
