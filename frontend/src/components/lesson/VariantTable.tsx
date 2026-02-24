import {
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import type { LabVariant } from '../../types/theme';

/* ── Human-readable labels for every variant key ── */
const LABELS: Record<string, [string, string]> = {
  /* label, unit */
  // Lesson 1
  intensityCd:      ['Сила света (I)',      'кд'],
  solidAngleSr:     ['Телесный угол (ω)',   'ср'],
  workAreaM2:       ['Площадь раб. зоны',   'м²'],
  eMaxLux:          ['Emax',                'лк'],
  eMinLux:          ['Emin',                'лк'],
  eAvgLux:          ['Ecp',                 'лк'],
  // Lesson 2
  lengthM:          ['Длина помещения (L)',  'м'],
  widthM:           ['Ширина помещения (B)', 'м'],
  heightM:          ['Высота подвеса (H)',   'м'],
  lampFluxLm:       ['Поток лампы (Φл)',     'лм'],
  eNormLux:         ['Норма освещённости (Eн)', 'лк'],
  reserveFactor:    ['Коэф. запаса (Kз)',    ''],
  nonUniformity:    ['Коэф. неравн. (z)',    ''],
  lampsPerLuminaire:['Ламп в светильнике (n)', 'шт'],
  lampPowerW:       ['Мощность лампы (Pл)',  'Вт'],
  // Lesson 3 / 4 — noise
  sourceA1mDb:      ['Источник A — L₁',     'дБ'],
  sourceB1mDb:      ['Источник B — L₁',     'дБ'],
  sourceC1mDb:      ['Источник C — L₁',     'дБ'],
  distanceA:        ['Расстояние R (A)',     'м'],
  distanceB:        ['Расстояние R (B)',     'м'],
  distanceC:        ['Расстояние R (C)',     'м'],
  distanceM:        ['Расстояние (R)',       'м'],
  barrierMassA:     ['Масса преграды A (G)', 'кг/м²'],
  barrierMassB:     ['Масса преграды B (G)', 'кг/м²'],
  barrierMassC:     ['Масса преграды C (G)', 'кг/м²'],
  barrierIdA:       ['№ преграды A',         ''],
  barrierIdB:       ['№ преграды B',         ''],
  barrierIdC:       ['№ преграды C',         ''],
  // Lesson 5 — EMI
  frequencyHz:      ['Частота (f)',          'Гц'],
  electricFieldVpm: ['Электр. поле (E)',     'В/м'],
  magneticFieldApm: ['Магн. поле (H)',       'А/м'],
  sourcePowerW:     ['Мощность источника',   'Вт'],
  sourceGain:       ['Коэф. усиления',      ''],
  reflectance:      ['Коэф. отражения',      ''],
  luminaireCount:   ['Кол-во светильников',  'шт'],
};

function formatValue(key: string, val: number): string {
  if (key === 'frequencyHz') {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)} ГГц`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)} МГц`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)} кГц`;
    return `${val} Гц`;
  }
  if (Number.isInteger(val)) return String(val);
  return val.toFixed(2);
}

interface Props {
  variants: LabVariant[];
  /** Highlight this variant number */
  activeVariant?: number;
}

/**
 * Renders a properly formatted table of variant values
 * with human-readable parameter names instead of raw JSON.
 */
export default function VariantTable({ variants, activeVariant }: Props) {
  if (variants.length === 0) return null;

  const keys = Object.keys(variants[0].values);

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText', whiteSpace: 'nowrap' }}>
              Параметр
            </TableCell>
            {variants.map((v) => (
              <TableCell
                key={`hdr-${v.variant}`}
                align="center"
                sx={{
                  fontWeight: 700,
                  bgcolor: v.variant === activeVariant ? 'primary.light' : 'primary.main',
                  color: 'primary.contrastText',
                  whiteSpace: 'nowrap',
                }}
              >
                {v.variant === 0 ? '0' : v.variant}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {keys.map((key) => {
            const [label, unit] = LABELS[key] ?? [key, ''];
            return (
              <TableRow key={key} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                  {label}{unit ? ` (${unit})` : ''}
                </TableCell>
                {variants.map((v) => (
                  <TableCell
                    key={`${key}-${v.variant}`}
                    align="center"
                    sx={{
                      bgcolor: v.variant === activeVariant ? 'action.selected' : undefined,
                      fontWeight: v.variant === activeVariant ? 700 : 400,
                    }}
                  >
                    {v.variant === activeVariant ? (
                      <Chip
                        size="small"
                        label={formatValue(key, v.values[key])}
                        color="primary"
                        variant="filled"
                      />
                    ) : (
                      formatValue(key, v.values[key])
                    )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
