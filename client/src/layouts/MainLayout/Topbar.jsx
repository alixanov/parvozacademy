/**
 * MainLayout / Topbar — Premium SaaS navbar
 * Design language: Linear · Vercel · Notion · Stripe
 */
import {
  AppBar, Toolbar, IconButton, Box, Button,
  Typography, Tooltip, Avatar,
  Menu, MenuItem, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch }   from 'react-redux';
import MenuIcon     from '@mui/icons-material/Menu';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import LoginIcon    from '@mui/icons-material/Login';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import i18n            from '../../utils/i18n.js';
import { ColorModeContext } from '../../app/providers.jsx';
import { useAuth }     from '../../hooks/useAuth.js';
import { clearCredentials } from '../../features/auth/authSlice.js';
import { TOPBAR_H } from './Sidebar.jsx';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

const LANGS = [
  { code: 'uz', label: "O'zbek",  stripes: ['#009BBB', '#FFFFFF', '#1EB53A'] },
  { code: 'ru', label: 'Русский', stripes: ['#FFFFFF', '#0039A6', '#D52B1E'] },
];

function FlagIcon({ stripes, width = 20, height = 14 }) {
  return (
    <Box sx={{
      width, height,
      borderRadius: '2px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      border: '0.5px solid rgba(0,0,0,0.12)',
      flexShrink: 0,
    }}>
      {stripes.map((color, i) => (
        <Box key={i} sx={{ flex: 1, bgcolor: color }} />
      ))}
    </Box>
  );
}

