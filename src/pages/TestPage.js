import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  Alert,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScienceIcon from '@mui/icons-material/Science';
import ReplayIcon from '@mui/icons-material/Replay';
import themesData from '../data/themes';
import { useAppContext } from '../context/AppContext';

export default function TestPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dispatch } = useAppContext();
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

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

  const questions = theme.questions;

  const handleChange = (qIndex, value) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: Number(value) }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const correct = questions.reduce(
      (acc, q, i) => (answers[i] === q.correctIndex ? acc + 1 : acc),
      0
    );
    const score = Math.round((correct / questions.length) * 100);
    dispatch({
      type: 'SET_TEST_RESULT',
      payload: { themeId: theme.id, score },
    });
    if (score >= 70) {
      dispatch({ type: 'UNLOCK_LAB', payload: theme.id });
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
  };

  const correctCount = submitted
    ? questions.reduce(
        (acc, q, i) => (answers[i] === q.correctIndex ? acc + 1 : acc),
        0
      )
    : 0;
  const score = submitted
    ? Math.round((correctCount / questions.length) * 100)
    : 0;
  const passed = score >= 70;

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
          onClick={() => navigate(`/theme/${theme.id}`)}
          sx={{ mb: 2 }}
        >
          Back to Theme
        </Button>

        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Test: {theme.title}
        </Typography>

        {submitted && (
          <Alert
            severity={passed ? 'success' : 'error'}
            sx={{ mb: 3 }}
            action={
              !passed && (
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<ReplayIcon />}
                  onClick={handleRetry}
                >
                  Retry
                </Button>
              )
            }
          >
            {passed
              ? `Congratulations! You scored ${score}% (${correctCount}/${questions.length}). You can proceed to the lab.`
              : `You scored ${score}% (${correctCount}/${questions.length}). You need at least 70% to proceed. Try again!`}
          </Alert>
        )}

        {submitted && (
          <LinearProgress
            variant="determinate"
            value={score}
            color={passed ? 'success' : 'error'}
            sx={{ mb: 3, height: 8, borderRadius: 4 }}
          />
        )}

        {questions.map((q, qIndex) => (
          <Paper key={qIndex} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel
                component="legend"
                sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}
              >
                {qIndex + 1}. {q.question}
              </FormLabel>
              <RadioGroup
                value={answers[qIndex] !== undefined ? String(answers[qIndex]) : ''}
                onChange={(e) => handleChange(qIndex, e.target.value)}
              >
                {q.options.map((opt, oIndex) => {
                  let color = 'default';
                  if (submitted) {
                    if (oIndex === q.correctIndex) color = 'success';
                    else if (answers[qIndex] === oIndex) color = 'error';
                  }
                  return (
                    <FormControlLabel
                      key={oIndex}
                      value={String(oIndex)}
                      control={<Radio color={color} />}
                      label={opt}
                      disabled={submitted}
                      sx={
                        submitted && oIndex === q.correctIndex
                          ? { color: '#66bb6a' }
                          : submitted && answers[qIndex] === oIndex && oIndex !== q.correctIndex
                          ? { color: '#ef5350' }
                          : {}
                      }
                    />
                  );
                })}
              </RadioGroup>
            </FormControl>
          </Paper>
        ))}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          {!submitted ? (
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < questions.length}
            >
              Submit Answers
            </Button>
          ) : passed ? (
            <Button
              variant="contained"
              size="large"
              color="success"
              startIcon={<ScienceIcon />}
              onClick={() => navigate(`/lab/${theme.id}`)}
            >
              Proceed to Lab
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              startIcon={<ReplayIcon />}
              onClick={handleRetry}
            >
              Retry Test
            </Button>
          )}
        </Box>
      </Container>
    </Box>
  );
}
