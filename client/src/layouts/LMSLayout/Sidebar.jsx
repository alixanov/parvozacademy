/**
 * LMSLayout / Sidebar — Premium SaaS dashboard nav
 * Design language: Linear · Vercel · Notion · Stripe
 */
import {
  Box, Drawer, List, ListItemButton,
  Tooltip, Typography, Divider, Avatar, Badge,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChevronLeftIcon  from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon       from '@mui/icons-material/Logout';
import { studentNav, teacherNav, adminNav } from './navConfig.js';
import { useAuth }      from '../../hooks/useAuth.js';
import { useDispatch, useSelector } from 'react-redux';
import { clearCredentials } from '../../features/auth/authSlice.js';
import { selectPendingCount } from '../../features/payment/paymentSlice.js';
import { useLogoutMutation } from '../../features/auth/authApi.js';

/* ── Layout constants — exported for Topbar alignment ──────────── */
export const TOPBAR_H  = 64;
export const EXPANDED  = 272;
export const COLLAPSED = 64;

const EASE   = 'cubic-bezier(0.4, 0, 0.2, 1)';
const NAV_MAP = { student: studentNav, teacher: teacherNav, admin: adminNav };

/* Role accent colors — subtle branding per role */
const ROLE_COLOR = {
  student: '#1976D2',
  teacher: '#7C3AED',
  admin:   '#0369a1',
};

/* ── Brand area ─────────────────────────────────────────────────── */
function BrandArea({ collapsed, onClick, isDark }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        height: TOPBAR_H,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        px: collapsed ? 0 : 2.5,
        cursor: 'pointer',
        overflow: 'hidden',
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: `padding 0.28s ${EASE}, background-color 0.15s`,
        '&:hover': {
          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.025)',
        },
      }}
    >
      <Box sx={{
        position: 'absolute',
        opacity:   collapsed ? 1 : 0,
        transform: collapsed ? 'scale(1)' : 'scale(0.75)',
        pointerEvents: collapsed ? 'auto' : 'none',
        transition: `opacity 0.22s ${EASE}, transform 0.28s ${EASE}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 36, height: 36,
        borderRadius: '10px',
        bgcolor: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(25,118,210,0.08)',
        border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : 'rgba(25,118,210,0.14)'}`,
      }}>
        <Box
          component="img"
          src="/logo-tablet.png"
          alt="Parvoz Academy"
          sx={{ width: 28, height: 28, objectFit: 'contain' }}
        />
      </Box>

      <Box
        component="img"
        src="/logo.png"
        alt="Parvoz Academy"
        sx={{
          height: 36, width: 'auto', maxWidth: 210,
          objectFit: 'contain', objectPosition: 'left center',
          display: 'block', flexShrink: 0,
          opacity:   collapsed ? 0 : 1,
          transform: collapsed ? 'translateX(-6px)' : 'translateX(0)',
          pointerEvents: collapsed ? 'none' : 'auto',
          transition: `opacity 0.2s ${EASE}, transform 0.28s ${EASE}`,
        }}
      />
    </Box>
  );
}

