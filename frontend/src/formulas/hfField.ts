/**
 * Lab 7 — Расчёт напряжённости поля ВЧ-диапазона
 * Shuleikin–Van-der-Pol formula, attenuation factor F, x parameter.
 */

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
 * Условие волновой зоны (формула 7.1)
 * d > 2·L²/λ  (L — максимальный размер антенны)
 */
export function isWaveZone(distanceM: number, antennaSizeM: number, wavelengthM: number): boolean {
  assertFinitePositive(distanceM, 'distanceM');
  assertFinitePositive(wavelengthM, 'wavelengthM');
  assertFiniteNonNegative(antennaSizeM, 'antennaSizeM');
  return distanceM > (2 * antennaSizeM * antennaSizeM) / wavelengthM;
}

/**
 * x для ДВ и СВ (длинных/средних волн). (формула 7.5)
 * x = π·d / (λ · √(θ² + (18000·δ/f)²))
 * Условие (7.4): 18000·δ/f ≫ θ  → можно упрощать
 */
export function xParameterDVSV(
  distanceM: number,
  wavelengthM: number,
  theta: number,
  sigma: number,
): number {
  assertFinitePositive(distanceM, 'distanceM');
  assertFinitePositive(wavelengthM, 'wavelengthM');
  assertFinitePositive(theta, 'theta');
  assertFiniteNonNegative(sigma, 'sigma');
  const f = 299_792_458 / wavelengthM;
  const term = Math.sqrt(theta * theta + (18000 * sigma / f) ** 2);
  return (Math.PI * distanceM) / (wavelengthM * term);
}

/**
 * x для КВ (коротких волн). (формула 7.6)
 * x = π·d·δ / (f · (θ² + (18000·δ/f)²))
 */
export function xParameterKV(
  distanceM: number,
  wavelengthM: number,
  theta: number,
  sigma: number,
): number {
  assertFinitePositive(distanceM, 'distanceM');
  assertFinitePositive(wavelengthM, 'wavelengthM');
  assertFinitePositive(theta, 'theta');
  assertFinitePositive(sigma, 'sigma');
  const f = 299_792_458 / wavelengthM;
  const denominator = f * (theta * theta + (18000 * sigma / f) ** 2);
  return (Math.PI * distanceM * sigma) / denominator;
}

/**
 * Множитель ослабления F(x). (формула 7.3)
 * F = 2 + 0.3·x / (2 + x + 0.6·x²)
 * Approximation valid for x > 0.
 */
export function attenuationFactorF(x: number): number {
  assertFiniteNonNegative(x, 'x');
  if (x === 0) return 1;
  return (2 + 0.3 * x) / (2 + x + 0.6 * x * x);
}

/**
 * Напряжённость поля по Шулейкину–Ван-дер-Полю, В/м. (формула 7.2)
 * E = (245·√(P·Ga)·F) / d
 * P in кВт → √(P_Вт) ... Стандартная формула: E = 245·√(P_кВт·Ga)·F / d
 */
export function fieldStrengthShuleikin(
  powerKW: number,
  gainAntenna: number,
  distanceM: number,
  fFactor: number,
): number {
  assertFinitePositive(powerKW, 'powerKW');
  assertFinitePositive(gainAntenna, 'gainAntenna');
  assertFinitePositive(distanceM, 'distanceM');
  assertFiniteNonNegative(fFactor, 'fFactor');
  return (245 * Math.sqrt(powerKW * gainAntenna) * fFactor) / distanceM;
}

/**
 * Определяет диапазон волн по длине волны.
 */
export type WaveBand = 'DV' | 'SV' | 'KV' | 'UKV' | 'SVCh';

export function classifyWaveBand(wavelengthM: number): WaveBand {
  assertFinitePositive(wavelengthM, 'wavelengthM');
  if (wavelengthM >= 1000) return 'DV';
  if (wavelengthM >= 100) return 'SV';
  if (wavelengthM >= 10) return 'KV';
  if (wavelengthM >= 1) return 'UKV';
  return 'SVCh';
}

/**
 * Полный расчёт x в зависимости от диапазона.
 */
export function xParameter(
  distanceM: number,
  wavelengthM: number,
  theta: number,
  sigma: number,
): number {
  const band = classifyWaveBand(wavelengthM);
  if (band === 'DV' || band === 'SV') {
    return xParameterDVSV(distanceM, wavelengthM, theta, sigma);
  }
  return xParameterKV(distanceM, wavelengthM, theta, sigma);
}
