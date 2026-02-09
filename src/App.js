import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainMenu from './pages/MainMenu';
import ThemeSelection from './pages/ThemeSelection';
import ThemeContent from './pages/ThemeContent';
import TestPage from './pages/TestPage';
import LabPage from './pages/LabPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/themes" element={<ThemeSelection />} />
      <Route path="/theme/:id" element={<ThemeContent />} />
      <Route path="/test/:id" element={<TestPage />} />
      <Route path="/lab/:id" element={<LabPage />} />
    </Routes>
  );
}

export default App;
