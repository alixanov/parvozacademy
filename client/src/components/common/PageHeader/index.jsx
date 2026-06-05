import { Box, Typography, Stack, Breadcrumbs, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

/**
 * PageHeader — universal page title bar for dashboard pages.
 *
 * Props:
 *   icon        — MUI Icon element shown before title
 *   title       — page title string
 *   subtitle    — optional short description below the title
 *   actions     — optional JSX rendered on the right (buttons, chips)
 *   breadcrumbs — optional array of { label, path } for breadcrumb trail
 *   accent      — accent color (default: primary.main)
 */
export default function PageHeader({ icon, title, subtitle, actions, breadcrumbs, accent }) {
  const navigate = useNavigate();
  const theme    = useTheme();
  const color    = accent ?? theme.palette.primary.main;

  return (
    <Box sx={{ mb: 4 }}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon sx={{ fontSize: 14 }} />}
          sx={{ mb: 1.5 }}
          aria-label="breadcrumb"
        >
          {breadcrumbs.map((crumb, i) =>
            i < breadcrumbs.length - 1 ? (
              <Link
                key={crumb.path}
                underline="hover"
                color="text.secondary"
                onClick={() => navigate(crumb.path)}
                sx={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
              >
                {crumb.label}
              </Link>
            ) : (
              <Typography key="current" color="text.primary" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                {crumb.label}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}

      {/* Title row */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Icon container */}
          {icon && (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2.5,
                background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
                border: `1.5px solid ${color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color,
                '& svg': { fontSize: '1.4rem' },
              }}
            >
              {icon}
            </Box>
          )}

          <Box>
            {/* Accent line + title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 3,
                  height: 28,
                  borderRadius: 2,
                  background: `linear-gradient(180deg, ${color} 0%, ${color}55 100%)`,
                  flexShrink: 0,
                }}
              />
              <Typography variant="h5" fontWeight={800} lineHeight={1.2} color="text.primary">
                {title}
              </Typography>
            </Box>
            {subtitle && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5, ml: '18px' }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>

        {actions && (
          <Box sx={{ flexShrink: 0 }}>
            {actions}
          </Box>
        )}
      </Stack>
    </Box>
  );
}
