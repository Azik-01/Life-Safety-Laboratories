import { useState } from 'react';
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

/* ── Raw data from Table 4.1 of lab text ── */
const KEYS_LAST = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
const KEYS_PENULT = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const src1 = {
  label: 'Источник шума 1',
  R:       [2.5, 2.0, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5],
  L1:      [80,  90,  95,  100, 100, 110, 100, 90,  90,  100],
  barrier: [1,   2,   3,   4,   5,   6,   7,   8,   9,   10],
};
const src2 = {
  label: 'Источник шума 2',
  R:       [7.0, 7.5, 8.0, 8.5, 9.0, 9.5, 8.5, 8.5, 8.0, 7.5],
  L1:      [110, 100, 90,  80,  80,  80,  90,  90,  100, 110],
  barrier: [11,  12,  13,  14,  15,  15,  14,  13,  12,  11],
};
const src3 = {
  label: 'Источник шума 3',
  R:       [7.0, 6.5, 6.0, 5.5, 5.0, 4.5, 4.0, 3.5, 3.0, 2.5],
  L1:      [95,  90,  95,  100, 105, 110, 105, 100, 95,  90],
  barrier: [10,  9,   8,   7,   6,   5,   4,   3,   2,   1],
};

/* ── Table 4.2 ── */
const BARRIERS = [
  { id: 1,  material: 'Стена кирпичная',                                             thickness: 0.12, mass: 250 },
  { id: 2,  material: 'Стена кирпичная',                                             thickness: 0.25, mass: 470 },
  { id: 3,  material: 'Стена кирпичная',                                             thickness: 0.38, mass: 690 },
  { id: 4,  material: 'Стена кирпичная',                                             thickness: 0.52, mass: 934 },
  { id: 5,  material: 'Картон в несколько слоев',                                    thickness: 0.02, mass: 12  },
  { id: 6,  material: 'Картон в несколько слоев',                                    thickness: 0.04, mass: 24  },
  { id: 7,  material: 'Войлок',                                                      thickness: 0.025,mass: 8   },
  { id: 8,  material: 'Войлок',                                                      thickness: 0.05, mass: 16  },
  { id: 9,  material: 'Железобетон',                                                 thickness: 0.1,  mass: 240 },
  { id: 10, material: 'Железобетон',                                                 thickness: 0.2,  mass: 480 },
  { id: 11, material: 'Стена из шлакобетона',                                        thickness: 0.14, mass: 150 },
  { id: 12, material: 'Стена из шлакобетона',                                        thickness: 0.28, mass: 300 },
  { id: 13, material: 'Перегородка из досок 0,02 м, отштукатуренная с двух сторон', thickness: 0.06, mass: 70  },
  { id: 14, material: 'Перегородка из стоек 0,1 м, отштукатуренная с двух сторон',  thickness: 0.18, mass: 95  },
  { id: 15, material: 'Гипсовая перегородка',                                        thickness: 0.11, mass: 117 },
];

/* ── Table 4.3 ── */
const T43 = {
  Spt:       [100, 150, 200, 250, 300, 350, 400, 450, 500, 550],
  Sc:        [160, 180, 200, 220, 250, 260, 280, 300, 320, 340],
  alpha1_e3: [20,  25,  30,  35,  40,  45,  40,  35,  30,  25],
  alpha2_e2: [95,  90,  85,  80,  75,  70,  75,  80,  85,  90],
  beta1_e3:  [34,  33,  32,  31,  30,  31,  32,  33,  34,  35],
  beta2_e2:  [75,  80,  85,  90,  95,  90,  85,  80,  75,  70],
};

/* ── Table 4.4 ── */
const DIFF       = [0,   1,   2,   3,   4,   5,   6,   7,   8,   9,   10,  15,  20];
const CORRECTION = [3.0, 2.5, 2.0, 1.8, 1.5, 1.2, 1.0, 0.8, 0.6, 0.5, 0.4, 0.2, 0];

