/**
 * PageBanner — Premium SaaS-level page header
 *
 * Design language: Linear / Stripe / Coursera / Notion
 *  - Clean background.paper base — no aurora, no blobs, no stars
 *  - Very subtle dot-grid texture
 *  - Soft radial color tint in top-right
 *  - 3-pixel top accent gradient bar in page color
 *  - Left: eyebrow → bold title → subtitle → stats row → optional children
 *  - Right: page-specific decorative visual (passed as `visual` prop)
 *  - Bottom border → seamless join with content
 */
import { Box, Container, Typography, Stack, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

export default function PageBanner({
  eyebrow,
  title,
  subtitle,
  color      = '#1976D2',
  stats      = [],           // [{ value, label }]
  visual,                    // JSX — right decorative area
  py         = { xs: 5.5, md: 7 },
  children,                  // optional slot (search bar, buttons…)
  textAlign  = 'left',       // 'left' | 'center'
}) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const center = textAlign === 'center';

  /* Derive tones from the accent color */
  const tintA  = isDark ? `${color}0D` : `${color}0B`; // radial corner tint
  const tintB  = isDark ? `${color}06` : `${color}07`; // dot grid

  return (
    <Box sx={{
      position: 'relative',
      overflow: 'hidden',
      py,
      bgcolor: 'background.paper',
      borderBottom: '1px solid',
      borderColor: 'divider',

      /* Dot-grid background pattern */
      backgroundImage: `radial-gradient(circle, ${tintB} 1.5px, transparent 1.5px)`,
      backgroundSize: '22px 22px',

      /* Soft radial tint in upper-right */
      '&::before': {
        content: '""',
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: center
          ? `radial-gradient(ellipse 90% 140% at 50% -10%, ${tintA} 0%, transparent 65%)`
          : `radial-gradient(ellipse 70% 160% at 110% 0%, ${color}14 0%, transparent 60%)`,
        zIndex: 0,
      },
    }}>

      {/* ── Top accent line ─────────────────────────────────────────── */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 2,
        background: center
          ? `linear-gradient(90deg, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`
          : `linear-gradient(90deg, ${color} 0%, ${color}99 50%, transparent 100%)`,
        pointerEvents: 'none',
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Stack
          direction={{ xs: 'column', md: visual ? 'row' : 'column' }}
          alignItems={{ xs: 'flex-start', md: visual ? 'center' : 'flex-start' }}
          spacing={{ xs: 4, md: 6 }}
        >
          {/* ── Left / main content ────────────────────────────────── */}
          <Box sx={{
            flex: 1,
            maxWidth: visual ? { md: 560 } : '100%',
            textAlign: center ? 'center' : 'left',
          }}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Eyebrow */}
              {eyebrow && (
                <Box component="span" sx={{
                  display: 'inline-flex', alignItems: 'center',
                  mb: 2,
                  border: `1.5px solid ${color}35`,
                  bgcolor: isDark ? `${color}16` : `${color}0F`,
                  color: color,
                  borderRadius: '8px',
                  px: 1.5, py: 0.55,
                  fontSize: '0.67rem', fontWeight: 700,
                  letterSpacing: '1.6px', textTransform: 'uppercase',
                  lineHeight: 1,
                }}>
                  {eyebrow}
                </Box>
              )}

              {/* Title */}
              <Typography fontWeight={800} sx={{
                fontSize: { xs: '1.9rem', sm: '2.35rem', md: '2.75rem' },
                lineHeight: 1.14,
                letterSpacing: { xs: '-0.3px', md: '-0.8px' },
                color: 'text.primary',
                mb: 1.5,
              }}>
                {title}
              </Typography>

              {/* Subtitle */}
              {subtitle && (
                <Typography sx={{
                  color: 'text.secondary',
                  fontSize: { xs: '0.93rem', md: '1.02rem' },
                  lineHeight: 1.72,
                  maxWidth: center ? 580 : 500,
                  mx: center ? 'auto' : 0,
                  mb: (stats.length > 0 || children) ? 3 : 0,
                }}>
                  {subtitle}
                </Typography>
              )}

              {/* Stats row */}
              {stats.length > 0 && (
                <Stack
                  direction="row"
                  flexWrap="wrap"
                  gap={{ xs: 2.5, md: 3.5 }}
                  justifyContent={center ? 'center' : 'flex-start'}
                  sx={{ mb: children ? 3 : 0 }}
                >
                  {stats.map(({ value, label }) => (
                    <Box key={label}>
                      <Typography sx={{
                        fontSize: { xs: '1.35rem', md: '1.6rem' },
                        fontWeight: 800,
                        lineHeight: 1,
                        color,
                        mb: 0.3,
                        letterSpacing: '-0.3px',
                      }}>
                        {value}
                      </Typography>
                      <Typography sx={{
                        fontSize: '0.72rem',
                        color: 'text.secondary',
                        fontWeight: 400,
                        lineHeight: 1.3,
                      }}>
                        {label}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              )}

              {children}
            </motion.div>
          </Box>

          {/* ── Right visual slot ──────────────────────────────────── */}
          {visual && (
            <Box sx={{
              flex: '0 0 auto',
              width: { xs: '100%', md: 400 },
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
                style={{ width: '100%' }}
              >
                {visual}
              </motion.div>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
