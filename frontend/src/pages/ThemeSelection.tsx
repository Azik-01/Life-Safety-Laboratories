import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CalculateIcon from '@mui/icons-material/Calculate';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import WifiTetheringIcon from '@mui/icons-material/WifiTethering';
import RadioactiveIcon from '@mui/icons-material/Warning';
import ScienceIcon from '@mui/icons-material/Science';
import { themes } from '../data/themes';
import { useAppContext } from '../context/AppContext';

const iconMap: Record<string, React.ReactNode> = {
  light: <LightbulbIcon sx={{ fontSize: 48 }} />,
  calculate: <CalculateIcon sx={{ fontSize: 48 }} />,
  noise: <VolumeUpIcon sx={{ fontSize: 48 }} />,
  emf: <WifiTetheringIcon sx={{ fontSize: 48 }} />,
  radiation: <RadioactiveIcon sx={{ fontSize: 48 }} />,
};

export default function ThemeSelection() {
  const navigate = useNavigate();
  const { hasPassedTest } = useAppContext();

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/')} sx={{ mb: 2 }}>
        В меню
      </Button>

      <Typography variant="h4" gutterBottom>
        Выберите тему
      </Typography>
      <Typography variant="body1" color="text.secondary" mb={3}>
        Каждая тема содержит теорию, 3D-анимации, тест и интерактивную лабораторную работу.
      </Typography>

      <Grid container spacing={3}>
        {themes.map((t) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={t.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
            >
              <CardActionArea
                onClick={() => navigate(`/theme/${t.id}`)}
                sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', p: 1 }}
              >
                <CardContent>
                  <Box sx={{ mb: 2, color: 'primary.main' }}>
                    {iconMap[t.icon] ?? <ScienceIcon sx={{ fontSize: 48 }} />}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {t.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.subtitle}
                  </Typography>
                  <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                    <Chip label={`${t.steps.length} шагов`} size="small" />
                    <Chip label={`${t.quiz.length} вопросов`} size="small" />
                    {hasPassedTest(t.id) && (
                      <Chip label="Сдано ✓" color="success" size="small" />
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
