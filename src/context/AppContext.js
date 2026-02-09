import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const initialState = {
  currentTheme: null,
  testResults: {},
  labUnlocked: {},
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, currentTheme: action.payload };
    case 'SET_TEST_RESULT':
      return {
        ...state,
        testResults: {
          ...state.testResults,
          [action.payload.themeId]: action.payload.score,
        },
      };
    case 'UNLOCK_LAB':
      return {
        ...state,
        labUnlocked: {
          ...state.labUnlocked,
          [action.payload]: true,
        },
      };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
