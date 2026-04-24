import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { lightTheme, darkTheme } from './theme';

import LoginPage    from './pages/LoginPage';
import ExamRoomPage from './pages/ExamRoomPage';
import ResultsPage  from './pages/ResultsPage';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('nirikshak_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

/**
 * PageTransition
 * Must be used *inside* each route element (not wrapping <Routes>) so that the
 * location key actually causes the keyed Box to unmount/remount on navigation.
 */
function PageTransition({ children }) {
  const location = useLocation();

  return (
    <Box
      key={location.key}
      sx={{
        animation: 'pageIn 0.35s cubic-bezier(0.4,0,0.2,1)',
        '@keyframes pageIn': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        minHeight: '100%',
      }}
    >
      {children}
    </Box>
  );
}

export default function App() {
  // Dark-first — the whole app is designed dark, default to it
  const [darkMode, setDarkMode] = useState(true);

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={
            <PageTransition><LoginPage /></PageTransition>
          } />
          <Route
            path="/exam/:id"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <ExamRoomPage darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:id"
            element={
              <ProtectedRoute>
                <PageTransition>
                  <ResultsPage />
                </PageTransition>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
