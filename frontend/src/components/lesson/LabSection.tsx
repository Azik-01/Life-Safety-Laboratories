import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import type { LessonTheme } from '../../types/theme';
import { lesson2MergedValues, pickVariantByTicketDigits } from '../../data/variants';
import Lab4TablesPanel from './Lab4TablesPanel';
import VariantTable from './VariantTable';
import { mean, realisticIlluminanceLux } from '../../formulas/illumination';
import { sourceLevelAtObserver, sumLevelsEnergyDb } from '../../formulas/noise';
import { classifyEmZone, powerFluxDensityWm2, wavelengthM } from '../../formulas/emi';
import { useProgress } from '../../context/ProgressContext';

const LabScene3D = lazy(() => import('./LabScene3D'));

type LampType = 'incandescent' | 'fluorescent' | 'led';

interface LabSectionProps {
  lesson: LessonTheme;
}

interface ResultRow {
  step: string;
  metric: string;
  value: string;
}

export default function LabSection({ lesson }: LabSectionProps) {
  const progress = useProgress();
  const persistedLabStep = progress.get(lesson.id).labStep;
  const initialValues = lesson.variants[0]?.values ?? {};
  const [ticketInput, setTicketInput] = useState('');
  const [variantNumber, setVariantNumber] = useState(0);
  const [lesson2Penultimate, setLesson2Penultimate] = useState(0);
  const [lesson2Full, setLesson2Full] = useState<Record<string, number>>(
    () => lesson.id === 2 ? lesson2MergedValues(0, 0) : {}
  );
  const [lesson2SigmaE, setLesson2SigmaE] = useState<string>('');
  const [trainingMode, setTrainingMode] = useState(false);
  const [manualTableOpen, setManualTableOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(() =>
    Math.max(0, Math.min(persistedLabStep, lesson.labWizard.steps.length))
  );
  const [resultRows, setResultRows] = useState<ResultRow[]>([]);

  const variant = useMemo(
    () => lesson.variants.find((item) => item.variant === variantNumber) ?? lesson.variants[0],
    [lesson.variants, variantNumber]
  );

  const [lampType, setLampType] = useState<LampType>('led');
  const [intensityCd, setIntensityCd] = useState(initialValues.intensityCd ?? initialValues.lampFluxLm ?? 900);
  const [heightM, setHeightM] = useState(initialValues.heightM ?? 2.8);
  const [sensorOffsetM, setSensorOffsetM] = useState(initialValues.distanceM ?? 0.9);
  const [reflectance, setReflectance] = useState(initialValues.reflectance ?? 0.4);
  const [luminaireCount, setLuminaireCount] = useState(initialValues.luminaireCount ?? 2);

  const [sourceA, setSourceA] = useState(initialValues.sourceA1mDb ?? 98);
  const [sourceB, setSourceB] = useState(initialValues.sourceB1mDb ?? 92);
  const [sourceC, setSourceC] = useState(initialValues.sourceC1mDb ?? 86);
  const [sourceAX, setSourceAX] = useState(-(initialValues.distanceA ?? 3));
  const [sourceBX, setSourceBX] = useState(-(initialValues.distanceB ?? 4));
  const [sourceCX, setSourceCX] = useState(-(initialValues.distanceC ?? 5));
  const [observerX, setObserverX] = useState(4.5);
  const [barrierMass, setBarrierMass] = useState(initialValues.barrierMassA ?? 150);
  const [sourceAOn, setSourceAOn] = useState(true);
  const [sourceBOn, setSourceBOn] = useState(true);
  const [sourceCOn, setSourceCOn] = useState(true);

  const [frequencyHz, setFrequencyHz] = useState(initialValues.frequencyHz ?? 2.4e6);
  const [distanceM, setDistanceM] = useState(initialValues.distanceM ?? 1.2);
  const [eVpm, setEVpm] = useState(initialValues.electricFieldVpm ?? 14);
  const [hApm, setHApm] = useState(initialValues.magneticFieldApm ?? 0.45);

  useEffect(() => {
    const restored = Math.max(0, Math.min(progress.get(lesson.id).labStep, lesson.labWizard.steps.length));
    setStepIndex((current) => (current === restored ? current : restored));
  }, [lesson.id, lesson.labWizard.steps.length, progress]);

  useEffect(() => {
    progress.setLabStep(lesson.id, stepIndex);
  }, [lesson.id, progress, stepIndex]);

  function applyVariantValues(values: Record<string, number>) {
    if (lesson.id === 2) {
      setLesson2Full(values);
    }
    if (lesson.id === 1 || lesson.id === 2) {
      setIntensityCd(values.intensityCd ?? values.lampFluxLm ?? 900);
      setHeightM(values.heightM ?? 2.8);
      setSensorOffsetM(values.distanceM ?? 0.9);
      setReflectance(values.reflectance ?? 0.4);
      setLuminaireCount(values.luminaireCount ?? 2);
    }
    if (lesson.id === 3 || lesson.id === 4) {
      setSourceA(values.sourceA1mDb ?? 98);
      setSourceB(values.sourceB1mDb ?? 92);
      setSourceC(values.sourceC1mDb ?? 86);
      setSourceAX(-(values.distanceA ?? 3));
      setSourceBX(-(values.distanceB ?? 4));
      setSourceCX(-(values.distanceC ?? 5));
      setBarrierMass(values.barrierMassA ?? 150);
    }
    if (lesson.id === 5) {
      setFrequencyHz(values.frequencyHz ?? 2.4e6);
      setDistanceM(values.distanceM ?? 1.2);
      setEVpm(values.electricFieldVpm ?? 14);
      setHApm(values.magneticFieldApm ?? 0.45);
    }
  }

  const lightingMetrics = useMemo(() => {
    const distance = Math.sqrt(heightM * heightM + sensorOffsetM * sensorOffsetM);
    const eLux = realisticIlluminanceLux({
      intensityCd,
      distanceM: Math.max(0.1, distance),
      luminaireCount,
      reflectance,
      utilizationFactor: 0.62,
      maintenanceFactor: 0.85,
    });
    const history = [eLux, eLux * 0.92, eLux * 1.05, eLux * 0.89, eLux * 1.02];
    return {
      eLux,
      eAvg: mean(history),
      distance,
    };
  }, [heightM, intensityCd, luminaireCount, reflectance, sensorOffsetM]);

  const noiseMetrics = useMemo(() => {
    const levels = [
      sourceAOn
        ? sourceLevelAtObserver({
          levelAt1mDb: sourceA,
          distanceM: Math.max(0.8, Math.abs(observerX - sourceAX)),
          barrierMassPerM2: barrierMass,
        })
        : Number.NEGATIVE_INFINITY,
      sourceBOn
        ? sourceLevelAtObserver({
          levelAt1mDb: sourceB,
          distanceM: Math.max(0.8, Math.abs(observerX - sourceBX)),
          barrierMassPerM2: barrierMass,
        })
        : Number.NEGATIVE_INFINITY,
      sourceCOn
        ? sourceLevelAtObserver({
          levelAt1mDb: sourceC,
          distanceM: Math.max(0.8, Math.abs(observerX - sourceCX)),
          barrierMassPerM2: barrierMass,
        })
        : Number.NEGATIVE_INFINITY,
    ].filter((value) => Number.isFinite(value)) as number[];

    const total = levels.length > 0 ? sumLevelsEnergyDb(levels) : 0;
    return { levels, total };
  }, [barrierMass, observerX, sourceA, sourceAOn, sourceAX, sourceB, sourceBOn, sourceBX, sourceC, sourceCOn, sourceCX]);

  /** All intermediate and final calculations for Lesson 2, derived from both tables. */
  const lesson2Calcs = useMemo(() => {
    if (lesson.id !== 2) return null;
    const v = lesson2Full;
    const L   = v.lengthM         ?? 0;
    const B   = v.widthM          ?? 0;
    const H   = v.heightM         ?? 0;
    const PhiL = v.lampFluxLm     ?? 0;
    const En  = v.eNormLux        ?? 0;
    const Kz  = v.reserveFactor   ?? 0;
    const z   = v.nonUniformity   ?? 0;
    const n   = v.lampsPerLuminaire ?? 0;
    const Wt  = v.tabWt           ?? 0;
    const Sp  = v.roomAreaM2      ?? 0;
    const eta = v.etaPct          ?? 0;
    const mu  = v.mu              ?? 0;
    const hasT2 = Kz > 0 && Sp > 0 && eta > 0;

    // ── Method 1: Utilisation factor ────────────────────────────────
    const Hp     = +(H - 0.3).toFixed(3);  // Нр = H_room − hе(0.3м от потолка)
    const i      = Hp > 0 && (L + B) > 0 ? +((L * B) / (Hp * (L + B))).toFixed(3) : 0;
    const PhiSv  = +(n * PhiL).toFixed(1);
    const etaUtil = eta / 100;
    const N1     = hasT2 && PhiSv > 0 && etaUtil > 0
      ? Math.ceil((En * Sp * Kz * z) / (PhiSv * etaUtil))
      : null;

    // ── Method 2: Specific power ─────────────────────────────────────
    const alphaKz = hasT2 ? +(Kz / 1.5).toFixed(4) : null;
    const alphaZ  = hasT2 ? +(z  / 1.1).toFixed(4) : null;
    const alphaE  = hasT2 ? +(En / 100).toFixed(4)  : null;
    const Wp      = hasT2 ? +(Wt * (Kz / 1.5) * (z / 1.1) * (En / 100)).toFixed(3) : null;
    const PL = 40;
    const N2 = Wp !== null && n > 0
      ? Math.ceil((Wp * Sp) / (n * PL))
      : null;

    // ── Method 3: Light-line rows ─────────────────────────────────────
    const nRows  = 3;
    const Hprime = Hp;
    const lLine  = +((B / (nRows + 1))).toFixed(3);
    const Pprime = Hprime > 0 ? +(lLine / Hprime).toFixed(3) : 0;
    const Lprime = Hprime > 0 ? +(L / Hprime).toFixed(3) : 0;
    const sigmaE = parseFloat(lesson2SigmaE);
    const sigmaEValid = isFinite(sigmaE) && sigmaE > 0 && mu > 0;
    const PhiLprime = sigmaEValid
      ? +((1000 * En * Kz * z) / (mu * sigmaE)).toFixed(1)
      : null;
    const N1row = PhiLprime !== null && PhiSv > 0
      ? Math.ceil((PhiLprime * L) / PhiSv)
      : null;
    const Ntotal = N1row !== null ? N1row * nRows : null;

    return { L, B, H, PhiL, En, Kz, z, n, Wt, Sp, eta, mu,
      Hp, i, PhiSv, etaUtil, N1,
      alphaKz, alphaZ, alphaE, Wp, N2,
      Hprime, lLine, Pprime, Lprime, PhiLprime, N1row, Ntotal, hasT2 };
  }, [lesson.id, lesson2Full, lesson2SigmaE]);

  const emiMetrics = useMemo(() => {
    const lambda = wavelengthM(Math.max(1e3, frequencyHz));
    const ppe = powerFluxDensityWm2(Math.max(0, eVpm), Math.max(0, hApm));
    const zone = classifyEmZone(Math.max(0.01, distanceM), lambda);
    return { lambda, ppe, zone };
  }, [distanceM, eVpm, frequencyHz, hApm]);

  function addResultRow() {
    if (stepIndex === 0) return;
    const currentStep = lesson.labWizard.steps[stepIndex - 1];
    let value = '—';
    if (lesson.id === 2 && lesson2Calcs) {
      const { N1, N2, Ntotal } = lesson2Calcs;
      value = `N₁(η)=${N1 ?? 'н/д'} св.; N₂(Wт)=${N2 ?? 'н/д'} св.; NΣ(линии)=${Ntotal ?? 'н/д'} св.`;
    } else if (lesson.id === 1) {
      value = `E=${lightingMetrics.eLux.toFixed(1)} лк; Eср=${lightingMetrics.eAvg.toFixed(1)} лк`;
    } else if (lesson.id === 3 || lesson.id === 4) {
      value = `LΣ=${noiseMetrics.total.toFixed(1)} дБ; G=${barrierMass.toFixed(0)} кг/м²`;
    } else {
      value = `λ=${emiMetrics.lambda.toExponential(2)} м; ППЭ=${emiMetrics.ppe.toFixed(3)} Вт/м²; зона=${emiMetrics.zone}`;
    }
    setResultRows((prev) => [
      ...prev,
      {
        step: currentStep.title,
        metric: currentStep.resultField ?? currentStep.type,
        value,
      },
    ]);
  }

  const progressPercent = useMemo(
    () => Math.round((stepIndex / (lesson.labWizard.steps.length + 1)) * 100),
    [lesson.labWizard.steps.length, stepIndex]
  );

  const reportText = useMemo(() => {
    const rows = resultRows.map((row, index) => `${index + 1}. ${row.step}: ${row.value}`).join('\n');
    return [
      `Отчет по ${lesson.title}`,
      `Вариант: ${variant.variant}`,
      `Исходные данные: ${JSON.stringify(variant.values)}`,
      'Результаты:',
      rows || 'Нет сохраненных результатов.',
      `Вывод: ${lesson.labWizard.reportConclusionHint}`,
    ].join('\n');
  }, [lesson, resultRows, variant]);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportText);
    } catch {
      // no-op
    }
  }

  return (
    <Stack spacing={2}>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6">Шаг 0. Вариант студента</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 1 }}>
          <TextField
            size="small"
            label="Последние цифры студбилета"
            value={ticketInput}
            onChange={(event) => setTicketInput(event.target.value)}
          />
          <Button
            variant="contained"
            onClick={() => {
              const resolved = pickVariantByTicketDigits(lesson.id, ticketInput);
              setVariantNumber(resolved.variant);
              if (lesson.id === 2) {
                const digits = ticketInput.replace(/\D/g, '');
                const pen = digits.length > 1 ? Number(digits[digits.length - 2]) : 0;
                setLesson2Penultimate(pen);
              }
              applyVariantValues(resolved.values);
            }}
          >
            Автоподстановка
          </Button>
          <Select
            size="small"
            value={variantNumber}
            onChange={(event) => {
              const nextVariant = lesson.variants.find((item) => item.variant === Number(event.target.value));
              setVariantNumber(Number(event.target.value));
              if (lesson.id === 2) {
                const merged = lesson2MergedValues(Number(event.target.value), lesson2Penultimate);
                applyVariantValues(merged);
              } else if (nextVariant) {
                applyVariantValues(nextVariant.values);
              }
            }}
          >
            {lesson.variants.map((item) => (
              <MenuItem key={`variant-${item.variant}`} value={item.variant}>
                Вариант {item.variant}
              </MenuItem>
            ))}
          </Select>
          {lesson.id === 2 && (
            <Select
              size="small"
              value={lesson2Penultimate}
              onChange={(event) => {
                const pen = Number(event.target.value);
                setLesson2Penultimate(pen);
                const merged = lesson2MergedValues(variantNumber, pen);
                applyVariantValues(merged);
              }}
              sx={{ minWidth: 220 }}
            >
              {[0,1,2,3,4,5,6,7,8,9].map((d) => (
                <MenuItem key={d} value={d}>Предпоследняя цифра: {d} (Табл. 2.2)</MenuItem>
              ))}
            </Select>
          )}
          <Button variant="outlined" onClick={() => setManualTableOpen(true)}>
            Показать таблицу методички
          </Button>
        </Stack>
        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Checkbox
              checked={trainingMode}
              onChange={(event) => setTrainingMode(event.target.checked)}
            />
          }
          label="Учебный режим: разрешить ручную правку значений"
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Пошаговый wizard</Typography>
          <Typography variant="body2" color="text.secondary">
            Прогресс: {progressPercent}%
          </Typography>
        </Stack>
        <LinearProgress variant="determinate" value={progressPercent} sx={{ mt: 1, mb: 1.5 }} />

        <Stepper activeStep={stepIndex} alternativeLabel>
          <Step>
            <StepLabel>Вариант</StepLabel>
          </Step>
          {lesson.labWizard.steps.map((step) => (
            <Step key={step.id}>
              <StepLabel>{step.type}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {stepIndex === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            Перейдите к шагам лабораторной после подтверждения варианта.
          </Alert>
        ) : (
          <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle1">{lesson.labWizard.steps[stepIndex - 1].title}</Typography>
            <Typography variant="body2" sx={{ mt: 0.8 }}>
              Что делаем: {lesson.labWizard.steps[stepIndex - 1].whatToDo}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.8 }}>
              Почему: {lesson.labWizard.steps[stepIndex - 1].why}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.8 }}>
              В сцене: {lesson.labWizard.steps[stepIndex - 1].sceneAction}
            </Typography>
            <Alert severity="info" sx={{ mt: 1 }}>
              Подсказка: {lesson.labWizard.steps[stepIndex - 1].hint}
            </Alert>
          </Paper>
        )}

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="outlined" disabled={stepIndex === 0} onClick={() => setStepIndex((prev) => prev - 1)}>
            Назад
          </Button>
          <Button
            variant="contained"
            disabled={stepIndex >= lesson.labWizard.steps.length}
            onClick={() => setStepIndex((prev) => Math.min(prev + 1, lesson.labWizard.steps.length))}
          >
            Далее
          </Button>
          <Button variant="contained" color="secondary" disabled={stepIndex === 0} onClick={addResultRow}>
            Зафиксировать результат шага
          </Button>
        </Stack>
      </Paper>

      <Suspense
        fallback={
          <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={28} />
          </Paper>
        }
      >
        <LabScene3D
          lessonId={lesson.id}
          lightState={{ lampType, intensityCd, heightM, sensorOffsetM, reflectance, luminaireCount }}
          noiseState={{
            sourceA,
            sourceB,
            sourceC,
            sourceAX,
            sourceBX,
            sourceCX,
            observerX,
            barrierMass,
            sourceAOn,
            sourceBOn,
            sourceCOn,
          }}
          emiState={{ frequencyHz, distanceM, eVpm, hApm }}
        />
      </Suspense>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1">
            Управление лабораторной сценой
          </Typography>
          {!trainingMode && (
            <Alert severity="info" icon={false} sx={{ py: 0, px: 1 }}>
              🔒 Вариант {variant.variant} — значения зафиксированы
            </Alert>
          )}
        </Stack>
        {!trainingMode && (
          <Alert severity="warning" sx={{ mb: 1.5 }}>
            Параметры установлены по варианту №{variant.variant}. Включите «Учебный режим» для свободной настройки.
          </Alert>
        )}

        {lesson.id === 1 && (
          <Stack spacing={1.2}>
            <Typography variant="caption" fontWeight={600}>Исследование освещённости</Typography>
            <Select size="small" value={lampType} onChange={(event) => setLampType(event.target.value as LampType)} disabled={!trainingMode}>
              <MenuItem value="incandescent">Лампа накаливания</MenuItem>
              <MenuItem value="fluorescent">Люминесцентная лампа</MenuItem>
              <MenuItem value="led">LED</MenuItem>
            </Select>
            <Typography variant="caption">Сила света I: {intensityCd.toFixed(0)} кд</Typography>
            <Slider value={intensityCd} min={200} max={2500} step={10} disabled={!trainingMode} onChange={(_, value) => setIntensityCd(value as number)} />
            <Typography variant="caption">Высота подвеса: {heightM.toFixed(2)} м</Typography>
            <Slider value={heightM} min={2.2} max={4.5} step={0.05} disabled={!trainingMode} onChange={(_, value) => setHeightM(value as number)} />
            <Typography variant="caption">Смещение датчика: {sensorOffsetM.toFixed(2)} м</Typography>
            <Slider value={sensorOffsetM} min={0} max={3} step={0.05} onChange={(_, value) => setSensorOffsetM(value as number)} />
            <Typography variant="caption">Коэффициент отражения: {reflectance.toFixed(2)}</Typography>
            <Slider value={reflectance} min={0} max={0.9} step={0.01} disabled={!trainingMode} onChange={(_, value) => setReflectance(value as number)} />
            <Typography variant="caption">Количество светильников: {luminaireCount}</Typography>
            <Slider value={luminaireCount} min={1} max={8} step={1} disabled={!trainingMode} onChange={(_, value) => setLuminaireCount(value as number)} />
            <Alert severity={lightingMetrics.eLux >= 300 ? 'success' : 'warning'}>
              Текущее E={lightingMetrics.eLux.toFixed(1)} лк, Eср={lightingMetrics.eAvg.toFixed(1)} лк
            </Alert>
          </Stack>
        )}

        {lesson.id === 2 && lesson2Calcs && (
          <Stack spacing={1.5}>
            <Typography variant="caption" fontWeight={600}>Исходные данные варианта</Typography>
            <Table size="small">
              <TableBody>
                <TableRow><TableCell>L (м)</TableCell><TableCell>{lesson2Calcs.L}</TableCell><TableCell>B (м)</TableCell><TableCell>{lesson2Calcs.B}</TableCell><TableCell>H (м)</TableCell><TableCell>{lesson2Calcs.H}</TableCell></TableRow>
                <TableRow><TableCell>Φл (лм)</TableCell><TableCell>{lesson2Calcs.PhiL}</TableCell><TableCell>Eн (лк)</TableCell><TableCell>{lesson2Calcs.En}</TableCell><TableCell>n (шт)</TableCell><TableCell>{lesson2Calcs.n}</TableCell></TableRow>
                {lesson2Calcs.hasT2 && (
                  <TableRow><TableCell>Kз</TableCell><TableCell>{lesson2Calcs.Kz}</TableCell><TableCell>z</TableCell><TableCell>{lesson2Calcs.z}</TableCell><TableCell>Wт (Вт/м²)</TableCell><TableCell>{lesson2Calcs.Wt}</TableCell></TableRow>
                )}
                {lesson2Calcs.hasT2 && (
                  <TableRow><TableCell>Sп (м²)</TableCell><TableCell>{lesson2Calcs.Sp}</TableCell><TableCell>η (%)</TableCell><TableCell>{lesson2Calcs.eta}</TableCell><TableCell>μ</TableCell><TableCell>{lesson2Calcs.mu}</TableCell></TableRow>
                )}
              </TableBody>
            </Table>

            {!lesson2Calcs.hasT2 && (
              <Alert severity="warning">
                Выберите предпоследнюю цифру студбилета (Таблица 2.2) для расчёта N.
              </Alert>
            )}

            <Typography variant="caption" fontWeight={600}>Метод 1 — Коэффициент использования (формулы 1.12, 1.11, 1.10, 1.9)</Typography>
            <Table size="small">
              <TableBody>
                <TableRow><TableCell>Hp = H − 0,3 (hе=0,3м от потолка)</TableCell><TableCell>{lesson2Calcs.Hp.toFixed(2)} м</TableCell></TableRow>
                <TableRow><TableCell>i = (L×B) / (Hp×(L+B))</TableCell><TableCell>{lesson2Calcs.i.toFixed(3)}</TableCell></TableRow>
                <TableRow><TableCell>Φсв = n × Φл</TableCell><TableCell>{lesson2Calcs.PhiSv.toFixed(0)} лм</TableCell></TableRow>
                <TableRow><TableCell>η (из табл. 2.2)</TableCell><TableCell>{lesson2Calcs.hasT2 ? `${lesson2Calcs.eta} % = ${lesson2Calcs.etaUtil.toFixed(2)}` : '—'}</TableCell></TableRow>
                <TableRow sx={{ fontWeight: 700 }}>
                  <TableCell><strong>N₁ = ⌈Eн×Sп×Kз×z / (Φсв×η)⌉</strong></TableCell>
                  <TableCell><strong>{lesson2Calcs.N1 !== null ? `${lesson2Calcs.N1} св.` : '—'}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Typography variant="caption" fontWeight={600}>Метод 2 — Удельная мощность (формула 1.14)</Typography>
            <Table size="small">
              <TableBody>
                <TableRow><TableCell>αKз = Kз / 1,5</TableCell><TableCell>{lesson2Calcs.alphaKz?.toFixed(4) ?? '—'}</TableCell></TableRow>
                <TableRow><TableCell>αZ = z / 1,1</TableCell><TableCell>{lesson2Calcs.alphaZ?.toFixed(4) ?? '—'}</TableCell></TableRow>
                <TableRow><TableCell>αE = Eн / 100</TableCell><TableCell>{lesson2Calcs.alphaE?.toFixed(2) ?? '—'}</TableCell></TableRow>
                <TableRow><TableCell>Wp = Wт × αKз × αZ × αE</TableCell><TableCell>{lesson2Calcs.Wp !== null ? `${lesson2Calcs.Wp.toFixed(3)} Вт/м²` : '—'}</TableCell></TableRow>
                <TableRow sx={{ fontWeight: 700 }}>
                  <TableCell><strong>N₂ = ⌈Wp×Sп / (n×Pл)⌉, Pл=40 Вт</strong></TableCell>
                  <TableCell><strong>{lesson2Calcs.N2 !== null ? `${lesson2Calcs.N2} св.` : '—'}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Typography variant="caption" fontWeight={600}>Метод 3 — Светящиеся линии (3 ряда)</Typography>
            <Table size="small">
              <TableBody>
                <TableRow><TableCell>H′ = Hp</TableCell><TableCell>{lesson2Calcs.Hprime.toFixed(2)} м</TableCell></TableRow>
                <TableRow><TableCell>l = B/(N_рядов+1)</TableCell><TableCell>{lesson2Calcs.lLine.toFixed(3)} м</TableCell></TableRow>
                <TableRow><TableCell>P′ = l / H′</TableCell><TableCell>{lesson2Calcs.Pprime.toFixed(3)}</TableCell></TableRow>
                <TableRow><TableCell>L′ = L / H′</TableCell><TableCell>{lesson2Calcs.Lprime.toFixed(3)}</TableCell></TableRow>
                <TableRow>
                  <TableCell>Σe (из таблицы по P′, L′)</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={lesson2SigmaE}
                      onChange={(e) => setLesson2SigmaE(e.target.value)}
                      placeholder="введите Σe"
                      sx={{ width: 130 }}
                    />
                  </TableCell>
                </TableRow>
                <TableRow><TableCell>Φл′ = 1000×Eн×Kз×z / (μ×Σe)</TableCell>
                  <TableCell>{lesson2Calcs.PhiLprime !== null ? `${lesson2Calcs.PhiLprime.toFixed(1)} лм` : '—'}</TableCell>
                </TableRow>
                <TableRow><TableCell>N₁ (в ряду) = ⌈Φл′×L/Φсв⌉</TableCell><TableCell>{lesson2Calcs.N1row !== null ? `${lesson2Calcs.N1row} св.` : '—'}</TableCell></TableRow>
                <TableRow sx={{ fontWeight: 700 }}>
                  <TableCell><strong>NΣ = N₁×3</strong></TableCell>
                  <TableCell><strong>{lesson2Calcs.Ntotal !== null ? `${lesson2Calcs.Ntotal} св.` : '—'}</strong></TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {lesson2Calcs.hasT2 && (
              <Alert severity={lesson2Calcs.N1 !== null ? 'success' : 'info'}>
                Метод 1: N₁ = {lesson2Calcs.N1 ?? '?'} св. &nbsp;|&nbsp;
                Метод 2: N₂ = {lesson2Calcs.N2 ?? '?'} св. &nbsp;|&nbsp;
                Метод 3: NΣ = {lesson2Calcs.Ntotal ?? '(нужен Σe)'} св.
              </Alert>
            )}
          </Stack>
        )}

        {lesson.id === 3 && (
          <Stack spacing={1.2}>
            <Typography variant="caption" fontWeight={600}>Исследование интенсивности шума</Typography>
            <FormControlLabel control={<Checkbox checked={sourceAOn} onChange={(event) => setSourceAOn(event.target.checked)} />} label="Источник A (станок)" />
            <Typography variant="caption">Уровень A: {sourceA} дБ</Typography>
            <Slider value={sourceA} min={70} max={125} step={1} disabled={!trainingMode} onChange={(_, value) => setSourceA(value as number)} />
            <FormControlLabel control={<Checkbox checked={sourceBOn} onChange={(event) => setSourceBOn(event.target.checked)} />} label="Источник B (станок)" />
            <Typography variant="caption">Уровень B: {sourceB} дБ</Typography>
            <Slider value={sourceB} min={70} max={125} step={1} disabled={!trainingMode} onChange={(_, value) => setSourceB(value as number)} />
            <FormControlLabel control={<Checkbox checked={sourceCOn} onChange={(event) => setSourceCOn(event.target.checked)} />} label="Источник C (компрессор)" />
            <Typography variant="caption">Уровень C: {sourceC} дБ</Typography>
            <Slider value={sourceC} min={70} max={125} step={1} disabled={!trainingMode} onChange={(_, value) => setSourceC(value as number)} />
            <Typography variant="caption">Масса преграды G: {barrierMass.toFixed(0)} кг/м²</Typography>
            <Slider value={barrierMass} min={30} max={500} step={5} disabled={!trainingMode} onChange={(_, value) => setBarrierMass(value as number)} />
            <Typography variant="caption">Положение наблюдателя X: {observerX.toFixed(1)} м</Typography>
            <Slider value={observerX} min={1.5} max={7} step={0.1} onChange={(_, value) => setObserverX(value as number)} />
            <Alert severity={noiseMetrics.total <= 80 ? 'success' : 'warning'}>
              Итоговый уровень LΣ={noiseMetrics.total.toFixed(1)} дБ
            </Alert>
          </Stack>
        )}

        {lesson.id === 4 && (
          <Stack spacing={1.2}>
            <Typography variant="caption" fontWeight={600}>Расчёт допустимого шума на рабочем месте</Typography>
            <FormControlLabel control={<Checkbox checked={sourceAOn} onChange={(event) => setSourceAOn(event.target.checked)} />} label="Источник A" />
            <Typography variant="caption">Уровень A на 1 м: {sourceA} дБ</Typography>
            <Slider value={sourceA} min={70} max={125} step={1} disabled={!trainingMode} onChange={(_, value) => setSourceA(value as number)} />
            <Typography variant="caption">Расстояние до A: {Math.abs(sourceAX).toFixed(1)} м</Typography>
            <Slider value={Math.abs(sourceAX)} min={1} max={10} step={0.1} disabled={!trainingMode} onChange={(_, value) => setSourceAX(-(value as number))} />
            <FormControlLabel control={<Checkbox checked={sourceBOn} onChange={(event) => setSourceBOn(event.target.checked)} />} label="Источник B" />
            <Typography variant="caption">Уровень B на 1 м: {sourceB} дБ</Typography>
            <Slider value={sourceB} min={70} max={125} step={1} disabled={!trainingMode} onChange={(_, value) => setSourceB(value as number)} />
            <Typography variant="caption">Расстояние до B: {Math.abs(sourceBX).toFixed(1)} м</Typography>
            <Slider value={Math.abs(sourceBX)} min={1} max={10} step={0.1} disabled={!trainingMode} onChange={(_, value) => setSourceBX(-(value as number))} />
            <FormControlLabel control={<Checkbox checked={sourceCOn} onChange={(event) => setSourceCOn(event.target.checked)} />} label="Источник C" />
            <Typography variant="caption">Уровень C на 1 м: {sourceC} дБ</Typography>
            <Slider value={sourceC} min={70} max={125} step={1} disabled={!trainingMode} onChange={(_, value) => setSourceC(value as number)} />
            <Typography variant="caption">Расстояние до C: {Math.abs(sourceCX).toFixed(1)} м</Typography>
            <Slider value={Math.abs(sourceCX)} min={1} max={10} step={0.1} disabled={!trainingMode} onChange={(_, value) => setSourceCX(-(value as number))} />
            <Typography variant="caption">Масса преграды G: {barrierMass.toFixed(0)} кг/м²</Typography>
            <Slider value={barrierMass} min={30} max={500} step={5} disabled={!trainingMode} onChange={(_, value) => setBarrierMass(value as number)} />
            <Typography variant="caption">Положение рабочей точки X: {observerX.toFixed(1)} м</Typography>
            <Slider value={observerX} min={1.5} max={7} step={0.1} onChange={(_, value) => setObserverX(value as number)} />
            <Alert severity={noiseMetrics.total <= 80 ? 'success' : 'warning'}>
              Итоговый LΣ={noiseMetrics.total.toFixed(1)} дБ (с преградой G={barrierMass} кг/м²)
            </Alert>
          </Stack>
        )}

        {lesson.id === 5 && (
          <Stack spacing={1.2}>
            <Typography variant="caption" fontWeight={600}>Расчёт ЭМИ и экранировка</Typography>
            <Typography variant="caption">Частота: {(frequencyHz / 1e6).toFixed(2)} МГц</Typography>
            <Slider value={frequencyHz / 1e6} min={0.1} max={900} step={0.1} disabled={!trainingMode} onChange={(_, value) => setFrequencyHz((value as number) * 1e6)} />
            <Typography variant="caption">Расстояние r: {distanceM.toFixed(2)} м</Typography>
            <Slider value={distanceM} min={0.05} max={15} step={0.01} onChange={(_, value) => setDistanceM(value as number)} />
            <Typography variant="caption">E: {eVpm.toFixed(2)} В/м</Typography>
            <Slider value={eVpm} min={0} max={200} step={0.2} disabled={!trainingMode} onChange={(_, value) => setEVpm(value as number)} />
            <Typography variant="caption">H: {hApm.toFixed(3)} А/м</Typography>
            <Slider value={hApm} min={0} max={4} step={0.01} disabled={!trainingMode} onChange={(_, value) => setHApm(value as number)} />
            <Alert severity={emiMetrics.ppe <= 10 ? 'success' : 'warning'}>
              λ={emiMetrics.lambda.toExponential(2)} м; ППЭ={emiMetrics.ppe.toFixed(3)} Вт/м²; зона={emiMetrics.zone}
            </Alert>
          </Stack>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Таблица результатов
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Шаг</TableCell>
              <TableCell>Параметр</TableCell>
              <TableCell>Значение</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resultRows.map((row, index) => (
              <TableRow key={`result-${index}`}>
                <TableCell>{row.step}</TableCell>
                <TableCell>{row.metric}</TableCell>
                <TableCell>{row.value}</TableCell>
              </TableRow>
            ))}
            {resultRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography variant="body2" color="text.secondary">
                    Пока нет сохраненных строк.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="h6">Финальный отчет</Typography>
        <TextField multiline minRows={8} value={reportText} fullWidth sx={{ mt: 1 }} />
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button variant="contained" onClick={copyReport}>
            Экспорт/копировать в буфер
          </Button>
          <Alert severity="info" sx={{ flex: 1 }}>
            {lesson.labWizard.reportConclusionHint}
          </Alert>
        </Stack>
      </Paper>

      <Dialog
        open={manualTableOpen}
        onClose={() => setManualTableOpen(false)}
        maxWidth={lesson.id === 4 ? 'xl' : 'md'}
        fullWidth
      >
        <DialogTitle>
          {lesson.id === 4
            ? 'Таблицы 4.1–4.4 — Исходные данные (Занятие №4)'
            : lesson.labWizard.manualTableName}
        </DialogTitle>
        <DialogContent>
          {lesson.id === 4 ? (
            <Lab4TablesPanel />
          ) : lesson.id === 2 ? (
            <Stack spacing={3}>
              <Typography variant="subtitle2" fontWeight={700}>
                Таблица 2.1 — по последней цифре студбилета
              </Typography>
              <VariantTable variants={lesson.variants} activeVariant={variantNumber} />
              <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 2 }}>
                Таблица 2.2 — по предпоследней цифре студбилета
                {' '}(ваша: <strong>{lesson2Penultimate}</strong>)
              </Typography>
              <Table size="small" component={Paper} variant="outlined">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'primary.main', color: 'primary.contrastText' }}>Параметр</TableCell>
                    {[0,1,2,3,4,5,6,7,8,9].map((d) => (
                      <TableCell key={d} align="center" sx={{ fontWeight: d === lesson2Penultimate ? 700 : 400, bgcolor: d === lesson2Penultimate ? 'primary.light' : 'primary.main', color: 'primary.contrastText' }}>{d}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {([
                    ['Kз',        [0.5,0.6,0.7,0.8,0.9,1.0,1.1,1.2,1.3,1.4],  ''],
                    ['z',         [1.00,1.02,1.04,1.06,1.07,1.08,1.09,1.10,1.12,1.13], ''],
                    ['Wт (Вт/м²)',[5.0,5.2,5.4,5.6,5.8,6.0,6.2,6.4,6.6,6.8],  ''],
                    ['Sп (м²)',   [200,210,220,230,240,250,260,270,280,280],     ''],
                    ['n (шт)',    [1,2,3,4,5,6,7,8,9,10],                        ''],
                    ['η (%)',     [45,45,45,45,45,45,45,45,45,45],               ''],
                    ['μ',        [1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9,2.0],   ''],
                  ] as [string, number[], string][]).map(([label, vals]) => (
                    <TableRow key={label} sx={{ '&:nth-of-type(odd)': { bgcolor: 'action.hover' } }}>
                      <TableCell sx={{ fontWeight: 600 }}>{label}</TableCell>
                      {vals.map((val, d) => (
                        <TableCell key={d} align="center"
                          sx={{ bgcolor: d === lesson2Penultimate ? 'action.selected' : undefined, fontWeight: d === lesson2Penultimate ? 700 : 400 }}
                        >
                          {d === lesson2Penultimate
                            ? <Chip size="small" label={String(val)} color="primary" variant="filled" />
                            : String(val)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          ) : (
            <VariantTable variants={lesson.variants} activeVariant={variantNumber} />
          )}
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

