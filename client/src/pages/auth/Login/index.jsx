import {
  Box, Typography, TextField, Button, Link, InputAdornment,
  IconButton, Alert, Stack, useTheme, Chip,
} from '@mui/material';
import { useState }                                     from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useForm }                                      from 'react-hook-form';
import { zodResolver }                                  from '@hookform/resolvers/zod';
import { z }                                            from 'zod';
import { useDispatch }                                  from 'react-redux';
import { motion, AnimatePresence }                      from 'framer-motion';

import VisibilityIcon    from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import { useTranslation }   from 'react-i18next';
import { useLoginMutation } from '../../../features/auth/authApi.js';
import { setCredentials }   from '../../../features/auth/authSlice.js';
import LogoMark             from '../../../components/ui/LogoMark.jsx';

const schema = z.object({
  phone:    z.string()
    .min(9,  'Kamida 9 ta raqam kiriting')
    .max(18, 'Telefon raqam juda uzun')
    .regex(/^[\d\s\-+()]+$/, "Faqat raqam kiriting"),
  password: z.string().min(6, 'Kamida 6 ta belgi'),
});

const ROLE_HOME = { student: '/student', teacher: '/teacher', admin: '/admin' };

/* ─── Abstract orbital illustration ─────────────────────────── */
function OrbitalIllustration({ isDark }) {
  return (
    <svg width="380" height="380" viewBox="0 0 380 380" fill="none"
      style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
      <defs>
        <radialGradient id="cg" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#1976D2" stopOpacity="1"/>
          <stop offset="100%" stopColor="#1976D2" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="glow1" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#2563EB" stopOpacity="0.35"/>
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Outer glow ring */}
      <circle cx="190" cy="190" r="72" fill="url(#glow1)" />
      <circle cx="190" cy="190" r="40" fill="url(#glow1)" opacity="0.6"/>

      {/* Orbit 1 — horizontal */}
      <ellipse cx="190" cy="190" rx="175" ry="58"
        stroke="rgba(37,99,235,0.32)" strokeWidth="1" fill="none"/>
      <circle cx="365" cy="190" r="5"   fill="#2563EB" opacity="0.9"/>
      <circle cx="15"  cy="190" r="3"   fill="#2563EB" opacity="0.5"/>

      {/* Orbit 2 — 60° */}
      <g transform="rotate(60 190 190)">
        <ellipse cx="190" cy="190" rx="175" ry="58"
          stroke="rgba(99,102,241,0.25)" strokeWidth="1" fill="none"/>
        <circle cx="365" cy="190" r="4.5" fill="#6366F1" opacity="0.85"/>
        <circle cx="15"  cy="190" r="2.5" fill="#6366F1" opacity="0.5"/>
      </g>

      {/* Orbit 3 — 120° */}
      <g transform="rotate(120 190 190)">
        <ellipse cx="190" cy="190" rx="175" ry="58"
          stroke="rgba(6,182,212,0.20)" strokeWidth="1" fill="none"/>
        <circle cx="365" cy="190" r="4"   fill="#06B6D4" opacity="0.8"/>
        <circle cx="15"  cy="190" r="2"   fill="#06B6D4" opacity="0.45"/>
      </g>

      {/* Center core */}
      <circle cx="190" cy="190" r="14" fill="rgba(25,118,210,0.22)"/>
      <circle cx="190" cy="190" r="8"  fill="#1976D2" opacity="0.8"/>
      <circle cx="190" cy="190" r="4"  fill="white"   opacity="0.95"/>

      {/* Scattered particles */}
      {[
        [72,  55,  1.8, 0.18], [308, 72,  1.5, 0.14],
        [52,  292, 2.2, 0.12], [318, 278, 1.8, 0.14],
        [190, 32,  1.5, 0.16], [36,  168, 2.0, 0.12],
        [338, 208, 1.5, 0.14], [142, 340, 1.5, 0.10],
        [250, 328, 2.0, 0.12], [100, 112, 1.2, 0.10],
        [288, 130, 1.4, 0.10], [168,  72, 1.2, 0.08],
      ].map(([cx, cy, r, op], i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill={isDark ? 'white' : '#1E3A8A'} opacity={op}/>
      ))}

      {/* Subtle connector lines */}
      <line x1="190" y1="190" x2="365" y2="190"
        stroke="rgba(37,99,235,0.08)" strokeWidth="1"/>
      <line x1="190" y1="190" x2="278" y2="341"
        stroke="rgba(99,102,241,0.06)" strokeWidth="1"
        transform="rotate(60 190 190)"/>
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function Login() {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { t }  = useTranslation();
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch();

  const [showPwd, setShowPwd]   = useState(false);
  const [apiError, setApiError] = useState('');
  const [login, { isLoading }]  = useLoginMutation();
  const from = location.state?.from?.pathname ?? null;

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema), mode: 'onBlur',
  });

  // Normalize phone: strip non-digits, ensure +998 prefix
  const normalizePhone = (raw = '') => {
    const digits = raw.replace(/\D/g, '');
    if (digits.startsWith('998') && digits.length === 12) return `+${digits}`;
    if (digits.length === 9) return `+998${digits}`;
    if (digits.length === 11 && digits.startsWith('998')) return `+${digits}`;
    return raw.trim();
  };

  const onSubmit = async (data) => {
    setApiError('');
    try {
      const payload = { ...data, phone: normalizePhone(data.phone) };
      const res = await login(payload).unwrap();
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      navigate(from ?? ROLE_HOME[res.data.user.role] ?? '/', { replace: true });
    } catch (err) {
      setApiError(err?.data?.message ?? 'Kirish xatosi. Telefon raqam va parolni tekshiring.');
    }
  };

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      fontSize: '0.875rem',
      transition: 'box-shadow 0.15s',
      '& fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.13)' },
      '&:hover fieldset': { borderColor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.26)' },
      '&.Mui-focused': {
        boxShadow: '0 0 0 3px rgba(25,118,210,0.14)',
        '& fieldset': { borderColor: '#1976D2', borderWidth: '1.5px' },
      },
      '&.Mui-error fieldset': { borderColor: '#EF4444' },
    },
    '& .MuiInputLabel-root': { fontSize: '0.875rem' },
    '& .MuiFormHelperText-root': { fontSize: '0.72rem', ml: 0 },
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>

      {/* ════════════════════════════════════════════════════
          LEFT PANEL — premium visual
      ════════════════════════════════════════════════════ */}
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        width: { md: '48%', lg: '50%' },
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: isDark ? '#060914' : '#EEF4FF',
      }}>
        {/* Gradient atmosphere */}
        <Box sx={{
          position: 'absolute', top: '-15%', left: '-10%',
          width: '70%', height: '70%', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(25,118,210,0.22) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(37,99,235,0.13) 0%, transparent 65%)',
          filter: 'blur(2px)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: '-10%', right: '-10%',
          width: '60%', height: '60%', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 65%)',
          filter: 'blur(2px)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: '20%', left: '-5%',
          width: '45%', height: '45%', borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 65%)',
        }} />

        {/* Very subtle dot grid */}
        <Box sx={{
          position: 'absolute', inset: 0,
          backgroundImage: isDark
            ? 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)'
            : 'radial-gradient(rgba(15,23,42,0.055) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        {/* Right-edge integration liner */}
        <Box sx={{
          position: 'absolute', right: 0, top: 0,
          width: 1.5, height: '100%', zIndex: 4,
          background: 'linear-gradient(180deg, transparent 5%, rgba(37,99,235,0.5) 30%, rgba(99,102,241,0.38) 70%, transparent 95%)',
        }} />
        <Box sx={{
          position: 'absolute', right: 0, top: 0,
          width: 36, height: '100%', zIndex: 3,
          background: isDark
            ? 'linear-gradient(to right, transparent, rgba(37,99,235,0.07))'
            : 'linear-gradient(to right, transparent, rgba(37,99,235,0.05))',
        }} />

        {/* Orbital SVG illustration — centered */}
        <Box sx={{ position: 'absolute', inset: 0 }}>
          <OrbitalIllustration isDark={isDark} />
        </Box>

        {/* Content layer */}
        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', height: '100%', p: { md: 5, lg: 6 } }}>
          {/* Logo */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer', width: 'fit-content' }}
              onClick={() => navigate('/')}>
              <Box sx={{
                width: 32, height: 32, borderRadius: '8px',
                background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.07)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.10)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <LogoMark size={20} color={isDark ? '#fff' : '#1E3A8A'} />
              </Box>
              <Box>
                <Typography sx={{ color: isDark ? 'white' : '#0F172A', fontSize: '0.8rem', fontWeight: 700, letterSpacing: 0.3, lineHeight: 1 }}>
                  PARVOZ ACADEMY
                </Typography>
                <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.42)', fontSize: '0.55rem', letterSpacing: '0.12em', textTransform: 'uppercase', mt: 0.2 }}>
                  Education Platform
                </Typography>
              </Box>
            </Box>
          </motion.div>

          {/* Spacer */}
          <Box sx={{ flex: 1 }} />

          {/* Bottom text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}>
            <Typography sx={{
              color: isDark ? 'white' : '#0F172A',
              fontSize: { md: '1.9rem', lg: '2.35rem' },
              fontWeight: 800,
              lineHeight: 1.18,
              letterSpacing: '-0.025em',
              mb: 1.5,
            }}>
              Bilim oling.<br />
              <Box component="span" sx={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.42)', fontWeight: 600 }}>
                Kelajakni yarating.
              </Box>
            </Typography>

            <Typography sx={{
              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.52)',
              fontSize: '0.88rem',
              lineHeight: 1.7,
              maxWidth: 340,
              mb: 4,
            }}>
              Professional o'qituvchilar, strukturlangan kurslar va real natijalar — bir platformada.
            </Typography>

            {/* Stats */}
            <Box sx={{
              display: 'flex', gap: 3.5,
              pt: 3.5,
              borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.10)'}`,
            }}>
              {[
                { val: '1 240+', lbl: 'Talabalar' },
                { val: '24',     lbl: "O'qituvchilar" },
                { val: '36',     lbl: 'Guruhlar' },
              ].map(({ val, lbl }) => (
                <Box key={lbl}>
                  <Typography sx={{ color: isDark ? 'white' : '#1E3A5F', fontWeight: 700, fontSize: '1.2rem', lineHeight: 1 }}>
                    {val}
                  </Typography>
                  <Typography sx={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,23,42,0.45)', fontSize: '0.7rem', mt: 0.4 }}>
                    {lbl}
                  </Typography>
                </Box>
              ))}
            </Box>
          </motion.div>
        </Box>
      </Box>

      {/* ════════════════════════════════════════════════════
          RIGHT PANEL — form
      ════════════════════════════════════════════════════ */}
      <Box sx={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: isDark ? '#0C0E14' : '#FFFFFF',
        p: { xs: 3, sm: 5 },
        overflowY: 'auto',
      }}>
        {/* Left edge blue glow — integration with left panel */}
        <Box sx={{
          position: 'absolute', left: 0, top: 0,
          width: 72, height: '100%', pointerEvents: 'none', zIndex: 0,
          background: isDark
            ? 'linear-gradient(to right, rgba(37,99,235,0.07), transparent)'
            : 'linear-gradient(to right, rgba(37,99,235,0.05), transparent)',
        }} />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{ width: '100%', maxWidth: 380 }}
        >
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.25, mb: 5, cursor: 'pointer' }}
            onClick={() => navigate('/')}>
            <Box sx={{ width: 28, height: 28, borderRadius: '7px', background: 'linear-gradient(135deg,#1565C0,#1976D2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LogoMark size={17} color="#fff" />
            </Box>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'text.disabled' }}>
              Parvoz Academy
            </Typography>
          </Box>

          {/* Heading */}
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.025em', mb: 0.5 }}>
            {t('auth.login')}
          </Typography>
          <Typography sx={{ fontSize: '0.83rem', color: 'text.secondary', mb: 4, lineHeight: 1.55 }}>
            {t('auth.loginSubtitle')}
          </Typography>

          {/* Error */}
          <AnimatePresence>
            {apiError && (
              <motion.div key="err"
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}>
                <Alert severity="error" onClose={() => setApiError('')}
                  sx={{ mb: 3, borderRadius: '8px', fontSize: '0.8rem', py: 0.5 }}>
                  {apiError}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={1.75}>
              <TextField
                label={t('auth.phone')} type="tel" fullWidth size="small"
                autoComplete="tel" autoFocus
                placeholder="90 123 45 67"
                {...register('phone')}
                error={!!errors.phone} helperText={errors.phone?.message}
                sx={fieldSx}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Chip
                        label="+998"
                        size="small"
                        sx={{
                          height: 22, fontSize: '0.72rem', fontWeight: 700,
                          bgcolor: isDark ? 'rgba(25,118,210,0.18)' : 'rgba(25,118,210,0.10)',
                          color: 'primary.main',
                          border: 'none',
                          borderRadius: '4px',
                          mr: 0.5,
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label={t('auth.password')} type={showPwd ? 'text' : 'password'}
                fullWidth size="small" autoComplete="current-password"
                {...register('password')}
                error={!!errors.password} helperText={errors.password?.message}
                sx={fieldSx}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" edge="end" tabIndex={-1}
                        onClick={() => setShowPwd((p) => !p)}
                        sx={{ color: 'text.disabled', mr: -0.25 }}>
                        {showPwd ? <VisibilityOffIcon sx={{ fontSize: 16 }} /> : <VisibilityIcon sx={{ fontSize: 16 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>

            <Box sx={{ textAlign: 'right', mt: 1.5, mb: 2.5 }}>
              <Link component="button" type="button" underline="hover"
                sx={{ fontSize: '0.78rem', color: 'text.secondary', fontWeight: 500 }}
                onClick={() => navigate('/contacts')}>
                {t('auth.forgotPassword')}
              </Link>
            </Box>

            <Button
              type="submit" variant="contained" fullWidth disabled={isLoading}
              sx={{
                height: 42, fontSize: '0.875rem', fontWeight: 600,
                borderRadius: '8px', letterSpacing: 0.1,
                bgcolor: '#1976D2', boxShadow: 'none',
                '&:hover': { bgcolor: '#1565C0', boxShadow: 'none' },
                '&.Mui-disabled': {
                  bgcolor: isDark ? 'rgba(25,118,210,0.38)' : 'rgba(25,118,210,0.32)',
                  color: 'rgba(255,255,255,0.55)',
                },
              }}
            >
              {isLoading ? t('common.loading') : t('auth.login')}
            </Button>
          </Box>

          <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled', textAlign: 'center', mt: 3.5 }}>
            {t('auth.noAccount')}{' '}
            <Link component={RouterLink} to="/register" underline="hover"
              sx={{ color: 'primary.main', fontWeight: 600 }}>
              {t('auth.registerLink')}
            </Link>
          </Typography>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Link component="button" underline="none"
              sx={{ fontSize: '0.72rem', color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
              onClick={() => navigate('/')}>
              {t('auth.backHome')}
            </Link>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
}
