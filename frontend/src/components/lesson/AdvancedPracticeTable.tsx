import { useCallback, useMemo, useState, memo } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

/* ---------- Types ---------- */

export interface PracticeParam {
  key: string;
  label: string;
  unit: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  /** if true, this param is computed, not editable */
  computed?: boolean;
}

export interface PracticeStep {
  label: string;
  formula: string;
  compute: (params: Record<string, number>) => number;
  resultKey: string;
  resultUnit: string;
}

export interface PracticeMethod {
  id: string;
  title: string;
  description?: string;
  params: PracticeParam[];
  steps: PracticeStep[];
  conclusionFn?: (results: Record<string, number>) => string;
}

export interface AdvancedPracticeTableProps {
  /** Multiple calculation methods (tabs) */
  methods: PracticeMethod[];
  /** Title */
  title?: string;
}

/* ---------- Helper ---------- */

function safeNum(val: string | number): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

/* ---------- Single Method Panel ---------- */

interface MethodPanelProps {
  method: PracticeMethod;
}

function MethodPanel({ method }: MethodPanelProps) {
  const defaults = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of method.params) {
      map[p.key] = p.defaultValue;
    }
    return map;
  }, [method.params]);

  const [inputs, setInputs] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const p of method.params) {
      if (!p.computed) map[p.key] = String(p.defaultValue);
    }
    return map;
  });

  const [calculated, setCalculated] = useState(false);

  const paramValues = useMemo(() => {
    const map: Record<string, number> = { ...defaults };
    for (const [k, v] of Object.entries(inputs)) {
      map[k] = safeNum(v);
    }
    return map;
  }, [defaults, inputs]);

  const results = useMemo(() => {
    if (!calculated) return null;
    const accumulator: Record<string, number> = { ...paramValues };
    const stepResults: { label: string; formula: string; value: number; unit: string }[] = [];

    for (const step of method.steps) {
      try {
        const val = step.compute(accumulator);
        accumulator[step.resultKey] = Number.isFinite(val) ? val : 0;
        stepResults.push({
          label: step.label,
          formula: step.formula,
          value: Number.isFinite(val) ? val : NaN,
          unit: step.resultUnit,
        });
      } catch {
        stepResults.push({
          label: step.label,
          formula: step.formula,
          value: NaN,
          unit: step.resultUnit,
        });
      }
    }

    const conclusion = method.conclusionFn ? method.conclusionFn(accumulator) : null;
    return { stepResults, conclusion, accumulator };
  }, [calculated, method, paramValues]);

  const handleInput = useCallback(
    (key: string, value: string) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
      setCalculated(false);
    },
    [],
  );

  const copyResults = useCallback(async () => {
    if (!results) return;
    const text = results.stepResults
      .map((r) => `${r.label}: ${Number.isFinite(r.value) ? r.value.toFixed(4) : 'ошибка'} ${r.unit}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text + (results.conclusion ? `\n\nВывод: ${results.conclusion}` : ''));
    } catch { /* noop */ }
  }, [results]);

  return (
    <Box>
      {method.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {method.description}
        </Typography>
      )}

      {/* Input params */}
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Исходные данные
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mb: 2 }}>
        {method.params
          .filter((p) => !p.computed)
          .map((p) => (
            <Tooltip key={p.key} title={`${p.label} [${p.unit}]`} arrow>
              <TextField
                size="small"
                type="number"
                label={`${p.label} [${p.unit}]`}
                value={inputs[p.key] ?? ''}
                onChange={(e) => handleInput(p.key, e.target.value)}
                inputProps={{ min: p.min, max: p.max, step: p.step ?? 0.1 }}
                sx={{ width: 180 }}
              />
            </Tooltip>
          ))}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<CalculateIcon />}
          onClick={() => setCalculated(true)}
        >
          Рассчитать
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setCalculated(false);
            const map: Record<string, string> = {};
            for (const p of method.params) {
              if (!p.computed) map[p.key] = String(p.defaultValue);
            }
            setInputs(map);
          }}
        >
          Сброс
        </Button>
        {results && (
          <Button variant="outlined" startIcon={<ContentCopyIcon />} onClick={copyResults}>
            Копировать
          </Button>
        )}
      </Stack>

      {/* Step-by-step results */}
      {results && (
        <>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Шаг</TableCell>
                <TableCell>Формула</TableCell>
                <TableCell align="right">Результат</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.stepResults.map((r, i) => (
                <TableRow key={i} sx={Number.isNaN(r.value) ? { bgcolor: 'error.light' } : undefined}>
                  <TableCell>{r.label}</TableCell>
                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{r.formula}</TableCell>
                  <TableCell align="right">
                    {Number.isFinite(r.value) ? (
                      <Chip label={`${r.value.toFixed(2)} ${r.unit}`} size="small" color="primary" variant="outlined" />
                    ) : (
                      <Chip label="Ошибка" size="small" color="error" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {results.conclusion && (
            <Alert severity={results.conclusion.includes('превышает') ? 'warning' : 'success'} sx={{ mt: 1.5 }}>
              <Typography variant="body2" fontWeight={600}>
                Вывод: {results.conclusion}
              </Typography>
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}

/* ---------- Main Component ---------- */

function AdvancedPracticeTable({ methods, title }: AdvancedPracticeTableProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (methods.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: 2, my: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
        <CalculateIcon color="secondary" />
        <Typography variant="h6">{title ?? 'Практический расчёт'}</Typography>
      </Stack>

      {methods.length > 1 && (
        <>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 1.5 }}
          >
            {methods.map((m, i) => (
              <Tab key={m.id} label={m.title} value={i} />
            ))}
          </Tabs>
          <Divider sx={{ mb: 1.5 }} />
        </>
      )}

      <MethodPanel method={methods[activeTab]} />
    </Paper>
  );
}

export default memo(AdvancedPracticeTable);
