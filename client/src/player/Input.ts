/** Keyboard + mouse state. Pointer lock is managed here. */
export class Input {
  keys = new Set<string>();
  /** Pressed this frame (cleared by endFrame). */
  pressed = new Set<string>();
  mouseDown = [false, false, false];
  mousePressed = [false, false, false];
  mouseReleased = [false, false, false];
  wheel = 0;
  dx = 0;
  dy = 0;
  locked = false;
  enabled = true;
  onLockChange: ((locked: boolean) => void) | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      this.keys.add(e.code);
      this.pressed.add(e.code);
      if (this.locked && ['Space', 'Tab', 'KeyQ'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
    canvas.addEventListener('mousedown', (e) => {
      if (!this.locked) return;
      this.mouseDown[e.button] = true;
      this.mousePressed[e.button] = true;
    });
    window.addEventListener('mouseup', (e) => {
      if (this.mouseDown[e.button]) this.mouseReleased[e.button] = true;
      this.mouseDown[e.button] = false;
    });
    window.addEventListener('mousemove', (e) => {
      if (!this.locked) return;
      this.dx += e.movementX;
      this.dy += e.movementY;
    });
    window.addEventListener('wheel', (e) => {
      if (this.locked) this.wheel += Math.sign(e.deltaY);
    }, { passive: true });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      if (!this.locked) {
        this.keys.clear();
        this.mouseDown.fill(false);
      }
      this.onLockChange?.(this.locked);
    });
  }

  requestLock(): void {
    if (this.locked) return;
    try {
      const r = this.canvas.requestPointerLock?.() as unknown as Promise<void> | undefined;
      r?.catch?.(() => {});
    } catch {
      /* no gesture yet (or headless) */
    }
  }

  releaseLock(): void {
    if (this.locked) document.exitPointerLock();
  }

  down(code: string): boolean {
    return this.enabled && this.keys.has(code);
  }

  wasPressed(code: string): boolean {
    return this.enabled && this.pressed.has(code);
  }

  endFrame(): void {
    this.pressed.clear();
    this.mousePressed.fill(false);
    this.mouseReleased.fill(false);
    this.wheel = 0;
    this.dx = 0;
    this.dy = 0;
  }
}
