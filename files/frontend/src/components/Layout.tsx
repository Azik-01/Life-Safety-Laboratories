import { Box, Container } from '@mui/material';
import { Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Container maxWidth="xl" sx={{ flex: 1, py: 3, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </Container>
    </Box>
  );
}
