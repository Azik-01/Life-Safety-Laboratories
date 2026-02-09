import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Paper,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

export default function MainMenu() {
  const navigate = useNavigate();

  const handleExit = () => {
    if (window.confirm('Are you sure you want to exit?')) {
      window.close();
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 50%, #0d1b2a 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: { xs: 3, md: 5 },
            textAlign: 'center',
            borderRadius: 3,
            background: 'rgba(30, 30, 30, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(90deg, #90caf9, #f48fb1)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Virtual Safety Lab
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Life Safety Laboratories
          </Typography>
          <Stack spacing={2} direction="column" alignItems="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<PlayArrowIcon />}
              onClick={() => navigate('/themes')}
              sx={{ minWidth: 200 }}
            >
              Start
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<ExitToAppIcon />}
              onClick={handleExit}
              sx={{ minWidth: 200 }}
            >
              Exit
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
