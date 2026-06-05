import {
  Box, Container, Grid, Typography,
  Card, CardContent, Chip, Button, Stack, Divider, useTheme,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useSelector }    from 'react-redux';
import { useNavigate }    from 'react-router-dom';
import { motion }         from 'framer-motion';
import EmojiEventsIcon    from '@mui/icons-material/EmojiEvents';
import GroupsIcon         from '@mui/icons-material/Groups';
import SchoolIcon         from '@mui/icons-material/School';
import LightbulbIcon      from '@mui/icons-material/Lightbulb';
import TrackChangesIcon   from '@mui/icons-material/TrackChanges';
import ArrowForwardIcon   from '@mui/icons-material/ArrowForward';
import PhoneIcon          from '@mui/icons-material/Phone';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import i18n               from '../../../utils/i18n.js';
import PageBanner         from '../../../components/ui/PageBanner.jsx';
import { selectTeam }     from '../../../features/content/contentSlice.js';

/* ── Animation base — NEVER override this object, always spread ── */
const BASE_T = { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] };

const fadeUp = {
  initial:     { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0  },
  viewport:    { once: true, margin: '-40px' },
  transition:  BASE_T,
};

const slideLeft = {
  initial:     { opacity: 0, x: -20 },
  whileInView: { opacity: 1, x: 0   },
  viewport:    { once: true, margin: '-40px' },
  transition:  BASE_T,
};

const scaleFade = {
  initial:     { opacity: 0, scale: 0.95, y: 12 },
  whileInView: { opacity: 1, scale: 1,    y: 0   },
  viewport:    { once: true, margin: '-40px' },
  transition:  BASE_T,
};

/* ── Stats ─────────────────────────────────────────────────────── */
const STATS = [
  { value: '5 000+', labelKey: 'page.about.statGraduates', color: '#1976D2' },
  { value: '95%',    labelKey: 'page.about.statSuccess',   color: '#F59E0B' },
  { value: '15+',    labelKey: 'page.about.statTeachers',  color: '#10B981' },
  { value: '4.9',    labelKey: 'page.about.statRating',    color: '#7C3AED' },
];

/* ── Timeline ──────────────────────────────────────────────────── */
const TIMELINE = [
  {
    year: '2018', color: '#1976D2',
    title: { uz: 'Akademiya tashkil topdi',       ru: 'Основание академии' },
    desc:  { uz: "Toshkentda birinchi o'quv markazi ochildi. 30 ta o'quvchi, 3 ta o'qituvchi.",
             ru: 'Открыт первый учебный центр в Ташкенте. 30 учеников, 3 преподавателя.' },
    badge: { uz: "30 ta o'quvchi",  ru: '30 учеников' },
  },
  {
    year: '2019', color: '#7C3AED',
    title: { uz: "Birinchi 100 o'quvchi",         ru: 'Первые 100 учеников' },
    desc:  { uz: "DTM natijalarida muvaffaqiyatga erishib, 100+ o'quvchi qo'shildi.",
             ru: 'После успешных результатов ЦТ к академии присоединились 100+ учеников.' },
    badge: { uz: "100+ o'quvchi",   ru: '100+ учеников' },
  },
  {
    year: '2020', color: '#10B981',
    title: { uz: 'Onlayn platforma',              ru: 'Онлайн-платформа' },
    desc:  { uz: "Pandemiya davrida onlayn ta'lim joriy qildik. 500+ o'quvchi onlayn o'qidi.",
             ru: 'В период пандемии запустили онлайн-обучение. 500+ учеников перешли онлайн.' },
    badge: { uz: '500+ onlayn',     ru: '500+ онлайн' },
  },
  {
    year: '2022', color: '#F59E0B',
    title: { uz: "Yangi yo'nalishlar",            ru: 'Новые направления' },
    desc:  { uz: "IT, Ingliz tili va Tarix qo'shildi. O'quvchilar soni 1 000+ ga yetdi.",
             ru: 'Добавлены IT, английский, история. Число учеников превысило 1 000.' },
    badge: { uz: "1 000+ o'quvchi", ru: '1 000+ учеников' },
  },
  {
    year: '2023', color: '#EF4444',
    title: { uz: "O'z LMS platformamiz",          ru: 'Собственная LMS-платформа' },
    desc:  { uz: "O'z raqamli platformamizni ishga tushirdik. 3 000+ foydalanuvchi.",
             ru: 'Запустили собственную платформу обучения. 3 000+ пользователей.' },
    badge: { uz: '3 000+ foydalanuvchi', ru: '3 000+ пользователей' },
  },
  {
    year: '2024', color: '#059669',
    title: { uz: "5 000+ o'quvchi",               ru: '5 000+ учеников' },
    desc:  { uz: "O'zbekistondagi eng yirik xususiy ta'lim markazlaridan biriga aylandik.",
             ru: 'Стали одним из крупнейших частных учебных центров Узбекистана.' },
    badge: { uz: "5 000+ o'quvchi", ru: '5 000+ учеников' },
    isLatest: true,
  },
];

