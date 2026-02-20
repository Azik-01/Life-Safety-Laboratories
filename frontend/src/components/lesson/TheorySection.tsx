import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import type { TheoryModule } from '../../types/theme';
import MiniSimulator from './MiniSimulator';
import { manualAssets } from '../../data/manualAssets';

function MiniQuestion({ moduleId, question }: { moduleId: string; question: TheoryModule['miniQuestion'] }) {
  const [selected, setSelected] = useState<string>('');
  const [numericValue, setNumericValue] = useState<string>('');
  const [checked, setChecked] = useState(false);

  const result = useMemo(() => {
    if (!checked) return null;
    if (question.type === 'single') {
      return Number(selected) === Number(question.correctAnswer);
    }
    const num = Number(numericValue);
    const correct = Number(question.correctAnswer);
    const tolerance = question.tolerance ?? 0;
    return Number.isFinite(num) && Math.abs(num - correct) <= tolerance;
  }, [checked, question, selected, numericValue]);

  return (
    <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5 }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        Мини-вопрос
      </Typography>
      <Typography variant="body2">{question.question}</Typography>
      {question.type === 'single' ? (
        <RadioGroup
          value={selected}
          onChange={(event) => {
            setSelected(event.target.value);
            setChecked(false);
          }}
          sx={{ mt: 0.8 }}
        >
          {question.options?.map((option, index) => (
            <FormControlLabel key={`${moduleId}-${index}`} value={String(index)} control={<Radio size="small" />} label={option} />
          ))}
        </RadioGroup>
      ) : (
        <TextField
          size="small"
          type="number"
          label="Ваш ответ"
          value={numericValue}
          onChange={(event) => {
            setNumericValue(event.target.value);
            setChecked(false);
          }}
          sx={{ mt: 1 }}
        />
      )}
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        <Button variant="contained" size="small" onClick={() => setChecked(true)}>
          Проверить
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={() => {
            setChecked(false);
            setSelected('');
            setNumericValue('');
          }}
        >
          Сброс
        </Button>
      </Stack>
      {checked && result !== null && (
        <Alert severity={result ? 'success' : 'warning'} sx={{ mt: 1 }}>
          {result ? 'Верно.' : 'Неверно.'} {question.explanation}
        </Alert>
      )}
    </Paper>
  );
}

interface TheorySectionProps {
  modules: TheoryModule[];
}

export default function TheorySection({ modules }: TheorySectionProps) {
  return (
    <Stack spacing={2}>
      {modules.map((module) => {
        const assets = manualAssets.filter((asset) => module.assetIds?.includes(asset.id));
        return (
          <Card key={module.id} id={module.id}>
            <CardContent>
              <Typography variant="h6">{module.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                {module.definition}
              </Typography>

              <Paper variant="outlined" sx={{ p: 1.5, mt: 1.5 }}>
                <Typography variant="subtitle2">Формула</Typography>
                <Typography variant="h6" sx={{ mt: 0.5 }}>
                  {module.formula}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                  {module.formulaExplanation}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 0.8 }}>
                  Единицы: {module.units}
                </Typography>
              </Paper>

              <MiniSimulator type={module.simulator} />

              <Typography variant="subtitle2" sx={{ mt: 1.5 }}>
                Что это значит на практике
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {module.practicalMeaning}
              </Typography>

              <Typography variant="subtitle2" sx={{ mt: 1.5 }}>
                Типичные ошибки
              </Typography>
              <Stack spacing={0.4}>
                {module.commonMistakes.map((mistake, index) => (
                  <Typography key={`${module.id}-mistake-${index}`} variant="body2" color="text.secondary">
                    • {mistake}
                  </Typography>
                ))}
              </Stack>

              {assets.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Иллюстрации из методички
                  </Typography>
                  <Stack spacing={1.2}>
                    {assets.map((asset) => (
                      <Paper key={asset.id} variant="outlined" sx={{ p: 1 }}>
                        <Box
                          component="img"
                          src={asset.path}
                          alt={asset.alt}
                          sx={{
                            width: '100%',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.8, display: 'block' }}>
                          {asset.caption} ({asset.pageHint})
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}

              <MiniQuestion moduleId={module.id} question={module.miniQuestion} />
            </CardContent>
            <Divider />
          </Card>
        );
      })}
    </Stack>
  );
}