/* ── Section label ──────────────────────────────────────────────── */
function SectionLabel({ labelKey, collapsed }) {
  const { t } = useTranslation();
  if (collapsed) {
    return (
      <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5 }}>
        <Divider sx={{ opacity: 0.4 }} />
      </Box>
    );
  }
  return (
    <Typography
      sx={{
        display: 'block',
        px: 2,
        pt: 2.5,
        pb: 0.75,
        fontSize: '0.62rem',
        fontWeight: 700,
        letterSpacing: 1.4,
        color: 'text.disabled',
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      {t(labelKey)}
    </Typography>
  );
}

/* ── Nav item ───────────────────────────────────────────────────── */
function NavItem({ navKey, path, Icon, active, collapsed, isDark, badge, onClick }) {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Box sx={{ px: 1, mb: 0.5 }}>
      <Tooltip title={collapsed ? t(navKey) : ''} placement="right" arrow>
        <ListItemButton
          onClick={onClick}
          sx={{
            borderRadius: '9px',
            px: collapsed ? 0 : 1.5,
            py: 0,
            height: 38,
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: collapsed ? 0 : 1.25,
            bgcolor: active
              ? alpha(theme.palette.primary.main, isDark ? 0.16 : 0.09)
              : 'transparent',
            transition: `background-color 0.14s, padding 0.28s ${EASE}`,
            '&:hover': {
              bgcolor: active
                ? alpha(theme.palette.primary.main, isDark ? 0.22 : 0.13)
                : alpha(theme.palette.text.primary, 0.04),
            },
          }}
        >
          <Box sx={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: active ? 'primary.main' : 'text.secondary',
            transition: 'color 0.14s',
            width: collapsed ? 'auto' : 20,
          }}>
            {badge > 0 ? (
              <Badge
                badgeContent={badge}
                color="error"
                max={9}
                sx={{ '& .MuiBadge-badge': { fontSize: '0.58rem', minWidth: 14, height: 14, p: 0 } }}
              >
                <Icon sx={{ fontSize: 18 }} />
              </Badge>
            ) : (
              <Icon sx={{ fontSize: 18 }} />
            )}
          </Box>

          <Box sx={{
            overflow: 'hidden',
            maxWidth: collapsed ? 0 : 200,
            opacity:  collapsed ? 0 : 1,
            transition: `max-width 0.28s ${EASE}, opacity 0.18s`,
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Typography
              noWrap
              sx={{
                fontSize: '0.845rem',
                fontWeight: active ? 600 : 450,
                color: active ? 'primary.main' : 'text.primary',
                lineHeight: 1,
                letterSpacing: active ? '-0.01em' : 0,
              }}
            >
              {t(navKey)}
            </Typography>
            {badge > 0 && (
              <Box sx={{
                ml: 0.75,
                minWidth: 18, height: 18,
                borderRadius: '9px',
                bgcolor: 'error.main',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: 'white', lineHeight: 1 }}>
                  {badge > 9 ? '9+' : badge}
                </Typography>
              </Box>
            )}
          </Box>
        </ListItemButton>
      </Tooltip>
    </Box>
  );
}

/* ── Bottom user card ───────────────────────────────────────────── */
function UserCard({ user, collapsed, isDark, onLogout }) {
  const theme    = useTheme();
  const { t }    = useTranslation();
  const roleColor = ROLE_COLOR[user?.role] ?? theme.palette.primary.main;

  const initials = user?.name
    ?.split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'U';

  return (
    <Box sx={{
      borderTop: '1px solid',
      borderColor: 'divider',
      px: 1,
      py: 1.25,
    }}>
      {/* User info row */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : 1.25,
        px: collapsed ? 0 : 1,
        py: 0.75,
        borderRadius: '9px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        transition: `padding 0.28s ${EASE}`,
        bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
        overflow: 'hidden',
        mb: 0.5,
      }}>
        <Tooltip title={collapsed ? (user?.name ?? '') : ''} placement="right">
          <Avatar
            sx={{
              width: 30, height: 30,
              bgcolor: roleColor,
              fontWeight: 800,
              fontSize: '0.72rem',
              flexShrink: 0,
              boxShadow: `0 0 0 2px ${alpha(roleColor, 0.25)}`,
            }}
          >
            {initials}
          </Avatar>
        </Tooltip>

        <Box sx={{
          overflow: 'hidden',
          maxWidth: collapsed ? 0 : 160,
          opacity:  collapsed ? 0 : 1,
          transition: `max-width 0.28s ${EASE}, opacity 0.18s`,
          flex: 1,
          whiteSpace: 'nowrap',
        }}>
          <Typography
            noWrap
            sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.35 }}
          >
            {user?.name ?? '—'}
          </Typography>
          <Typography
            noWrap
            sx={{
              fontSize: '0.69rem',
              color: roleColor,
              fontWeight: 500,
              lineHeight: 1.2,
              opacity: 0.9,
            }}
          >
            {t(`role.${user?.role}`, { defaultValue: user?.role ?? '' })}
          </Typography>
        </Box>
      </Box>

      {/* Logout row */}
      <Box sx={{ px: 0, mb: 0.5 }}>
        <Tooltip title={collapsed ? t('topbar.logout') : ''} placement="right">
          <ListItemButton
            onClick={onLogout}
            sx={{
              borderRadius: '9px',
              px: collapsed ? 0 : 1.5,
              py: 0,
              height: 36,
              justifyContent: collapsed ? 'center' : 'flex-start',
              gap: collapsed ? 0 : 1.25,
              color: 'error.main',
              transition: `background-color 0.14s, padding 0.28s ${EASE}`,
              '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) },
            }}
          >
            <Box sx={{
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: collapsed ? 'auto' : 20,
            }}>
              <LogoutIcon sx={{ fontSize: 17 }} />
            </Box>
            <Box sx={{
              overflow: 'hidden',
              maxWidth: collapsed ? 0 : 200,
              opacity:  collapsed ? 0 : 1,
              transition: `max-width 0.28s ${EASE}, opacity 0.18s`,
            }}>
              <Typography noWrap sx={{ fontSize: '0.845rem', fontWeight: 450, color: 'error.main' }}>
                {t('topbar.logout')}
              </Typography>
            </Box>
          </ListItemButton>
        </Tooltip>
      </Box>

      {/* Collapse toggle (desktop only — rendered by parent) */}
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════ */
export default function LMSSidebar({
  open, onClose, isMobile, isTablet, collapsed, onToggleCollapse,
}) {
  const theme    = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t }    = useTranslation();
  const { user } = useAuth();
  const [logout] = useLogoutMutation();
  const pendingCount = useSelector(selectPendingCount);
  const isDark   = theme.palette.mode === 'dark';

  const navItems = NAV_MAP[user?.role] ?? [];

  const isActive = (path) =>
    path.endsWith('/admin') && path === location.pathname
      ? true
      : location.pathname === path ||
        (path !== '/admin' && location.pathname.startsWith(path + '/'));

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) onClose();
  };

  const handleLogout = async () => {
    await logout().unwrap().catch(() => {});
    dispatch(clearCredentials());
    navigate('/login');
  };

  const sidebarBg = isDark ? '#0d1120' : '#f5f7fb';

  const content = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: sidebarBg,
      overflow: 'hidden',
    }}>
      {/* ── Brand ── */}
      <BrandArea
        collapsed={collapsed}
        isDark={isDark}
        onClick={() => { navigate('/'); if (isMobile) onClose(); }}
      />

      {/* ── Nav items ── */}
      <Box sx={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        py: 1.25,
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}>
        <List disablePadding>
          {navItems.map(({ key, path, Icon, section }) => (
            <Box key={key}>
              {section && <SectionLabel labelKey={section} collapsed={collapsed} />}
              <NavItem
                navKey={key}
                path={path}
                Icon={Icon}
                active={isActive(path)}
                collapsed={collapsed}
                isDark={isDark}
                badge={key === 'admin.payments' ? pendingCount : 0}
                onClick={() => handleNav(path)}
              />
            </Box>
          ))}
        </List>
      </Box>

      {/* ── User card ── */}
      <UserCard
        user={user}
        collapsed={collapsed}
        isDark={isDark}
        onLogout={handleLogout}
      />

      {/* ── Collapse toggle (desktop only) ── */}
      {!isMobile && !isTablet && (
        <Box sx={{
          px: 1,
          pb: 1,
          display: 'flex',
          justifyContent: collapsed ? 'center' : 'flex-end',
        }}>
          <Tooltip
            title={t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
            placement="right"
          >
            <Box
              onClick={onToggleCollapse}
              sx={{
                width: 28, height: 28,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '7px',
                cursor: 'pointer',
                border: `1px solid ${theme.palette.divider}`,
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                color: 'text.disabled',
                transition: 'all 0.15s',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                  color: 'text.secondary',
                  borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                },
              }}
            >
              {collapsed
                ? <ChevronRightIcon sx={{ fontSize: 14 }} />
                : <ChevronLeftIcon  sx={{ fontSize: 14 }} />}
            </Box>
          </Tooltip>
        </Box>
      )}
    </Box>
  );

  /* Mobile: overlay Drawer */
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: EXPANDED,
            boxSizing: 'border-box',
            bgcolor: sidebarBg,
            boxShadow: isDark
              ? '4px 0 32px rgba(0,0,0,0.5)'
              : '4px 0 24px rgba(0,0,0,0.08)',
            border: 'none',
          },
        }}
      >
        {content}
      </Drawer>
    );
  }

  /* Tablet + Desktop: persistent */
  return (
    <Box
      component="nav"
      sx={{
        width: collapsed ? COLLAPSED : EXPANDED,
        flexShrink: 0,
        transition: `width 0.28s ${EASE}`,
        overflow: 'hidden',
        borderRight: `1px solid ${theme.palette.divider}`,
        position: 'sticky',
        top: 0,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: sidebarBg,
      }}
    >
      {content}
    </Box>
  );
}
