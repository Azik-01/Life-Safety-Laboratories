import { describe, expect, it } from 'vitest';
import {
  barrierReductionDbFromMass,
  deltaByDifferenceDb,
  levelAfterBarrierDb,
  levelAtDistanceDb,
  soundPressureLevelDb,
  sourceLevelAtObserver,
  sumLevelsEnergyDb,
  sumTwoLevelsByDeltaDb,
} from '../../src/formulas/noise';

describe('noise formulas', () => {
  it('calculates sound pressure level', () => {
    expect(soundPressureLevelDb(2e-4)).toBeCloseTo(20, 1);
  });

  it('calculates level by distance formula', () => {
    expect(levelAtDistanceDb(100, 2)).toBeCloseTo(86, 1);
  });

  it('calculates barrier reduction from mass', () => {
    const reduction = barrierReductionDbFromMass(150);
    expect(reduction).toBeGreaterThan(30);
  });

  it('applies barrier reduction', () => {
    expect(levelAfterBarrierDb(85, 20)).toBeCloseTo(65, 6);
  });

  it('returns expected delta for equal levels', () => {
    expect(deltaByDifferenceDb(0)).toBeCloseTo(3, 6);
  });

  it('sums two levels by LA+ΔL', () => {
    expect(sumTwoLevelsByDeltaDb(90, 90)).toBeCloseTo(93, 1);
  });

  it('sums multiple levels by energy', () => {
    const total = sumLevelsEnergyDb([90, 90, 90]);
    expect(total).toBeCloseTo(94.8, 1);
  });

  it('computes observer level with barrier', () => {
    const level = sourceLevelAtObserver({
      levelAt1mDb: 98,
      distanceM: 4,
      barrierMassPerM2: 120,
    });
    expect(level).toBeLessThan(98);
  });

  it('throws on invalid pressure input', () => {
    expect(() => soundPressureLevelDb(0)).toThrow();
  });
});

