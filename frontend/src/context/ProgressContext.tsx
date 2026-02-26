import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { LessonId } from '../types/theme';

/* ---------- Types ---------- */

export interface LessonProgress {
  theoryRead: string[];       // module IDs visited
  labStep: number;            // current step index
  testScore: number | null;   // percent, or null if not attempted
}

type ProgressMap = Record<number, LessonProgress>;

interface ProgressContextValue {
  get: (lessonId: LessonId) => LessonProgress;
  markTheoryRead: (lessonId: LessonId, moduleId: string) => void;
  setLabStep: (lessonId: LessonId, step: number) => void;
  setTestScore: (lessonId: LessonId, score: number) => void;
  reset: (lessonId: LessonId) => void;
}

/* ---------- Default ---------- */

const defaultProgress: LessonProgress = {
  theoryRead: [],
  labStep: 0,
  testScore: null,
};

/* ---------- Storage ---------- */

const STORAGE_KEY = 'lsl-progress';

function loadFromStorage(): ProgressMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressMap) : {};
  } catch {
    return {};
  }
}

function saveToStorage(map: ProgressMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch { /* noop */ }
}

/* ---------- Context ---------- */

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressMap>(loadFromStorage);

  const update = useCallback((updater: (prev: ProgressMap) => ProgressMap) => {
    setProgress((prev) => {
      const next = updater(prev);
      saveToStorage(next);
      return next;
    });
  }, []);

  const get = useCallback(
    (lessonId: LessonId): LessonProgress => progress[lessonId] ?? defaultProgress,
    [progress],
  );

  const markTheoryRead = useCallback(
    (lessonId: LessonId, moduleId: string) => {
      update((prev) => {
        const lp = prev[lessonId] ?? { ...defaultProgress };
        if (lp.theoryRead.includes(moduleId)) return prev;
        return { ...prev, [lessonId]: { ...lp, theoryRead: [...lp.theoryRead, moduleId] } };
      });
    },
    [update],
  );

  const setLabStep = useCallback(
    (lessonId: LessonId, step: number) => {
      update((prev) => {
        const lp = prev[lessonId] ?? { ...defaultProgress };
        if (lp.labStep === step) return prev;
        return { ...prev, [lessonId]: { ...lp, labStep: step } };
      });
    },
    [update],
  );

  const setTestScore = useCallback(
    (lessonId: LessonId, score: number) => {
      update((prev) => {
        const lp = prev[lessonId] ?? { ...defaultProgress };
        return { ...prev, [lessonId]: { ...lp, testScore: score } };
      });
    },
    [update],
  );

  const reset = useCallback(
    (lessonId: LessonId) => {
      update((prev) => {
        const copy = { ...prev };
        delete copy[lessonId];
        return copy;
      });
    },
    [update],
  );

  const value = useMemo<ProgressContextValue>(
    () => ({ get, markTheoryRead, setLabStep, setTestScore, reset }),
    [get, markTheoryRead, setLabStep, setTestScore, reset],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
