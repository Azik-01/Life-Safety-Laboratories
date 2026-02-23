import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Divider,
  FormControlLabel,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { TheoryModule } from '../../types/theme';
import type { LessonId } from '../../types/theme';
import FormulaBlock from './FormulaBlock';
import FigureZoom from './FigureZoom';
import TermHighlight from './TermHighlight';
import { manualAssets } from '../../data/manualAssets';
import {
  getKnowledgeLayer,
  toFormulaBlockProps,
  buildGlossary,
  buildPracticeMethods,
} from '../../data/knowledgeLayer';
import AdvancedPracticeTable from './AdvancedPracticeTable';
import { useProgress } from '../../context/ProgressContext';

const MiniSimulator = lazy(() => import('./MiniSimulator'));

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
  lessonId?: LessonId;
}

export default function TheorySection({ modules, lessonId }: TheorySectionProps) {
  const progress = useProgress();
  const knowledgeLayer = lessonId ? getKnowledgeLayer(lessonId) : undefined;
  const glossary = useMemo(() => (knowledgeLayer ? buildGlossary(knowledgeLayer) : {}), [knowledgeLayer]);
  const practiceMethods = useMemo(() => (lessonId ? buildPracticeMethods(lessonId) : []), [lessonId]);
  const [detailedMode, setDetailedMode] = useState(true);

  useEffect(() => {
    if (!lessonId) return;
    modules.forEach((module) => progress.markTheoryRead(lessonId, module.id));
  }, [lessonId, modules, progress]);

  return (
    <Stack spacing={2}>
      {/* Brief / detailed toggle */}
      <Stack direction="row" justifyContent="flex-end" spacing={1}>
        <Chip
          label={detailedMode ? 'Подробный режим' : 'Краткий режим'}
          color={detailedMode ? 'primary' : 'default'}
          onClick={() => setDetailedMode((prev) => !prev)}
          variant="outlined"
          size="small"
        />
      </Stack>

      {/* Knowledge layer theory blocks (from JSON) */}
      {knowledgeLayer && detailedMode && (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              📖 Теоретические сведения
            </Typography>
            <Stack spacing={1.5}>
              {knowledgeLayer.theory.map((block) => (
                <KnowledgeBlock key={block.id} block={block} glossary={glossary} />
              ))}
            </Stack>

            {/* Knowledge layer formulas */}
            {knowledgeLayer.formulas.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Формулы
                </Typography>
                {knowledgeLayer.formulas.map((formula) => (
                  <FormulaBlock key={formula.id} {...toFormulaBlockProps(formula)} />
                ))}
              </Box>
            )}

            {/* Knowledge layer figures */}
            {knowledgeLayer.figures.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Иллюстрации
                </Typography>
                <Stack spacing={1.2}>
                  {knowledgeLayer.figures.map((fig) => (
                    <FigureZoom key={fig.id} src={fig.path} caption={fig.caption} />
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing theory module cards (unchanged structure) */}
      {modules.map((module) => {
        const assets = manualAssets.filter((asset) => module.assetIds?.includes(asset.id));
        return (
          <Card key={module.id} id={module.id}>
            <CardContent>
              <Typography variant="h6">{module.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.8 }}>
                <TermHighlight text={module.definition} glossary={glossary} />
              </Typography>

              <FormulaBlock
                expression={module.formula}
                variables={[]}
                explanation={module.formulaExplanation}
              />
              <Typography variant="caption" display="block" sx={{ mt: 0.8 }}>
                Единицы: {module.units}
              </Typography>

              <Suspense fallback={<LinearProgress sx={{ mt: 1 }} />}>
                <MiniSimulator type={module.simulator} />
              </Suspense>

              {detailedMode && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 1.5 }}>
                    Что это значит на практике
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <TermHighlight text={module.practicalMeaning} glossary={glossary} />
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
                </>
              )}

              {assets.length > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Иллюстрации из методички
                  </Typography>
                  <Stack spacing={1.2}>
                    {assets.map((asset) => (
                      <FigureZoom
                        key={asset.id}
                        src={asset.path}
                        alt={asset.alt}
                        caption={`${asset.caption} (${asset.pageHint})`}
                      />
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

      {/* Practice table from knowledge layer */}
      {practiceMethods.length > 0 && (
        <AdvancedPracticeTable methods={practiceMethods} title="Практический расчёт" />
      )}
    </Stack>
  );
}

/* ---------- KnowledgeBlock sub-component ---------- */

function KnowledgeBlock({
  block,
  glossary,
}: {
  block: { id: string; heading: string; text: string; keywords: string[] };
  glossary: Record<string, string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = block.text.length > 200;
  const displayText = !isLong || expanded ? block.text : block.text.slice(0, 200) + '…';

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }} id={block.id}>
      <Typography variant="subtitle2" color="primary.main">
        {block.heading}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5 }}>
        <TermHighlight text={displayText} glossary={glossary} />
      </Typography>
      {isLong && (
        <Button
          size="small"
          endIcon={<ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />}
          onClick={() => setExpanded((prev) => !prev)}
          sx={{ mt: 0.5 }}
        >
          {expanded ? 'Свернуть' : 'Читать далее'}
        </Button>
      )}
      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
        {block.keywords.map((kw) => (
          <Chip key={kw} label={kw} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
        ))}
      </Stack>
    </Paper>
  );
}
