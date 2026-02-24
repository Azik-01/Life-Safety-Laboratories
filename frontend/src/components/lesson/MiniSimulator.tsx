import { Suspense, lazy, useMemo, useState } from 'react';
import { Box, LinearProgress, Paper, Slider, Stack, Typography } from '@mui/material';
import type { TheorySimulatorType } from '../../types/theme';

const sceneTitle: Record<string, string> = {
  'light-flux': 'Распространение светового потока от источника',
  'light-illuminance': 'Как освещённость зависит от площади поверхности',
  'light-brightness': 'Яркость и слепящее действие источника',
  'light-pulsation': 'Пульсация света и стробоскопический эффект',
  'light-room-index': 'Индекс помещения — зависимость от размеров',
  'light-specific-power': 'Расположение светильников в помещении',
  'light-multi-source': 'Управление отдельными светильниками в помещении',
  'noise-distance': 'Ослабление шума с расстоянием от источника',
  'noise-barrier': 'Звукоизоляция: отражение звука преградой',
  'noise-sum': 'Суммирование шума от нескольких источников',
  'noise-reflection': 'Отражение звуковых волн от стены',
  'emi-spectrum': 'Длина электромагнитной волны и частота',
  'emi-wave': 'Плотность потока энергии (ППЭ) электромагнитного поля',
  'emi-ppe-zones': 'Зоны вокруг источника ЭМИ (ближняя / промежуточная / дальняя)',
};
import {
  brightness,
  illuminanceFromFlux,
  luminairesBySpecificPower,
  luminairesByUtilization,
  luminousFlux,
  pulsationCoefficientPercent,
  roomIndex,
  suspensionHeight,
} from '../../formulas/illumination';
import {
  barrierReductionDbFromMass,
  levelAfterBarrierDb,
  levelAtDistanceDb,
  sumLevelsEnergyDb,
  sumTwoLevelsByDeltaDb,
} from '../../formulas/noise';
import { classifyEmZone, powerFluxDensityWm2, wavelengthM } from '../../formulas/emi';
const TheoryScene3D = lazy(() => import('./TheoryScene3D'));
const isTestEnvironment = import.meta.env.MODE === 'test';

interface SimulatorProps {
  type: TheorySimulatorType;
}

function ValueLine({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600}>
        {value}
      </Typography>
    </Stack>
  );
}

/* Default slider values per scene type */
function getDefaults(type: TheorySimulatorType) {
  switch (type) {
    case 'light-multi-source':
      return { a: 80, b: 80, c: 80, d: 80 };
    default:
      return { a: 500, b: 1.2, c: 2.5, d: 120 };
  }
}

