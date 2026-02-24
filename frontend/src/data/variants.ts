import type { LabVariant, LessonId } from '../types/theme';

function lesson2Values(base: number): Record<string, number> {
  return {
    lengthM: 12 + base,
    widthM: 6 + (base % 4),
    heightM: 3 + (base % 3) * 0.5,
    lampFluxLm: 3000 + base * 220,
    eNormLux: 200 + (base % 5) * 50,
    reserveFactor: 1.4 + (base % 3) * 0.1,
    nonUniformity: 1.1,
    lampsPerLuminaire: 2,
    lampPowerW: 40 + (base % 4) * 20,
  };
}

function lesson1Values(base: number): Record<string, number> {
  return {
    intensityCd: 700 + base * 80,
    solidAngleSr: 1 + (base % 4) * 0.2,
    workAreaM2: 0.8 + (base % 3) * 0.2,
    heightM: 2.5 + (base % 4) * 0.2,
    distanceM: 0.5 + (base % 5) * 0.2,
    eMaxLux: 420 + base * 12,
    eMinLux: 280 + base * 9,
    eAvgLux: 350 + base * 10,
  };
}

function lesson3Values(base: number): Record<string, number> {
  return {
    sourceA1mDb: 96 + (base % 4) * 2,
    sourceB1mDb: 88 + (base % 5) * 2,
    sourceC1mDb: 82 + (base % 4) * 2,
    distanceA: 2 + (base % 4),
    distanceB: 3 + (base % 5),
    distanceC: 4 + (base % 4),
    barrierMassA: 120 + base * 10,
    barrierMassB: 90 + base * 8,
    barrierMassC: 70 + base * 6,
  };
}

function lesson4Values(digit: number): Record<string, number> {
  // Barrier mass lookup from Table 4.2
  const G: Record<number, number> = {
    1: 250, 2: 470, 3: 690, 4: 934, 5: 12, 6: 24,
    7: 8, 8: 16, 9: 240, 10: 480,
    11: 150, 12: 300, 13: 70, 14: 95, 15: 117,
  };
  // Table 4.1 — arrays indexed where [0]=digit 1, [1]=digit 2, …, [8]=digit 9, [9]=digit 0
  const R1  = [2.5, 2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5];
  const L1a = [80,  90,  95,  100, 100, 110, 100, 90,  90,  100];
  const b1  = [1,   2,   3,   4,   5,   6,   7,   8,   9,   10];
  const R2  = [7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 8.5, 8.5, 8.0, 7.5];
  const L1b = [110, 100, 90,  80,  80,  80,  90,  90,  100, 110];
  const b2  = [11,  12,  13,  14,  15,  15,  14,  13,  12,  11];
  const R3  = [7.0, 6.5, 6.0, 5.5, 5.0, 4.5, 4.0, 3.5, 3.0, 2.5];
  const L1c = [95,  90,  95,  100, 105, 110, 105, 100, 95,  90];
  const b3  = [10,  9,   8,   7,   6,   5,   4,   3,   2,   1];
  // digit 1→idx 0, digit 2→idx 1, …, digit 9→idx 8, digit 0→idx 9
  const idx = digit === 0 ? 9 : digit - 1;
  return {
    sourceA1mDb: L1a[idx],
    sourceB1mDb: L1b[idx],
    sourceC1mDb: L1c[idx],
    distanceA: R1[idx],
    distanceB: R2[idx],
    distanceC: R3[idx],
    barrierMassA: G[b1[idx]],
    barrierMassB: G[b2[idx]],
    barrierMassC: G[b3[idx]],
    barrierIdA: b1[idx],
    barrierIdB: b2[idx],
    barrierIdC: b3[idx],
  };
}

function lesson5Values(base: number): Record<string, number> {
  return {
    frequencyHz: 1.5e6 + base * 0.3e6,
    electricFieldVpm: 10 + base,
    magneticFieldApm: 0.05 + base * 0.01,
    distanceM: 0.4 + base * 0.08,
    sourcePowerW: 60 + base * 15,
    sourceGain: 8 + (base % 5),
  };
}

function makeVariants(
  sourceNote: string,
  valuesFactory: (base: number) => Record<string, number>,
  validated = false,
): LabVariant[] {
  return Array.from({ length: 10 }, (_, variant) => ({
    variant,
    ticketLastDigits: [variant],
    values: valuesFactory(variant),
    sourceNote,
    validated,
  }));
}

const sourceNote =
  'Данные вариантов перенесены в приложение и требуют верификации по files/labs doc/lab txt 1.txt ... 5.txt (и PDF в той же папке).';

const sourceNote4 =
  'Данные верифицированы по Таблицам 4.1 и 4.2 методички (labs doc/lab txt 4.txt). ' +
  'Масса преграды (G) подставляется автоматически по номеру из Таблицы 4.2.';

export const lessonVariants: Record<LessonId, LabVariant[]> = {
  1: makeVariants(sourceNote, lesson1Values),
  2: makeVariants(sourceNote, lesson2Values),
  3: makeVariants(sourceNote, lesson3Values),
  4: makeVariants(sourceNote4, lesson4Values, true),
  5: makeVariants(sourceNote, lesson5Values),
};

export function pickVariantByTicketDigits(
  lessonId: LessonId,
  ticketInput: string
): LabVariant {
  const digits = ticketInput.replace(/\D/g, '');
  const lastDigit = digits.length > 0 ? Number(digits[digits.length - 1]) : 0;
  return lessonVariants[lessonId].find((row) => row.ticketLastDigits.includes(lastDigit))
    ?? lessonVariants[lessonId][0];
}

