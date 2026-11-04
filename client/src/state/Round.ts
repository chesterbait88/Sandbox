import { MILESTONE_TIME_BONUS_S, SCORING } from '@vw/config';
import { events } from './events';

/** The 3-minute clock. Ticks once per second; milestone 'time' rewards add seconds. */
export class Round {
  remaining = 0;
  running = false;
  /** Seconds added by rewards this round. */
  bonusSeconds = 0;
  private lastWhole = -1;

  start(): void {
    this.remaining = SCORING.roundSeconds;
    this.bonusSeconds = 0;
    this.running = true;
    this.lastWhole = -1;
    events.emit('tick', { remaining: this.remaining });
  }

  stop(): void {
    this.running = false;
  }

  addTime(): void {
    if (!this.running) return;
    this.remaining += MILESTONE_TIME_BONUS_S;
    this.bonusSeconds += MILESTONE_TIME_BONUS_S;
    events.emit('tick', { remaining: this.remaining });
  }

  /** Returns true on the frame the clock reaches zero. */
  update(dt: number): boolean {
    if (!this.running) return false;
    this.remaining -= dt;
    const whole = Math.ceil(this.remaining);
    if (whole !== this.lastWhole) {
      this.lastWhole = whole;
      events.emit('tick', { remaining: Math.max(0, this.remaining) });
    }
    if (this.remaining <= 0) {
      this.remaining = 0;
      this.running = false;
      return true;
    }
    return false;
  }
}
