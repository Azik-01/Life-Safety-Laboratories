import { Box, Button, Typography, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

export default function MainMenu() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 4,
      }}
    >
      <Typography variant="h3" gutterBottom>
        🧪 Виртуальная лаборатория БЖД
      </Typography>
      <Typography variant="h6" color="text.secondary" maxWidth={600}>
        Интерактивная лаборатория по <em>Безопасности жизнедеятельности</em> —
        изучайте физику производственных опасностей через 3D-симуляции.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={2}>
        <Button
          variant="contained"
          size="large"
          startIcon={<PlayArrowIcon />}
          onClick={() => navigate('/themes')}
        >
          Начать
        </Button>
        <Button
          variant="outlined"
          size="large"
          startIcon={<ExitToAppIcon />}
          onClick={() => {
            if (confirm('Вы уверены, что хотите выйти?')) window.close();
          }}
        >
          Выход
        </Button>
      </Stack>
    </Box>
  );
}
