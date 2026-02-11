import { createContext, useContext, useState, type ReactNode } from 'react';

interface AppState {
  /** theme id → score (0-100) */
  testScores: Record<number, number>;
  setTestScore: (themeId: number, score: number) => void;
  hasPassedTest: (themeId: number) => boolean;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [testScores, setTestScores] = useState<Record<number, number>>({});

  const setTestScore = (themeId: number, score: number) =>
    setTestScores((prev) => ({ ...prev, [themeId]: score }));

  const hasPassedTest = (themeId: number) => (testScores[themeId] ?? 0) >= 70;

  return (
    <AppContext.Provider value={{ testScores, setTestScore, hasPassedTest }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be inside AppProvider');
  return ctx;
}
