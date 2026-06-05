import {
  Box, Container, Grid, Typography, Card, CardContent,
  Button, TextField, Stack, Link, useTheme, Chip, InputAdornment,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation }  from 'react-i18next';
import { motion }          from 'framer-motion';
import PhoneIcon           from '@mui/icons-material/Phone';
import EmailIcon           from '@mui/icons-material/Email';
import TelegramIcon        from '@mui/icons-material/Telegram';
import LocationOnIcon      from '@mui/icons-material/LocationOn';
import AccessTimeIcon      from '@mui/icons-material/AccessTime';
import SendIcon            from '@mui/icons-material/Send';
import CheckCircleIcon     from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon    from '@mui/icons-material/ArrowForward';
import RefreshIcon         from '@mui/icons-material/Refresh';
import i18n                from '../../../utils/i18n.js';
import PageBanner          from '../../../components/ui/PageBanner.jsx';

/* ─── shared animation ───────────────────────────────────────────── */
const fadeUp = {
  initial:     { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, margin: '-40px' },
  transition:  { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

export default function Contacts() {
  const { t }    = useTranslation();
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const lang     = i18n.language === 'ru' ? 'ru' : 'uz';
  /* Evaluated at render time — always shows today's actual day */
  const jsDay    = new Date().getDay(); // 0 Sun … 6 Sat

  const [sent, setSent]   = useState(false);
  const [form, setForm]   = useState({ name: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});

  /* ── data ────────────────────────────────────────────────────── */
  const CONTACTS = [
    {
      Icon: PhoneIcon,
      labelKey: 'contactsPage.phone',
      value: '+998 50 500 76 13',
      href: 'tel:+998505007613',
      color: '#1976D2',
    },
    {
      Icon: EmailIcon,
      labelKey: 'contactsPage.email',
      value: 'info@parvoz.uz',
      href: 'mailto:info@parvoz.uz',
      color: '#EF4444',
    },
    {
      Icon: TelegramIcon,
      labelKey: 'contactsPage.telegram',
      value: '@parvozacademy',
      href: 'https://t.me/parvozacademy',
      color: '#0088CC',
    },
    {
      Icon: LocationOnIcon,
      labelKey: 'contactsPage.address',
      value: lang === 'ru' ? 'Андижан, Узбекистан' : "Andijon, O'zbekiston",
      href: 'https://maps.google.com/?q=41.04239,71.66817',
      color: '#10B981',
    },
  ];

  /* today highlight: 1-5 = Mon–Fri, 6 = Sat, 0 = Sun */
  const HOURS = [
    {
      dayKey: 'contactsPage.monFri',
      time: '09:00 – 20:00',
      closed: false,
      isToday: jsDay >= 1 && jsDay <= 5,
    },
    {
      dayKey: 'contactsPage.sat',
      time: '09:00 – 18:00',
      closed: false,
      isToday: jsDay === 6,
    },
    {
      dayKey: 'contactsPage.sun',
      time: t('contactsPage.sunClosed'),
      closed: true,
      isToday: jsDay === 0,
    },
  ];

  /* ── form validation ─────────────────────────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = true;
    if (form.phone.length !== 9) e.phone = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (ev) => {
    const val = field === 'phone'
      ? ev.target.value.replace(/\D/g, '').slice(0, 9)
      : ev.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: false }));
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSent(true);
  };

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <Box sx={{ mx: { xs: -2, sm: -3 } }}>

      {/* ━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <PageBanner
        eyebrow="Parvoz Academy"
        title={t('contactsPage.pageTitle')}
        subtitle={t('contactsPage.pageSubtitle')}
        color="#0088CC"
        stats={[
          { value: '+998 50 500 76 13', label: lang === 'ru' ? 'телефон'    : 'telefon' },
          { value: 'Пн–Сб',            label: lang === 'ru' ? 'с 9:00–20:00' : '9:00–20:00' },
          { value: lang === 'ru' ? 'Андижан' : 'Andijon', label: lang === 'ru' ? 'адрес' : 'manzil' },
        ]}
        visual={
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {CONTACTS.map(({ Icon, labelKey, value, color }) => (
              <Box key={labelKey} sx={{
                display: 'flex', flexDirection: 'column', gap: 0.85,
                p: 2,
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'background.default',
                border: '1px solid', borderColor: 'divider',
                borderRadius: '14px',
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                <Box sx={{
                  width: 34, height: 34, borderRadius: '10px',
                  bgcolor: `${color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon sx={{ fontSize: 18, color }} />
                </Box>
                <Typography sx={{
                  fontSize: '0.72rem', fontWeight: 700, color: 'text.primary',
                  lineHeight: 1.3, wordBreak: 'break-all',
                }}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Box>
        }
      />


      {/* ━━━━━━━━━━━━━━━━ MAP + FORM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Box sx={{ py: { xs: 5, md: 8 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 4, md: 5 }}>

            {/* ── Left: Map + Hours ────────────────────────────────── */}
            <Grid item xs={12} md={7}>
              <motion.div {...fadeUp}>

                {/* Section label */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{
                    width: 30, height: 30, borderRadius: '9px',
                    bgcolor: 'primary.main' + '14',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'primary.main',
                  }}>
                    <LocationOnIcon sx={{ fontSize: 17 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>
                    {t('contactsPage.mapTitle')}
                  </Typography>
                </Stack>

                {/* Map iframe */}
                <Box sx={{
                  width: '100%',
                  height: { xs: 260, md: 340 },
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                }}>
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2996.3!2d69.2401!3d41.2995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDE3JzU4LjIiTiA2OcKwMTQnMjQuNCJF!5e0!3m2!1sru!2s!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0, display: 'block' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="PARVOZ ACADEMY xaritada"
                  />
                </Box>

                {/* Hours */}
                <Box
                  sx={{
                    mt: 2.5,
                    p: 2.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '8px',
                      bgcolor: 'primary.main' + '14',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'primary.main',
                    }}>
                      <AccessTimeIcon sx={{ fontSize: 15 }} />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {t('contactsPage.hoursTitle')}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    {HOURS.map(({ dayKey, time, closed, isToday }) => (
                      <Box
                        key={dayKey}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          px: 1.5, py: 0.9,
                          borderRadius: 2,
                          bgcolor: isToday
                            ? (closed
                                ? 'error.main' + '0D'
                                : 'primary.main' + '0A')
                            : 'transparent',
                          border: '1px solid',
                          borderColor: isToday
                            ? (closed ? 'error.light' + '44' : 'primary.light' + '44')
                            : 'transparent',
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography
                            variant="body2"
                            fontWeight={isToday ? 700 : 400}
                            color={isToday ? (closed ? 'error.main' : 'primary.main') : 'text.secondary'}
                          >
                            {t(dayKey)}
                          </Typography>
                          {isToday && (
                            <Box sx={{
                              px: 0.75, py: 0.15,
                              borderRadius: '5px',
                              bgcolor: closed ? 'error.main' : 'primary.main',
                              lineHeight: 1,
                            }}>
                              <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'white' }}>
                                {lang === 'ru' ? 'сегодня' : 'bugun'}
                              </Typography>
                            </Box>
                          )}
                        </Stack>
                        <Typography
                          variant="body2"
                          fontWeight={isToday ? 700 : 600}
                          color={closed ? 'error.main' : (isToday ? 'primary.main' : 'text.primary')}
                        >
                          {time}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </motion.div>
            </Grid>

            {/* ── Right: Contact form ───────────────────────────────── */}
            <Grid item xs={12} md={5}>
              <motion.div {...fadeUp} transition={{ duration: 0.4, delay: 0.12 }}>

                {/* Section label */}
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Box sx={{
                    width: 30, height: 30, borderRadius: '9px',
                    bgcolor: 'primary.main' + '14',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'primary.main',
                  }}>
                    <SendIcon sx={{ fontSize: 15 }} />
                  </Box>
                  <Typography variant="h6" fontWeight={700}>
                    {t('contactsPage.formTitle')}
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.75 }}>
                  {t('contactsPage.formSubtitle')}
                </Typography>

                {sent ? (
                  /* ── Success state ─────────────────────────────── */
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                  >
                    <Box
                      sx={{
                        p: { xs: 3.5, md: 4 },
                        borderRadius: 3,
                        textAlign: 'center',
                        border: '1.5px solid',
                        borderColor: 'success.light' + '66',
                        bgcolor: isDark ? 'rgba(16,185,129,0.06)' : '#F0FDF4',
                      }}
                    >
                      <Box sx={{
                        width: 52, height: 52,
                        borderRadius: '16px',
                        bgcolor: '#10B98115',
                        border: '1.5px solid #10B98130',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2.5, color: '#10B981',
                      }}>
                        <CheckCircleIcon sx={{ fontSize: 26 }} />
                      </Box>
                      <Typography variant="h6" fontWeight={800} gutterBottom>
                        {t('contactsPage.formSent')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.75 }}>
                        {t('contactsPage.formSentDesc')}
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={() => { setSent(false); setForm({ name: '', phone: '', message: '' }); }}
                        sx={{ borderRadius: 2.5 }}
                      >
                        {t('contactsPage.formSendAgain')}
                      </Button>
                    </Box>
                  </motion.div>
                ) : (
                  /* ── Form ──────────────────────────────────────── */
                  <Box
                    component="form"
                    onSubmit={handleSubmit}
                    noValidate
                  >
                    <Stack spacing={2.5}>
                      <TextField
                        label={t('contactsPage.formName')}
                        fullWidth
                        required
                        value={form.name}
                        onChange={handleChange('name')}
                        error={!!errors.name}
                        helperText={errors.name
                          ? (lang === 'ru' ? 'Обязательное поле' : 'Majburiy maydon')
                          : ''}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        label={t('contactsPage.formPhone')}
                        fullWidth
                        required
                        placeholder="90 123 45 67"
                        value={form.phone}
                        onChange={handleChange('phone')}
                        inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Chip
                                label="+998"
                                size="small"
                                sx={{
                                  height: 22, fontSize: '0.72rem', fontWeight: 700,
                                  bgcolor: 'rgba(25,118,210,0.10)',
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
                        error={!!errors.phone}
                        helperText={errors.phone
                          ? (lang === 'ru' ? '9 та рақам киритинг' : '9 ta raqam kiriting')
                          : ''}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        label={t('contactsPage.formMessage')}
                        fullWidth
                        multiline
                        rows={4}
                        value={form.message}
                        onChange={handleChange('message')}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />

                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        endIcon={<ArrowForwardIcon />}
                        sx={{
                          py: 1.4,
                          borderRadius: 2.5,
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                          boxShadow: '0 6px 22px rgba(25,118,210,0.36)',
                          position: 'relative', overflow: 'hidden',
                          transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                          '&::before': {
                            content: '""', position: 'absolute', inset: 0,
                            background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                            transform: 'translateX(-100%)',
                            transition: 'transform 0.6s',
                          },
                          '&:hover': {
                            background: 'linear-gradient(135deg, #1251A0 0%, #1565C0 100%)',
                            boxShadow: '0 14px 36px rgba(25,118,210,0.52)',
                            transform: 'translateY(-2px)',
                            '&::before': { transform: 'translateX(100%)' },
                          },
                        }}
                      >
                        {t('contactsPage.formBtn')}
                      </Button>

                      <Typography
                        variant="caption"
                        color="text.disabled"
                        textAlign="center"
                      >
                        {lang === 'ru'
                          ? 'Мы ответим в течение 24 часов'
                          : "Biz 24 soat ichida javob beramiz"}
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </motion.div>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {/* ━━━━━━━━━━━━━━━━ QUICK-CONNECT STRIP ━━━━━━━━━━━━━━━━━━━━━━ */}
      {/*
        Senior UX: give multiple channels so user chooses
        the one they prefer — reduces friction.
      */}
      <Box
        sx={{
          py: { xs: 5, md: 6 },
          bgcolor: 'background.default',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="md">
          <motion.div {...fadeUp}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.2px' }}>
                {lang === 'ru' ? 'Свяжитесь удобным способом' : "Qulay usulda bog'laning"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {lang === 'ru'
                  ? 'Выберите любой канал — мы быстро ответим'
                  : "Istalgan kanal orqali yozing — tez javob beramiz"}
              </Typography>
            </Box>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="center"
            >
              {[
                {
                  label: lang === 'ru' ? 'Позвонить' : 'Qo\'ng\'iroq',
                  href: 'tel:+998505007613',
                  Icon: PhoneIcon,
                  color: '#1976D2',
                },
                {
                  label: 'Telegram',
                  href: 'https://t.me/parvozacademy',
                  Icon: TelegramIcon,
                  color: '#0088CC',
                },
                {
                  label: lang === 'ru' ? 'Написать на почту' : 'Email yozish',
                  href: 'mailto:info@parvoz.uz',
                  Icon: EmailIcon,
                  color: '#EF4444',
                },
              ].map(({ label, href, Icon, color }) => (
                <Button
                  key={label}
                  component={Link}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  variant="outlined"
                  startIcon={<Icon sx={{ fontSize: '18px !important' }} />}
                  sx={{
                    borderRadius: 2.5,
                    px: 3,
                    py: 1.1,
                    borderColor: color + '44',
                    color,
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: color,
                      bgcolor: color + '08',
                    },
                    transition: 'all 0.18s',
                  }}
                >
                  {label}
                </Button>
              ))}
            </Stack>
          </motion.div>
        </Container>
      </Box>

    </Box>
  );
}
