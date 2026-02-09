import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import QuizIcon from '@mui/icons-material/Quiz';
import themesData from '../data/themes';
import SceneLoader from '../components/SceneLoader';

export default function ThemeContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const theme = useMemo(
    () => themesData.find((t) => t.id === Number(id)),
    [id]
  );

  if (!theme) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h5">Theme not found.</Typography>
        <Button onClick={() => navigate('/themes')}>Back to Themes</Button>
      </Container>
    );
  }

  const steps = theme.steps;
  const currentStep = steps[activeStep];
  const isLast = activeStep === steps.length - 1;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #0d1b2a 100%)',
      }}
    >
      <Container maxWidth="md">
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/themes')}
          sx={{ mb: 2 }}
        >
          Back to Themes
        </Button>

        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          {theme.title}
        </Typography>

        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {steps.map((step, index) => (
            <Step key={index}>
              <StepLabel>{step.title}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {currentStep.type === 'theory' && (
          <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {currentStep.title}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              {currentStep.content}
            </Typography>
          </Paper>
        )}

        {currentStep.type === 'scene' && (
          <Paper
            sx={{
              mb: 3,
              borderRadius: 2,
              overflow: 'hidden',
              height: { xs: 300, md: 450 },
              background: '#1a1a2e',
            }}
          >
            <SceneLoader sceneKey={currentStep.sceneKey} />
          </Paper>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            variant="outlined"
            disabled={activeStep === 0}
            onClick={() => setActiveStep((s) => s - 1)}
            startIcon={<ArrowBackIcon />}
          >
            Previous
          </Button>

          {isLast ? (
            <Button
              variant="contained"
              endIcon={<QuizIcon />}
              onClick={() => navigate(`/test/${theme.id}`)}
            >
              Take the Test
            </Button>
          ) : (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => setActiveStep((s) => s + 1)}
            >
              Next
            </Button>
          )}
        </Box>
      </Container>
    </Box>
  );
}
