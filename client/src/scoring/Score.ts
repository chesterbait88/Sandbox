import { MATERIALS, MILESTONE_INTERVAL, SCORING, milestoneFor, voxelValue, type MilestoneReward } from '@vw/config';
import { events, type Destroyed } from '../state/events';
import type { StructureInfo } from '../world/World';

interface Entry {
  info: StructureInfo;
  destroyedValue: number;
  leveled: boolean;
}

const valueOf = new Float32Array(256);
for (const m of Object.values(MATERIALS)) valueOf[m.id] = voxelValue(m);

/**
 * Round scoring: material value per destroyed structure voxel × combo multiplier, leveled bonus,
 * milestones. Terrain pays nothing. Gameplay calls onDestroyed/onDetonation; UI listens to events.
 */
export class Score {
  score = 0;
  multiplier = 1;
  /** Combo heat: level = floor(heat); see SCORING.combo*. */
  heat = 0;
  private sinceGain = 0;
  chain = 0;
  bestChain = 0;
  voxelsDestroyed = 0;
  structuresLeveled = 0;
  arenaTotal = 0;
  nextMilestone = 0;
  /** Milestones earned but not yet announced; released one per MILESTONE_DRIP_S so callouts never stack. */
  private milestoneQueue = 0;
  private dripT = 0;
  /** Loud callouts announced in the current burst (resets after a quiet spell). */
  private loudInBurst = 0;
  private sinceRelease = 0;
  /** Scoring stops when false (after the clock). */
  active = true;
  private entries = new Map<number, Entry>();

  reset(structures: StructureInfo[]): void {
    this.score = 0;
    this.multiplier = 1;
    this.heat = 0;
    this.sinceGain = 0;
    this.chain = 0;
    this.bestChain = 0;
    this.voxelsDestroyed = 0;
    this.structuresLeveled = 0;
    this.nextMilestone = 0;
    this.milestoneQueue = 0;
    this.dripT = 0;
    this.loudInBurst = 0;
    this.sinceRelease = 0;
    this.active = true;
    this.entries.clear();
    this.arenaTotal = 0;
    for (const s of structures) {
      this.entries.set(s.id, { info: s, destroyedValue: 0, leveled: false });
      this.arenaTotal += s.totalValue;
    }
  }

  /** Fraction of the arena's structure value destroyed. */
  get arenaPercent(): number {
    if (this.arenaTotal === 0) return 0;
    let d = 0;
    for (const e of this.entries.values()) d += e.destroyedValue;
    return Math.min(1, d / this.arenaTotal);
  }

  structure(id: number): { name: string; percent: number; totalValue: number; destroyedValue: number } | null {
    const e = this.entries.get(id);
    if (!e) return null;
    return { name: e.info.name, percent: e.info.totalValue ? e.destroyedValue / e.info.totalValue : 0, totalValue: e.info.totalValue, destroyedValue: e.destroyedValue };
  }

  onDestroyed(list: Destroyed[]): void {
    this.voxelsDestroyed += list.length;
    if (!this.active) return;
    let delta = 0;
    const touched = new Map<number, Entry>();
    // Lists are mostly one owner: resolve the entry only when the owner changes.
    let lastOwner = 0;
    let e: Entry | undefined;
    let raw = 0;
    for (let i = 0; i < list.length; i++) {
      const v = list[i];
      const o = v.owner;
      if (o === 0) continue;
      if (o !== lastOwner) {
        lastOwner = o;
        e = this.entries.get(o);
        if (e) touched.set(o, e);
      }
      if (!e) continue;
      const value = valueOf[v.mat];
      e.destroyedValue += value;
      raw += value;
    }
    delta += raw * this.multiplier;
    if (raw > 0) this.gainHeat(Math.sqrt(raw) * SCORING.comboHeatPerSqrtPoint);
    for (const e of touched.values()) {
      const percent = e.info.totalValue ? e.destroyedValue / e.info.totalValue : 1;
      events.emit('structureDamaged', { id: e.info.id, name: e.info.name, percent: Math.min(1, percent), value: Math.round(e.destroyedValue), totalValue: e.info.totalValue, destroyedValue: e.destroyedValue });
      if (!e.leveled && percent >= SCORING.leveledThreshold) {
        e.leveled = true;
        if (!e.info.prop) this.structuresLeveled++;
        const bonus = Math.round(e.info.totalValue * SCORING.leveledBonus);
        delta += bonus;
        events.emit('structureLeveled', { id: e.info.id, name: e.info.name, bonus, totalValue: e.info.totalValue, prop: !!e.info.prop });
      }
    }
    if (delta > 0) this.add(delta);
  }

  onDetonation(): void {
    if (!this.active) return;
    this.chain++;
    if (this.chain > this.bestChain) this.bestChain = this.chain;
    this.gainHeat(SCORING.comboHeatPerDetonation);
  }

  /** Fraction of the way to the next multiplier level (1 when capped). */
  get heatFraction(): number {
    return this.multiplier >= SCORING.comboMax ? 1 : this.heat - Math.floor(this.heat);
  }

  private static readonly maxLevel = Math.round((SCORING.comboMax - 1) / SCORING.comboStep);
  /** Heat caps with the top level's bar full, so draining starts with a whole level in hand. */
  private static readonly maxHeat = Score.maxLevel + 1 - 1e-6;

  private gainHeat(amount: number): void {
    this.sinceGain = 0;
    this.heat = Math.min(Score.maxHeat, this.heat + amount);
    this.syncMultiplier();
  }

  private syncMultiplier(): void {
    const level = Math.min(Score.maxLevel, Math.floor(this.heat));
    const m = 1 + level * SCORING.comboStep;
    const changed = m !== this.multiplier;
    this.multiplier = m;
    if (changed) events.emit('combo', { multiplier: m, chain: this.chain, heat: this.heatFraction });
  }

  private add(delta: number): void {
    const rounded = Math.round(delta);
    this.score += rounded;
    events.emit('scoreChanged', { score: this.score, delta: rounded, multiplier: this.multiplier });
    while (this.score >= (this.nextMilestone + this.milestoneQueue + 1) * MILESTONE_INTERVAL) this.milestoneQueue++;
    if (this.milestoneQueue > 0 && this.dripT <= 0) this.releaseMilestone();
  }

  private releaseMilestone(): void {
    const tier = milestoneFor(this.nextMilestone);
    this.nextMilestone++;
    this.milestoneQueue--;
    const quiet = this.loudInBurst >= SCORING.milestoneLoudPerBurst;
    if (!quiet) this.loudInBurst++;
    this.dripT = quiet ? SCORING.milestoneQuietDripS : SCORING.milestoneDripS;
    this.sinceRelease = 0;
    events.emit('milestone', { index: this.nextMilestone, callout: tier.callout, reward: tier.reward as MilestoneReward, score: this.score, quiet });
  }

  update(dt: number): void {
    if (this.dripT > 0) this.dripT -= dt;
    this.sinceRelease += dt;
    if (this.sinceRelease > SCORING.milestoneBurstResetS) this.loudInBurst = 0;
    if (this.milestoneQueue > 0 && this.dripT <= 0) this.releaseMilestone();
    // The meter drains after a grace period; levels fall away one by one.
    this.sinceGain += dt;
    if (this.heat > 0 && this.sinceGain > SCORING.comboGraceS) {
      this.heat = Math.max(0, this.heat - dt / SCORING.comboDrainS);
      if (this.heat === 0) this.chain = 0;
      this.syncMultiplier();
    }
  }
}
