import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Alert,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import { themes } from '../data/themes';
import { useAppContext } from '../context/AppContext';

export default function TestPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setTestScore, hasPassedTest } = useAppContext();
  const theme = themes.find((t) => t.id === Number(id));

  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

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

  const quiz = theme.quiz;
  const totalQuestions = quiz.length;
  const answeredCount = Object.keys(answers).length;

  const handleSubmit = () => {
    let correct = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });
    const pct = Math.round((correct / totalQuestions) * 100);
    setScore(pct);
    setTestScore(theme.id, pct);
    setSubmitted(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const passed = score >= 70;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(`/theme/${theme.id}`)} sx={{ mb: 2 }}>
        Назад к теме
      </Button>

      <Typography variant="h4" gutterBottom>
        Тест: {theme.title}
      </Typography>

      {!submitted && (
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Отвечено {answeredCount} из {totalQuestions}
          </Typography>
          <LinearProgress variant="determinate" value={(answeredCount / totalQuestions) * 100} />
        </Box>
      )}

      {submitted && (
        <Alert severity={passed ? 'success' : 'warning'} sx={{ mb: 3 }}>
          {passed
            ? `Отлично! Ваш результат: ${score}%. Можете перейти к лабораторной работе.`
            : `Ваш результат: ${score}%. Для допуска к лабораторной нужно набрать не менее 70%. Попробуйте ещё раз!`}
        </Alert>
      )}

      {quiz.map((q, qi) => (
        <Paper key={qi} sx={{ p: 3, mb: 2, opacity: submitted ? 0.85 : 1 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            {qi + 1}. {q.question}
          </Typography>
          <RadioGroup
            value={answers[qi] ?? ''}
            onChange={(e) =>
              !submitted && setAnswers((prev) => ({ ...prev, [qi]: Number(e.target.value) }))
            }
          >
            {q.options.map((opt, oi) => {
              let color: string | undefined;
              if (submitted) {
                if (oi === q.correctIndex) color = '#66bb6a';
                else if (answers[qi] === oi) color = '#ef5350';
              }
              return (
                <FormControlLabel
                  key={oi}
                  value={oi}
                  control={<Radio />}
                  label={opt}
                  sx={color ? { color } : undefined}
                  disabled={submitted}
                />
              );
            })}
          </RadioGroup>
        </Paper>
      ))}

      <Box display="flex" gap={2} mt={2} flexWrap="wrap">
        {!submitted && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={answeredCount < totalQuestions}
            startIcon={<CheckCircleIcon />}
          >
            Ответить
          </Button>
        )}

        {submitted && !passed && (
          <Button variant="contained" color="warning" startIcon={<ReplayIcon />} onClick={handleRetry}>
            Повторить
          </Button>
        )}

        {submitted && passed && (
          <Button
            variant="contained"
            color="success"
            onClick={() => navigate(`/lab/${theme.id}`)}
          >
            Перейти к лабораторной →
          </Button>
        )}

        {/* Allow users who already passed to go directly */}
        {!submitted && hasPassedTest(theme.id) && (
          <Button variant="outlined" color="success" onClick={() => navigate(`/lab/${theme.id}`)}>
            Пропустить (уже сдано) →
          </Button>
        )}
      </Box>
    </Box>
  );
}
