import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { motion } from 'framer-motion';
import LMSSidebar from './Sidebar.jsx';
import LMSTopbar  from './Topbar.jsx';

const COLLAPSED_KEY = 'lms_sidebar_collapsed';

export default function LMSLayout() {
  const theme    = useTheme();
  const location = useLocation();

  /* ── Breakpoints ───────────────────────────────────────────────
     mobile  < 600px  → hamburger + drawer overlay
     tablet  600–899  → persistent icon-only sidebar
     desktop ≥ 900px  → persistent full sidebar (user-collapsible)
  ─────────────────────────────────────────────────────────────── */
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed]   = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === 'true',
  );

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  };

  /* On tablet — always render collapsed (icon-only). Desktop — user choice. */
  const effectiveCollapsed = !isMobile && (isTablet || collapsed);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <LMSSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isMobile={isMobile}
        isTablet={isTablet}
        collapsed={effectiveCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <LMSTopbar isMobile={isMobile} onMenuOpen={() => setMobileOpen(true)} />

        <Box
          component="main"
          sx={{ flex: 1, p: { xs: 2, sm: 3 }, maxWidth: '100%', overflowX: 'hidden' }}
        >
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ height: '100%' }}
          >
            <Outlet />
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
}
