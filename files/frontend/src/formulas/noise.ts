const REFERENCE_PRESSURE_PA = 2e-5;
const DISTANCE_LOSS_CONSTANT_DB = 8;

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be a finite value > 0`);
  }
}

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be finite`);
  }
}

/**
 * Уровень звукового давления, дБ.
 * L = 20 * lg(p / p0)
 */
export function soundPressureLevelDb(
  pressurePa: number,
  referencePressurePa = REFERENCE_PRESSURE_PA
): number {
  assertFinitePositive(pressurePa, 'pressurePa');
  assertFinitePositive(referencePressurePa, 'referencePressurePa');
  return 20 * Math.log10(pressurePa / referencePressurePa);
}

/**
 * Уровень на расстоянии R от источника.
 * Якорь методички: LR = L1 - 20 * lg(R) - 8
 */
export function levelAtDistanceDb(levelAt1mDb: number, distanceM: number): number {
  assertFinite(levelAt1mDb, 'levelAt1mDb');
  assertFinitePositive(distanceM, 'distanceM');
  return levelAt1mDb - 20 * Math.log10(distanceM) - DISTANCE_LOSS_CONSTANT_DB;
}

/**
 * Снижение уровней преградой (через массу 1м² G, кг/м²).
 * Формула из методички (занятие №4, формула 4.2):
 * N = 14.5 + 15·lg(G) дБ
 */
export function barrierReductionDbFromMass(massPerM2: number): number {
  assertFinitePositive(massPerM2, 'massPerM2');
  return 14.5 + 15 * Math.log10(massPerM2);
}

/**
 * Уровень после преграды.
 * L'R = LR - N
 */
export function levelAfterBarrierDb(levelBeforeBarrierDb: number, reductionDb: number): number {
  assertFinite(levelBeforeBarrierDb, 'levelBeforeBarrierDb');
  assertFinite(reductionDb, 'reductionDb');
  return levelBeforeBarrierDb - reductionDb;
}

/**
 * Коррекция ΔL из таблицы по разности двух уровней.
 * При diff >= 10 дБ вклад слабого источника пренебрежим.
 */
export function deltaByDifferenceDb(diffDb: number): number {
  assertFinite(diffDb, 'diffDb');
  const diff = Math.abs(diffDb);

  if (diff < 0.5) return 3.0;
  if (diff < 1.5) return 2.5;
  if (diff < 2.5) return 2.1;
  if (diff < 3.5) return 1.8;
  if (diff < 4.5) return 1.5;
  if (diff < 5.5) return 1.2;
  if (diff < 6.5) return 1.0;
  if (diff < 7.5) return 0.8;
  if (diff < 8.5) return 0.6;
  if (diff < 9.5) return 0.5;
  return 0;
}

/**
 * Суммирование двух уровней по правилу LA + ΔL.
 */
export function sumTwoLevelsByDeltaDb(levelA: number, levelB: number): number {
  assertFinite(levelA, 'levelA');
  assertFinite(levelB, 'levelB');
  const maxLevel = Math.max(levelA, levelB);
  const minLevel = Math.min(levelA, levelB);
  const delta = deltaByDifferenceDb(maxLevel - minLevel);
  return maxLevel + delta;
}

/**
 * Строгое энергетическое суммирование для 1..n источников.
 * LΣ = 10 * lg(Σ(10^(Li/10)))
 */
export function sumLevelsEnergyDb(levelsDb: number[]): number {
  if (levelsDb.length === 0) {
    throw new Error('levelsDb must not be empty');
  }
  const energy = levelsDb.reduce((acc, level) => {
    assertFinite(level, 'level');
    return acc + 10 ** (level / 10);
  }, 0);
  return 10 * Math.log10(energy);
}

export interface NoiseSourceInput {
  levelAt1mDb: number;
  distanceM: number;
  barrierMassPerM2?: number;
  enabled?: boolean;
}

/**
 * Расчет уровня каждого источника в точке наблюдения.
 */
export function sourceLevelAtObserver(input: NoiseSourceInput): number {
  if (input.enabled === false) {
    return Number.NEGATIVE_INFINITY;
  }
  const atDistance = levelAtDistanceDb(input.levelAt1mDb, input.distanceM);
  if (!input.barrierMassPerM2) {
    return atDistance;
  }
  const reduction = barrierReductionDbFromMass(input.barrierMassPerM2);
  return levelAfterBarrierDb(atDistance, reduction);
}

