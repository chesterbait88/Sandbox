/** F3 overlay: fps, frame time, mesher stats, position. */
export class DebugOverlay {
  private el: HTMLDivElement;
  private frames = 0;
  private acc = 0;
  private fps = 0;
  private worst = 0;
  visible = false;
  private extra = '';

  constructor(parent: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'debug-overlay';
    this.el.style.display = 'none';
    parent.appendChild(this.el);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'F3') {
        e.preventDefault();
        this.toggle();
      }
    });
    if (new URLSearchParams(location.search).has('debug')) this.toggle();
  }

  toggle(): void {
    this.visible = !this.visible;
    this.el.style.display = this.visible ? 'block' : 'none';
  }

  set(lines: string): void {
    this.extra = lines;
  }

  frame(dtMs: number): void {
    this.frames++;
    this.acc += dtMs;
    if (dtMs > this.worst) this.worst = dtMs;
    if (this.acc >= 500) {
      this.fps = (this.frames * 1000) / this.acc;
      this.frames = 0;
      this.acc = 0;
      if (this.visible) this.el.textContent = `${this.fps.toFixed(0)} fps · worst ${this.worst.toFixed(1)} ms\n${this.extra}`;
      this.worst = 0;
    }
  }

  get currentFps(): number {
    return this.fps;
  }
}
