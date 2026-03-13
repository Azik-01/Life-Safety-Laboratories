import { Fragment, useState } from 'react';
import {
  Box,
  Chip,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const src1 = {
  label: 'Источник шума 1',
  R: [2.5, 2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5],
  L1: [80, 90, 95, 100, 100, 110, 100, 90, 90, 100],
  barrier: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};
const src2 = {
  label: 'Источник шума 2',
  R: [7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 8.5, 8.5, 8.0, 7.5],
  L1: [110, 100, 90, 80, 80, 80, 90, 90, 100, 110],
  barrier: [11, 12, 13, 14, 15, 15, 14, 13, 12, 11],
};
const src3 = {
  label: 'Источник шума 3',
  R: [7.0, 6.5, 6.0, 5.5, 5.0, 4.5, 4.0, 3.5, 3.0, 2.5],
  L1: [95, 90, 95, 100, 105, 110, 105, 100, 95, 90],
  barrier: [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
};

const barriers = [
  { id: 1, material: 'Стена кирпичная', thickness: 0.12, mass: 250 },
  { id: 2, material: 'Стена кирпичная', thickness: 0.25, mass: 470 },
  { id: 3, material: 'Стена кирпичная', thickness: 0.38, mass: 690 },
  { id: 4, material: 'Стена кирпичная', thickness: 0.52, mass: 934 },
  { id: 5, material: 'Картон в несколько слоев', thickness: 0.02, mass: 12 },
  { id: 6, material: 'Картон в несколько слоев', thickness: 0.04, mass: 24 },
  { id: 7, material: 'Войлок', thickness: 0.025, mass: 8 },
  { id: 8, material: 'Войлок', thickness: 0.05, mass: 16 },
  { id: 9, material: 'Железобетон', thickness: 0.1, mass: 240 },
  { id: 10, material: 'Железобетон', thickness: 0.2, mass: 480 },
  { id: 11, material: 'Стена из шлакобетона', thickness: 0.14, mass: 150 },
  { id: 12, material: 'Стена из шлакобетона', thickness: 0.28, mass: 300 },
  { id: 13, material: 'Перегородка из досок 0,02 м, отштукатуренная с двух сторон', thickness: 0.06, mass: 70 },
  { id: 14, material: 'Перегородка из стоек 0,1 м, отштукатуренная с двух сторон', thickness: 0.18, mass: 95 },
  { id: 15, material: 'Гипсовая перегородка', thickness: 0.11, mass: 117 },
];

const roomTable = {
  Spt: [100, 150, 200, 250, 300, 350, 400, 450, 500, 550],
  Sc: [160, 180, 200, 220, 250, 260, 280, 300, 320, 340],
  alpha1e3: [20, 25, 30, 35, 40, 45, 40, 35, 30, 25],
  alpha2e2: [95, 90, 85, 80, 75, 70, 75, 80, 85, 90],
  beta1e3: [34, 33, 32, 31, 30, 31, 32, 33, 34, 35],
  beta2e2: [75, 80, 85, 90, 95, 90, 85, 80, 75, 70],
};

const diff = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20];
const correction = [3.0, 2.5, 2.0, 1.8, 1.5, 1.2, 1.0, 0.8, 0.6, 0.5, 0.4, 0.2, 0.0];

const headSx = { fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText', whiteSpace: 'nowrap' as const };
const subSx = { fontWeight: 700, bgcolor: 'action.hover' };

interface Lab4TablesPanelProps {
  lastDigit?: number;
  penultimateDigit?: number;
}

export default function Lab4TablesPanel({ lastDigit = 0, penultimateDigit = 0 }: Lab4TablesPanelProps) {
  const [tab, setTab] = useState(0);
  const highlightLast = lastDigit === 0 ? 9 : lastDigit - 1;
  const highlightPenultimate = penultimateDigit === 0 ? 9 : penultimateDigit - 1;

  const headerCellSx = (isActive: boolean) => ({
    ...headSx,
    bgcolor: isActive ? 'secondary.main' : 'primary.main',
  });

  const bodyCellSx = (isActive: boolean) => ({
    bgcolor: isActive ? 'action.selected' : undefined,
    fontWeight: isActive ? 700 : 400,
  });

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, value: number) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Таблица 4.1 — Источники" />
        <Tab label="Таблица 4.2 — Преграды" />
        <Tab label="Таблица 4.3 — Помещение" />
        <Tab label="Таблица 4.4 — Поправка ΔL" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Используется <strong>последняя цифра</strong> номера студенческого билета. Активная колонка варианта подсвечена.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>Источник / параметр</TableCell>
                  {KEYS.map((key, index) => (
                    <TableCell key={key} align="center" sx={headerCellSx(index === highlightLast)}>
                      {key}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[src1, src2, src3].map((src) => (
                  <Fragment key={src.label}>
                    <TableRow>
                      <TableCell colSpan={11} sx={subSx}>{src.label}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>R, м</TableCell>
                      {src.R.map((value, index) => <TableCell key={index} align="center" sx={bodyCellSx(index === highlightLast)}>{value}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell>L1, дБ</TableCell>
                      {src.L1.map((value, index) => <TableCell key={index} align="center" sx={bodyCellSx(index === highlightLast)}>{value}</TableCell>)}
                    </TableRow>
                    <TableRow>
                      <TableCell>№ преграды</TableCell>
                      {src.barrier.map((value, index) => <TableCell key={index} align="center" sx={bodyCellSx(index === highlightLast)}>{value}</TableCell>)}
                    </TableRow>
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            По номеру преграды из таблицы 4.1 выбирают массу G и рассчитывают снижение N = 14,5·lg(G) + 15.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>№</TableCell>
                  <TableCell sx={headSx}>Материал и конструкция</TableCell>
                  <TableCell align="center" sx={headSx}>Толщина, м</TableCell>
                  <TableCell align="center" sx={headSx}>G, кг/м²</TableCell>
                  <TableCell align="center" sx={headSx}>N, дБ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {barriers.map((barrier) => (
                  <TableRow key={barrier.id} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                    <TableCell>{barrier.id}</TableCell>
                    <TableCell>{barrier.material}</TableCell>
                    <TableCell align="center">{barrier.thickness}</TableCell>
                    <TableCell align="center">{barrier.mass}</TableCell>
                    <TableCell align="center">
                      <Chip size="small" label={(14.5 * Math.log10(barrier.mass) + 15).toFixed(1)} color="primary" variant="outlined" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 2 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Используется <strong>предпоследняя цифра</strong> номера студенческого билета. По этой таблице считают M1 и M2 для формулы 4.6.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>Параметр</TableCell>
                  {KEYS.map((key, index) => (
                    <TableCell key={key} align="center" sx={headerCellSx(index === highlightPenultimate)}>
                      {key}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Sпт, м²</TableCell>
                  {roomTable.Spt.map((value, index) => <TableCell key={index} align="center" sx={bodyCellSx(index === highlightPenultimate)}>{value}</TableCell>)}
                </TableRow>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Sс, м²</TableCell>
                  {roomTable.Sc.map((value, index) => <TableCell key={index} align="center" sx={bodyCellSx(index === highlightPenultimate)}>{value}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell>α1 ×10⁻³</TableCell>
                  {roomTable.alpha1e3.map((value, index) => <TableCell key={index} align="center" sx={bodyCellSx(index === highlightPenultimate)}>{value}</TableCell>)}
                </TableRow>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>α2 ×10⁻²</TableCell>
                  {roomTable.alpha2e2.map((value, index) => <TableCell key={index} align="center" sx={bodyCellSx(index === highlightPenultimate)}>{value}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell>β1 ×10⁻³</TableCell>
                  {roomTable.beta1e3.map((value, index) => <TableCell key={index} align="center" sx={bodyCellSx(index === highlightPenultimate)}>{value}</TableCell>)}
                </TableRow>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>β2 ×10⁻²</TableCell>
                  {roomTable.beta2e2.map((value, index) => <TableCell key={index} align="center" sx={bodyCellSx(index === highlightPenultimate)}>{value}</TableCell>)}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 3 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Таблица 4.4 нужна для пошагового суммирования двух уровней шума: сначала берут больший уровень, затем по разности выбирают поправку ΔL.
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={headSx}>Разность уровней, дБ</TableCell>
                  {diff.map((value) => <TableCell key={value} align="center" sx={headSx}>{value}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Поправка ΔL, дБ</TableCell>
                  {correction.map((value, index) => (
                    <TableCell key={index} align="center">
                      <strong>{value}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
}
