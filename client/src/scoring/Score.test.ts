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

  it('detonations fill the combo meter, the multiplier caps, and it drains level by level', () => {
    const perLevel = 1 / SCORING.comboHeatPerDetonation;
    for (let i = 0; i < perLevel; i++) s.onDetonation();
    expect(s.multiplier).toBe(1 + SCORING.comboStep);
    for (let i = 0; i < 30; i++) s.onDetonation();
    expect(s.multiplier).toBe(SCORING.comboMax);
    expect(s.bestChain).toBe(perLevel + 30);
    s.onDestroyed(v(1, MAT.WOOD, 1));
    expect(s.score).toBe(2 * SCORING.comboMax);
    // Nothing drains during the grace period; then one level per comboDrainS.
    s.update(SCORING.comboGraceS - 0.1);
    expect(s.multiplier).toBe(SCORING.comboMax);
    s.update(0.2);
    s.update(SCORING.comboDrainS);
    expect(s.multiplier).toBe(SCORING.comboMax - SCORING.comboStep);
    s.update(SCORING.comboDrainS * 20);
    expect(s.multiplier).toBe(1);
    expect(s.chain).toBe(0);
  });

  it('destroying value moves the meter sub-linearly and a heavy blast is about one level', () => {
    s.onDestroyed(v(1, MAT.DRYWALL, 1)); // 1 point
    expect(s.heat).toBeCloseTo(SCORING.comboHeatPerSqrtPoint, 5);
    expect(s.multiplier).toBe(1);
    s.reset([{ id: 1, name: 'Tower', totalValue: 100000, center: { x: 0, y: 0, z: 0 }, voxels: 1, bounds: { x0: 0, y0: 0, z0: 0, x1: 1, y1: 1, z1: 1 } }]);
    s.onDestroyed(v(1, MAT.CONCRETE, 320)); // 1,600 points → sqrt 40 → one level
    expect(s.multiplier).toBe(1 + SCORING.comboStep);
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