export default function MiniSimulator({ type }: SimulatorProps) {
  const defs = getDefaults(type);
  const [a, setA] = useState(defs.a);
  const [b, setB] = useState(defs.b);
  const [c, setC] = useState(defs.c);
  const [d, setD] = useState(defs.d);
  // Extra params for multi-light scene (directions 0-100%)
  const [e, setE] = useState(80);
  const [f, setF] = useState(80);
  const [g, setG] = useState(80);
  const [h, setH] = useState(80);

  const content = useMemo(() => {
    switch (type) {
      case 'light-flux': {
        const flux = luminousFlux(a, b);
        return {
          controls: (
            <Stack spacing={1.2}>
              <Typography variant="caption">I (кд): {a.toFixed(0)}</Typography>
              <Slider value={a} min={100} max={2000} step={10} onChange={(_, value) => setA(value as number)} />
              <Typography variant="caption">ω (ср): {b.toFixed(2)}</Typography>
              <Slider value={b} min={0.1} max={6.2} step={0.1} onChange={(_, value) => setB(value as number)} />
            </Stack>
          ),
          values: [<ValueLine key="v1" label="Φ = I·ω" value={`${flux.toFixed(1)} лм`} />],
        };
      }
      case 'light-illuminance': {
        const illuminance = illuminanceFromFlux(a, Math.max(0.1, b));
        return {
          controls: (
            <Stack spacing={1.2}>
              <Typography variant="caption">Φ (лм): {a.toFixed(0)}</Typography>
              <Slider value={a} min={100} max={5000} step={50} onChange={(_, value) => setA(value as number)} />
              <Typography variant="caption">S (м²): {b.toFixed(2)}</Typography>
              <Slider value={b} min={0.2} max={12} step={0.1} onChange={(_, value) => setB(value as number)} />
            </Stack>
          ),
          values: [<ValueLine key="v1" label="E = Φ/S" value={`${illuminance.toFixed(1)} лк`} />],
        };
      }
      case 'light-brightness': {
        const luminance = brightness(a, Math.max(0.1, b));
        return {
          controls: (
            <Stack spacing={1.2}>
              <Typography variant="caption">I (кд): {a.toFixed(0)}</Typography>
              <Slider value={a} min={50} max={1600} step={10} onChange={(_, value) => setA(value as number)} />
              <Typography variant="caption">S (м²): {b.toFixed(2)}</Typography>
              <Slider value={b} min={0.1} max={4} step={0.05} onChange={(_, value) => setB(value as number)} />
            </Stack>
          ),
          values: [<ValueLine key="v1" label="B = I/S" value={`${luminance.toFixed(1)} кд/м²`} />],
        };
      }
      case 'light-pulsation': {
        const maxValue = Math.max(a, b);
        const minValue = Math.min(a, b);
        const avg = Math.max(1, c);
        const kp = pulsationCoefficientPercent(maxValue, minValue, avg);
        return {
          controls: (
            <Stack spacing={1.2}>
              <Typography variant="caption">Emax (лк): {a.toFixed(0)}</Typography>
              <Slider value={a} min={100} max={1500} step={10} onChange={(_, value) => setA(value as number)} />
              <Typography variant="caption">Emin (лк): {b.toFixed(0)}</Typography>
              <Slider value={b} min={50} max={1400} step={10} onChange={(_, value) => setB(value as number)} />
              <Typography variant="caption">Eср (лк): {avg.toFixed(0)}</Typography>
              <Slider value={avg} min={80} max={1450} step={10} onChange={(_, value) => setC(value as number)} />
            </Stack>
          ),
          values: [
            <ValueLine key="v1" label="Kп" value={`${kp.toFixed(2)} %`} />,
            <ValueLine key="v2" label="Оценка" value={kp <= 10 ? 'низкая пульсация' : 'повышенная пульсация'} />,
          ],
        };
      }
      case 'light-room-index': {
        const hp = suspensionHeight(Math.max(0.5, c));
        const index = roomIndex(Math.max(1, a / 50), Math.max(1, b), hp);
        return {
          controls: (
            <Stack spacing={1.2}>
              <Typography variant="caption">L (м): {(a / 50).toFixed(1)}</Typography>
              <Slider value={a} min={150} max={1500} step={10} onChange={(_, value) => setA(value as number)} />
              <Typography variant="caption">B (м): {b.toFixed(1)}</Typography>
              <Slider value={b} min={3} max={20} step={0.5} onChange={(_, value) => setB(value as number)} />
              <Typography variant="caption">H (м): {c.toFixed(1)}</Typography>
              <Slider value={c} min={2.5} max={8} step={0.1} onChange={(_, value) => setC(value as number)} />
            </Stack>
          ),
          values: [
            <ValueLine key="v1" label="Hp = H - 0.3" value={`${hp.toFixed(2)} м`} />,
            <ValueLine key="v2" label="i" value={index.toFixed(3)} />,
          ],
        };
      }
      case 'light-specific-power': {
        const area = Math.max(10, a);
        const width = Math.max(3, b);
        const lampPower = Math.max(20, c * 20);
        const countByPower = luminairesBySpecificPower({
          areaM2: area,
          widthM: width,
          lampPowerW: lampPower,
          lampsPerLuminaire: Math.max(1, Math.round(d / 40)),
        });
        const countByEta = luminairesByUtilization({
          areaM2: area,
          eNormLux: 300,
          reserveFactor: 1.5,
          nonUniformityFactor: 1.1,
          lampsPerLuminaire: Math.max(1, Math.round(d / 40)),
          lampFluxLm: 3200,
          utilizationFactor: 0.5,
        });
        return {
          controls: (
            <Stack spacing={1.2}>
              <Typography variant="caption">S (м²): {area.toFixed(0)}</Typography>
              <Slider value={area} min={10} max={300} step={5} onChange={(_, value) => setA(value as number)} />
              <Typography variant="caption">B (м): {width.toFixed(1)}</Typography>
              <Slider value={width} min={3} max={20} step={0.5} onChange={(_, value) => setB(value as number)} />
              <Typography variant="caption">P лампы (Вт): {lampPower.toFixed(0)}</Typography>
              <Slider value={c} min={1} max={10} step={0.5} onChange={(_, value) => setC(value as number)} />
            </Stack>
          ),
          values: [
            <ValueLine key="v1" label="N (удельная мощность)" value={`${countByPower}`} />,
            <ValueLine key="v2" label="N (η-метод, демо)" value={`${countByEta}`} />,
          ],
        };
      }
      case 'light-multi-source': {
        const lights = [
          { name: 'Светильник 1', int: a, setInt: setA, dir: e, setDir: setE, color: '#ff6644' },
          { name: 'Светильник 2', int: b, setInt: setB, dir: f, setDir: setF, color: '#44aaff' },
          { name: 'Светильник 3', int: c, setInt: setC, dir: g, setDir: setG, color: '#44cc44' },
          { name: 'Светильник 4', int: d, setInt: setD, dir: h, setDir: setH, color: '#ffaa00' },
        ];
        return {
          controls: (
            <Stack spacing={1.2}>
              {lights.map((l, i) => (
                <Box key={i}>
                  <Typography variant="caption" sx={{ color: l.color, fontWeight: 600 }}>
                    {l.name}: {l.int > 0 ? `${l.int.toFixed(0)}%` : 'ВЫКЛ'}
                  </Typography>
                  <Slider value={l.int} min={0} max={100} step={5} onChange={(_, v) => l.setInt(v as number)}
                    sx={{ '& .MuiSlider-thumb': { bgcolor: l.color }, '& .MuiSlider-track': { bgcolor: l.color } }} />
                  <Typography variant="caption">Направление на рабочего: {l.dir.toFixed(0)}%</Typography>
                  <Slider value={l.dir} min={0} max={100} step={5} onChange={(_, v) => l.setDir(v as number)}
                    sx={{ '& .MuiSlider-thumb': { bgcolor: l.color }, '& .MuiSlider-track': { bgcolor: l.color } }} />
                </Box>
              ))}
            </Stack>
          ),
          values: [
            <ValueLine key="v1" label="Вкл. светильников" value={`${[a, b, c, d].filter((v) => v > 0).length} из 4`} />,
          ],
        };
      }
      case 'noise-distance': {
        const level = levelAtDistanceDb(a, Math.max(0.5, b));
        return {
          controls: (
            <Stack spacing={1.2}>
              <Typography variant="caption">L1 (дБ): {a.toFixed(0)}</Typography>
              <Slider value={a} min={70} max={130} step={1} onChange={(_, value) => setA(value as number)} />
              <Typography variant="caption">R (м): {b.toFixed(1)}</Typography>
              <Slider value={b} min={0.5} max={20} step={0.1} onChange={(_, value) => setB(value as number)} />
            </Stack>
          ),
          values: [<ValueLine key="v1" label="LR" value={`${level.toFixed(2)} дБ`} />],
        };
      }
      case 'noise-barrier': {
        const reduction = barrierReductionDbFromMass(Math.max(10, a));
        const output = levelAfterBarrierDb(b, reduction);
        return {
          controls: (
            <Stack spacing={1.2}>
              <Typography variant="caption">G (кг/м²): {a.toFixed(0)}</Typography>
              <Slider value={a} min={10} max={800} step={5} onChange={(_, value) => setA(value as number)} />
              <Typography variant="caption">LR до преграды (дБ): {b.toFixed(0)}</Typography>
              <Slider value={b} min={40} max={130} step={1} onChange={(_, value) => setB(value as number)} />
            </Stack>
          ),
          values: [
            <ValueLine key="v1" label="N(lgG)" value={`${reduction.toFixed(2)} дБ`} />,
            <ValueLine key="v2" label="L′R" value={`${output.toFixed(2)} дБ`} />,
          ],
        };
      }
      case 'noise-sum': {
        const l1 = Math.max(30, a);
        const l2 = Math.max(30, b);
        const l3 = Math.max(30, c);
        const deltaPair = sumTwoLevelsByDeltaDb(l1, l2);
        const energyAll = sumLevelsEnergyDb([l1, l2, l3]);
        return {
          controls: (
            <Stack spacing={1.2}>
              <Typography variant="caption">L1: {l1.toFixed(0)} дБ</Typography>
              <Slider value={l1} min={40} max={120} step={1} onChange={(_, value) => setA(value as number)} />
              <Typography variant="caption">L2: {l2.toFixed(0)} дБ</Typography>
              <Slider value={l2} min={40} max={120} step={1} onChange={(_, value) => setB(value as number)} />
              <Typography variant="caption">L3: {l3.toFixed(0)} дБ</Typography>
              <Slider value={l3} min={40} max={120} step={1} onChange={(_, value) => setC(value as number)} />
            </Stack>
          ),
          values: [
            <ValueLine key="v1" label="L1+L2 (LA+ΔL)" value={`${deltaPair.toFixed(2)} дБ`} />,
            <ValueLine key="v2" label="LΣ (энергосумма 3)" value={`${energyAll.toFixed(2)} дБ`} />,
          ],
        };
      }
      case 'emi-spectrum': {
        const frequency = Math.max(1e3, a * 1e3);
        const lambda = wavelengthM(frequency);
        return {
          controls: (
            <Stack spacing={1.2}>
              <Typography variant="caption">f (кГц): {a.toFixed(0)}</Typography>
              <Slider value={a} min={1} max={3_000_000} step={1000} onChange={(_, value) => setA(value as number)} />
            </Stack>
          ),
          values: [
            <ValueLine key="v1" label="λ = c/f" value={`${lambda.toExponential(3)} м`} />,
            <ValueLine
              key="v2"
              label="Диапазон"
              value={frequency < 3e7 ? 'Радиоволны' : frequency < 3e11 ? 'Микроволны' : 'ИК/видимый и выше'}
            />,
          ],
        };
      }
      case 'emi-wave': {
        const ppe = powerFluxDensityWm2(a, b);
        return {
          controls: (
            <Stack spacing={1.2}>
              <Typography variant="caption">E (В/м): {a.toFixed(2)}</Typography>
              <Slider value={a} min={0} max={200} step={0.5} onChange={(_, value) => setA(value as number)} />
              <Typography variant="caption">H (А/м): {b.toFixed(3)}</Typography>
              <Slider value={b} min={0} max={5} step={0.01} onChange={(_, value) => setB(value as number)} />
            </Stack>
          ),
          values: [<ValueLine key="v1" label="ППЭ = E×H" value={`${ppe.toFixed(3)} Вт/м²`} />],
        };
      }
      case 'emi-ppe-zones': {
        const frequency = Math.max(1e3, a * 1e3);
        const distance = Math.max(0.01, b);
        const lambda = wavelengthM(frequency);
        const zone = classifyEmZone(distance, lambda);
        const ppe = powerFluxDensityWm2(Math.max(0, c), Math.max(0, d / 1000));
        return {
          controls: (
            <Stack spacing={1.2}>
              <Typography variant="caption">f (кГц): {a.toFixed(0)}</Typography>
              <Slider value={a} min={10} max={1_000_000} step={1000} onChange={(_, value) => setA(value as number)} />
              <Typography variant="caption">r (м): {distance.toFixed(2)}</Typography>
              <Slider value={distance} min={0.01} max={20} step={0.01} onChange={(_, value) => setB(value as number)} />
              <Typography variant="caption">E (В/м): {c.toFixed(1)}</Typography>
              <Slider value={c} min={0} max={100} step={0.1} onChange={(_, value) => setC(value as number)} />
              <Typography variant="caption">H (мА/м): {d.toFixed(0)}</Typography>
              <Slider value={d} min={0} max={3000} step={10} onChange={(_, value) => setD(value as number)} />
            </Stack>
          ),
          values: [
            <ValueLine key="v1" label="λ" value={`${lambda.toExponential(3)} м`} />,
            <ValueLine key="v2" label="Зона" value={zone === 'near' ? 'Ближняя' : zone === 'intermediate' ? 'Промежуточная' : 'Дальняя'} />,
            <ValueLine key="v3" label="ППЭ" value={`${ppe.toFixed(3)} Вт/м²`} />,
          ],
        };
      }
      default:
        return {
          controls: <Typography variant="body2">Симулятор в разработке.</Typography>,
          values: [],
        };
    }
  }, [a, b, c, d, e, f, g, h, type]);

  return (
    <Paper variant="outlined" sx={{ p: 2, mt: 1.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700 }}>
        {sceneTitle[type] || 'Симулятор'}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Изменяйте параметры ползунками — результат отобразится в 3D-сцене и в расчётах ниже.
      </Typography>
      {/* Interactive 3D Scene */}
      {!isTestEnvironment && (
        <Suspense fallback={<LinearProgress sx={{ mb: 1 }} />}>
          <TheoryScene3D type={type} params={{ a, b, c, d, e, f, g, h }} />
        </Suspense>
      )}
      {/* Controls */}
      <Box sx={{ mt: 1.5 }}>{content.controls}</Box>
      <Stack spacing={0.8} sx={{ mt: 1.5 }}>
        {content.values}
      </Stack>
    </Paper>
  );
}
