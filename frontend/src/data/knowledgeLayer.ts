import type { LessonId } from '../types/theme';
import type { FormulaBlockProps } from '../components/lesson/FormulaBlock';
import type { PracticeMethod } from '../components/lesson/AdvancedPracticeTable';
import type { Glossary } from '../components/lesson/TermHighlight';

/* ---- Raw JSON shape (matches lab-*.json) ---- */

export interface KnowledgeTheoryBlock {
  id: string;
  heading: string;
  text: string;
  keywords: string[];
}

export interface KnowledgeFormula {
  id: string;
  label: string;
  expression: string;
  imagePath?: string;
  variables: { symbol: string; description: string; unit: string }[];
  example?: { given: Record<string, number>; steps: string[]; result: string };
}

export interface KnowledgeFigure {
  id: string;
  path: string;
  caption: string;
}

export interface KnowledgeQuiz {
  question: string;
  answer: string;
}

export interface KnowledgePracticeMethod {
  id: string;
  title: string;
  description: string;
  steps?: string[];
}

export interface KnowledgeLayer {
  id: string;
  title: string;
  goal: string;
  theory: KnowledgeTheoryBlock[];
  formulas: KnowledgeFormula[];
  figures: KnowledgeFigure[];
  tables: unknown;
  practice: { methods: KnowledgePracticeMethod[] };
  quiz: KnowledgeQuiz[];
}

/* ---- Static imports ---- */

import lab1 from '../content/labs/lab-1.json';
import lab2 from '../content/labs/lab-2.json';
import lab3 from '../content/labs/lab-3.json';
import lab4 from '../content/labs/lab-4.json';
import lab5 from '../content/labs/lab-5.json';

const layers: Record<number, KnowledgeLayer> = {
  1: lab1 as unknown as KnowledgeLayer,
  2: lab2 as unknown as KnowledgeLayer,
  3: lab3 as unknown as KnowledgeLayer,
  4: lab4 as unknown as KnowledgeLayer,
  5: lab5 as unknown as KnowledgeLayer,
};

/* ---- Public API ---- */

export function getKnowledgeLayer(lessonId: LessonId): KnowledgeLayer | undefined {
  return layers[lessonId];
}

/** Convert knowledge formula into FormulaBlock props */
export function toFormulaBlockProps(formula: KnowledgeFormula): FormulaBlockProps {
  return {
    id: formula.id,
    label: formula.label,
    expression: formula.expression,
    imagePath: formula.imagePath,
    variables: formula.variables,
    example: formula.example,
  };
}

/** Build a glossary from theory blocks */
export function buildGlossary(layer: KnowledgeLayer): Glossary {
  const glossary: Glossary = {};
  for (const block of layer.theory) {
    // Use first sentence of text as the definition for each keyword
    const firstSentence = block.text.split(/[.!?]/)[0]?.trim() ?? block.text;
    for (const kw of block.keywords) {
      // Skip very short keywords (≤2 chars): formula symbols like E, H, f, G, λ
      // match inside virtually every word and produce false highlights
      if (kw.length <= 2) continue;
      if (!glossary[kw]) {
        glossary[kw] = `${block.heading}: ${firstSentence}.`;
      }
    }
  }
  return glossary;
}

