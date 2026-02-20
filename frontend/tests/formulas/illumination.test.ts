import { describe, expect, it } from 'vitest';
import {
  brightness,
  illuminanceFromFlux,
  luminairesBySpecificPower,
  luminairesByUtilization,
  luminousFlux,
  mean,
  pulsationCoefficientPercent,
  roomIndex,
  specificPowerByWidth,
  suspensionHeight,
} from '../../src/formulas/illumination';

describe('illumination formulas', () => {
  it('calculates luminous flux Φ = I*ω', () => {
    expect(luminousFlux(800, 1.5)).toBeCloseTo(1200, 6);
  });

  it('calculates illuminance E = Φ/S', () => {
    expect(illuminanceFromFlux(1500, 5)).toBeCloseTo(300, 6);
  });

  it('calculates brightness B = I/S', () => {
    expect(brightness(400, 0.5)).toBeCloseTo(800, 6);
  });

  it('calculates pulsation coefficient', () => {
    expect(pulsationCoefficientPercent(420, 280, 350)).toBeCloseTo(20, 6);
  });

  it('calculates suspension height Hp = H-0.3', () => {
    expect(suspensionHeight(3.8)).toBeCloseTo(3.5, 6);
  });

  it('calculates room index', () => {
    expect(roomIndex(12, 8, 3.2)).toBeCloseTo(1.5, 3);
  });

  it('calculates luminaires count by utilization method', () => {
    const result = luminairesByUtilization({
      eNormLux: 300,
      areaM2: 120,
      reserveFactor: 1.5,
      nonUniformityFactor: 1.1,
      lampsPerLuminaire: 2,
      lampFluxLm: 3200,
      utilizationFactor: 0.52,
    });
    expect(result).toBeGreaterThanOrEqual(1);
  });

  it('calculates specific power method and rounds up count', () => {
    const p = specificPowerByWidth(6);
    expect(p).toBeCloseTo(240, 6);
    const n = luminairesBySpecificPower({
      areaM2: 90,
      widthM: 6,
      lampPowerW: 80,
      lampsPerLuminaire: 2,
    });
    expect(n).toBeGreaterThan(0);
  });

  it('calculates arithmetic mean for measurement series', () => {
    expect(mean([100, 200, 300])).toBeCloseTo(200, 6);
  });

  it('throws on invalid area', () => {
    expect(() => illuminanceFromFlux(100, 0)).toThrow();
  });
});

