/** Tiny DOM helpers for the overlay UI. */
export function h<K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = ''): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html) el.innerHTML = html;
  return el;
}

export function button(label: string, cls = '', onClick?: () => void): HTMLButtonElement {
  const b = h('button', `btn ${cls}`.trim(), label);
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

export function fmt(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

/** Animate a number in an element from its current value to target over ms, ticking. */
export function tickNumber(el: HTMLElement, target: number, ms = 400, suffix = ''): void {
  const start = Number(el.dataset.value ?? '0');
  const t0 = performance.now();
  const step = () => {
    const t = Math.min(1, (performance.now() - t0) / ms);
    const e = 1 - Math.pow(1 - t, 3);
    const v = start + (target - start) * e;
    el.textContent = fmt(v) + suffix;
    if (t < 1) requestAnimationFrame(step);
    else el.dataset.value = String(target);
  };
  if (ms <= 0) {
    el.textContent = fmt(target) + suffix;
    el.dataset.value = String(target);
    return;
  }
  step();
}

/** Re-trigger a CSS animation class. */
export function pop(el: HTMLElement, cls = 'pop'): void {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}

export const settings = {
  load(): { sensitivity: number; volume: number; fov: number } | null {
    try {
      const s = localStorage.getItem('vw.settings');
      return s ? (JSON.parse(s) as { sensitivity: number; volume: number; fov: number }) : null;
    } catch {
      return null;
    }
  },
  save(v: { sensitivity: number; volume: number; fov: number }): void {
    try {
      localStorage.setItem('vw.settings', JSON.stringify(v));
    } catch {
      /* ignore */
    }
  }
};
