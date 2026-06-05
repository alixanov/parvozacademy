import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RefreshIcon      from '@mui/icons-material/Refresh';
import HomeIcon         from '@mui/icons-material/Home';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            p: 4,
            textAlign: 'center',
            bgcolor: 'background.default',
          }}
        >
          <Box
            sx={{
              width: 72, height: 72,
              borderRadius: '50%',
              bgcolor: 'error.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mb: 1,
              opacity: 0.15,
              position: 'relative',
            }}
          />
          <WarningAmberIcon sx={{ fontSize: 56, color: 'error.main', mt: -10 }} />

          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              background: 'linear-gradient(135deg, #EF4444 0%, #7C3AED 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Kutilmagan xatolik
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 380, lineHeight: 1.7 }}>
            Sahifa yuklanishida muammo yuz berdi. Sahifani yangilang yoki bosh sahifaga qayting.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={() => window.location.reload()}
              sx={{ borderRadius: 3 }}
            >
              Sahifani yangilash
            </Button>
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/';
              }}
              sx={{ borderRadius: 3 }}
            >
              Bosh sahifaga
            </Button>
          </Stack>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box
              component="pre"
              sx={{
                mt: 3, p: 2, borderRadius: 2,
                bgcolor: 'action.hover',
                fontSize: '0.72rem',
                textAlign: 'left',
                maxWidth: 640, overflow: 'auto',
                color: 'error.main',
                fontFamily: 'monospace',
              }}
            >
              {this.state.error.toString()}
            </Box>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
