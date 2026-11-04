import { h } from './dom';

/** A full-screen DOM panel. One is visible at a time; HUD is separate. */
export abstract class Screen {
  readonly el: HTMLElement;
  visible = false;

  constructor(name: string) {
    this.el = h('section', `screen screen-${name}`);
    this.el.style.display = 'none';
  }

  show(): void {
    if (this.visible) return;
    this.visible = true;
    this.el.style.display = '';
    this.el.classList.remove('leave');
    this.el.classList.add('enter');
    this.onShow();
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.el.classList.remove('enter');
    this.el.classList.add('leave');
    const el = this.el;
    setTimeout(() => {
      if (!this.visible) el.style.display = 'none';
    }, 220);
    this.onHide();
  }

  protected onShow(): void {}
  protected onHide(): void {}
  update(_dt: number): void {}
}
