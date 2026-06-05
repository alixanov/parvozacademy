import { createContext, useCallback, useContext, useState } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

/* ─── Context ─────────────────────────────────────────────────── */
const SnackbarContext = createContext({ show: () => {} });

export const useSnackbar = () => useContext(SnackbarContext);

/* ─── Slide-up transition ─────────────────────────────────────── */
function SlideUp(props) {
  return <Slide {...props} direction="up" />;
}

/* ─── Provider ────────────────────────────────────────────────── */
export function SnackbarProvider({ children }) {
  const [snack, setSnack] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const show = useCallback((message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  }, []);

  const handleClose = (_, reason) => {
    if (reason === 'clickaway') return;
    setSnack((s) => ({ ...s, open: false }));
  };

  return (
    <SnackbarContext.Provider value={{ show }}>
      {children}

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={SlideUp}
        sx={{ mb: { xs: 2, sm: 3 } }}
      >
        <Alert
          onClose={handleClose}
          severity={snack.severity}
          variant="filled"
          sx={{
            borderRadius: 3,
            fontWeight: 600,
            minWidth: 280,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
}
