const DEFAULT_WORK_PLANE_OFFSET_M = 0.3;

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
 * Световой поток, лм.
 * Формула: Φ = I * ω
 */
export function luminousFlux(intensityCd: number, solidAngleSr: number): number {
  assertFiniteNonNegative(intensityCd, 'intensityCd');
  assertFiniteNonNegative(solidAngleSr, 'solidAngleSr');
  return intensityCd * solidAngleSr;
}

/**
 * Освещенность, лк.
 * Формула: E = Φ / S
 */
export function illuminanceFromFlux(fluxLm: number, areaM2: number): number {
  assertFiniteNonNegative(fluxLm, 'fluxLm');
  assertFinitePositive(areaM2, 'areaM2');
  return fluxLm / areaM2;
}

/**
 * Яркость, кд/м^2.
 * Формула: B = I / S
 */
export function brightness(intensityCd: number, areaM2: number): number {
  assertFiniteNonNegative(intensityCd, 'intensityCd');
  assertFinitePositive(areaM2, 'areaM2');
  return intensityCd / areaM2;
}

/**
 * Коэффициент пульсации освещенности, %.
 * Формула: Kп = (Emax - Emin) / (2 * Eavg) * 100
 */
export function pulsationCoefficientPercent(
  eMaxLux: number,
  eMinLux: number,
  eAvgLux: number
): number {
  assertFiniteNonNegative(eMaxLux, 'eMaxLux');
  assertFiniteNonNegative(eMinLux, 'eMinLux');
  assertFinitePositive(eAvgLux, 'eAvgLux');
  if (eMaxLux < eMinLux) {
    throw new Error('eMaxLux must be >= eMinLux');
  }
  return ((eMaxLux - eMinLux) / (2 * eAvgLux)) * 100;
}

/**
 * Высота подвеса светильника над рабочей плоскостью, м.
 * Формула: Hp = H - 0.3
 */
export function suspensionHeight(
  roomHeightM: number,
  workPlaneOffsetM = DEFAULT_WORK_PLANE_OFFSET_M
): number {
  assertFinitePositive(roomHeightM, 'roomHeightM');
  assertFiniteNonNegative(workPlaneOffsetM, 'workPlaneOffsetM');
  const hp = roomHeightM - workPlaneOffsetM;
  if (hp <= 0) {
    throw new Error('suspension height must be > 0');
  }
  return hp;
}

/**
 * Индекс помещения.
 * Формула: i = (L * B) / (Hp * (L + B))
 */
export function roomIndex(lengthM: number, widthM: number, hpM: number): number {
  assertFinitePositive(lengthM, 'lengthM');
  assertFinitePositive(widthM, 'widthM');
  assertFinitePositive(hpM, 'hpM');
  return (lengthM * widthM) / (hpM * (lengthM + widthM));
}

export interface UtilizationMethodInput {
  eNormLux: number;
  areaM2: number;
  reserveFactor: number;
  nonUniformityFactor: number;
  lampsPerLuminaire: number;
  lampFluxLm: number;
  utilizationFactor: number;
}

/**
 * Расчет количества светильников методом коэффициента использования.
 * Формула: N = (Eн * S * Kз * z) / (n * Φл * η)
 */
export function luminairesByUtilization(input: UtilizationMethodInput): number {
  assertFinitePositive(input.eNormLux, 'eNormLux');
  assertFinitePositive(input.areaM2, 'areaM2');
  assertFinitePositive(input.reserveFactor, 'reserveFactor');
  assertFinitePositive(input.nonUniformityFactor, 'nonUniformityFactor');
  assertFinitePositive(input.lampsPerLuminaire, 'lampsPerLuminaire');
  assertFinitePositive(input.lampFluxLm, 'lampFluxLm');
  assertFinitePositive(input.utilizationFactor, 'utilizationFactor');

  const value =
    (input.eNormLux * input.areaM2 * input.reserveFactor * input.nonUniformityFactor) /
    (input.lampsPerLuminaire * input.lampFluxLm * input.utilizationFactor);

  return Math.max(1, Math.ceil(value));
}

/**
 * Метод удельной мощности (якорь методички): P = 40 * B.
 * Здесь B - ширина помещения, м.
 * Возвращает удельную мощность, Вт/м^2.
 */
export function specificPowerByWidth(widthM: number): number {
  assertFinitePositive(widthM, 'widthM');
  return 40 * widthM;
}

export interface SpecificPowerMethodInput {
  areaM2: number;
  widthM: number;
  lampPowerW: number;
  lampsPerLuminaire: number;
}

/**
 * Количество светильников методом удельной мощности.
 * N = (Pуд * S) / (Pлампы * n)
 */
export function luminairesBySpecificPower(input: SpecificPowerMethodInput): number {
  assertFinitePositive(input.areaM2, 'areaM2');
  assertFinitePositive(input.widthM, 'widthM');
  assertFinitePositive(input.lampPowerW, 'lampPowerW');
  assertFinitePositive(input.lampsPerLuminaire, 'lampsPerLuminaire');

  const specificPowerWm2 = specificPowerByWidth(input.widthM);
  const totalPowerW = specificPowerWm2 * input.areaM2;
  const luminaires = totalPowerW / (input.lampPowerW * input.lampsPerLuminaire);
  return Math.max(1, Math.ceil(luminaires));
}

export function mean(values: number[]): number {
  if (values.length === 0) {
    throw new Error('values must not be empty');
  }
  const total = values.reduce((acc, value) => {
    assertFiniteNonNegative(value, 'measurement');
    return acc + value;
  }, 0);
  return total / values.length;
}



export interface RealisticIlluminanceInput {
  intensityCd: number;
  distanceM: number;
  luminaireCount?: number;
  reflectance?: number;
  utilizationFactor?: number;
  maintenanceFactor?: number;
}

/**
 * Расширенная оценка освещенности рабочего места
 * с учетом числа светильников, отражений, использования и запаса.
 */
export function realisticIlluminanceLux(input: RealisticIlluminanceInput): number {
  assertFiniteNonNegative(input.intensityCd, 'intensityCd');
  assertFinitePositive(input.distanceM, 'distanceM');

  const luminaireCount = Math.max(1, input.luminaireCount ?? 1);
  const reflectance = Math.min(0.95, Math.max(0, input.reflectance ?? 0.3));
  const utilizationFactor = Math.min(1, Math.max(0.2, input.utilizationFactor ?? 0.6));
  const maintenanceFactor = Math.min(1.2, Math.max(0.5, input.maintenanceFactor ?? 0.85));

  const direct = input.intensityCd / (input.distanceM * input.distanceM);
  const reflectedGain = 1 + reflectance * 0.35;
  const value = direct * luminaireCount * utilizationFactor * maintenanceFactor * reflectedGain;
  return Math.max(0, value);
}
