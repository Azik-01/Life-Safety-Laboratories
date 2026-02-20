import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { TestQuestion } from '../../types/theme';

interface TestSectionProps {
  questions: TestQuestion[];
}

export default function TestSection({ questions }: TestSectionProps) {
  const [singleAnswers, setSingleAnswers] = useState<Record<string, number>>({});
  const [multiAnswers, setMultiAnswers] = useState<Record<string, number[]>>({});
  const [numericAnswers, setNumericAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const total = questions.length;
  const score = useMemo(() => {
    if (!submitted) return 0;
    let correctCount = 0;
    for (const question of questions) {
      if (question.type === 'single') {
        if (singleAnswers[question.id] === question.correct) correctCount += 1;
      } else if (question.type === 'multi') {
        const selected = [...(multiAnswers[question.id] ?? [])].sort((a, b) => a - b);
        const expected = [...question.correct].sort((a, b) => a - b);
        if (selected.length === expected.length && selected.every((value, index) => value === expected[index])) {
          correctCount += 1;
        }
      } else {
        const raw = numericAnswers[question.id];
        const value = Number(raw);
        if (Number.isFinite(value) && Math.abs(value - question.correct) <= question.tolerance) {
          correctCount += 1;
        }
      }
    }
    return Math.round((correctCount / total) * 100);
  }, [multiAnswers, numericAnswers, questions, singleAnswers, submitted, total]);

  return (
    <Stack spacing={1.5}>
      {questions.map((question, index) => {
        let isCorrect = false;
        if (submitted) {
          if (question.type === 'single') {
            isCorrect = singleAnswers[question.id] === question.correct;
          } else if (question.type === 'multi') {
            const selected = [...(multiAnswers[question.id] ?? [])].sort((a, b) => a - b);
            const expected = [...question.correct].sort((a, b) => a - b);
            isCorrect = selected.length === expected.length && selected.every((value, idx) => value === expected[idx]);
          } else {
            const value = Number(numericAnswers[question.id]);
            isCorrect = Number.isFinite(value) && Math.abs(value - question.correct) <= question.tolerance;
          }
        }

        return (
          <Paper key={question.id} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {index + 1}. {question.prompt}
            </Typography>
            {question.type === 'single' && (
              <RadioGroup
                value={String(singleAnswers[question.id] ?? '')}
                onChange={(event) =>
                  setSingleAnswers((prev) => ({ ...prev, [question.id]: Number(event.target.value) }))
                }
              >
                {question.options.map((option, optionIndex) => (
                  <FormControlLabel key={`${question.id}-single-${optionIndex}`} value={String(optionIndex)} control={<Radio />} label={option} />
                ))}
              </RadioGroup>
            )}
            {question.type === 'multi' && (
              <Stack>
                {question.options.map((option, optionIndex) => {
                  const selectedValues = multiAnswers[question.id] ?? [];
                  const checked = selectedValues.includes(optionIndex);
                  return (
                    <FormControlLabel
                      key={`${question.id}-multi-${optionIndex}`}
                      control={
                        <Checkbox
                          checked={checked}
                          onChange={(event) => {
                            setMultiAnswers((prev) => {
                              const current = prev[question.id] ?? [];
                              const next = event.target.checked
                                ? [...current, optionIndex]
                                : current.filter((value) => value !== optionIndex);
                              return { ...prev, [question.id]: next };
                            });
                          }}
                        />
                      }
                      label={option}
                    />
                  );
                })}
              </Stack>
            )}
            {question.type === 'numeric' && (
              <TextField
                type="number"
                size="small"
                label={`Числовой ответ${question.unit ? `, ${question.unit}` : ''}`}
                value={numericAnswers[question.id] ?? ''}
                onChange={(event) => setNumericAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))}
              />
            )}

            {submitted && (
              <Alert severity={isCorrect ? 'success' : 'warning'} sx={{ mt: 1 }}>
                {isCorrect ? 'Верно.' : 'Неверно.'} {question.explanation}
              </Alert>
            )}
          </Paper>
        );
      })}

      <Stack direction="row" spacing={1}>
        <Button variant="contained" onClick={() => setSubmitted(true)}>
          Проверить тест
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            setSubmitted(false);
            setSingleAnswers({});
            setMultiAnswers({});
            setNumericAnswers({});
          }}
        >
          Сброс
        </Button>
      </Stack>

      {submitted && (
        <Alert severity={score >= 70 ? 'success' : 'warning'}>
          Итог: {score}%. {score >= 70 ? 'Тест пройден.' : 'Нужно повторить материал и пересдать.'}
        </Alert>
      )}
    </Stack>
  );
}
