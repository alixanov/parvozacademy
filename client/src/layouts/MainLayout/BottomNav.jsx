/**
 * BottomNav — мобильная нижняя навигация (только < sm = 600px)
 * 5 ключевых разделов: Главная, Курсы, Тарифы, Преподаватели, Кабинет
 */
import { Box, useTheme } from '@mui/material';
import { alpha }         from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HomeIcon        from '@mui/icons-material/Home';
import SchoolIcon      from '@mui/icons-material/School';
import LocalOfferIcon  from '@mui/icons-material/LocalOffer';
import PeopleAltIcon   from '@mui/icons-material/PeopleAlt';
import PersonIcon      from '@mui/icons-material/Person';
import { useAuth }     from '../../hooks/useAuth.js';

const TABS = [
  { key: 'nav.home',     path: '/',          Icon: HomeIcon,       exact: true },
  { key: 'nav.courses',  path: '/courses',   Icon: SchoolIcon },
  { key: 'nav.pricing',  path: '/pricing',   Icon: LocalOfferIcon },
  { key: 'nav.teachers', path: '/teachers',  Icon: PeopleAltIcon },
  { key: 'nav.cabinet',  path: null,         Icon: PersonIcon },   // dynamic
];

export const BOTTOM_NAV_H = 62; // px — matches padding in main content

export default function BottomNav() {
  const theme    = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { t }    = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const isDark   = theme.palette.mode === 'dark';

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const handleTab = (tab) => {
    if (tab.key === 'nav.cabinet') {
      navigate(isAuthenticated ? `/${user?.role}` : '/login');
    } else {
      navigate(tab.path);
    }
  };

  return (
    <Box
      component="nav"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar + 10,
        height: BOTTOM_NAV_H,
        display: { xs: 'flex', sm: 'none' },
        alignItems: 'stretch',
        bgcolor: isDark
          ? alpha('#0d1120', 0.96)
          : alpha(theme.palette.background.paper, 0.97),
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: `1px solid ${theme.palette.divider}`,
        boxShadow: isDark
          ? '0 -4px 24px rgba(0,0,0,0.5)'
          : '0 -4px 24px rgba(0,0,0,0.08)',
        // Safe area for notch phones
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map((tab) => {
        const path    = tab.key === 'nav.cabinet'
          ? (isAuthenticated ? `/${user?.role}` : '/login')
          : tab.path;
        const active  = tab.key === 'nav.cabinet'
          ? (location.pathname.startsWith('/student') || location.pathname.startsWith('/teacher') || location.pathname.startsWith('/admin') || location.pathname === '/login')
          : tab.key === 'nav.courses'
            ? (isActive(path, tab.exact) || location.pathname.startsWith('/packages'))
            : isActive(path, tab.exact);
        const { Icon } = tab;

        return (
          <Box
            key={tab.key}
            onClick={() => handleTab(tab)}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.35,
              cursor: 'pointer',
              pt: 0.5,
              position: 'relative',
              transition: 'background-color 0.15s',
              '&:active': {
                bgcolor: alpha(theme.palette.primary.main, 0.06),
              },
            }}
          >
            {/* Active indicator pill */}
            {active && (
              <Box sx={{
                position: 'absolute',
                top: 6,
                width: 28,
                height: 3,
                borderRadius: 99,
                bgcolor: 'primary.main',
              }} />
            )}

            {/* Icon */}
            <Box sx={{
              width: 36, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '10px',
              bgcolor: active
                ? alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1)
                : 'transparent',
              transition: 'background-color 0.15s',
            }}>
              <Icon sx={{
                fontSize: 20,
                color: active ? 'primary.main' : 'text.disabled',
                transition: 'color 0.15s',
              }} />
            </Box>

            {/* Label */}
            <Box sx={{
              fontSize: '0.6rem',
              fontWeight: active ? 700 : 400,
              color: active ? 'primary.main' : 'text.disabled',
              letterSpacing: active ? '-0.01em' : 0,
              lineHeight: 1,
              maxWidth: 52,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'color 0.15s',
            }}>
              {t(tab.key)}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
