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
 * Ð£Ñ€Ð¾Ð²ÐµÐ½ÑŒ Ð·Ð²ÑƒÐºÐ¾Ð²Ð¾Ð³Ð¾ Ð´Ð°Ð²Ð»ÐµÐ½Ð¸Ñ, Ð´Ð‘.
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
 * Ð£Ñ€Ð¾Ð²ÐµÐ½ÑŒ Ð½Ð° Ñ€Ð°ÑÑÑ‚Ð¾ÑÐ½Ð¸Ð¸ R Ð¾Ñ‚ Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ°.
 * Ð¯ÐºÐ¾Ñ€ÑŒ Ð¼ÐµÑ‚Ð¾Ð´Ð¸Ñ‡ÐºÐ¸: LR = L1 - 20 * lg(R) - 8
 */
export function levelAtDistanceDb(levelAt1mDb: number, distanceM: number): number {
  assertFinite(levelAt1mDb, 'levelAt1mDb');
  assertFinitePositive(distanceM, 'distanceM');
  return levelAt1mDb - 20 * Math.log10(distanceM) - DISTANCE_LOSS_CONSTANT_DB;
}

/**
 * Ð¡Ð½Ð¸Ð¶ÐµÐ½Ð¸Ðµ ÑƒÑ€Ð¾Ð²Ð½ÐµÐ¹ Ð¿Ñ€ÐµÐ³Ñ€Ð°Ð´Ð¾Ð¹ (Ñ‡ÐµÑ€ÐµÐ· Ð¼Ð°ÑÑÑƒ 1Ð¼Â² G, ÐºÐ³/Ð¼Â²).
 * Ð¤Ð¾Ñ€Ð¼ÑƒÐ»Ð° Ð¸Ð· Ð¼ÐµÑ‚Ð¾Ð´Ð¸Ñ‡ÐºÐ¸ (Ð·Ð°Ð½ÑÑ‚Ð¸Ðµ â„–4, Ñ„Ð¾Ñ€Ð¼ÑƒÐ»Ð° 4.2):
 * N = 14.5·lg(G) + 15 дБ
 */
export function barrierReductionDbFromMass(massPerM2: number): number {
  assertFinitePositive(massPerM2, 'massPerM2');
  return 14.5 * Math.log10(massPerM2) + 15;
}

/**
 * Ð£Ñ€Ð¾Ð²ÐµÐ½ÑŒ Ð¿Ð¾ÑÐ»Ðµ Ð¿Ñ€ÐµÐ³Ñ€Ð°Ð´Ñ‹.
 * L'R = LR - N
 */
export function levelAfterBarrierDb(levelBeforeBarrierDb: number, reductionDb: number): number {
  assertFinite(levelBeforeBarrierDb, 'levelBeforeBarrierDb');
  assertFinite(reductionDb, 'reductionDb');
  return levelBeforeBarrierDb - reductionDb;
}

/**
 * ÐšÐ¾Ñ€Ñ€ÐµÐºÑ†Ð¸Ñ Î”L Ð¸Ð· Ñ‚Ð°Ð±Ð»Ð¸Ñ†Ñ‹ Ð¿Ð¾ Ñ€Ð°Ð·Ð½Ð¾ÑÑ‚Ð¸ Ð´Ð²ÑƒÑ… ÑƒÑ€Ð¾Ð²Ð½ÐµÐ¹.
 * ÐŸÑ€Ð¸ diff >= 10 Ð´Ð‘ Ð²ÐºÐ»Ð°Ð´ ÑÐ»Ð°Ð±Ð¾Ð³Ð¾ Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ° Ð¿Ñ€ÐµÐ½ÐµÐ±Ñ€ÐµÐ¶Ð¸Ð¼.
 */
export function deltaByDifferenceDb(diffDb: number): number {
  assertFinite(diffDb, 'diffDb');
  const diff = Math.abs(diffDb);

  if (diff < 0.5) return 3.0;
  if (diff < 1.5) return 2.5;
  if (diff < 2.5) return 2.0;
  if (diff < 3.5) return 1.8;
  if (diff < 4.5) return 1.5;
  if (diff < 5.5) return 1.2;
  if (diff < 6.5) return 1.0;
  if (diff < 7.5) return 0.8;
  if (diff < 8.5) return 0.6;
  if (diff < 9.5) return 0.5;
  if (diff < 12.5) return 0.4;
  if (diff < 17.5) return 0.2;
  return 0;
}

/**
 * Ð¡ÑƒÐ¼Ð¼Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ Ð´Ð²ÑƒÑ… ÑƒÑ€Ð¾Ð²Ð½ÐµÐ¹ Ð¿Ð¾ Ð¿Ñ€Ð°Ð²Ð¸Ð»Ñƒ LA + Î”L.
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
 * Ð¡Ñ‚Ñ€Ð¾Ð³Ð¾Ðµ ÑÐ½ÐµÑ€Ð³ÐµÑ‚Ð¸Ñ‡ÐµÑÐºÐ¾Ðµ ÑÑƒÐ¼Ð¼Ð¸Ñ€Ð¾Ð²Ð°Ð½Ð¸Ðµ Ð´Ð»Ñ 1..n Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ¾Ð².
 * LÎ£ = 10 * lg(Î£(10^(Li/10)))
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
 * Ð Ð°ÑÑ‡ÐµÑ‚ ÑƒÑ€Ð¾Ð²Ð½Ñ ÐºÐ°Ð¶Ð´Ð¾Ð³Ð¾ Ð¸ÑÑ‚Ð¾Ñ‡Ð½Ð¸ÐºÐ° Ð² Ñ‚Ð¾Ñ‡ÐºÐµ Ð½Ð°Ð±Ð»ÑŽÐ´ÐµÐ½Ð¸Ñ.
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


