import { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate, useParams } from 'react-router-dom';
import { getLessonById } from '../data/lessons';
import TheorySection from '../components/lesson/TheorySection';
import LabSection from '../components/lesson/LabSection';
import TestSection from '../components/lesson/TestSection';
import type { LessonId } from '../types/theme';

type Section = 'theory' | 'lab' | 'test';

function normalizeSection(raw?: string): Section {
  if (raw === 'lab' || raw === 'test') return raw;
  return 'theory';
}

export default function LessonPage() {
  const navigate = useNavigate();
  const { id, section } = useParams<{ id: string; section?: string }>();
  const lesson = getLessonById(Number(id));
  const activeSection = normalizeSection(section);
  const [search, setSearch] = useState('');

  const query = search.trim().toLowerCase();
  const filteredModules = (lesson?.theoryModules ?? []).filter((module) => {
    if (!query) return true;
    const inTitle = module.title.toLowerCase().includes(query);
    const inKeywords = module.keywords.some((keyword) => keyword.toLowerCase().includes(query));
    const inFormula = module.formula.toLowerCase().includes(query);
    return inTitle || inKeywords || inFormula;
  });

  if (!lesson) {
    return (
      <Box>
        <Typography variant="h5">Занятие не найдено</Typography>
        <Button sx={{ mt: 2 }} onClick={() => navigate('/')}>
          К списку занятий
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 1 }}>
        На главную
      </Button>

      <Typography variant="h4" sx={{ mb: 1 }}>
        {lesson.title}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        {lesson.goal}
      </Typography>

      <Tabs
        value={activeSection}
        onChange={(_, value: Section) => navigate(`/lesson/${lesson.id}/${value}`)}
        sx={{ mb: 2 }}
      >
        <Tab value="theory" label="Теория" />
        <Tab value="lab" label="Лабораторная" />
        <Tab value="test" label="Тест" />
      </Tabs>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <Paper variant="outlined" sx={{ p: 1.5, position: 'sticky', top: 16 }}>
            <Typography variant="subtitle1">Оглавление</Typography>
            {activeSection === 'theory' && (
              <TextField
                size="small"
                fullWidth
                label="Поиск по теории"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ mt: 1 }}
              />
            )}
            <List dense sx={{ mt: 1 }}>
              {activeSection === 'theory' &&
                filteredModules.map((module) => (
                  <ListItemButton
                    key={`toc-${module.id}`}
                    onClick={() =>
                      document.getElementById(module.id)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      })
                    }
                  >
                    <ListItemText primary={module.title} />
                  </ListItemButton>
                ))}
              {activeSection === 'lab' && (
                <>
                  <ListItemButton>
                    <ListItemText primary="Шаг 0. Вариант" />
                  </ListItemButton>
                  {lesson.labWizard.steps.map((step, index) => (
                    <ListItemButton key={`step-${step.id}`}>
                      <ListItemText primary={`Шаг ${index + 1}. ${step.title}`} />
                    </ListItemButton>
                  ))}
                </>
              )}
              {activeSection === 'test' &&
                lesson.tests.map((question, index) => (
                  <ListItemButton key={`q-${question.id}`}>
                    <ListItemText primary={`Вопрос ${index + 1}`} />
                  </ListItemButton>
                ))}
            </List>
            <Stack spacing={0.4} sx={{ mt: 1 }}>
              {lesson.references.map((reference) => (
                <Typography key={`ref-${reference}`} variant="caption" color="text.secondary">
                  • {reference}
                </Typography>
              ))}
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 9 }}>
          {activeSection === 'theory' && <TheorySection modules={filteredModules} lessonId={lesson.id as LessonId} />}
          {activeSection === 'lab' && <LabSection key={`lab-${lesson.id}`} lesson={lesson} />}
          {activeSection === 'test' && <TestSection questions={lesson.tests} lessonId={lesson.id as LessonId} />}
        </Grid>
      </Grid>
    </Box>
  );
}
