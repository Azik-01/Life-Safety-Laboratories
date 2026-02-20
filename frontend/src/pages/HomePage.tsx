import { Box, Button, Card, CardActions, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ScienceIcon from '@mui/icons-material/Science';
import QuizIcon from '@mui/icons-material/Quiz';
import { useNavigate } from 'react-router-dom';
import { lessons } from '../data/lessons';

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <Box>
      <Typography variant="h3" gutterBottom>
        Life-Safety Laboratories
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 3, maxWidth: 900 }}>
        Полный интерактивный практикум по БЖД: теория, лабораторные и тесты по 5 занятиям в формате методички.
      </Typography>

      <Grid container spacing={2.5}>
        {lessons.map((lesson) => (
          <Grid key={lesson.id} size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                  <Chip label={`Занятие ${lesson.id}`} color="primary" />
                  <Chip label={`${lesson.theoryModules.length} модулей`} variant="outlined" />
                  <Chip label={`${lesson.labWizard.steps.length + 1} шагов лаб.`} variant="outlined" />
                </Stack>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  {lesson.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lesson.goal}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} sx={{ width: '100%' }}>
                  <Button
                    variant="contained"
                    startIcon={<AutoStoriesIcon />}
                    onClick={() => navigate(`/lesson/${lesson.id}/theory`)}
                  >
                    Теория
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<ScienceIcon />}
                    onClick={() => navigate(`/lesson/${lesson.id}/lab`)}
                  >
                    Лабораторная
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<QuizIcon />}
                    onClick={() => navigate(`/lesson/${lesson.id}/test`)}
                  >
                    Тест
                  </Button>
                </Stack>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

