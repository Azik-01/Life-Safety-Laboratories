import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import themesData from '../data/themes';
import { useAppContext } from '../context/AppContext';

export default function ThemeSelection() {
  const navigate = useNavigate();
  const { dispatch } = useAppContext();

  const handleSelect = (theme) => {
    dispatch({ type: 'SET_THEME', payload: theme.id });
    navigate(`/theme/${theme.id}`);
  };

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
          onClick={() => navigate('/')}
          sx={{ mb: 3 }}
        >
          Back to Menu
        </Button>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Select a Theme
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Choose a topic to study theory, watch demonstrations, take a test, and
          access the interactive lab.
        </Typography>
        <Grid container spacing={3}>
          {themesData.map((theme) => (
            <Grid item xs={12} sm={6} md={4} key={theme.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="overline" color="primary">
                    Theme {theme.id}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {theme.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {theme.subtitle}
                  </Typography>
                  <Typography variant="body2">{theme.description}</Typography>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleSelect(theme)}
                  >
                    Study
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
