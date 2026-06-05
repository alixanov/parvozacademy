import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { motion } from 'framer-motion';
import MainTopbar  from './Topbar.jsx';
import MainSidebar from './Sidebar.jsx';
import Footer      from './Footer.jsx';
import BottomNav, { BOTTOM_NAV_H } from './BottomNav.jsx';

const COLLAPSED_KEY = 'sidebar_collapsed';

export default function MainLayout() {
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
      <MainSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        isMobile={isMobile}
        isTablet={isTablet}
        collapsed={effectiveCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <MainTopbar isMobile={isMobile} onMenuOpen={() => setMobileOpen(true)} />

        <Box component="main" sx={{
          flex: 1, px: { xs: 2, sm: 3 },
          // On mobile add bottom padding so content clears the fixed bottom nav
          pb: { xs: `${BOTTOM_NAV_H + 8}px`, sm: 0 },
        }}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 7 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Outlet />
          </motion.div>
        </Box>

        {/* Extra bottom clearance so BottomNav doesn't overlap the footer */}
        <Box sx={{ pb: { xs: `${BOTTOM_NAV_H}px`, sm: 0 } }}>
          <Footer />
        </Box>
      </Box>

      {/* Fixed bottom nav — mobile only */}
      <BottomNav />
    </Box>
  );
}
