import { Emitter } from '../util/events';
import type { Vec3 } from '../util/vec';

export interface Destroyed {
  x: number;
  y: number;
  z: number;
  mat: number;
  owner: number;
}

export interface GameEvents {
  /** Any damage application that destroyed something (or not). */
  hit: { center: Vec3; radius: number; power: number; destroyed: Destroyed[]; source: string; glass: number };
  /** A volatile material detonated (chain reaction). */
  detonation: { center: Vec3; mat: number; power: number; radius: number };
  weaponFire: { weapon: string; kind: string };
  weaponSwitch: { weapon: string; slot: number };
  ammoChanged: { weapon: string; mag: number; reserve: number; reloading: number; grenades: number; c4: number; charges: number };
  structureDamaged: { id: number; name: string; percent: number; value: number; totalValue: number; destroyedValue: number };
  structureLeveled: { id: number; name: string; bonus: number; totalValue: number };
  scoreChanged: { score: number; delta: number; multiplier: number; comboRemaining: number };
  combo: { multiplier: number; chain: number };
  milestone: { index: number; callout: string; reward: string; score: number };
  roundEnd: { score: number };
  tick: { remaining: number };
  placedCharge: { count: number };
}

export const events = new Emitter<GameEvents>();
