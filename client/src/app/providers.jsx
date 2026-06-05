import { createContext, useMemo, useState, useEffect, Fragment } from 'react';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import i18n from '../utils/i18n.js';
import { store } from './store.js';
import router from './router.jsx';
import { createAppTheme } from '../theme/index.js';
import { setCredentials, clearCredentials } from '../features/auth/authSlice.js';
import ErrorBoundary from '../components/common/ErrorBoundary/index.jsx';
import { SnackbarProvider } from '../context/SnackbarContext.jsx';

export const ColorModeContext = createContext({ mode: 'light', toggle: () => {} });

/* ─── Theme provider ─────────────────────────────────────────── */
function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(() => localStorage.getItem('theme') || 'light');
  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const toggle = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  return (
    <ColorModeContext.Provider value={{ mode, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

/* ─── Silent auth refresh on boot ───────────────────────────── */
function AuthInitializer() {
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/auth/refresh`,
          { method: 'POST', credentials: 'include', signal: controller.signal },
        );
        if (res.ok) {
          const { data } = await res.json();
          store.dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
        } else {
          store.dispatch(clearCredentials());
        }
      } catch (err) {
        if (err.name !== 'AbortError') store.dispatch(clearCredentials());
      }
    })();
    return () => controller.abort();
  }, []);
  return null;
}

/* ─── Language gate ──────────────────────────────────────────────
   Re-mounts router + all pages on language change (RTL/LTR-safe).
   Also syncs <html lang> attribute for screen readers & SEO.
─────────────────────────────────────────────────────────────────── */
function LanguageGate({ children }) {
  const [lang, setLang] = useState(i18n.language);

  useEffect(() => {
    const onChange = (lng) => {
      setLang(lng);
      document.documentElement.lang = lng;
    };
    // Set initial lang attribute
    document.documentElement.lang = i18n.language;
    i18n.on('languageChanged', onChange);
    return () => i18n.off('languageChanged', onChange);
  }, []);

  return <Fragment key={lang}>{children}</Fragment>;
}

/* ─── Root ───────────────────────────────────────────────────── */
export default function Providers() {
  return (
    <Provider store={store}>
      <AppThemeProvider>
        <SnackbarProvider>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <AuthInitializer />
            <LanguageGate>
              <ErrorBoundary>
                <RouterProvider router={router} />
              </ErrorBoundary>
            </LanguageGate>
          </LocalizationProvider>
        </SnackbarProvider>
      </AppThemeProvider>
    </Provider>
  );
}
