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

function lesson4Values(base: number): Record<string, number> {
  return {
    sourceA1mDb: 100 + (base % 4) * 2,
    sourceB1mDb: 92 + (base % 5) * 2,
    sourceC1mDb: 84 + (base % 4) * 2,
    distanceA: 2 + (base % 3),
    distanceB: 3 + (base % 4),
    distanceC: 5 + (base % 3),
    barrierMassA: 140 + base * 10,
    barrierMassB: 100 + base * 8,
    barrierMassC: 80 + base * 6,
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
  valuesFactory: (base: number) => Record<string, number>
): LabVariant[] {
  return Array.from({ length: 10 }, (_, variant) => ({
    variant,
    ticketLastDigits: [variant],
    values: valuesFactory(variant),
    sourceNote,
  }));
}

const sourceNote =
  'TODO: manual confirmation. Значения из таблиц PDF требуют ручной сверки по методичке.';

export const lessonVariants: Record<LessonId, LabVariant[]> = {
  1: makeVariants(sourceNote, lesson1Values),
  2: makeVariants(sourceNote, lesson2Values),
  3: makeVariants(sourceNote, lesson3Values),
  4: makeVariants(sourceNote, lesson4Values),
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

