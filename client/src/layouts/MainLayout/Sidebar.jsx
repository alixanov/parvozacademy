/**
 * MainLayout / Sidebar — Premium SaaS nav
 * Design language: Linear · Vercel · Notion · Stripe
 */
import {
  Box, Drawer, List, ListItemButton,
  Tooltip, Typography, Divider,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ChevronLeftIcon  from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { publicNav } from './navConfig.js';

/* ── Layout constants — exported for Topbar alignment ──────────── */
export const TOPBAR_H  = 64;   // px — must match Topbar height
export const EXPANDED  = 272;  // px — full sidebar width
export const COLLAPSED = 64;   // px — icon-only width = TOPBAR_H

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)';

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
          bgcolor: isDark
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(0,0,0,0.025)',
        },
      }}
    >
      {/* Collapsed: icon mark */}
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

      {/* Expanded: full logo */}
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
        <Divider sx={{ opacity: 0.45 }} />
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
function NavItem({ item, active, collapsed, onClick, isDark }) {
  const theme  = useTheme();
  const { t }  = useTranslation();
  const { key, Icon } = item;

  return (
    <Box sx={{ px: 1, mb: 0.5 }}>
      <Tooltip title={collapsed ? t(key) : ''} placement="right" arrow>
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
          {/* Icon */}
          <Box sx={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: active ? 'primary.main' : 'text.secondary',
            transition: 'color 0.14s',
            width: collapsed ? 'auto' : 20,
          }}>
            <Icon sx={{ fontSize: 18 }} />
          </Box>

          {/* Label */}
          <Box sx={{
            overflow: 'hidden',
            maxWidth: collapsed ? 0 : 200,
            opacity:  collapsed ? 0 : 1,
            transition: `max-width 0.28s ${EASE}, opacity 0.18s`,
            flex: 1,
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
              {t(key)}
            </Typography>
          </Box>
        </ListItemButton>
      </Tooltip>
    </Box>
  );
}

/* ── Collapse toggle button ─────────────────────────────────────── */
function CollapseToggle({ collapsed, onToggle, isDark }) {
  const theme = useTheme();
  const { t } = useTranslation();
  return (
    <Box sx={{
      px: 1, py: 1.25,
      borderTop: '1px solid',
      borderColor: 'divider',
      display: 'flex',
      justifyContent: collapsed ? 'center' : 'flex-end',
    }}>
      <Tooltip
        title={t(collapsed ? 'sidebar.expand' : 'sidebar.collapse')}
        placement="right"
      >
        <Box
          onClick={onToggle}
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
  );
}

/* ═══════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════ */
export default function MainSidebar({
  open, onClose, isMobile, isTablet, collapsed, onToggleCollapse,
}) {
  const theme    = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark   = theme.palette.mode === 'dark';

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleNav = (path) => {
    navigate(path);
    if (isMobile) onClose();
  };

  /* Sidebar surface — slightly different from page content */
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
        '&::-webkit-scrollbar': { width: 3 },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: alpha(theme.palette.text.primary, 0.09),
          borderRadius: 8,
        },
        '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
      }}>
        <List disablePadding>
          {publicNav.map((item) => (
            <Box key={item.key}>
              {item.section && (
                <SectionLabel labelKey={item.section} collapsed={collapsed} />
              )}
              <NavItem
                item={item}
                active={isActive(item.path)}
                collapsed={collapsed}
                isDark={isDark}
                onClick={() => handleNav(item.path)}
              />
            </Box>
          ))}
        </List>
      </Box>

      {/* ── Collapse toggle (desktop only) ── */}
      {!isMobile && !isTablet && (
        <CollapseToggle
          collapsed={collapsed}
          isDark={isDark}
          onToggle={onToggleCollapse}
        />
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
              ? '4px 0 32px rgba(0,0,0,0.4)'
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
