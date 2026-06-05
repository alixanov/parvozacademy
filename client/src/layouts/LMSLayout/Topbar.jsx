/**
 * LMSLayout / Topbar — Premium SaaS dashboard navbar
 * Design language: Linear · Vercel · Notion · Stripe
 */
import {
  AppBar, Toolbar, IconButton, Box, Typography,
  Tooltip, Badge, Menu, MenuItem, Divider, Avatar,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useContext, useState } from 'react';
import { useNavigate, useMatches } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import MenuIcon                from '@mui/icons-material/Menu';
import DarkModeIcon            from '@mui/icons-material/DarkMode';
import LightModeIcon           from '@mui/icons-material/LightMode';
import NotificationsIcon       from '@mui/icons-material/Notifications';
import ChevronRightIcon        from '@mui/icons-material/ChevronRight';
import PersonIcon              from '@mui/icons-material/Person';
import SettingsIcon            from '@mui/icons-material/Settings';
import LogoutIcon              from '@mui/icons-material/Logout';
import HomeIcon                from '@mui/icons-material/Home';
import KeyboardArrowDownIcon   from '@mui/icons-material/KeyboardArrowDown';
import i18n                    from '../../utils/i18n.js';
import { ColorModeContext }    from '../../app/providers.jsx';
import { useAuth }             from '../../hooks/useAuth.js';
import { clearCredentials }    from '../../features/auth/authSlice.js';
import { useLogoutMutation }   from '../../features/auth/authApi.js';
import { TOPBAR_H }            from './Sidebar.jsx';
import {
  selectTeacherByName, selectStudentByName, selectUnreadCount,
} from '../../features/lms/lmsSlice.js';

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

const LANGS = [
  { code: 'uz', label: "O'zbek",  stripes: ['#009BBB', '#FFFFFF', '#1EB53A'] },
  { code: 'ru', label: 'Русский', stripes: ['#FFFFFF', '#0039A6', '#D52B1E'] },
];

/* Role → profile & settings routes */
const ROLE_PROFILE  = { student: '/student/profile',  teacher: '/teacher/students',      admin: '/admin' };
const ROLE_SETTINGS = { student: '/student/settings', teacher: '/teacher/notifications', admin: '/admin/settings' };

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

/* ── Consistent icon button ─────────────────────────────────────── */
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

