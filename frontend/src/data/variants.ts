import type { LabVariant, LessonId } from '../types/theme';

/* ─── Таблица 2.1 — по последней цифре студбилета ─── */
const T2_1_L =    [11,   12,   13,   14,   15,   16,   17,   18,   19,   20  ] as const;
const T2_1_B =    [ 5,    6,    7,    8,    9,   10,   11,   12,   13,   14  ] as const;
const T2_1_H =    [ 3.4,  3.6,  3.8,  4.0,  4.2,  4.4,  4.6,  4.8,  5.0,  5.2] as const;
const T2_1_FL =   [2300, 2310, 2280, 2290, 2320, 2330, 2340, 2285, 2295, 2305] as const;
const T2_1_EN =   [ 450,  180,  100,  120,  150,  200,  250,  300,  350,  400] as const;

/* ─── Таблица 2.2 — по предпоследней цифре студбилета ─── */
const T2_2_KZ  = [0.5,  0.6,  0.7,  0.8,  0.9,  1.0,  1.1,  1.2,  1.3,  1.4 ] as const;
const T2_2_Z   = [1.00, 1.02, 1.04, 1.06, 1.07, 1.08, 1.09, 1.10, 1.12, 1.13] as const;
const T2_2_WT  = [5.0,  5.2,  5.4,  5.6,  5.8,  6.0,  6.2,  6.4,  6.6,  6.8 ] as const;
const T2_2_SN  = [200,  210,  220,  230,  240,  250,  260,  270,  280,  280 ] as const; // Sп,м²
const T2_2_N   = [1,    2,    3,    4,    5,    6,    7,    8,    9,    10  ] as const;
const T2_2_ETA = [45,   45,   45,   45,   45,   45,   45,   45,   45,   45  ] as const; // η, %
const T2_2_MU  = [1.1,  1.2,  1.3,  1.4,  1.5,  1.6,  1.7,  1.8,  1.9,  2.0 ] as const;

function lesson2Table1Values(d: number): Record<string, number> {
  return {
    lengthM:    T2_1_L[d],
    widthM:     T2_1_B[d],
    heightM:    T2_1_H[d],
    lampFluxLm: T2_1_FL[d],
    eNormLux:   T2_1_EN[d],
    // Table 2.2 placeholders — require entry of student ticket
    reserveFactor:    0,
    nonUniformity:    0,
    tabWt:            0,
    roomAreaM2:       0,
    lampsPerLuminaire:0,
    etaPct:           0,
    mu:               0,
  };
}

/** Build the full merged values for lesson 2 from both digits. */
export function lesson2MergedValues(lastDigit: number, penultimateDigit: number): Record<string, number> {
  return {
    // Table 2.1
    lengthM:     T2_1_L[lastDigit],
    widthM:      T2_1_B[lastDigit],
    heightM:     T2_1_H[lastDigit],
    lampFluxLm:  T2_1_FL[lastDigit],
    eNormLux:    T2_1_EN[lastDigit],
    // Table 2.2
    reserveFactor:     T2_2_KZ[penultimateDigit],
    nonUniformity:     T2_2_Z[penultimateDigit],
    tabWt:             T2_2_WT[penultimateDigit],
    roomAreaM2:        T2_2_SN[penultimateDigit],
    lampsPerLuminaire: T2_2_N[penultimateDigit],
    etaPct:            T2_2_ETA[penultimateDigit],
    mu:                T2_2_MU[penultimateDigit],
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

const sourceNote2 =
  'Таблица 2.1 (последняя цифра) + Таблица 2.2 (предпоследняя цифра). ' +
  'Введите номер студенческого билета для автоматического заполнения обеих таблиц.';

/* Lesson 2: 10 variants contain only Table 2.1 data (last digit).              */
/* Full merged values are built by pickVariantByTicketDigits using both digits. */
const lesson2Variants: LabVariant[] = Array.from({ length: 10 }, (_, d) => ({
  variant: d,
  ticketLastDigits: [d],
  values: lesson2Table1Values(d),
  sourceNote: sourceNote2,
  validated: true,
}));

export const lessonVariants: Record<LessonId, LabVariant[]> = {
  1: makeVariants(sourceNote, lesson1Values),
  2: lesson2Variants,
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

  if (lessonId === 2) {
    const penultimateDigit = digits.length > 1 ? Number(digits[digits.length - 2]) : 0;
    const base = lessonVariants[2].find((row) => row.ticketLastDigits.includes(lastDigit))
      ?? lessonVariants[2][0];
    return {
      ...base,
      values: lesson2MergedValues(lastDigit, penultimateDigit),
    };
  }

  return lessonVariants[lessonId].find((row) => row.ticketLastDigits.includes(lastDigit))
    ?? lessonVariants[lessonId][0];
}

