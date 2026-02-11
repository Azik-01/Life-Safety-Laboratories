import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import muiTheme from './theme';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import MainMenu from './pages/MainMenu';
import ThemeSelection from './pages/ThemeSelection';
import ThemeContent from './pages/ThemeContent';
import TestPage from './pages/TestPage';
import LabPage from './pages/LabPage';

export default function App() {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<MainMenu />} />
              <Route path="/themes" element={<ThemeSelection />} />
              <Route path="/theme/:id" element={<ThemeContent />} />
              <Route path="/test/:id" element={<TestPage />} />
              <Route path="/lab/:id" element={<LabPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}