/* ═══════════════════════════════════════════════════════════════ */
export default function About() {
  const theme    = useTheme();
  const { t }    = useTranslation();
  const lang     = i18n.language;
  const team     = useSelector(selectTeam);
  const navigate = useNavigate();
  const isDark   = theme.palette.mode === 'dark';
  const bdr      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  return (
    <Box sx={{ mx: { xs: -2, sm: -3 } }}>

      {/* ── Hero ── */}
      <PageBanner
        eyebrow="Parvoz Academy"
        title={t('page.about.title')}
        subtitle={t('page.about.subtitle')}
        color="#4338CA"
        stats={[
          { value: '2018',    label: lang === 'ru' ? 'год основания'    : 'tashkil topgan' },
          { value: '5 000+',  label: lang === 'ru' ? 'студентов'         : "o'quvchi" },
          { value: '15+',     label: lang === 'ru' ? 'преподавателей'    : "o'qituvchi" },
          { value: '95%',     label: lang === 'ru' ? 'успех выпускников' : 'bitiruvchi muvaffaqiyati' },
        ]}
        visual={
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            {[
              { Icon: EmojiEventsIcon, value: '2018',    label: lang === 'ru' ? 'Основана'          : 'Tashkil topgan', color: '#4338CA' },
              { Icon: SchoolIcon,      value: '5 000+',  label: lang === 'ru' ? 'Выпускников'       : "Bitiruvchilar",  color: '#1976D2' },
              { Icon: GroupsIcon,      value: '15+',     label: lang === 'ru' ? 'Преподавателей'    : "O'qituvchilar",  color: '#10B981' },
              { Icon: TrackChangesIcon,value: '95%',     label: lang === 'ru' ? 'Успешных'          : 'Muvaffaqiyatli', color: '#F59E0B' },
            ].map(({ Icon, value, label, color }) => (
              <Box key={label} sx={{
                display: 'flex', flexDirection: 'column',
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
                  mb: 1.25,
                }}>
                  <Icon sx={{ fontSize: 18, color }} />
                </Box>
                <Typography sx={{ fontSize: '1.35rem', fontWeight: 800, color, lineHeight: 1, mb: 0.35 }}>
                  {value}
                </Typography>
                <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', lineHeight: 1.3 }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        }
      />


      {/* ════════════════════════════════════════════════════════
          MISSION & GOAL  —  visual panels with icons
      ════════════════════════════════════════════════════════ */}
      <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">

          <motion.div {...fadeUp}>
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography
                variant="overline" color="primary" fontWeight={700}
                sx={{ letterSpacing: 2, display: 'block', mb: 0.5 }}
              >
                {lang === 'ru' ? 'КТО МЫ' : 'BIZ HAQIMIZDA'}
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                {lang === 'ru' ? 'Ценности и цели академии' : "Akademiya qadriyatlari va maqsadlari"}
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={3}>
            {/* Mission panel */}
            <Grid item xs={12} md={6}>
              <motion.div {...fadeUp} transition={{ ...BASE_T, delay: 0.1 }}>
                <Box sx={{
                  p: { xs: 3, md: 4 }, borderRadius: 4,
                  border: '1px solid #1976D228',
                  background: 'linear-gradient(135deg, #1976D20C 0%, #1565C006 100%)',
                  height: '100%',
                }}>
                  <Box sx={{
                    width: 52, height: 52, borderRadius: '14px',
                    bgcolor: '#1976D218', border: '1.5px solid #1976D230',
                    color: 'primary.main',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mb: 2.5,
                  }}>
                    <LightbulbIcon sx={{ fontSize: 26 }} />
                  </Box>
                  <Typography
                    variant="overline" color="primary" fontWeight={700}
                    sx={{ letterSpacing: 1.5, display: 'block', mb: 1 }}
                  >
                    {t('page.about.mission')}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ mb: 2, letterSpacing: '-0.3px', lineHeight: 1.3 }}>
                    {t('page.about.missionTitle')}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.85 }}>
                    {t('page.about.missionDesc')}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>

            {/* Goal panel */}
            <Grid item xs={12} md={6}>
              <motion.div {...fadeUp} transition={{ ...BASE_T, delay: 0.2 }}>
                <Box sx={{
                  p: { xs: 3, md: 4 }, borderRadius: 4,
                  border: '1px solid #7C3AED28',
                  background: 'linear-gradient(135deg, #7C3AED0C 0%, #6D28D906 100%)',
                  height: '100%',
                }}>
                  <Box sx={{
                    width: 52, height: 52, borderRadius: '14px',
                    bgcolor: '#7C3AED18', border: '1.5px solid #7C3AED30',
                    color: '#7C3AED',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mb: 2.5,
                  }}>
                    <TrackChangesIcon sx={{ fontSize: 26 }} />
                  </Box>
                  <Typography
                    variant="overline" fontWeight={700}
                    sx={{ letterSpacing: 1.5, display: 'block', mb: 1, color: '#7C3AED' }}
                  >
                    {t('page.about.goal')}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ mb: 2, letterSpacing: '-0.3px', lineHeight: 1.3 }}>
                    {t('page.about.goalTitle')}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.85 }}>
                    {t('page.about.goalDesc')}
                  </Typography>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ════════════════════════════════════════════════════════
          TIMELINE  —  year marker slideLeft, content scaleFade
      ════════════════════════════════════════════════════════ */}
      <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: 'background.paper' }}>
        <Container maxWidth="md">

          <motion.div {...fadeUp}>
            <Box sx={{ mb: 6 }}>
              <Typography
                variant="overline" color="primary" fontWeight={700}
                sx={{ letterSpacing: 2, display: 'block', mb: 0.5 }}
              >
                {lang === 'ru' ? 'С 2018 ГОДА' : '2018-YILDAN BERI'}
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                {t('page.about.timeline')}
              </Typography>
            </Box>
          </motion.div>

          {TIMELINE.map(({ year, color, title, desc, badge, isLatest }, i) => {
            const titleText = title[lang] ?? title.uz;
            const descText  = desc[lang]  ?? desc.uz;
            const badgeText = badge[lang]  ?? badge.uz;
            const isLast    = i === TIMELINE.length - 1;
            const delay     = i * 0.08;

            return (
              <Box key={year} sx={{ display: 'flex', gap: { xs: 2, md: 3 } }}>

                {/* ── Left: year marker + connector — slides in from left ── */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <motion.div
                    {...slideLeft}
                    transition={{ ...BASE_T, delay }}
                  >
                    <Box sx={{
                      width: 52, height: 52,
                      borderRadius: '13px',
                      bgcolor: color + '14',
                      border: `2px solid ${color}35`,
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Typography sx={{
                        fontSize: '0.75rem', fontWeight: 900,
                        color, letterSpacing: '-0.5px', lineHeight: 1,
                      }}>
                        {year}
                      </Typography>
                    </Box>
                  </motion.div>

                  {/* Connector line */}
                  {!isLast && (
                    <Box sx={{
                      width: '2px', flex: 1, mt: '6px', minHeight: 32,
                      background: `linear-gradient(180deg, ${color}50 0%, ${TIMELINE[i + 1].color}50 100%)`,
                    }} />
                  )}
                </Box>

                {/* ── Right: content — scales up ── */}
                <Box sx={{ pb: isLast ? 0 : 5, flex: 1 }}>
                  <motion.div
                    {...scaleFade}
                    transition={{ ...BASE_T, delay: delay + 0.07 }}
                  >
                    <Box sx={{ pt: 0.5 }}>
                      {/* Title + latest chip */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.2px', lineHeight: 1.3 }}>
                          {titleText}
                        </Typography>
                        {isLatest && (
                          <Chip
                            label={lang === 'ru' ? 'Сейчас' : 'Hozir'}
                            size="small"
                            sx={{
                              height: 20, fontSize: '0.62rem', fontWeight: 800,
                              bgcolor: color + '18', color,
                              border: `1px solid ${color}35`,
                            }}
                          />
                        )}
                      </Box>

                      {/* Description */}
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75, mb: 1.25 }}>
                        {descText}
                      </Typography>

                      {/* Milestone badge */}
                      <Box sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.6,
                        bgcolor: color + '0E',
                        border: `1px solid ${color}28`,
                        borderRadius: '8px',
                        px: 1.25, py: 0.4,
                      }}>
                        <CheckCircleIcon sx={{ fontSize: 11, color }} />
                        <Typography sx={{ fontSize: '0.71rem', fontWeight: 800, color }}>
                          {badgeText}
                        </Typography>
                      </Box>
                    </Box>
                  </motion.div>
                </Box>
              </Box>
            );
          })}
        </Container>
      </Box>

      {/* ════════════════════════════════════════════════════════
          TEAM PHOTO BANNER  —  responsive picture element
      ════════════════════════════════════════════════════════ */}
      <Box
        component={motion.div}
        {...fadeUp}
        sx={{ position: 'relative', overflow: 'hidden', lineHeight: 0 }}
      >
        {/* Responsive image: desktop / tablet / mobile */}
        <Box
          component="picture"
          sx={{ display: 'block', width: '100%' }}
        >
          {/* Desktop ≥ 900px — landscape */}
          <Box
            component="source"
            media="(min-width: 900px)"
            srcSet="/team-desktop.jpg"
          />
          {/* Tablet 600px–899px */}
          <Box
            component="source"
            media="(min-width: 600px)"
            srcSet="/team-tablet.jpg"
          />
          {/* Mobile < 600px — portrait (fallback) */}
          <Box
            component="img"
            src="/team-mobile.jpg"
            alt={lang === 'ru' ? 'Наша команда — Parvoz Academy' : "Bizning jamoa — Parvoz Academy"}
            sx={{
              display: 'block',
              width: '100%',
              height: { xs: '420px', sm: '520px', md: '480px' },
              objectFit: 'cover',
              objectPosition: 'center top',
            }}
          />
        </Box>

        {/* Top gradient overlay (blends into previous section) */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: '80px',
          background: 'linear-gradient(180deg, var(--mui-palette-background-paper, #fff) 0%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Bottom gradient overlay + caption */}
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(0deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.24) 70%, transparent 100%)',
          px: { xs: 3, md: 6 }, py: { xs: 2.5, md: 3.5 },
          display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 1,
        }}>
          <Box>
            <Typography
              variant="overline"
              sx={{ color: 'rgba(255,255,255,0.55)', letterSpacing: 2.5, display: 'block', mb: 0.25, fontSize: '0.65rem' }}
            >
              {lang === 'ru' ? 'PARVOZ ACADEMY' : 'PARVOZ ACADEMY'}
            </Typography>
            <Typography
              variant="h6" fontWeight={800}
              sx={{ color: 'white', letterSpacing: '-0.3px', lineHeight: 1.2 }}
            >
              {lang === 'ru' ? 'Наша команда' : 'Bizning jamoa'}
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 0.75,
            bgcolor: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.18)',
            backdropFilter: 'blur(8px)',
            borderRadius: '10px', px: 1.5, py: 0.75,
          }}>
            <CameraAltOutlinedIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
              {lang === 'ru' ? 'Ташкент, 2024' : 'Toshkent, 2024'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ════════════════════════════════════════════════════════
          TEAM  —  from Redux, static modest cards (no hover lift)
      ════════════════════════════════════════════════════════ */}
      <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">

          <motion.div {...fadeUp}>
            <Box sx={{ mb: 5 }}>
              <Typography
                variant="overline" color="primary" fontWeight={700}
                sx={{ letterSpacing: 2, display: 'block', mb: 0.5 }}
              >
                {lang === 'ru' ? 'РУКОВОДСТВО' : 'RAHBARIYAT'}
              </Typography>
              <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                {t('page.about.team')}
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={3}>
            {team.map(({ id, name, avatar, color, roleUz, roleRu, bioUz, bioRu }, i) => {
              const roleText = lang === 'ru' ? roleRu : roleUz;
              const bioText  = lang === 'ru' ? bioRu  : bioUz;
              return (
                <Grid item xs={12} sm={6} md={4} key={id}>
                  <motion.div
                    {...fadeUp}
                    transition={{ ...BASE_T, delay: i * 0.1 }}
                    style={{ height: '100%' }}
                  >
                    <Card sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid',
                      borderColor: 'divider',
                      boxShadow: 'none',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}>
                      {/* 4px accent bar */}
                      <Box sx={{
                        height: 4, flexShrink: 0,
                        background: `linear-gradient(90deg, ${color} 0%, ${color}60 100%)`,
                      }} />

                      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                        {/* Initials box */}
                        <Box sx={{
                          width: 52, height: 52, borderRadius: '13px',
                          bgcolor: color + '12',
                          border: `1.5px solid ${color}25`,
                          color, fontWeight: 900, fontSize: '1.3rem',
                          letterSpacing: '-0.5px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          mb: 2, flexShrink: 0,
                        }}>
                          {avatar}
                        </Box>

                        <Typography
                          variant="subtitle1" fontWeight={800}
                          sx={{ letterSpacing: '-0.2px', lineHeight: 1.3, mb: 0.5 }}
                        >
                          {name}
                        </Typography>

                        <Chip
                          label={roleText} size="small"
                          sx={{
                            mb: 2, alignSelf: 'flex-start',
                            bgcolor: color + '10',
                            border: `1px solid ${color}22`,
                            color, fontWeight: 700,
                            fontSize: '0.68rem', height: 22, borderRadius: '6px',
                          }}
                        />

                        <Divider sx={{ mb: 2 }} />

                        <Typography
                          variant="body2" color="text.secondary"
                          sx={{
                            lineHeight: 1.75,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {bioText}
                        </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      {/* ════════════════════════════════════════════════════════
          CTA — premium strip (indigo tint, no gradient)
      ════════════════════════════════════════════════════════ */}
      <Box sx={{
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: isDark ? '#08091e' : '#f3f4ff',
        py: { xs: 6, md: 7 },
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(ellipse 60% 120% at 100% 0%, rgba(67,56,202,0.18) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 60% 120% at 100% 0%, rgba(67,56,202,0.10) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}>
        <Container maxWidth="lg">
          <motion.div {...fadeUp}>
            <Grid container spacing={4} alignItems="center" justifyContent="space-between">
              <Grid item xs={12} md={7}>
                <Chip
                  label={lang === 'ru' ? 'НАЧНИТЕ СЕГОДНЯ' : 'BUGUN BOSHLANG'}
                  size="small"
                  sx={{
                    mb: 2,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    bgcolor: isDark ? 'rgba(67,56,202,0.15)' : 'rgba(67,56,202,0.10)',
                    color: '#4338CA',
                    border: '1.5px solid rgba(67,56,202,0.22)',
                    height: 26,
                  }}
                />
                <Typography
                  variant="h4" fontWeight={800}
                  sx={{ color: 'text.primary', letterSpacing: '-0.5px', lineHeight: 1.25, mb: 1.5 }}
                >
                  {lang === 'ru' ? 'Готовы начать обучение?' : "O'qishni boshlashga tayyormisiz?"}
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.8, maxWidth: 480 }}>
                  {lang === 'ru'
                    ? 'Присоединяйтесь к 5 000+ студентам. Первый урок — бесплатно.'
                    : "5 000+ o'quvchiga qo'shiling. Birinchi dars — bepul."}
                </Typography>
              </Grid>

              <Grid item xs={12} md="auto">
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <Button
                    variant="contained" size="large"
                    onClick={() => navigate('/courses')}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      background: 'linear-gradient(135deg, #3730a3 0%, #4338CA 100%)',
                      color: 'white', fontWeight: 700,
                      borderRadius: 2.5, px: 3.5, py: 1.4,
                      boxShadow: '0 6px 22px rgba(67,56,202,0.36)',
                      position: 'relative', overflow: 'hidden',
                      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                      '&::before': {
                        content: '""', position: 'absolute', inset: 0,
                        background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                        transform: 'translateX(-100%)',
                        transition: 'transform 0.6s',
                      },
                      '&:hover': {
                        background: 'linear-gradient(135deg, #272580 0%, #3730a3 100%)',
                        boxShadow: '0 14px 36px rgba(67,56,202,0.52)',
                        transform: 'translateY(-2px)',
                        '&::before': { transform: 'translateX(100%)' },
                      },
                    }}
                  >
                    {lang === 'ru' ? 'Все курсы' : 'Barcha kurslar'}
                  </Button>
                  <Button
                    variant="outlined" size="large"
                    onClick={() => navigate('/contacts')}
                    startIcon={<PhoneIcon />}
                    sx={{
                      borderColor: 'rgba(67,56,202,0.35)',
                      color: '#4338CA', fontWeight: 600,
                      borderRadius: 2.5, px: 3.5, py: 1.4,
                      '&:hover': {
                        borderColor: 'rgba(67,56,202,0.65)',
                        bgcolor: 'rgba(67,56,202,0.06)',
                      },
                    }}
                  >
                    {lang === 'ru' ? 'Связаться' : "Bog'lanish"}
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
}
