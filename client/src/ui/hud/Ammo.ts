import { h } from '../dom';
import { events } from '../../state/events';

/** Bottom-right: magazine, reserve, reload bar, grenade and C4 pips. */
export class Ammo {
  readonly el = h('div', 'hud-ammo');
  private mag = h('div', 'ammo-mag', '12');
  private reserve = h('div', 'ammo-reserve', '72');
  private reload = h('div', 'ammo-reload');
  private pips = h('div', 'ammo-pips');
  private weaponName = h('div', 'ammo-weapon', 'PISTOL');

  constructor() {
    const main = h('div', 'ammo-main');
    main.append(this.mag, this.reserve);
    const bar = h('div', 'ammo-reload-track');
    bar.append(this.reload);
    this.el.append(this.pips, this.weaponName, main, bar);
    events.on('ammoChanged', (a) => {
      const inf = !Number.isFinite(a.mag);
      this.mag.textContent = inf ? '∞' : String(a.mag);
      this.reserve.textContent = inf || a.weapon === 'grenade' || a.weapon === 'c4' ? '' : String(a.reserve);
      this.el.classList.toggle('empty', !inf && a.mag <= 0 && (a.reserve <= 0 || a.weapon === 'grenade' || a.weapon === 'c4'));
      this.reload.style.width = `${a.reloading * 100}%`;
      this.el.classList.toggle('reloading', a.reloading > 0);
      this.pips.innerHTML = `<span class="pip-group">${'<i class="pip g"></i>'.repeat(Math.min(12, a.grenades))}</span><span class="pip-group">${'<i class="pip c"></i>'.repeat(Math.min(12, a.c4))}</span>${a.charges ? `<span class="charges">${a.charges} ARMED</span>` : ''}`;
    });
    events.on('weaponSwitch', (w) => (this.weaponName.textContent = w.weapon.toUpperCase()));
  }
}
