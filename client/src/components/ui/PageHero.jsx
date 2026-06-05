/**
 * PageHero — Premium banner component (Home-quality design system)
 *
 * Senior UI/UX v4 — refined aurora, no decorative clutter:
 *  - 3 aurora blobs: top-left, bottom-right, true-center fill
 *  - center blob fills the previously-empty middle area
 *  - twinkling starfield (10 stars)
 *  - constellation SVG lines
 *  - top accent gradient line + inner highlight
 *  - diagonal light streak
 *  - SVG fractalNoise grain (soft-light blend)
 *  - bottom fade for seamless transition to content
 *  - side vignette framing
 */
import { Box, Container, Typography, Stack, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

/* Grain — SVG fractalNoise as data URI */
const GRAIN_URI = "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

/* Helper — re-bake an rgba(...) inside a gradient string with a new alpha */
const reAlpha = (gradient, alpha) =>
  gradient.replace(/(rgba\(\d+,\s*\d+,\s*\d+,\s*)[\d.]+(\s*\))/, (_, a, b) => `${a}${alpha}${b}`);

/* Twinkling stars — deterministic positions across the hero */
const STARS = [
  { top: '14%', left: '12%', size: 2, delay: '0s' },
  { top: '22%', left: '68%', size: 3, delay: '1.2s' },
  { top: '38%', left: '7%', size: 2, delay: '0.5s' },
  { top: '48%', left: '88%', size: 2, delay: '2s' },
  { top: '62%', left: '22%', size: 3, delay: '1.5s' },
  { top: '18%', left: '48%', size: 2, delay: '2.8s' },
  { top: '72%', left: '76%', size: 2, delay: '0.8s' },
  { top: '82%', left: '14%', size: 2, delay: '2.2s' },
  { top: '42%', left: '60%', size: 2, delay: '3.2s' },
  { top: '78%', left: '50%', size: 3, delay: '1.8s' },
];

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  gradient,
  lightBg = 'linear-gradient(135deg, #147eff 0%, #4457ff 52%, #a78bfa 100%)',
  darkBg,
  blob1 = 'radial-gradient(circle, rgba(37,99,235,0.92) 0%, transparent 65%)',
  blob2 = 'radial-gradient(circle, rgba(109,40,217,0.84) 0%, transparent 65%)',
  darkBlob1 = 'radial-gradient(circle, rgba(37,99,235,0.65) 0%, transparent 65%)',
  darkBlob2 = 'radial-gradient(circle, rgba(84, 0, 220, 0.55) 0%, transparent 65%)',
  chips = [],
  children,
  py = { xs: 8, md: 10 },
  showStars = true,
  showConstellation = true,
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const resolvedDark = darkBg ?? gradient ?? 'linear-gradient(135deg, #0a0b1f 0%, #14112e 100%)';
  const bg = isDark ? resolvedDark : lightBg;

  /* Center fill blob — significantly more visible than corner blobs */
  const centerBlob = isDark
    ? reAlpha(darkBlob1, '0.30')
    : reAlpha(blob1, '0.42');

  return (
    <Box sx={{
      position: 'relative', overflow: 'hidden', py,
      background: bg,
      isolation: 'isolate',

      /* ── Keyframes ───────────────────────────────────────────── */
      '@keyframes auroraDrift': {
        '0%, 100%': { transform: 'translate(0,0) scale(1)' },
        '50%': { transform: 'translate(28px,-22px) scale(1.04)' },
      },
      '@keyframes auroraDrift2': {
        '0%, 100%': { transform: 'translate(0,0) scale(1)' },
        '50%': { transform: 'translate(-22px,18px) scale(1.06)' },
      },
      '@keyframes twinkle': {
        '0%, 100%': { opacity: 0.25, transform: 'scale(1)' },
        '50%': { opacity: 1, transform: 'scale(1.4)' },
      },
    }}>

      {/* ── Top accent gradient line ─────────────────────────────── */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 1,
        background: isDark
          ? 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.30) 30%, rgba(255,255,255,0.30) 70%, transparent 100%)'
          : 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 30%, rgba(255,255,255,0.55) 70%, transparent 100%)',
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* ── Aurora blob 1 — top-left, brought inside for center fill ── */}
      <Box sx={{
        position: 'absolute', top: '-8%', left: '-6%',
        width: { xs: 540, md: 700 }, height: { xs: 540, md: 700 },
        borderRadius: '50%',
        background: isDark ? darkBlob1 : blob1,
        filter: 'blur(110px)',
        animation: 'auroraDrift 18s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Aurora blob 2 — bottom-right, brought inside for center fill ── */}
      <Box sx={{
        position: 'absolute', bottom: '-8%', right: '-6%',
        width: { xs: 500, md: 660 }, height: { xs: 500, md: 660 },
        borderRadius: '50%',
        background: isDark ? darkBlob2 : blob2,
        filter: 'blur(110px)',
        animation: 'auroraDrift2 22s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Center fill blob — fixes the empty-center problem ──────── */}
      <Box sx={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: 520, md: 760 }, height: { xs: 260, md: 360 },
        borderRadius: '50%',
        background: centerBlob,
        filter: 'blur(100px)',
        animation: 'auroraDrift 16s ease-in-out infinite reverse',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Top inner highlight — "lit from above" ──────────────── */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '45%',
        background: isDark
          ? 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 40%, transparent 100%)'
          : 'linear-gradient(to bottom, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 40%, transparent 100%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Diagonal light streak ───────────────────────────────── */}
      <Box sx={{
        position: 'absolute', top: '-60%', left: '15%',
        width: '50%', height: '220%',
        background: isDark
          ? 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)'
          : 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.09) 50%, transparent 60%)',
        transform: 'rotate(12deg)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* ── Twinkling starfield ──────────────────────────────────── */}
      {showStars && STARS.map((s, i) => (
        <Box key={i} sx={{
          position: 'absolute',
          top: s.top, left: s.left,
          width: s.size, height: s.size,
          borderRadius: '50%',
          bgcolor: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.95)',
          boxShadow: isDark
            ? `0 0 ${s.size * 3}px rgba(255,255,255,0.65)`
            : `0 0 ${s.size * 3}px rgba(255,255,255,0.55)`,
          animation: `twinkle 3.5s ease-in-out ${s.delay} infinite`,
          pointerEvents: 'none', zIndex: 0,
        }} />
      ))}

      {/* ── Constellation: connecting lines (SVG) ───────────────── */}
      {showConstellation && (
        <Box component="svg" viewBox="0 0 100 100" preserveAspectRatio="none" sx={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 0,
          opacity: isDark ? 0.18 : 0.16,
          color: 'white',
        }}>
          <line x1="12" y1="14" x2="48" y2="18" stroke="currentColor" strokeWidth="0.08" />
          <line x1="48" y1="18" x2="68" y2="22" stroke="currentColor" strokeWidth="0.08" />
          <line x1="7" y1="38" x2="22" y2="62" stroke="currentColor" strokeWidth="0.08" />
          <line x1="60" y1="42" x2="88" y2="48" stroke="currentColor" strokeWidth="0.08" />
          <line x1="76" y1="72" x2="50" y2="78" stroke="currentColor" strokeWidth="0.08" />
          <line x1="14" y1="82" x2="50" y2="78" stroke="currentColor" strokeWidth="0.08" />
        </Box>
      )}

      {/* ── Grain texture ───────────────────────────────────────── */}
      <Box sx={{
        position: 'absolute', inset: 0, zIndex: 1,
        backgroundImage: GRAIN_URI,
        backgroundRepeat: 'repeat',
        backgroundSize: '180px 180px',
        opacity: isDark ? 0.22 : 0.12,
        mixBlendMode: 'soft-light',
        pointerEvents: 'none',
      }} />

      {/* ── Bottom edge fade — seamless transition ──────────────── */}
      <Box sx={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: 80, zIndex: 1, pointerEvents: 'none',
        background: isDark
          ? 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.28) 100%)'
          : 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.10) 100%)',
      }} />

      {/* ── Side vignette ───────────────────────────────────────── */}
      <Box sx={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 100% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.12) 100%)',
      }} />

      {/* ── Content ─────────────────────────────────────────────── */}
      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {eyebrow && (
            <Box component="span" sx={{
              display: 'inline-block', mb: 2.5,
              bgcolor: 'rgba(255,255,255,0.16)',
              border: '1px solid rgba(255,255,255,0.34)',
              backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              borderRadius: 6, px: 2.25, py: 0.7,
              color: 'rgba(255,255,255,0.95)',
              fontSize: '0.7rem', fontWeight: 700,
              letterSpacing: 1.8, textTransform: 'uppercase',
              boxShadow: '0 4px 18px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.20)',
            }}>
              {eyebrow}
            </Box>
          )}

          <Typography variant="h2" fontWeight={800} sx={{
            color: 'white', mb: 1.75,
            lineHeight: 1.12,
            letterSpacing: { xs: '-0.5px', md: '-1.2px' },
            fontSize: { xs: '2.15rem', sm: '2.75rem', md: '3.25rem' },
            textShadow: '0 2px 18px rgba(0,0,0,0.22), 0 1px 3px rgba(0,0,0,0.12)',
          }}>
            {title}
          </Typography>

          {subtitle && (
            <Typography variant="h6" sx={{
              color: 'rgba(255,255,255,0.88)', fontWeight: 400,
              lineHeight: 1.7, maxWidth: 620, mx: 'auto',
              mb: chips.length > 0 || children ? 4 : 0,
              fontSize: { xs: '0.95rem', md: '1.08rem' },
              textShadow: '0 1px 8px rgba(0,0,0,0.15)',
            }}>
              {subtitle}
            </Typography>
          )}

          {chips.length > 0 && (
            <Stack direction="row" justifyContent="center" flexWrap="wrap" gap={1.5}
              sx={{ mb: children ? 3.5 : 0 }}>
              {chips.map(({ label, icon }) => (
                <Box key={label} sx={{
                  display: 'flex', alignItems: 'center', gap: 0.85,
                  bgcolor: 'rgba(255,255,255,0.16)',
                  border: '1px solid rgba(255,255,255,0.30)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  borderRadius: 3, px: 2, py: 0.95,
                  boxShadow: '0 2px 14px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.16)',
                  transition: 'all 0.22s',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.22)',
                    borderColor: 'rgba(255,255,255,0.42)',
                    transform: 'translateY(-1px)',
                  },
                }}>
                  {icon && (
                    <Box sx={{
                      display: 'flex', alignItems: 'center',
                      color: 'rgba(255,255,255,0.90)',
                      '& .MuiSvgIcon-root': { fontSize: 16 },
                    }}>
                      {icon}
                    </Box>
                  )}
                  <Typography variant="body2" sx={{
                    color: 'white', fontWeight: 600, lineHeight: 1,
                  }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}

          {children}
        </motion.div>
      </Container>
    </Box>
  );
}