/* isMobile is passed from LMSLayout */
export default function LMSTopbar({ isMobile, onMenuOpen }) {
  const theme    = useTheme();
  const { t }   = useTranslation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { mode, toggle } = useContext(ColorModeContext);
  const matches  = useMatches();
  const { user } = useAuth();
  const [logout] = useLogoutMutation();
  const isDark   = mode === 'dark';

  const _student     = useSelector(selectStudentByName(user?.name ?? ''));
  const _teacher     = useSelector(selectTeacherByName(user?.name ?? ''));
  const _recipientId = _student?.id ?? _teacher?.id ?? '';
  const unreadCount  = useSelector(selectUnreadCount(user?.role ?? '', _recipientId));

  const [langAnchor,    setLangAnchor]    = useState(null);
  const [profileAnchor, setProfileAnchor] = useState(null);

  const currentLang = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];

  const switchLang = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('lang', code);
    setLangAnchor(null);
  };

  const handleLogout = async () => {
    setProfileAnchor(null);
    await logout().unwrap().catch(() => {});
    dispatch(clearCredentials());
    navigate('/login');
  };

  const crumbs   = matches.filter((m) => m.handle?.crumb).map((m) => m.handle.crumb);
  const initials = user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() ?? 'U';

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
        sx={{ height: TOPBAR_H, px: { xs: 1.5, sm: 2.5 }, gap: 0.5 }}
      >
        {/* ── Hamburger (mobile) ─────────────────────────────── */}
        {isMobile && (
          <NavIconButton tooltip={t('sidebar.openMenu')} onClick={onMenuOpen} sx={{ mr: 0.5 }}>
            <MenuIcon sx={{ fontSize: 20 }} />
          </NavIconButton>
        )}

        {/* ── Breadcrumbs ────────────────────────────────────── */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 0.25,
          overflow: 'hidden',
          minWidth: 0,
        }}>
          {crumbs.map((crumb, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.25, minWidth: 0 }}>
              {i > 0 && (
                <ChevronRightIcon
                  sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0, mx: 0.125 }}
                />
              )}
              <Typography
                variant="body2"
                noWrap
                sx={{
                  fontSize: '0.845rem',
                  fontWeight: i === crumbs.length - 1 ? 600 : 400,
                  color: i === crumbs.length - 1 ? 'text.primary' : 'text.secondary',
                  letterSpacing: i === crumbs.length - 1 ? '-0.01em' : 0,
                }}
              >
                {t(crumb, { defaultValue: crumb })}
              </Typography>
            </Box>
          ))}
        </Box>

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

          {/* Notifications */}
          <Tooltip title={t('topbar.notifications')}>
            <IconButton
              size="small"
              onClick={() => navigate(`/${user?.role ?? 'student'}/notifications`)}
              sx={{
                width: 34, height: 34,
                borderRadius: '8px',
                position: 'relative',
                color: unreadCount > 0 ? 'text.primary' : 'text.secondary',
                transition: `background-color 0.14s`,
                '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.06) },
              }}
            >
              <NotificationsIcon sx={{ fontSize: 19 }} />
              {unreadCount > 0 && (
                <Box sx={{
                  position: 'absolute',
                  top: 6, right: 6,
                  width: 7, height: 7,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  border: `1.5px solid ${theme.palette.background.paper}`,
                }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Profile avatar */}
          <Tooltip title={user?.name ?? t('topbar.profile')}>
            <Box
              onClick={(e) => setProfileAnchor(e.currentTarget)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 0.5,
                ml: 0.25, pl: 0.5,
                cursor: 'pointer',
                borderRadius: '9px',
                transition: 'background-color 0.14s',
                '&:hover': { bgcolor: alpha(theme.palette.text.primary, 0.05) },
                height: 38, px: 0.5,
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
                {initials}
              </Avatar>
              {!isMobile && (
                <KeyboardArrowDownIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              )}
            </Box>
          </Tooltip>

          <Menu
            anchorEl={profileAnchor}
            open={Boolean(profileAnchor)}
            onClose={() => setProfileAnchor(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 0,
              sx: {
                mt: 0.75,
                minWidth: 210,
                borderRadius: '12px',
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: isDark
                  ? '0 8px 32px rgba(0,0,0,0.5)'
                  : '0 8px 24px rgba(0,0,0,0.1)',
                overflow: 'hidden',
              },
            }}
          >
            {/* User header */}
            <Box sx={{
              px: 2, py: 1.5,
              bgcolor: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Avatar
                  sx={{
                    width: 36, height: 36,
                    bgcolor: 'primary.main',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                  }}
                >
                  {initials}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {user?.name ?? '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {user?.email ?? ''}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider />

            <Box sx={{ py: 0.5 }}>
              <MenuItem
                onClick={() => { navigate(ROLE_PROFILE[user?.role] ?? '/'); setProfileAnchor(null); }}
                sx={{ gap: 1.25, borderRadius: '7px', mx: 0.5, my: 0.25, fontSize: '0.875rem' }}
              >
                <PersonIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                {t('topbar.profile')}
              </MenuItem>
              <MenuItem
                onClick={() => { navigate(ROLE_SETTINGS[user?.role] ?? '/'); setProfileAnchor(null); }}
                sx={{ gap: 1.25, borderRadius: '7px', mx: 0.5, my: 0.25, fontSize: '0.875rem' }}
              >
                <SettingsIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                {t('topbar.settings')}
              </MenuItem>
              <MenuItem
                onClick={() => { navigate('/'); setProfileAnchor(null); }}
                sx={{ gap: 1.25, borderRadius: '7px', mx: 0.5, my: 0.25, fontSize: '0.875rem' }}
              >
                <HomeIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                {t('topbar.home')}
              </MenuItem>
            </Box>

            <Divider />

            <Box sx={{ py: 0.5 }}>
              <MenuItem
                onClick={handleLogout}
                sx={{
                  gap: 1.25,
                  color: 'error.main',
                  borderRadius: '7px',
                  mx: 0.5, my: 0.25,
                  fontSize: '0.875rem',
                  '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
                }}
              >
                <LogoutIcon sx={{ fontSize: 17 }} />
                {t('topbar.logout')}
              </MenuItem>
            </Box>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
