import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { light, dark } from './palette.js';
import { getOverrides } from './components.js';

export const createAppTheme = (mode = 'light') => {
  const palette = mode === 'dark' ? dark : light;

  const base = createTheme({
    palette,
    typography: {
      fontFamily: '"Inter", "Roboto", sans-serif',
      h1: { fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.5px' },
      h2: { fontWeight: 800, lineHeight: 1.2,  letterSpacing: '-0.3px' },
      h3: { fontWeight: 700, lineHeight: 1.3,  letterSpacing: '-0.2px' },
      h4: { fontWeight: 700, lineHeight: 1.4 },
      h5: { fontWeight: 700, lineHeight: 1.5 },
      h6: { fontWeight: 600, lineHeight: 1.5 },
      subtitle1: { fontWeight: 500, lineHeight: 1.6 },
      subtitle2: { fontWeight: 600, lineHeight: 1.6 },
      body1:  { lineHeight: 1.7 },
      body2:  { lineHeight: 1.65 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0.2 },
      caption: { fontSize: '0.75rem', lineHeight: 1.5 },
      overline: { fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.7rem' },
    },
    shape: { borderRadius: 12 },
    shadows: [
      'none',
      '0 1px 2px rgba(0,0,0,0.06)',
      '0 1px 4px rgba(0,0,0,0.08)',
      '0 2px 8px rgba(0,0,0,0.09)',
      '0 4px 12px rgba(0,0,0,0.10)',
      '0 6px 16px rgba(0,0,0,0.11)',
      '0 8px 20px rgba(0,0,0,0.12)',
      '0 10px 24px rgba(0,0,0,0.12)',
      '0 12px 28px rgba(0,0,0,0.13)',
      '0 14px 32px rgba(0,0,0,0.14)',
      '0 16px 36px rgba(0,0,0,0.14)',
      '0 18px 40px rgba(0,0,0,0.15)',
      '0 20px 44px rgba(0,0,0,0.15)',
      '0 22px 48px rgba(0,0,0,0.16)',
      '0 24px 52px rgba(0,0,0,0.16)',
      '0 26px 56px rgba(0,0,0,0.17)',
      '0 28px 60px rgba(0,0,0,0.17)',
      '0 30px 64px rgba(0,0,0,0.18)',
      '0 32px 68px rgba(0,0,0,0.18)',
      '0 34px 72px rgba(0,0,0,0.19)',
      '0 36px 76px rgba(0,0,0,0.19)',
      '0 38px 80px rgba(0,0,0,0.20)',
      '0 40px 84px rgba(0,0,0,0.20)',
      '0 42px 88px rgba(0,0,0,0.21)',
      '0 44px 92px rgba(0,0,0,0.22)',
    ],
    components: getOverrides(palette),
    transitions: {
      easing: {
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        easeOut:   'cubic-bezier(0.0, 0, 0.2, 1)',
        easeIn:    'cubic-bezier(0.4, 0, 1, 1)',
        sharp:     'cubic-bezier(0.4, 0, 0.6, 1)',
      },
      duration: {
        shortest: 150,
        shorter:  200,
        short:    250,
        standard: 300,
        complex:  375,
        enteringScreen: 225,
        leavingScreen:  195,
      },
    },
  });

  return responsiveFontSizes(base);
};
