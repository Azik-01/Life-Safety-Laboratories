import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import QuizIcon from '@mui/icons-material/Quiz';
import { themes } from '../data/themes';
import SceneViewer from '../components/SceneViewer';

export default function ThemeContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = themes.find((t) => t.id === Number(id));
  const [activeStep, setActiveStep] = useState(0);

  if (!theme) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography variant="h5">Тема не найдена</Typography>
        <Button onClick={() => navigate('/themes')} sx={{ mt: 2 }}>
          К списку тем
        </Button>
      </Box>
    );
  }

  const step = theme.steps[activeStep];
  const isLast = activeStep === theme.steps.length - 1;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/themes')} sx={{ mb: 2 }}>
        К списку тем
      </Button>

      <Typography variant="h4" gutterBottom>
        {theme.title}
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {theme.steps.map((s, i) => (
          <Step key={i}>
            <StepLabel>{s.title}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Current step content */}
      {step.type === 'theory' && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            📖 {step.title}
          </Typography>
          <Typography variant="body1" sx={{ lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {step.content}
          </Typography>
        </Paper>
      )}

      {step.type === 'scene' && step.sceneId && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            🎬 {step.title}
          </Typography>
          <SceneViewer sceneId={step.sceneId} />
        </Box>
      )}

      {/* Navigation */}
      <Box display="flex" justifyContent="space-between" mt={2}>
        <Button
          variant="outlined"
          disabled={activeStep === 0}
          onClick={() => setActiveStep((s) => s - 1)}
          startIcon={<ArrowBackIcon />}
        >
          Назад
        </Button>

        {isLast ? (
          <Button
            variant="contained"
            color="secondary"
            endIcon={<QuizIcon />}
            onClick={() => navigate(`/test/${theme.id}`)}
          >
            Перейти к тесту
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={() => setActiveStep((s) => s + 1)}
            endIcon={<ArrowForwardIcon />}
          >
            Далее
          </Button>
        )}
      </Box>
    </Box>
  );
}