const HEAD_SX = { fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText', whiteSpace: 'nowrap' as const };
const SUB_SX  = { fontWeight: 700, bgcolor: 'action.hover' };

export default function Lab4TablesPanel() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v: number) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 1.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Таблица 4.1 — Исходные данные" />
        <Tab label="Таблица 4.2 — Преграды" />
        <Tab label="Таблица 4.3 — Помещение" />
        <Tab label="Таблица 4.4 — Поправка ΔL" />
      </Tabs>

      {/* ─── Table 4.1 ─── */}
      {tab === 0 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            По <strong>последней цифре</strong> номера студенческого билета.
            Для каждого источника указывается: расстояние R (м), уровень на 1 м L₁ (дБ), номер преграды (→ Таблица 4.2).
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={HEAD_SX}>Источник / параметр</TableCell>
                  {KEYS_LAST.map((k) => (
                    <TableCell key={k} align="center" sx={HEAD_SX}>{k}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {[src1, src2, src3].map((src) => (
                  <>
                    <TableRow key={`lbl-${src.label}`}>
                      <TableCell colSpan={11} sx={SUB_SX}>{src.label}</TableCell>
                    </TableRow>
                    <TableRow key={`R-${src.label}`}>
                      <TableCell>R, м</TableCell>
                      {src.R.map((v, i) => <TableCell key={i} align="center">{v}</TableCell>)}
                    </TableRow>
                    <TableRow key={`L1-${src.label}`}>
                      <TableCell>L₁, дБ</TableCell>
                      {src.L1.map((v, i) => <TableCell key={i} align="center">{v}</TableCell>)}
                    </TableRow>
                    <TableRow key={`b-${src.label}`}>
                      <TableCell>№ преграды</TableCell>
                      {src.barrier.map((v, i) => <TableCell key={i} align="center">{v}</TableCell>)}
                    </TableRow>
                  </>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ─── Table 4.2 ─── */}
      {tab === 1 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            По <strong>номеру преграды</strong> из Таблицы 4.1 определяется масса G (кг/м²) для расчёта звукоизоляции: N = 14,5·lg(G) + 15
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={HEAD_SX}>№</TableCell>
                  <TableCell sx={HEAD_SX}>Материал и конструкция</TableCell>
                  <TableCell align="center" sx={HEAD_SX}>Толщина, м</TableCell>
                  <TableCell align="center" sx={HEAD_SX}>G, кг/м²</TableCell>
                  <TableCell align="center" sx={HEAD_SX}>N, дБ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {BARRIERS.map((b) => (
                  <TableRow key={b.id} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                    <TableCell>{b.id}</TableCell>
                    <TableCell>{b.material}</TableCell>
                    <TableCell align="center">{b.thickness}</TableCell>
                    <TableCell align="center">{b.mass}</TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={(14.5 * Math.log10(b.mass) + 15).toFixed(1)}
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ─── Table 4.3 ─── */}
      {tab === 2 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            По <strong>предпоследней цифре</strong> номера студенческого билета.
            Используется для расчёта звукопоглощения M = Sпт·α + Sс·β + Sпт·γ (γ_пол = 0,061).
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={HEAD_SX}>Параметр</TableCell>
                  {KEYS_PENULT.map((k) => (
                    <TableCell key={k} align="center" sx={HEAD_SX}>{k}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Sпт, м²</TableCell>
                  {T43.Spt.map((v, i) => <TableCell key={i} align="center">{v}</TableCell>)}
                </TableRow>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>Sс, м²</TableCell>
                  {T43.Sc.map((v, i) => <TableCell key={i} align="center">{v}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell>α₁ ×10⁻³</TableCell>
                  {T43.alpha1_e3.map((v, i) => <TableCell key={i} align="center">{v}</TableCell>)}
                </TableRow>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>α₂ ×10⁻²</TableCell>
                  {T43.alpha2_e2.map((v, i) => <TableCell key={i} align="center">{v}</TableCell>)}
                </TableRow>
                <TableRow>
                  <TableCell>β₁ ×10⁻³</TableCell>
                  {T43.beta1_e3.map((v, i) => <TableCell key={i} align="center">{v}</TableCell>)}
                </TableRow>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell>β₂ ×10⁻²</TableCell>
                  {T43.beta2_e2.map((v, i) => <TableCell key={i} align="center">{v}</TableCell>)}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
            M₁ рассчитывается с α₁ и β₁ (без спец. покрытия), M₂ — с α₂ и β₂ (с покрытием).
          </Typography>
        </Box>
      )}

      {/* ─── Table 4.4 ─── */}
      {tab === 3 && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Поправка ΔL для метода суммирования двух уровней: L<sub>Σ</sub> = L<sub>A</sub> + ΔL,
            где L<sub>A</sub> — бо́льший уровень, ΔL — поправка по разности |L<sub>A</sub> − L<sub>B</sub>|.
            При разности &gt; 20 дБ: ΔL = 0 (слабый источник не вносит вклада).
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={HEAD_SX}>Разность |LA−LB|, дБ</TableCell>
                  {DIFF.map((d) => (
                    <TableCell key={d} align="center" sx={HEAD_SX}>{d}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Поправка ΔL, дБ</TableCell>
                  {CORRECTION.map((c, i) => (
                    <TableCell key={i} align="center">
                      <strong>{c}</strong>
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Пример: L₁ = 85 дБ, L₂ = 85 дБ → разность = 0 → ΔL = 3,0 → LΣ = 88 дБ.{' '}
            При разности 10 дБ: ΔL = 0,4 → слабый источник почти не влияет.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