/* ── Icon button wrapper — consistent style ─────────────────────── */
function NavIconButton({ children, tooltip, onClick, active, sx: sxExtra = {} }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Tooltip title={tooltip}>
      <IconButton
        size="small"
        onClick={onClick}
        sx={{
          width: 34, height: 34,
          borderRadius: '8px',
          color: active ? 'primary.main' : 'text.secondary',
          bgcolor: active
            ? alpha(theme.palette.primary.main, isDark ? 0.14 : 0.08)
            : 'transparent',
          transition: `background-color 0.14s, color 0.14s`,
          '&:hover': {
            bgcolor: active
              ? alpha(theme.palette.primary.main, isDark ? 0.2 : 0.12)
              : alpha(theme.palette.text.primary, 0.06),
            color: active ? 'primary.main' : 'text.primary',
          },
          ...sxExtra,
        }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

/* ─── isMobile is passed from MainLayout (< sm = 600px) ────────── */
export default function MainTopbar({ isMobile, onMenuOpen }) {
  const theme    = useTheme();
  const { t }   = useTranslation();
  const navigate = useNavigate();
  const { mode, toggle } = useContext(ColorModeContext);
  const { isAuthenticated, user } = useAuth();
  const dispatch = useDispatch();
  const isDark   = mode === 'dark';

  const [langAnchor, setLangAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const currentLang = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];

  const switchLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    setLangAnchor(null);
  };

  const bgOpacity = isDark ? 0.82 : 0.88;

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        height: TOPBAR_H,
        bgcolor: alpha(theme.palette.background.paper, bgOpacity),
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        color: 'text.primary',
        zIndex: theme.zIndex.appBar,
        '& .MuiToolbar-root': {
          minHeight: `${TOPBAR_H}px !important`,
          height:    `${TOPBAR_H}px`,
        },
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          height: TOPBAR_H,
          px: { xs: 1.5, sm: 2.5 },
          gap: 0.5,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* ── Hamburger (mobile) ─────────────────────────────── */}
        {isMobile && (
          <NavIconButton tooltip={t('sidebar.openMenu')} onClick={onMenuOpen}>
            <MenuIcon sx={{ fontSize: 20 }} />
          </NavIconButton>
        )}

        {/* ── Logo (mobile only — desktop shows in sidebar) ─── */}
        {isMobile && (
          <Box
            component="img"
            src="/logo.png"
            alt="Parvoz Academy"
            onClick={() => navigate('/')}
            sx={{
              height: 34, width: 'auto', maxWidth: 180,
              objectFit: 'contain', objectPosition: 'left center',
              cursor: 'pointer', display: 'block', flexShrink: 0,
              ml: 0.5,
            }}
          />
        )}

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* ── Right controls ─────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>

          {/* Language pill */}
          <Box
            onClick={(e) => setLangAnchor(e.currentTarget)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              height: 32,
              px: 1.25,
              borderRadius: '8px',
              cursor: 'pointer',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
              transition: 'all 0.14s',
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              },
            }}
          >
            <FlagIcon stripes={currentLang.stripes} />
            {!isMobile && (
              <Typography
                variant="caption"
                fontWeight={600}
                sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1 }}
              >
                {currentLang.code.toUpperCase()}
              </Typography>
            )}
            <KeyboardArrowDownIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
          </Box>
          <Menu
            anchorEl={langAnchor}
            open={Boolean(langAnchor)}
            onClose={() => setLangAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 0,
              sx: {
                borderRadius: '10px',
                mt: 0.75,
                minWidth: 148,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: isDark
                  ? '0 8px 32px rgba(0,0,0,0.5)'
                  : '0 8px 24px rgba(0,0,0,0.1)',
              },
            }}
          >
            {LANGS.map((l) => (
              <MenuItem
                key={l.code}
                onClick={() => switchLang(l.code)}
                selected={i18n.language === l.code}
                sx={{ gap: 1.25, borderRadius: '7px', mx: 0.5, my: 0.25 }}
              >
                <FlagIcon stripes={l.stripes} />
                <Typography variant="body2" fontWeight={i18n.language === l.code ? 600 : 400}>
                  {l.label}
                </Typography>
              </MenuItem>
            ))}
          </Menu>

          {/* Theme toggle */}
          <NavIconButton
            tooltip={mode === 'dark' ? t('topbar.lightMode') : t('topbar.darkMode')}
            onClick={toggle}
          >
            {mode === 'dark'
              ? <LightModeIcon sx={{ fontSize: 17 }} />
              : <DarkModeIcon  sx={{ fontSize: 17 }} />}
          </NavIconButton>

          {/* Auth */}
          {isAuthenticated ? (
            <>
              <Tooltip title={user?.name ?? t('topbar.profile')}>
                <Box
                  onClick={(e) => setUserAnchor(e.currentTarget)}
                  sx={{
                    ml: 0.5,
                    display: 'flex', alignItems: 'center', gap: 0.5,
                    cursor: 'pointer',
                    borderRadius: '9px',
                    px: 0.5, py: 0.25,
                    transition: 'background-color 0.14s',
                    '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.06) },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 30, height: 30,
                      bgcolor: 'primary.main',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.25)}`,
                    }}
                  >
                    {user?.name?.[0]?.toUpperCase() ?? 'U'}
                  </Avatar>
                  {!isMobile && (
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      sx={{ fontSize: '0.8rem', color: 'text.primary', maxWidth: 100 }}
                      noWrap
                    >
                      {user?.name}
                    </Typography>
                  )}
                </Box>
              </Tooltip>

              <Menu
                anchorEl={userAnchor}
                open={Boolean(userAnchor)}
                onClose={() => setUserAnchor(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    mt: 0.75,
                    minWidth: 200,
                    borderRadius: '10px',
                    border: `1px solid ${theme.palette.divider}`,
                    boxShadow: isDark
                      ? '0 8px 32px rgba(0,0,0,0.5)'
                      : '0 8px 24px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {user?.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {user?.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem
                  onClick={() => { navigate(`/${user?.role}`); setUserAnchor(null); }}
                  sx={{ borderRadius: '7px', mx: 0.5, my: 0.25, fontSize: '0.875rem' }}
                >
                  {t('topbar.personalCabinet')}
                </MenuItem>
                <MenuItem
                  onClick={() => { dispatch(clearCredentials()); setUserAnchor(null); navigate('/'); }}
                  sx={{
                    color: 'error.main',
                    borderRadius: '7px', mx: 0.5, my: 0.25,
                    fontSize: '0.875rem',
                  }}
                >
                  {t('topbar.logout')}
                </MenuItem>
              </Menu>
            </>
          ) : isMobile ? (
            <NavIconButton
              tooltip={t('auth.login')}
              onClick={() => navigate('/login')}
              active
              sx={{ ml: 0.25 }}
            >
              <LoginIcon sx={{ fontSize: 17 }} />
            </NavIconButton>
          ) : (
            <Button
              onClick={() => navigate('/login')}
              startIcon={<LoginIcon sx={{ fontSize: 15 }} />}
              sx={{
                ml: 0.5,
                height: 34,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.82rem',
                px: 2,
                boxShadow: isDark
                  ? '0 2px 12px rgba(59,130,246,0.35)'
                  : '0 2px 10px rgba(25,118,210,0.3)',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1251A0 0%, #1565C0 100%)',
                  boxShadow: isDark
                    ? '0 4px 16px rgba(59,130,246,0.45)'
                    : '0 4px 14px rgba(25,118,210,0.38)',
                  transform: 'translateY(-1px)',
                },
                transition: 'all 0.16s',
              }}
            >
              {t('auth.login')}
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