/** Build practice methods with computation stubs from the knowledge layer */
export function buildPracticeMethods(lessonId: LessonId): PracticeMethod[] {
  // Lesson-specific calculation methods using real formulas
  switch (lessonId) {
    case 1:
      return [
        {
          id: 'illuminance-measurement',
          title: 'Определение освещённости',
          description: 'Расчёт освещённости по силе света и расстоянию',
          params: [
            { key: 'I', label: 'Сила света', unit: 'кд', defaultValue: 900 },
            { key: 'r', label: 'Расстояние', unit: 'м', defaultValue: 2 },
          ],
          steps: [
            {
              label: 'Освещённость E',
              formula: 'E = I / r²',
              compute: (p) => p.I / (p.r * p.r),
              resultKey: 'E',
              resultUnit: 'лк',
            },
          ],
          conclusionFn: (r) =>
            r.E >= 300
              ? `E = ${r.E.toFixed(1)} лк — норма выполняется (≥ 300 лк)`
              : `E = ${r.E.toFixed(1)} лк — норма НЕ выполняется (< 300 лк)`,
        },
      ];

    case 2:
      return [
        {
          id: 'utilization-method',
          title: 'Метод коэффициента использования',
          description: 'N = (Eн·S·Kз·z) / (n·Φл·η)',
          params: [
            { key: 'En', label: 'Eн (норма)', unit: 'лк', defaultValue: 300 },
            { key: 'S', label: 'Площадь S', unit: 'м²', defaultValue: 72 },
            { key: 'Kz', label: 'Кз', unit: '', defaultValue: 1.5 },
            { key: 'z', label: 'z (неравн.)', unit: '', defaultValue: 1.1 },
            { key: 'n', label: 'n (ламп/свет.)', unit: '', defaultValue: 2 },
            { key: 'Fl', label: 'Φл (поток)', unit: 'лм', defaultValue: 3000 },
          ],
          steps: [
            {
              label: 'Индекс помещения i',
              formula: 'i = (A·B) / (Hp·(A+B))',
              compute: () => 1.5,
              resultKey: 'i',
              resultUnit: '',
            },
            {
              label: 'η (из таблицы по i)',
              formula: 'η ≈ 0.5 (по i)',
              compute: () => 0.5,
              resultKey: 'eta',
              resultUnit: '',
            },
            {
              label: 'Число светильников N',
              formula: 'N = (Eн·S·Kз·z) / (n·Φл·η)',
              compute: (p) => Math.ceil((p.En * p.S * p.Kz * p.z) / (p.n * p.Fl * (p.eta || 0.5))),
              resultKey: 'N',
              resultUnit: 'шт.',
            },
          ],
          conclusionFn: (r) => `Необходимо ${r.N} светильников для обеспечения нормы.`,
        },
        {
          id: 'specific-power',
          title: 'Метод удельной мощности',
          description: 'Wp = αКЗ · αЗ · αЕ · Wт, затем N = (Wp · S) / (Pлампы · n)',
          params: [
            { key: 'S', label: 'Площадь', unit: 'м²', defaultValue: 72 },
            { key: 'Wt', label: 'Wт (табл.)', unit: 'Вт/м²', defaultValue: 16 },
            { key: 'aKZ', label: 'αКЗ', unit: '', defaultValue: 1.3 },
            { key: 'aZ', label: 'αЗ', unit: '', defaultValue: 1.15 },
            { key: 'aE', label: 'αЕ = Eн/100', unit: '', defaultValue: 3 },
            { key: 'Pl', label: 'Pлампы', unit: 'Вт', defaultValue: 36 },
            { key: 'n', label: 'n (ламп/свет.)', unit: '', defaultValue: 2 },
          ],
          steps: [
            {
              label: 'Удельная мощность Wp',
              formula: 'Wp = αКЗ × αЗ × αЕ × Wт',
              compute: (p) => p.aKZ * p.aZ * p.aE * p.Wt,
              resultKey: 'Wp',
              resultUnit: 'Вт/м²',
            },
            {
              label: 'Общая мощность',
              formula: 'P = Wp × S',
              compute: (p) => p.Wp * p.S,
              resultKey: 'P',
              resultUnit: 'Вт',
            },
            {
              label: 'Число светильников',
              formula: 'N = P / (Pлампы × n)',
              compute: (p) => Math.ceil(p.P / (p.Pl * p.n)),
              resultKey: 'N',
              resultUnit: 'шт.',
            },
          ],
          conclusionFn: (r) => `Необходимо ${r.N} светильников (удельная мощность Wp = ${r.Wp?.toFixed(1)} Вт/м²).`,
        },
        {
          id: 'luminous-lines',
          title: 'Метод светящихся линий',
          description: 'Формулы 2.16–2.19: расчёт числа рядов и светильников в ряду.',
          params: [
            { key: 'L', label: 'Длина помещения', unit: 'м', defaultValue: 12 },
            { key: 'B', label: 'Ширина помещения', unit: 'м', defaultValue: 6 },
            { key: 'H', label: 'Высота подвеса Hp', unit: 'м', defaultValue: 2.7 },
            { key: 'Lsv', label: 'Длина светильника', unit: 'м', defaultValue: 1.27 },
          ],
          steps: [
            {
              label: 'Длина ряда l',
              formula: 'l = 0.5 × L\'  (L\' ≈ L)',
              compute: (p) => 0.5 * p.L,
              resultKey: 'rowLen',
              resultUnit: 'м',
            },
            {
              label: 'Светильников в ряду N1',
              formula: 'N₁ = l / Lсв (округл. вверх)',
              compute: (p) => Math.ceil(p.rowLen / p.Lsv),
              resultKey: 'N1',
              resultUnit: 'шт.',
            },
            {
              label: 'Число рядов',
              formula: 'Ряды = B / (Hp × 1.6) (округл.)',
              compute: (p) => Math.max(1, Math.round(p.B / (p.H * 1.6))),
              resultKey: 'rows',
              resultUnit: '',
            },
            {
              label: 'Общее число N',
              formula: 'N = N₁ × Ряды',
              compute: (p) => p.N1 * p.rows,
              resultKey: 'N',
              resultUnit: 'шт.',
            },
          ],
          conclusionFn: (r) => `Необходимо ${r.N} светильников (${r.N1} в ряду × ${r.rows} рядов).`,
        },
      ];

    case 4:
      return [
        {
          id: 'noise-calculation',
          title: 'Расчёт интенсивности шума',
          description:
            'Пошаговый расчёт по формулам 4.1–4.8: от уровня источников до итогового L\'Σ.',
          params: [
            { key: 'L1', label: 'L₁ (источник 1)', unit: 'дБ', defaultValue: 100 },
            { key: 'R1', label: 'R₁', unit: 'м', defaultValue: 4 },
            { key: 'G1', label: 'G₁ (масса преграды 1)', unit: 'кг/м²', defaultValue: 250 },
            { key: 'L2', label: 'L₂ (источник 2)', unit: 'дБ', defaultValue: 90 },
            { key: 'R2', label: 'R₂', unit: 'м', defaultValue: 8 },
            { key: 'G2', label: 'G₂ (масса преграды 2)', unit: 'кг/м²', defaultValue: 300 },
            { key: 'L3', label: 'L₃ (источник 3)', unit: 'дБ', defaultValue: 85 },
            { key: 'R3', label: 'R₃', unit: 'м', defaultValue: 6 },
            { key: 'G3', label: 'G₃ (масса преграды 3)', unit: 'кг/м²', defaultValue: 200 },
          ],
          steps: [
            {
              label: 'LR₁ на расстоянии R₁',
              formula: 'LR = L₁ − 20·lg(R) − 8',
              compute: (p) => p.L1 - 20 * Math.log10(Math.max(0.1, p.R1)) - 8,
              resultKey: 'LR1',
              resultUnit: 'дБ',
            },
            {
              label: 'N₁ (снижение преградой 1)',
              formula: 'N = 14,5·lg(G) + 15',
              compute: (p) => 14.5 * Math.log10(Math.max(1, p.G1)) + 15,
              resultKey: 'N1',
              resultUnit: 'дБ',
            },
            {
              label: 'L\'R₁ (после преграды)',
              formula: 'L\'R = LR − N',
              compute: (p) => p.LR1 - p.N1,
              resultKey: 'LpR1',
              resultUnit: 'дБ',
            },
            {
              label: 'LR₂ на расстоянии R₂',
              formula: 'LR = L₂ − 20·lg(R) − 8',
              compute: (p) => p.L2 - 20 * Math.log10(Math.max(0.1, p.R2)) - 8,
              resultKey: 'LR2',
              resultUnit: 'дБ',
            },
            {
              label: 'N₂ (снижение преградой 2)',
              formula: 'N = 14,5·lg(G) + 15',
              compute: (p) => 14.5 * Math.log10(Math.max(1, p.G2)) + 15,
              resultKey: 'N2',
              resultUnit: 'дБ',
            },
            {
              label: 'L\'R₂ (после преграды)',
              formula: 'L\'R = LR − N',
              compute: (p) => p.LR2 - p.N2,
              resultKey: 'LpR2',
              resultUnit: 'дБ',
            },
            {
              label: 'LR₃ на расстоянии R₃',
              formula: 'LR = L₃ − 20·lg(R) − 8',
              compute: (p) => p.L3 - 20 * Math.log10(Math.max(0.1, p.R3)) - 8,
              resultKey: 'LR3',
              resultUnit: 'дБ',
            },
            {
              label: 'N₃ (снижение преградой 3)',
              formula: 'N = 14,5·lg(G) + 15',
              compute: (p) => 14.5 * Math.log10(Math.max(1, p.G3)) + 15,
              resultKey: 'N3',
              resultUnit: 'дБ',
            },
            {
              label: 'L\'R₃ (после преграды)',
              formula: 'L\'R = LR − N',
              compute: (p) => p.LR3 - p.N3,
              resultKey: 'LpR3',
              resultUnit: 'дБ',
            },
            {
              label: 'LΣ (суммарный от 3 источников)',
              formula: 'LΣ = 10·lg(10^(L₁/10) + 10^(L₂/10) + 10^(L₃/10))',
              compute: (p) =>
                10 *
                Math.log10(
                  Math.pow(10, Math.max(-100, p.LpR1) / 10) +
                    Math.pow(10, Math.max(-100, p.LpR2) / 10) +
                    Math.pow(10, Math.max(-100, p.LpR3) / 10),
                ),
              resultKey: 'Lsum',
              resultUnit: 'дБ',
            },
          ],
          conclusionFn: (r) =>
            r.Lsum <= 40
              ? `LΣ = ${r.Lsum.toFixed(1)} дБ — в пределах нормы (≤ 40 дБ)`
              : `LΣ = ${r.Lsum.toFixed(1)} дБ — превышает комфортный уровень 40 дБ`,
        },
      ];

    case 5:
      return [
        {
          id: 'emi-analysis',
          title: 'Анализ ЭМИ',
          description: 'Определение длины волны и ППЭ по заданным параметрам.',
          params: [
            { key: 'f', label: 'Частота', unit: 'МГц', defaultValue: 2450 },
            { key: 'E', label: 'E', unit: 'В/м', defaultValue: 14 },
            { key: 'H', label: 'H', unit: 'А/м', defaultValue: 0.45 },
          ],
          steps: [
            {
              label: 'Длина волны λ',
              formula: 'λ = c / f',
              compute: (p) => 299792458 / (p.f * 1e6),
              resultKey: 'lambda',
              resultUnit: 'м',
            },
            {
              label: 'ППЭ',
              formula: 'ППЭ = E × H',
              compute: (p) => p.E * p.H,
              resultKey: 'PPE',
              resultUnit: 'Вт/м²',
            },
          ],
          conclusionFn: (r) =>
            r.PPE <= 10
              ? `ППЭ = ${r.PPE.toFixed(3)} Вт/м² — ниже теплового порога`
              : `ППЭ = ${r.PPE.toFixed(3)} Вт/м² — превышает тепловой порог 10 мВт/см²!`,
        },
      ];

    default:
      return [];
  }
}
