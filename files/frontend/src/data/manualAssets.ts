export interface ManualAsset {
  id: string;
  lessonId: 1 | 2 | 3 | 4 | 5;
  path: string;
  caption: string;
  alt: string;
  pageHint: string;
}

export const manualAssets: ManualAsset[] = [
  {
    id: 'l1-spectrum',
    lessonId: 1,
    path: '/assets/manual/images/page-015-img-01.jpeg',
    caption: 'Классификация освещения и визуальные условия рабочей зоны',
    alt: 'Схема производственного освещения из методички',
    pageHint: 'стр. ~15',
  },
  {
    id: 'l1-pulsation',
    lessonId: 1,
    path: '/assets/manual/images/page-017-img-01.png',
    caption: 'Пульсация светового потока и стробоскопический эффект',
    alt: 'Иллюстрация пульсации освещенности из методички',
    pageHint: 'стр. ~17',
  },
  {
    id: 'l2-layout',
    lessonId: 2,
    path: '/assets/manual/images/page-034-img-01.jpeg',
    caption: 'Схема расчета освещения методом коэффициента использования',
    alt: 'План помещения и размещение светильников',
    pageHint: 'стр. ~34',
  },
  {
    id: 'l2-table',
    lessonId: 2,
    path: '/assets/manual/images/page-039-img-01.png',
    caption: 'Табличные данные для расчета освещения (варианты)',
    alt: 'Таблица вариантов для расчета освещенности',
    pageHint: 'стр. ~39',
  },
  {
    id: 'l3-noise',
    lessonId: 3,
    path: '/assets/manual/images/page-056-img-01.png',
    caption: 'Шкалы и источники производственного шума',
    alt: 'Иллюстрация по шуму и уровням дБ',
    pageHint: 'стр. ~56',
  },
  {
    id: 'l3-barrier',
    lessonId: 3,
    path: '/assets/manual/images/page-058-img-01.png',
    caption: 'Влияние ограждающих конструкций на уровень шума',
    alt: 'Схема звукоизоляции преград',
    pageHint: 'стр. ~58',
  },
  {
    id: 'l4-delta',
    lessonId: 4,
    path: '/assets/manual/images/page-066-img-01.jpeg',
    caption: 'Таблица поправок ΔL для суммирования источников',
    alt: 'Таблица поправок для логарифмического суммирования уровней шума',
    pageHint: 'стр. ~66',
  },
  {
    id: 'l4-cases',
    lessonId: 4,
    path: '/assets/manual/images/page-067-img-01.png',
    caption: 'Сценарные варианты расчета уровней в контрольной точке',
    alt: 'Сценарные данные для расчета шума',
    pageHint: 'стр. ~67',
  },
  {
    id: 'l5-spectrum',
    lessonId: 5,
    path: '/assets/manual/images/page-093-img-01.png',
    caption: 'Шкала электромагнитных излучений и примеры источников',
    alt: 'Электромагнитный спектр из методички',
    pageHint: 'стр. ~93',
  },
  {
    id: 'l5-zones',
    lessonId: 5,
    path: '/assets/manual/images/page-094-img-01.jpeg',
    caption: 'Зоны вокруг источника электромагнитного излучения',
    alt: 'Ближняя, промежуточная и дальняя зоны вокруг источника',
    pageHint: 'стр. ~94',
  },
];

export function assetsByLesson(lessonId: 1 | 2 | 3 | 4 | 5): ManualAsset[] {
  return manualAssets.filter((asset) => asset.lessonId === lessonId);
}

