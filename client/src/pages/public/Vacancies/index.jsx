import { useState, useMemo } from 'react';
import {
  Box, Container, Grid, Typography, Card, CardContent,
  Chip, Button, Stack, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, List, ListItem, ListItemIcon,
  ListItemText, IconButton, InputAdornment, useTheme, CircularProgress,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import WorkIcon              from '@mui/icons-material/Work';
import AccessTimeIcon        from '@mui/icons-material/AccessTime';
import MonetizationOnIcon    from '@mui/icons-material/MonetizationOn';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import CloseIcon             from '@mui/icons-material/Close';
import AttachFileIcon        from '@mui/icons-material/AttachFile';
import MenuBookIcon          from '@mui/icons-material/MenuBook';
import BeachAccessIcon       from '@mui/icons-material/BeachAccess';
import LanguageIcon          from '@mui/icons-material/Language';
import SchoolIcon            from '@mui/icons-material/School';
import PeopleIcon            from '@mui/icons-material/People';
import SendIcon              from '@mui/icons-material/Send';
import FunctionsIcon         from '@mui/icons-material/Functions';
import TranslateIcon         from '@mui/icons-material/Translate';
import ComputerIcon          from '@mui/icons-material/Computer';
import CampaignIcon          from '@mui/icons-material/Campaign';
import PhoneIcon             from '@mui/icons-material/Phone';
import PersonIcon            from '@mui/icons-material/Person';
import { formatPrice } from '../../../data/mockData.js';
import PageBanner from '../../../components/ui/PageBanner.jsx';
import i18n from '../../../utils/i18n.js';
import { useTranslation } from 'react-i18next';
import { useGetVacanciesQuery } from '../../../features/vacancies/vacanciesApi.js';

/* ── Animation presets ─────────────────────────────────────────── */
const fadeUp = {
  initial:     { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, margin: '-40px' },
  transition:  { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 20, scale: 0.98 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -10, scale: 0.98,
    transition: { duration: 0.18 } },
};

/* ── Constants ─────────────────────────────────────────────────── */
const TYPE_COLOR  = { 'full-time': '#1976D2', 'part-time': '#10B981' };

/* Subject → icon mapping for vacancy cards */
const SUBJECT_ICON = {
  Matematika: <FunctionsIcon sx={{ fontSize: 22 }} />,
  'Ingliz tili': <TranslateIcon sx={{ fontSize: 22 }} />,
  IT:          <ComputerIcon  sx={{ fontSize: 22 }} />,
  Marketing:   <CampaignIcon  sx={{ fontSize: 22 }} />,
};

/* Benefits — icon + colour + i18n key */
const BENEFITS = [
  { icon: <MonetizationOnIcon sx={{ fontSize: 22 }} />, key: 'page.vacancies.benefit1', color: '#10B981' },
  { icon: <MenuBookIcon       sx={{ fontSize: 22 }} />, key: 'page.vacancies.benefit2', color: '#1976D2' },
  { icon: <BeachAccessIcon    sx={{ fontSize: 22 }} />, key: 'page.vacancies.benefit3', color: '#F59E0B' },
  { icon: <LanguageIcon       sx={{ fontSize: 22 }} />, key: 'page.vacancies.benefit4', color: '#7C3AED' },
  { icon: <SchoolIcon         sx={{ fontSize: 22 }} />, key: 'page.vacancies.benefit5', color: '#EF4444' },
  { icon: <PeopleIcon         sx={{ fontSize: 22 }} />, key: 'page.vacancies.benefit6', color: '#059669' },
];

const LETTER_MAX = 500;
const emptyForm  = { name: '', phone: '', letter: '', fileName: '' };

/* ── VacancyCard component ─────────────────────────────────────── */
function VacancyCard({ vacancy, t, lang, onApply }) {
  const title        = typeof vacancy.title       === 'object' ? (vacancy.title[lang]       ?? vacancy.title.uz)       : vacancy.title;
  const description  = typeof vacancy.description === 'object' ? (vacancy.description[lang] ?? vacancy.description.uz) : vacancy.description;
  const requirements = Array.isArray(vacancy.requirements)
    ? vacancy.requirements
    : typeof vacancy.requirements === 'object' && vacancy.requirements !== null
      ? (vacancy.requirements[lang] ?? vacancy.requirements.uz ?? [])
      : [];
  const subjectUz    = typeof vacancy.subject === 'object' ? vacancy.subject.uz : vacancy.subject;

  const typeColor    = TYPE_COLOR[vacancy.type] ?? '#1976D2';
  const subjectIcon  = SUBJECT_ICON[subjectUz] ?? <WorkIcon sx={{ fontSize: 22 }} />;

  /* Requirements: max 3 + overflow count */
  const visibleReqs  = requirements.slice(0, 3);
  const overflowReqs = requirements.length - 3;

  return (
    <Card sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      border: '1px solid', borderColor: 'divider',
      transition: 'all 0.25s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: `0 14px 36px ${typeColor}28`,
        borderColor: typeColor + '44',
      },
    }}>
      {/* Top accent bar */}
      <Box sx={{
        height: 5, flexShrink: 0,
        background: `linear-gradient(90deg, ${typeColor} 0%, ${typeColor}55 100%)`,
      }} />

      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* ── Header: subject icon box + title + badges ── */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 2.5 }}>
          <Box sx={{
            width: 48, height: 48, flexShrink: 0,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${typeColor}1E 0%, ${typeColor}0A 100%)`,
            border: `1.5px solid ${typeColor}35`,
            color: typeColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {subjectIcon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="subtitle1" fontWeight={800}
              sx={{ lineHeight: 1.3, letterSpacing: '-0.2px', mb: 0.75 }}
            >
              {title}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: '13px !important' }} />}
                label={vacancy.type === 'full-time'
                  ? t('page.vacancies.fullTime')
                  : t('page.vacancies.partTime')}
                size="small"
                sx={{
                  bgcolor: typeColor + '14', color: typeColor,
                  fontWeight: 700, fontSize: '0.68rem', height: 22,
                }}
              />
              {vacancy.isActive && (
                <Chip
                  label={t('page.vacancies.active')} size="small"
                  sx={{
                    bgcolor: '#10B98114', color: '#059669',
                    fontWeight: 700, fontSize: '0.68rem', height: 22,
                    border: '1px solid #10B98130',
                  }}
                />
              )}
            </Stack>
          </Box>
        </Box>

        {/* ── Salary — prominent pill badge ── */}
        <Box sx={{
          display: 'inline-flex', alignItems: 'center', gap: 1,
          bgcolor: '#10B98110',
          border: '1px solid #10B98128',
          borderRadius: '10px',
          px: 1.75, py: 0.9,
          mb: 2.5, alignSelf: 'flex-start',
        }}>
          <MonetizationOnIcon sx={{ fontSize: 16, color: 'success.main' }} />
          <Typography variant="subtitle2" fontWeight={800} color="success.main" sx={{ letterSpacing: '-0.2px' }}>
            {formatPrice(vacancy.salary?.min ?? 0)} – {formatPrice(vacancy.salary?.max ?? 0)}
          </Typography>
          <Typography variant="caption" color="success.dark" sx={{ opacity: 0.8 }}>
            {t('page.vacancies.salaryRange')}
          </Typography>
        </Box>

        {/* ── Description — 2-line clamp ── */}
        <Typography
          variant="body2" color="text.secondary"
          sx={{
            lineHeight: 1.75, mb: 2,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {description}
        </Typography>

        {/* ── Requirements: max 3 + overflow ── */}
        <Typography
          variant="caption" fontWeight={700} color="text.disabled"
          sx={{ textTransform: 'uppercase', letterSpacing: 1, mb: 0.75, display: 'block' }}
        >
          {t('page.vacancies.requirements')}
        </Typography>
        <List dense disablePadding sx={{ mb: 1.5 }}>
          {visibleReqs.map((req) => (
            <ListItem key={req} sx={{ px: 0, py: 0.2 }}>
              <ListItemIcon sx={{ minWidth: 22 }}>
                <CheckCircleIcon sx={{ fontSize: 13, color: 'success.main' }} />
              </ListItemIcon>
              <ListItemText
                primary={req}
                primaryTypographyProps={{ variant: 'body2', sx: { lineHeight: 1.5 } }}
              />
            </ListItem>
          ))}
        </List>
        {overflowReqs > 0 && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`+${overflowReqs} ${lang === 'ru' ? 'ещё' : 'ta yana'}`}
              size="small" variant="outlined"
              sx={{ fontSize: '0.68rem', height: 20, borderRadius: '6px', color: 'text.secondary' }}
            />
          </Box>
        )}

        {/* ── Apply button — coloured ── */}
        <Button
          variant="contained" fullWidth
          sx={{
            mt: 'auto', borderRadius: 2.5, py: 1.15,
            fontWeight: 700, fontSize: '0.875rem',
            bgcolor: typeColor,
            '&:hover': { bgcolor: typeColor + 'DD', boxShadow: `0 6px 18px ${typeColor}44` },
          }}
          startIcon={<SendIcon />}
          onClick={() => onApply({ ...vacancy, title })}
        >
          {t('page.vacancies.btnApply')}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */
export default function Vacancies() {
  const { t }                      = useTranslation();
  const theme                      = useTheme();
  const isDark                     = theme.palette.mode === 'dark';
  const lang                       = i18n.language;
  const [typeFilter, setTypeFilter] = useState('all');
  const [selected, setSelected]    = useState(null);
  const [form, setForm]            = useState(emptyForm);
  const [errors, setErrors]        = useState({});
  const [submitted, setSubmitted]  = useState(false);

  const { data, isLoading } = useGetVacanciesQuery({ limit: 100 });
  const vacancies = data?.data ?? [];

  const activeCount = vacancies.filter((v) => v.isActive).length;

  /* Type filter labels */
  const TYPE_FILTERS = [
    { id: 'all',       label: lang === 'ru' ? 'Все'              : 'Barchasi',    color: '#0369a1' },
    { id: 'full-time', label: t('page.vacancies.fullTime'),                        color: TYPE_COLOR['full-time'] },
    { id: 'part-time', label: t('page.vacancies.partTime'),                        color: TYPE_COLOR['part-time'] },
  ];

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return vacancies;
    return vacancies.filter((v) => v.type === typeFilter);
  }, [vacancies, typeFilter]);

  /* Dialog handlers */
  const handleClose = () => {
    setSelected(null);
    setForm(emptyForm);
    setErrors({});
    setSubmitted(false);
  };

  const handleChange = (field) => (ev) => {
    const val = field === 'phone'
      ? ev.target.value.replace(/\D/g, '').slice(0, 9)
      : field === 'letter' ? ev.target.value.slice(0, LETTER_MAX) : ev.target.value;
    setForm((f) => ({ ...f, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: false }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = true;
    if (form.phone.length !== 9) e.phone = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
  };

  const handleFile = (e) => {
    if (e.target.files[0]) setForm((f) => ({ ...f, fileName: e.target.files[0].name }));
  };

  const handleApply = (vacancy) => {
    setSelected(vacancy);
    setSubmitted(false);
    setForm(emptyForm);
    setErrors({});
  };

  return (
    <Box sx={{ mx: { xs: -2, sm: -3 } }}>
      <PageBanner
        eyebrow="Parvoz Academy"
        title={t('page.vacancies.title')}
        subtitle={t('page.vacancies.subtitle')}
        color="#0369a1"
        stats={[
          { value: `${activeCount}`,                  label: lang === 'ru' ? 'открытых вакансий' : 'ochiq vakansiya' },
          { value: lang === 'ru' ? 'Удалённо'  : 'Remote',          label: lang === 'ru' ? 'формат работы'   : 'ish formati' },
          { value: lang === 'ru' ? 'Стабильно' : 'Barqaror',        label: lang === 'ru' ? 'зарплата'         : 'maosh' },
        ]}
        visual={
          <Stack spacing={1.25}>
            {vacancies.filter((v) => v.isActive).slice(0, 3).map((v) => {
              const title       = typeof v.title    === 'object' ? (v.title[lang === 'ru' ? 'ru' : 'uz']    ?? v.title.uz)    : v.title;
              const typeColor   = TYPE_COLOR[v.type] ?? '#0369a1';
              const typeLabel   = v.type === 'full-time'
                ? (lang === 'ru' ? 'Полная ставка' : 'To\'liq stavka')
                : (lang === 'ru' ? 'Частичная'     : 'Qisman');
              return (
                <Box key={v._id ?? v.id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2, py: 1.5,
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'background.default',
                  border: '1px solid', borderColor: 'divider',
                  borderRadius: '14px',
                  boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                    bgcolor: '#0369a120',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <WorkIcon sx={{ fontSize: 18, color: '#0369a1' }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }} noWrap>
                      {title}
                    </Typography>
                    <Box sx={{
                      display: 'inline-flex', mt: 0.4,
                      bgcolor: `${typeColor}15`, color: typeColor,
                      border: `1px solid ${typeColor}30`,
                      borderRadius: '5px', px: 0.75, py: 0.15,
                      fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.3px',
                    }}>
                      {typeLabel}
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        }
      />

      {/* ════════════════════════════════════════════════════════
          BENEFITS — card grid, NOT plain list
      ════════════════════════════════════════════════════════ */}
      <Box sx={{ bgcolor: 'background.paper', py: { xs: 5, md: 7 }, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <motion.div {...fadeUp}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography
                variant="overline" color="secondary" fontWeight={700}
                sx={{ letterSpacing: 2, display: 'block', mb: 0.5 }}
              >
                {lang === 'ru' ? 'НАШИ ПРЕИМУЩЕСТВА' : 'AFZALLIKLARIMIZ'}
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                {t('page.vacancies.whyWorkWithUs')}
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={2.5}>
            {BENEFITS.map(({ icon, key, color }, idx) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <motion.div {...fadeUp} transition={{ delay: idx * 0.07 }}>
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    p: 2.25,
                    borderRadius: 3,
                    border: '1px solid', borderColor: 'divider',
                    bgcolor: 'background.default',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: color + '06',
                      borderColor: color + '30',
                      transform: 'translateY(-2px)',
                      boxShadow: `0 6px 20px ${color}18`,
                    },
                  }}>
                    {/* Icon box */}
                    <Box sx={{
                      width: 44, height: 44, flexShrink: 0,
                      borderRadius: '11px',
                      bgcolor: color + '14',
                      border: `1.5px solid ${color}28`,
                      color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {icon}
                    </Box>
                    <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.5 }}>
                      {t(key)}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ════════════════════════════════════════════════════════
          VACANCIES GRID
      ════════════════════════════════════════════════════════ */}
      <Box sx={{ py: { xs: 5, md: 8 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">

          {/* Section header */}
          <motion.div {...fadeUp}>
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="overline" color="primary" fontWeight={700}
                sx={{ letterSpacing: 2, display: 'block', mb: 0.5 }}
              >
                {lang === 'ru' ? 'ОТКРЫТЫЕ ПОЗИЦИИ' : 'OCHIQ LAVOZIMLAR'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                  {t('page.vacancies.openPositions')}
                </Typography>
                <Typography
                  variant="h5" fontWeight={700}
                  sx={{
                    background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  ({filtered.length})
                </Typography>
              </Box>
            </Box>
          </motion.div>

          {/* ── Type filter pills ── */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 4 }}>
              {TYPE_FILTERS.map(({ id, label, color }) => {
                const active = typeFilter === id;
                return (
                  <Button
                    key={id}
                    size="small"
                    onClick={() => setTypeFilter(id)}
                    sx={{
                      borderRadius: '20px', px: 2.25, py: 0.6,
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.8rem', textTransform: 'none',
                      border: '1.5px solid',
                      borderColor: active ? color : 'divider',
                      bgcolor: active ? color : 'transparent',
                      color: active ? 'white' : 'text.secondary',
                      transition: 'all 0.18s',
                      '&:hover': {
                        borderColor: color,
                        bgcolor: active ? color + 'DD' : color + '10',
                        color: active ? 'white' : color,
                      },
                    }}
                  >
                    {label}
                    {id !== 'all' && (
                      <Box
                        component="span"
                        sx={{
                          ml: 1, px: 0.75, py: 0.1,
                          borderRadius: '10px', fontSize: '0.68rem',
                          fontWeight: 800, lineHeight: 1.6,
                          bgcolor: active ? 'rgba(255,255,255,0.25)' : color + '18',
                          color: active ? 'white' : color,
                        }}
                      >
                        {vacancies.filter((v) => v.type === id).length}
                      </Box>
                    )}
                  </Button>
                );
              })}
            </Stack>
          </motion.div>

          {/* ── Loading ── */}
          {isLoading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {/* ── Cards with AnimatePresence ── */}
          {!isLoading && (
          <Grid container spacing={3}>
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <Grid item xs={12} key="empty">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <WorkIcon sx={{ fontSize: 48, opacity: 0.25, mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        {lang === 'ru' ? 'Вакансии не найдены' : 'Vakansiyalar topilmadi'}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ) : (
                filtered.map((vacancy, i) => (
                  <Grid item xs={12} sm={6} md={6} key={vacancy._id ?? vacancy.id}>
                    <motion.div
                      key={vacancy._id ?? vacancy.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ delay: i * 0.08 }}
                      style={{ height: '100%' }}
                    >
                      <VacancyCard
                        vacancy={vacancy}
                        t={t}
                        lang={lang}
                        onApply={handleApply}
                      />
                    </motion.div>
                  </Grid>
                ))
              )}
            </AnimatePresence>
          </Grid>
          )}
        </Container>
      </Box>

      {/* ════════════════════════════════════════════════════════
          CTA — open application
      ════════════════════════════════════════════════════════ */}
      <Box sx={{
        bgcolor: isDark ? '#030d16' : '#f0f8ff',
        borderTop: '1px solid', borderColor: isDark ? 'rgba(3,105,161,0.2)' : 'rgba(3,105,161,0.15)',
        py: { xs: 5.5, md: 7 },
      }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center"
            justifyContent="space-between" gap={3}
          >
            <Box>
              <Box component="span" sx={{
                display: 'inline-flex', mb: 1.5,
                border: '1.5px solid rgba(3,105,161,0.35)',
                bgcolor: 'rgba(3,105,161,0.08)',
                color: '#0369a1', borderRadius: '8px',
                px: 1.5, py: 0.5,
                fontSize: '0.67rem', fontWeight: 700,
                letterSpacing: '1.6px', textTransform: 'uppercase',
              }}>
                {`${activeCount} ${lang === 'ru' ? 'открытых вакансий' : 'ochiq vakansiya'}`}
              </Box>
              <Typography fontWeight={800} sx={{ fontSize: { xs: '1.3rem', md: '1.55rem' }, mb: 0.75, color: 'text.primary' }}>
                {t('page.vacancies.noVacancy')}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', maxWidth: 460 }}>
                {t('page.vacancies.noVacancySubtitle')}
              </Typography>
            </Box>
            <Button variant="contained" size="large" startIcon={<SendIcon />}
              onClick={() => handleApply({
                id: 'open',
                title: t('page.vacancies.openApplicationTitle'),
                subject: { uz: 'default', ru: 'default' },
                type: 'full-time',
              })}
              sx={{
                flexShrink: 0,
                background: 'linear-gradient(135deg, #075985 0%, #0369a1 100%)',
                fontWeight: 700, borderRadius: 3, textTransform: 'none',
                px: 3.5, py: 1.4, fontSize: '0.95rem',
                boxShadow: '0 6px 22px rgba(3,105,161,0.36)',
                position: 'relative', overflow: 'hidden',
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                '&::before': {
                  content: '""', position: 'absolute', inset: 0,
                  background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                  transform: 'translateX(-100%)',
                  transition: 'transform 0.6s',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
                  boxShadow: '0 14px 36px rgba(3,105,161,0.52)',
                  transform: 'translateY(-2px)',
                  '&::before': { transform: 'translateX(100%)' },
                },
              }}
            >
              {t('page.vacancies.btnSendCV')}
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* ════════════════════════════════════════════════════════
          APPLY DIALOG
      ════════════════════════════════════════════════════════ */}
      <Dialog
        open={!!selected}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {/* ── Dialog header ── */}
        <DialogTitle sx={{ p: 0 }}>
          <Box sx={{
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            px: 3, pt: 3, pb: 2,
            borderBottom: '1px solid', borderColor: 'divider',
          }}>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.3px' }}>
                {t('page.vacancies.applyTitle')}
              </Typography>
              {selected && (
                <Chip
                  label={selected.title}
                  size="small"
                  sx={{
                    mt: 0.75,
                    bgcolor: (TYPE_COLOR[selected.type] ?? '#6D28D9') + '14',
                    color: TYPE_COLOR[selected.type] ?? '#6D28D9',
                    fontWeight: 700, fontSize: '0.72rem',
                    maxWidth: 280,
                  }}
                />
              )}
            </Box>
            <IconButton onClick={handleClose} size="small" sx={{ mt: -0.5 }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* ── Dialog body ── */}
        <DialogContent sx={{ px: 3, py: 0 }}>
          <AnimatePresence mode="wait">
            {submitted ? (
              /* ── Success state ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Box sx={{ textAlign: 'center', py: 5 }}>
                  <Box sx={{
                    width: 64, height: 64, borderRadius: '16px',
                    bgcolor: '#10B98114', border: '2px solid #10B98128',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mx: 'auto', mb: 2.5,
                  }}>
                    <CheckCircleIcon sx={{ fontSize: 32, color: 'success.main' }} />
                  </Box>
                  <Typography variant="h6" fontWeight={800} color="success.main" gutterBottom>
                    {t('page.vacancies.successTitle')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {t('page.vacancies.successBody')}
                  </Typography>
                  <Button
                    variant="outlined" color="success"
                    sx={{ mt: 3, borderRadius: 2.5, px: 3 }}
                    onClick={handleClose}
                  >
                    {lang === 'ru' ? 'Закрыть' : 'Yopish'}
                  </Button>
                </Box>
              </motion.div>
            ) : (
              /* ── Form ── */
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Box component="form" id="apply-form" onSubmit={handleSubmit}>
                  <Stack spacing={2.5} sx={{ py: 3 }}>
                    {/* Name */}
                    <TextField
                      label={t('page.vacancies.fullName')}
                      fullWidth required
                      value={form.name}
                      onChange={handleChange('name')}
                      error={!!errors.name}
                      helperText={errors.name ? (lang === 'ru' ? 'Укажите ваше имя' : 'Ismingizni kiriting') : ''}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    {/* Phone */}
                    <TextField
                      label={t('page.vacancies.phone')}
                      fullWidth required
                      placeholder="90 123 45 67"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                      error={!!errors.phone}
                      helperText={errors.phone ? (lang === 'ru' ? '9 цифр без +998' : '9 ta raqam kiriting') : ''}
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
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    {/* Cover letter — optional + char count */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                          {t('page.vacancies.whyUs')}
                        </Typography>
                        <Typography variant="caption" color={form.letter.length > LETTER_MAX * 0.9 ? 'warning.main' : 'text.disabled'}>
                          {form.letter.length}/{LETTER_MAX}
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth multiline rows={3}
                        placeholder={t('page.vacancies.aboutYou')}
                        value={form.letter}
                        onChange={handleChange('letter')}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                        {lang === 'ru' ? '* необязательно' : '* ixtiyoriy'}
                      </Typography>
                    </Box>

                    {/* File upload — styled upload zone */}
                    <Box
                      component="label"
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        p: 2, borderRadius: 2,
                        border: '1.5px dashed',
                        borderColor: form.fileName ? 'success.main' : 'divider',
                        bgcolor: form.fileName ? '#10B98108' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: form.fileName ? 'success.main' : 'primary.main',
                          bgcolor: form.fileName ? '#10B98110' : 'primary.main' + '06',
                        },
                      }}
                    >
                      <Box sx={{
                        width: 36, height: 36, borderRadius: '9px',
                        bgcolor: form.fileName ? '#10B98114' : 'action.hover',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        {form.fileName
                          ? <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                          : <AttachFileIcon  sx={{ fontSize: 18, color: 'text.secondary' }} />}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2" fontWeight={600}
                          color={form.fileName ? 'success.main' : 'text.secondary'}
                          noWrap
                        >
                          {form.fileName || t('page.vacancies.uploadCV')}
                        </Typography>
                        {!form.fileName && (
                          <Typography variant="caption" color="text.disabled">
                            PDF, DOC, DOCX
                          </Typography>
                        )}
                      </Box>
                      <input type="file" accept=".pdf,.doc,.docx" hidden onChange={handleFile} />
                    </Box>
                  </Stack>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>

        {/* ── Dialog actions ── */}
        {!submitted && (
          <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
            <Button
              onClick={handleClose}
              sx={{ borderRadius: 2, color: 'text.secondary', fontWeight: 600 }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit" form="apply-form"
              variant="contained"
              sx={{
                borderRadius: 2.5, px: 3.5, fontWeight: 700,
                bgcolor: TYPE_COLOR[selected?.type] ?? '#6D28D9',
                '&:hover': {
                  bgcolor: (TYPE_COLOR[selected?.type] ?? '#6D28D9') + 'DD',
                },
              }}
              startIcon={<SendIcon />}
            >
              {t('page.vacancies.submit')}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
}
