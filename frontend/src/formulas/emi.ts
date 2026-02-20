const SPEED_OF_LIGHT = 299_792_458;

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite value > 0`);
  }
}

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a finite value >= 0`);
  }
}

/**
 * Длина волны, м.
 * λ = c / f
 */
export function wavelengthM(frequencyHz: number, speedMS = SPEED_OF_LIGHT): number {
  assertFinitePositive(frequencyHz, 'frequencyHz');
  assertFinitePositive(speedMS, 'speedMS');
  return speedMS / frequencyHz;
}

/**
 * Частота, Гц.
 * f = c / λ
 */
export function frequencyHz(wavelengthMValue: number, speedMS = SPEED_OF_LIGHT): number {
  assertFinitePositive(wavelengthMValue, 'wavelengthM');
  assertFinitePositive(speedMS, 'speedMS');
  return speedMS / wavelengthMValue;
}

/**
 * Плотность потока энергии, Вт/м^2.
 * ППЭ = E * H
 */
export function powerFluxDensityWm2(eVpm: number, hApm: number): number {
  assertFiniteNonNegative(eVpm, 'eVpm');
  assertFiniteNonNegative(hApm, 'hApm');
  return eVpm * hApm;
}

export type EmZoneType = 'near' | 'intermediate' | 'far';

/**
 * Классификация зон вокруг источника.
 * Ближняя: r < λ/(2π)
 * Промежуточная: λ/(2π) <= r < 2λ
 * Дальняя: r >= 2λ
 */
export function classifyEmZone(distanceM: number, wavelengthMeters: number): EmZoneType {
  assertFinitePositive(distanceM, 'distanceM');
  assertFinitePositive(wavelengthMeters, 'wavelengthMeters');
  const nearBoundary = wavelengthMeters / (2 * Math.PI);
  const farBoundary = 2 * wavelengthMeters;
  if (distanceM < nearBoundary) return 'near';
  if (distanceM < farBoundary) return 'intermediate';
  return 'far';
}

/**
 * Оценка напряженности поля передатчика в дальней зоне.
 * E = sqrt(30 * P * G) / R
 */
export function electricFieldStrengthVpm(
  powerW: number,
  gain: number,
  distanceM: number
): number {
  assertFinitePositive(powerW, 'powerW');
  assertFinitePositive(gain, 'gain');
  assertFinitePositive(distanceM, 'distanceM');
  return Math.sqrt(30 * powerW * gain) / distanceM;
}

