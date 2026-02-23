import { describe, expect, it } from 'vitest';
import {
  classifyEmZone,
  electricFieldStrengthVpm,
  frequencyHz,
  powerFluxDensityWm2,
  wavelengthM,
} from '../../src/formulas/emi';

describe('emi formulas', () => {
  it('calculates wavelength λ = c/f', () => {
    expect(wavelengthM(100e6)).toBeCloseTo(2.9979, 3);
  });

  it('calculates frequency f = c/λ', () => {
    expect(frequencyHz(3)).toBeCloseTo(99_930_819, 0);
  });

  it('calculates power flux density PPE = E*H', () => {
    expect(powerFluxDensityWm2(20, 0.4)).toBeCloseTo(8, 6);
  });

  it('classifies near zone', () => {
    const lambda = 2;
    expect(classifyEmZone(0.1, lambda)).toBe('near');
  });

  it('classifies intermediate zone', () => {
    const lambda = 2;
    expect(classifyEmZone(1, lambda)).toBe('intermediate');
  });

  it('classifies far zone', () => {
    const lambda = 2;
    expect(classifyEmZone(5, lambda)).toBe('far');
  });

  it('computes electric field strength in far zone', () => {
    const e = electricFieldStrengthVpm(100, 10, 5);
    expect(e).toBeGreaterThan(0);
  });

  it('throws on invalid frequency', () => {
    expect(() => wavelengthM(0)).toThrow();
  });
});

