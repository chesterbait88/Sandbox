import { beforeEach, describe, expect, it } from 'vitest';
import { MAT, SCORE_BLOCK_M, SCORING, VOXEL_SIZE } from '@vw/config';
import { Score } from './Score';
import { events } from '../state/events';

/** Voxels per scoring block: material values are quoted per SCORE_BLOCK_M cube. */
const PER = Math.round((SCORE_BLOCK_M / VOXEL_SIZE) ** 3);
/** n blocks' worth of destroyed voxels. */
const v = (owner: number, mat: number, n: number) => Array.from({ length: n * PER }, (_, i) => ({ x: i, y: 0, z: 0, mat, owner }));

describe('Score', () => {
  let s: Score;
  beforeEach(() => {
    events.clear();
    s = new Score();
    s.reset([
      { id: 1, name: 'Gas Station', totalValue: 100, center: { x: 0, y: 0, z: 0 }, voxels: 20, bounds: { x0: 0, y0: 0, z0: 0, x1: 1, y1: 1, z1: 1 } },
      { id: 2, name: 'Shed', totalValue: 10, center: { x: 0, y: 0, z: 0 }, voxels: 5, bounds: { x0: 0, y0: 0, z0: 0, x1: 1, y1: 1, z1: 1 } }
    ]);
  });

  it('terrain is worth nothing, structure voxels pay material value', () => {
    s.onDestroyed(v(0, MAT.SAND, 50));
    expect(s.score).toBe(0);
    s.onDestroyed(v(1, MAT.CONCRETE, 4));
    expect(s.score).toBe(20);
    expect(s.voxelsDestroyed).toBe(54 * PER);
  });

  it('detonations raise the multiplier, capped, and it decays after the window', () => {
    for (let i = 0; i < 12; i++) s.onDetonation();
    expect(s.multiplier).toBe(SCORING.comboMax);
    expect(s.bestChain).toBe(12);
    s.onDestroyed(v(1, MAT.WOOD, 1));
    expect(s.score).toBe(2 * SCORING.comboMax);
    s.update(SCORING.comboWindowS + 0.1);
    expect(s.multiplier).toBe(1);
    expect(s.chain).toBe(0);
  });

  it('leveling a structure pays its listed value plus the bonus once', () => {
    const leveled: string[] = [];
    events.on('structureLeveled', (e) => leveled.push(e.name));
    s.onDestroyed(v(2, MAT.WOOD, 5)); // 10 of 10
    expect(s.score).toBe(10 + 10 * SCORING.leveledBonus);
    expect(leveled).toEqual(['Shed']);
    s.onDestroyed(v(2, MAT.WOOD, 1));
    expect(leveled.length).toBe(1);
    expect(s.structuresLeveled).toBe(1);
  });

  it('milestones fire every interval with cycling callouts and rewards', () => {
    const ms: string[] = [];
    events.on('milestone', (m) => ms.push(`${m.callout}:${m.reward}`));
    s.reset([{ id: 1, name: 'Tower', totalValue: 100000, center: { x: 0, y: 0, z: 0 }, voxels: 1, bounds: { x0: 0, y0: 0, z0: 0, x1: 1, y1: 1, z1: 1 } }]);
    s.onDestroyed(v(1, MAT.STEEL, 300)); // 2400 points → two milestones, announced one at a time
    expect(ms).toEqual(['WRECKING:grenade']);
    s.update(SCORING.milestoneDripS + 0.01);
    expect(ms).toEqual(['WRECKING:grenade', 'DEMOLITION:rocket']);
    expect(s.arenaPercent).toBeCloseTo(0.024);
  });

  it('nothing scores after the round ends', () => {
    s.active = false;
    s.onDestroyed(v(1, MAT.STEEL, 10));
    expect(s.score).toBe(0);
  });
});
