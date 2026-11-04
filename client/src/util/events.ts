/** Tiny typed event emitter. Gameplay emits; UI and audio subscribe. */
export class Emitter<T extends Record<string, unknown>> {
  private handlers: { [K in keyof T]?: Array<(payload: T[K]) => void> } = {};

  on<K extends keyof T>(name: K, fn: (payload: T[K]) => void): () => void {
    (this.handlers[name] ??= []).push(fn);
    return () => this.off(name, fn);
  }

  off<K extends keyof T>(name: K, fn: (payload: T[K]) => void): void {
    const list = this.handlers[name];
    if (!list) return;
    const i = list.indexOf(fn);
    if (i >= 0) list.splice(i, 1);
  }

  emit<K extends keyof T>(name: K, payload: T[K]): void {
    const list = this.handlers[name];
    if (!list) return;
    for (const fn of list.slice()) fn(payload);
  }

  clear(): void {
    this.handlers = {};
  }
}
