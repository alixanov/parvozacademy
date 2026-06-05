import { Box, Typography, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import HomeIcon         from '@mui/icons-material/Home';
import ArrowBackIcon    from '@mui/icons-material/ArrowBack';

export default function NotFound() {
  const { t }    = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        px: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        {/* Big 404 */}
        <Typography
          sx={{
            fontSize: { xs: '7rem', md: '10rem' },
            fontWeight: 900,
            lineHeight: 1,
            background: 'linear-gradient(135deg, #1976D2 0%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 2,
            userSelect: 'none',
          }}
        >
          404
        </Typography>

        <Typography variant="h4" fontWeight={800} gutterBottom>
          {t('page.notFound.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 5, maxWidth: 420, mx: 'auto', lineHeight: 1.7 }}>
          {t('page.notFound.subtitle')}
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="contained"
            size="large"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
            sx={{ borderRadius: 3, px: 4 }}
          >
            {t('topbar.home', { defaultValue: 'Bosh sahifa' })}
          </Button>
          <Button
            variant="outlined"
            size="large"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ borderRadius: 3, px: 4 }}
          >
            {t('common.back', { defaultValue: 'Orqaga' })}
          </Button>
        </Stack>
      </motion.div>
    </Box>
  );
}
