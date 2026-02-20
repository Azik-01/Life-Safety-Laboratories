import { createTheme } from '@mui/material/styles';

const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1353a2' },
    secondary: { main: '#0d8a7f' },
    background: { default: '#f4f6f2', paper: '#ffffff' },
    success: { main: '#2e7d32' },
    warning: { main: '#c57a00' },
    error: { main: '#b43d2f' },
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", "Tahoma", sans-serif',
    h3: { fontWeight: 700 },
    h4: { fontWeight: 650 },
    h5: { fontWeight: 600 },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #d9dfd4',
          boxShadow: '0 6px 20px rgba(13, 40, 29, 0.06)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderColor: '#d9dfd4',
        },
      },
    },
  },
});

export default muiTheme;
