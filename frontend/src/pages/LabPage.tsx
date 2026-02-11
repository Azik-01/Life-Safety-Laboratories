import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { themes } from '../data/themes';
import LightInvestigationLab from './labs/LightInvestigationLab';
import LightCalculationLab from './labs/LightCalculationLab';
import NoiseLab from './labs/NoiseLab';
import EMFLab from './labs/EMFLab';
import UHFLab from './labs/UHFLab';

/* ─── Map theme id → lab component ─── */
const labMap: Record<number, React.FC> = {
  1: LightInvestigationLab,
  2: LightCalculationLab,
  3: NoiseLab,
  5: EMFLab,
  6: UHFLab,
};

export default function LabPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const themeId = Number(id);
  const theme = themes.find((t) => t.id === themeId);

  if (!theme) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography variant="h5">Лабораторная не найдена</Typography>
        <Button onClick={() => navigate('/themes')} sx={{ mt: 2 }}>
          К списку тем
        </Button>
      </Box>
    );
  }

  const LabComponent = labMap[themeId];

  if (!LabComponent) {
    return (
      <Box textAlign="center" mt={8}>
        <Typography variant="h5">Лаборатория для этой темы ещё не реализована</Typography>
        <Button onClick={() => navigate('/themes')} sx={{ mt: 2 }}>
          К списку тем
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/test/${theme.id}`)}
        sx={{ mb: 1 }}
      >
        Назад к тесту
      </Button>

      <Typography variant="h4" gutterBottom>
        🔬 {theme.title}
      </Typography>

      <LabComponent />
    </Box>
  );
}
