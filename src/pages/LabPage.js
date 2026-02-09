import React, { useState, Suspense, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Slider,
  Grid,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import themesData from '../data/themes';
import { useAppContext } from '../context/AppContext';
import LabScene from '../scenes/LabScene';

function getHazardLevel(energy) {
  if (energy < 10) return 'Low';
  if (energy < 50) return 'Moderate';
  if (energy < 150) return 'High';
  return 'Critical';
}

function getHazardColor(level) {
  switch (level) {
    case 'Low': return 'success';
    case 'Moderate': return 'warning';
    case 'High': return 'error';
    case 'Critical': return 'error';
    default: return 'default';
  }
}

export default function LabPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useAppContext();

  const theme = useMemo(
    () => themesData.find((t) => t.id === Number(id)),
    [id]
  );

  const [height, setHeight] = useState(5);
  const [mass, setMass] = useState(2);
  const [dropping, setDropping] = useState(false);
  const [energy, setEnergy] = useState(0);

  if (!theme) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h5">Theme not found.</Typography>
        <Button onClick={() => navigate('/themes')}>Back to Themes</Button>
      </Container>
    );
  }

  if (!state.labUnlocked[theme.id]) {
    return (
      <Container sx={{ py: 4 }}>
        <Typography variant="h5" gutterBottom>
          Lab Locked
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          You need to pass the test with at least 70% to access this lab.
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate(`/test/${theme.id}`)}
        >
          Take the Test
        </Button>
      </Container>
    );
  }

  const handleDrop = () => {
    setDropping(true);
    setEnergy(0);
  };

  const handleLanded = () => {
    const ke = mass * 9.81 * height;
    setEnergy(ke);
    setDropping(false);
  };

  const handleReset = () => {
    setDropping(false);
    setEnergy(0);
  };

  const hazardLevel = getHazardLevel(energy);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #0d1b2a 100%)',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/themes')}
          sx={{ mb: 1 }}
        >
          Back to Themes
        </Button>

        <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
          Interactive Lab: {theme.title}
        </Typography>

        <Grid container spacing={2}>
          {/* 3D Scene */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                height: { xs: 350, md: 500 },
                borderRadius: 2,
                overflow: 'hidden',
                background: '#1a1a2e',
              }}
            >
              <Suspense
                fallback={
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography color="text.secondary">Loading 3D Lab…</Typography>
                  </Box>
                }
              >
                <LabScene
                  height={height}
                  mass={mass}
                  dropping={dropping}
                  onLanded={handleLanded}
                  energy={energy}
                  hazardLevel={hazardLevel}
                />
              </Suspense>
            </Paper>
          </Grid>

          {/* Controls Panel */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Parameters
              </Typography>

              <Typography gutterBottom>Height: {height} m</Typography>
              <Slider
                value={height}
                onChange={(_, v) => setHeight(v)}
                min={1}
                max={15}
                step={0.5}
                disabled={dropping}
                valueLabelDisplay="auto"
                sx={{ mb: 2 }}
              />

              <Typography gutterBottom>Mass: {mass} kg</Typography>
              <Slider
                value={mass}
                onChange={(_, v) => setMass(v)}
                min={0.5}
                max={20}
                step={0.5}
                disabled={dropping}
                valueLabelDisplay="auto"
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<PlayCircleIcon />}
                  onClick={handleDrop}
                  disabled={dropping}
                >
                  Drop
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<RestartAltIcon />}
                  onClick={handleReset}
                >
                  Reset
                </Button>
              </Box>

              {/* Results */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Results
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Potential Energy: {(mass * 9.81 * height).toFixed(1)} J
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Impact Velocity: {Math.sqrt(2 * 9.81 * height).toFixed(2)} m/s
                </Typography>
                <Typography variant="body2" gutterBottom>
                  Kinetic Energy at Impact:{' '}
                  {energy > 0 ? `${energy.toFixed(1)} J` : '—'}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={`Hazard Level: ${energy > 0 ? hazardLevel : '—'}`}
                    color={energy > 0 ? getHazardColor(hazardLevel) : 'default'}
                    variant="outlined"
                  />
                </Box>
              </Paper>

              {/* Info */}
              <Paper variant="outlined" sx={{ p: 2, mt: 2, borderRadius: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Safety Reference
                </Typography>
                <Typography variant="caption" display="block">
                  • &lt;10 J: Minor bruise risk
                </Typography>
                <Typography variant="caption" display="block">
                  • 10–50 J: Moderate injury risk
                </Typography>
                <Typography variant="caption" display="block">
                  • 50–150 J: Serious injury risk
                </Typography>
                <Typography variant="caption" display="block">
                  • &gt;150 J: Critical/fatal risk
                </Typography>
              </Paper>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
