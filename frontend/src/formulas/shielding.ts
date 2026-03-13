/**
 * Lab 6 — Расчёт параметров устройств защиты от ЭМИ
 * Shield thickness, waveguide attenuation, field strength calculations.
 */

const MU_0 = 4 * Math.PI * 1e-7; // Гн/м, магнитная постоянная

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
 * Абсолютная магнитная проницаемость, Гн/м.
 * μa = μ0 · μ (формула 6.9)
 */
export function absolutePermeability(relativePermeability: number): number {
  assertFinitePositive(relativePermeability, 'relativePermeability');
  return MU_0 * relativePermeability;
}

/**
 * Напряжённость магнитного поля катушки H, А/м.
 * H = β·W·I / R  (формула 6.1, при R/r > 10 → β = 1)
 */
export function magneticFieldStrengthH(
  turns: number,
  currentA: number,
  distanceM: number,
  coilRadiusM: number,
): number {
  assertFinitePositive(turns, 'turns');
  assertFinitePositive(currentA, 'currentA');
  assertFinitePositive(distanceM, 'distanceM');
  assertFinitePositive(coilRadiusM, 'coilRadiusM');
  const beta = distanceM / coilRadiusM > 10 ? 1 : 1;
  return (beta * turns * currentA) / distanceM;
}

/**
 * Напряжённость электрического поля E, В/м.
 * E = H · 377  (плоская волна в дальней зоне, формула 6.2)
 */
export function electricFieldFromH(hApm: number): number {
  assertFiniteNonNegative(hApm, 'hApm');
  return hApm * 377;
}

/**
 * Длина волны λ, м. (формула 6.3)
 * λ = c / f
 */
export function wavelength(frequencyHz: number): number {
  assertFinitePositive(frequencyHz, 'frequencyHz');
  return 299_792_458 / frequencyHz;
}

/**
 * Плотность потока энергии ППЭ, Вт/м². (формула 6.4)
 * ППЭ = E · H
 */
export function powerFluxDensity(eVpm: number, hApm: number): number {
  assertFiniteNonNegative(eVpm, 'eVpm');
  assertFiniteNonNegative(hApm, 'hApm');
  return eVpm * hApm;
}

/**
 * Допустимая ППЭ, Вт/м². (формула 6.5)
 * ППЭ_доп = N / T, где N = 2 Вт·ч/м²
 */
export function allowablePPE(exposureTimeH: number, energyLoadWhrM2 = 2): number {
  assertFinitePositive(exposureTimeH, 'exposureTimeH');
  return energyLoadWhrM2 / exposureTimeH;
}

/**
 * Требуемое ослабление L, дБ. (формула 6.6)
 * L = 10·lg(ППЭ / ППЭ_доп)
 */
export function requiredAttenuationDb(ppeActual: number, ppeAllowable: number): number {
  assertFinitePositive(ppeActual, 'ppeActual');
  assertFinitePositive(ppeAllowable, 'ppeAllowable');
  return 10 * Math.log10(ppeActual / ppeAllowable);
}

/**
 * Коэффициент затухания α, 1/м. (формула 6.8)
 * α = √(π · f · μa · γ)
 */
export function attenuationCoefficient(
  frequencyHz: number,
  muAbsoluteHpm: number,
  conductivitySpm: number,
): number {
  assertFinitePositive(frequencyHz, 'frequencyHz');
  assertFinitePositive(muAbsoluteHpm, 'muAbsoluteHpm');
  assertFinitePositive(conductivitySpm, 'conductivitySpm');
  return Math.sqrt(Math.PI * frequencyHz * muAbsoluteHpm * conductivitySpm);
}

/**
 * Толщина экрана M, м. (формула 6.7)
 * M = L / (8.68 · α)
 * (8.68 = 20·lg(e) — перевод Нп → дБ)
 */
export function shieldThicknessM(attenuationDb: number, alphaPerM: number): number {
  assertFinitePositive(attenuationDb, 'attenuationDb');
  assertFinitePositive(alphaPerM, 'alphaPerM');
  return attenuationDb / (8.68 * alphaPerM);
}

/**
 * Ослабление волноводной трубки на 1 м, дБ/м. (формула 6.10)
 * A1 = (32 / D) · √(1 − (λ_cr/λ)²)  — если λ > λ_cr
 * Для круглого волновода λ_cr ≈ 3.41·D·√ε (загорожено)
 * Упрощённо: A1 = 32/D  при λ > λ_cr, используя ε
 */
export function waveguideAttenuationPerM(diameterM: number, epsilon: number): number {
  assertFinitePositive(diameterM, 'diameterM');
  assertFinitePositive(epsilon, 'epsilon');
  return (32 / diameterM) * Math.sqrt(epsilon);
}

/**
 * Требуемая длина трубки-волновода, м. (формула 6.11)
 * l = L / A1
 */
export function waveguideLengthM(attenuationDb: number, attenuationPerM: number): number {
  assertFinitePositive(attenuationDb, 'attenuationDb');
  assertFinitePositive(attenuationPerM, 'attenuationPerM');
  return attenuationDb / attenuationPerM;
}
