import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
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
import { pickVariantByTicketDigits } from '../../data/variants';
import LabScene3D from './LabScene3D';
import { mean } from '../../formulas/illumination';
import { sourceLevelAtObserver, sumLevelsEnergyDb } from '../../formulas/noise';
import { classifyEmZone, powerFluxDensityWm2, wavelengthM } from '../../formulas/emi';

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
  const initialValues = lesson.variants[0]?.values ?? {};
  const [ticketInput, setTicketInput] = useState('');
  const [variantNumber, setVariantNumber] = useState(0);
  const [trainingMode, setTrainingMode] = useState(false);
  const [manualTableOpen, setManualTableOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [resultRows, setResultRows] = useState<ResultRow[]>([]);

  const variant = useMemo(
    () => lesson.variants.find((item) => item.variant === variantNumber) ?? lesson.variants[0],
    [lesson.variants, variantNumber]
  );

  const [lampType, setLampType] = useState<LampType>('led');
  const [intensityCd, setIntensityCd] = useState(initialValues.intensityCd ?? initialValues.lampFluxLm ?? 900);
  const [heightM, setHeightM] = useState(initialValues.heightM ?? 2.8);
  const [sensorOffsetM, setSensorOffsetM] = useState(initialValues.distanceM ?? 0.9);

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

  function applyVariantValues(values: Record<string, number>) {
    if (lesson.id === 1 || lesson.id === 2) {
      setIntensityCd(values.intensityCd ?? values.lampFluxLm ?? 900);
      setHeightM(values.heightM ?? 2.8);
      setSensorOffsetM(values.distanceM ?? 0.9);
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
    const eLux = intensityCd / Math.max(0.1, distance * distance);
    const history = [eLux, eLux * 0.92, eLux * 1.05, eLux * 0.89, eLux * 1.02];
    return {
      eLux,
      eAvg: mean(history),
    };
  }, [heightM, intensityCd, sensorOffsetM]);

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
    if (lesson.id === 1 || lesson.id === 2) {
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

  const progress = useMemo(
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
      'TODO: manual confirmation: сверить табличные значения с PDF-методичкой.',
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
              if (nextVariant) applyVariantValues(nextVariant.values);
            }}
          >
            {lesson.variants.map((item) => (
              <MenuItem key={`variant-${item.variant}`} value={item.variant}>
                Вариант {item.variant}
              </MenuItem>
            ))}
          </Select>
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
        <Alert severity={lesson.labWizard.manualConfirmationRequired ? 'warning' : 'info'} sx={{ mt: 1 }}>
          {variant.sourceNote}
        </Alert>
      </Paper>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Пошаговый wizard</Typography>
          <Typography variant="body2" color="text.secondary">
            Прогресс: {progress}%
          </Typography>
        </Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 1, mb: 1.5 }} />

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

      <LabScene3D
        lessonId={lesson.id}
        lightState={{ lampType, intensityCd, heightM, sensorOffsetM }}
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
            <Alert severity={lightingMetrics.eLux >= 300 ? 'success' : 'warning'}>
              Текущее E={lightingMetrics.eLux.toFixed(1)} лк, Eср={lightingMetrics.eAvg.toFixed(1)} лк
            </Alert>
          </Stack>
        )}

        {lesson.id === 2 && (
          <Stack spacing={1.2}>
            <Typography variant="caption" fontWeight={600}>Расчёт освещённости (метод коэффициента использования)</Typography>
            <Select size="small" value={lampType} onChange={(event) => setLampType(event.target.value as LampType)} disabled={!trainingMode}>
              <MenuItem value="incandescent">Лампа накаливания</MenuItem>
              <MenuItem value="fluorescent">Люминесцентная лампа</MenuItem>
              <MenuItem value="led">LED</MenuItem>
            </Select>
            <Typography variant="caption">Световой поток лампы Фл: {intensityCd.toFixed(0)} лм</Typography>
            <Slider value={intensityCd} min={200} max={5000} step={10} disabled={!trainingMode} onChange={(_, value) => setIntensityCd(value as number)} />
            <Typography variant="caption">Высота подвеса H: {heightM.toFixed(2)} м</Typography>
            <Slider value={heightM} min={2.2} max={5} step={0.05} disabled={!trainingMode} onChange={(_, value) => setHeightM(value as number)} />
            <Typography variant="caption">Высота рабочей поверхности hp: {sensorOffsetM.toFixed(2)} м</Typography>
            <Slider value={sensorOffsetM} min={0} max={1.5} step={0.05} disabled={!trainingMode} onChange={(_, value) => setSensorOffsetM(value as number)} />
            <Alert severity={lightingMetrics.eLux >= 300 ? 'success' : 'warning'}>
              Расчётное E={lightingMetrics.eLux.toFixed(1)} лк
            </Alert>
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

      <Dialog open={manualTableOpen} onClose={() => setManualTableOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{lesson.labWizard.manualTableName}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 1 }}>
            TODO: manual confirmation. Таблица сформирована автопереносом и требует ручной сверки с PDF.
          </Alert>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Вариант</TableCell>
                <TableCell>Последние цифры</TableCell>
                <TableCell>Значения</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lesson.variants.map((item) => (
                <TableRow key={`variant-row-${item.variant}`}>
                  <TableCell>{item.variant}</TableCell>
                  <TableCell>{item.ticketLastDigits.join(', ')}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{JSON.stringify(item.values)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
