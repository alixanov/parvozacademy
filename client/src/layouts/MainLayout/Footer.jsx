import {
  Box, Container, Grid, Typography, Link, Stack, Divider,
  IconButton,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TelegramIcon from '@mui/icons-material/Telegram';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LogoMark from '../../components/ui/LogoMark.jsx';

/*
  Все цвета — только из темы MUI (семантические токены).
  Никаких hardcoded rgba/hex и никаких isDark-проверок.
  Благодаря этому футер автоматически переключается
  между светлой и тёмной темой так же, как и все
  остальные компоненты приложения.
*/
export default function Footer() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const QUICK_LINKS = [
    { label: t('nav.home'), path: '/' },
    { label: t('nav.courses'), path: '/courses' },
    { label: t('nav.onlineTests'), path: '/tests' },
    { label: t('nav.pricing'), path: '/pricing' },
    { label: t('nav.teachers'), path: '/teachers' },
    { label: t('nav.vacancies'), path: '/vacancies' },
  ];

  const INFO_LINKS = [
    { label: t('nav.about'), path: '/about' },
    { label: t('nav.contacts'), path: '/contacts' },
    { label: t('auth.login'), path: '/login' },
    { label: t('auth.register'), path: '/register' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        /* background.paper = #FFFFFF (light) / #111827 (dark) —
           автоматически меняется при смене темы */
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',   /* divider = #E2E8F0 (light) / #1F2937 (dark) */
        pt: { xs: 6, md: 8 },
        pb: 3,
        flexShrink: 0,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>

          {/* ── Бренд ── */}
          <Grid item xs={12} md={4}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: 2,
                background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(25, 118, 210, 0.3)',
              }}>
                <LogoMark size={26} color="#ffffff" />
              </Box>
              <Box>
                {/* text.primary = #1A1A2E (light) / #F9FAFB (dark) */}
                <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ lineHeight: 1.1 }}>
                  PARVOZ ACADEMY
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('footer.tagline')}
                </Typography>
              </Box>
            </Stack>

            {/* text.secondary = #64748B (light) / #94A3B8 (dark) */}
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2.5 }}>
              {t('footer.description')}
            </Typography>

            {/* Соцсети — брендовые цвета остаются, они не зависят от темы */}
            <Stack direction="row" spacing={1}>
              <IconButton
                size="small"
                sx={{ bgcolor: '#229ED9', color: '#fff', '&:hover': { bgcolor: '#1a8dbf' }, borderRadius: 1.5 }}
                onClick={() => window.open('https://t.me/parvozacademy', '_blank')}
              >
                <TelegramIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{ bgcolor: '#E1306C', color: '#fff', '&:hover': { bgcolor: '#c62860' }, borderRadius: 1.5 }}
                onClick={() => window.open('https://instagram.com/parvozacademy', '_blank')}
              >
                <InstagramIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{ bgcolor: '#FF0000', color: '#fff', '&:hover': { bgcolor: '#cc0000' }, borderRadius: 1.5 }}
                onClick={() => window.open('https://youtube.com/@parvozacademy', '_blank')}
              >
                <YouTubeIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Grid>

          {/* ── Быстрые ссылки ── */}
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
              {t('footer.pages')}
            </Typography>
            <Stack spacing={1.25}>
              {QUICK_LINKS.map(({ label, path }) => (
                <Link
                  key={path}
                  component="button"
                  onClick={() => navigate(path)}
                  underline="hover"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* ── Информация ── */}
          <Grid item xs={6} md={2}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
              {t('footer.info')}
            </Typography>
            <Stack spacing={1.25}>
              {INFO_LINKS.map(({ label, path }) => (
                <Link
                  key={path}
                  component="button"
                  onClick={() => navigate(path)}
                  underline="hover"
                  sx={{
                    color: 'text.secondary',
                    fontSize: '0.875rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* ── Контакты ── */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 2 }}>
              {t('footer.contact')}
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start">
                <PhoneIcon sx={{ fontSize: 18, color: 'primary.main', mt: 0.25, flexShrink: 0 }} />
                <Box>
                  <Typography variant="body2" color="text.primary">+998 50 500 76 13</Typography>
                  <Typography variant="caption" color="text.secondary">{t('footer.hours')}</Typography>
                </Box>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <EmailIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                <Typography variant="body2" color="text.primary">info@parvozacademy.uz</Typography>
              </Stack>

              <Stack
                direction="row" spacing={1.5} alignItems="center"
                component="a"
                href="https://t.me/parvozacademy"
                target="_blank"
                sx={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                <TelegramIcon sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
                <Typography variant="body2" color="text.primary">@parvozacademy</Typography>
              </Stack>

              <Stack
                direction="row" spacing={1.5} alignItems="flex-start"
                component="a"
                href="https://maps.google.com/?q=41.04239,71.66817"
                target="_blank"
                sx={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                <LocationOnIcon sx={{ fontSize: 18, color: 'primary.main', mt: 0.25, flexShrink: 0 }} />
                <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6 }}>
                  41°02'32.6"N 71°40'05.4"E
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        {/* Divider — берёт цвет из темы автоматически */}
        <Divider sx={{ my: 4 }} />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems="center"
          spacing={1}
        >
          <Typography variant="caption" color="text.disabled">
            © {new Date().getFullYear()} PARVOZ ACADEMY. {t('footer.copyright')}
          </Typography>

          <Stack direction="row" spacing={2}>
            <Link
              component="button"
              onClick={() => navigate('/privacy')}
              underline="hover"
              sx={{ color: 'text.disabled', fontSize: '0.75rem', cursor: 'pointer', '&:hover': { color: 'text.secondary' } }}
            >
              {t('footer.privacy')}
            </Link>
            <Link
              component="button"
              onClick={() => navigate('/terms')}
              underline="hover"
              sx={{ color: 'text.disabled', fontSize: '0.75rem', cursor: 'pointer', '&:hover': { color: 'text.secondary' } }}
            >
              {t('footer.terms')}
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
