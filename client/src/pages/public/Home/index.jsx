/**
 * Home — Notion × Luxury
 * Senior UI/UX redesign:
 *  - cloud mesh gradient hero (barely perceptible)
 *  - consultation form widget in hero right column (no emoji)
 *  - smooth gradient hover on every card
 *  - generous whitespace, tight typography
 */
import {
  Box, Container, Grid, Typography, Button,
  Avatar, Stack, useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../../../utils/i18n.js';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';

import SchoolIcon          from '@mui/icons-material/School';
import StarIcon            from '@mui/icons-material/Star';
import CheckCircleIcon     from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon    from '@mui/icons-material/ArrowForward';
import ComputerIcon        from '@mui/icons-material/Computer';
import FunctionsIcon       from '@mui/icons-material/Functions';
import HistoryEduIcon      from '@mui/icons-material/HistoryEdu';
import TranslateIcon       from '@mui/icons-material/Translate';
import MenuBookIcon        from '@mui/icons-material/MenuBook';
import LightbulbIcon       from '@mui/icons-material/Lightbulb';
import CardMembershipIcon  from '@mui/icons-material/CardMembership';
import LaptopIcon          from '@mui/icons-material/Laptop';
import PersonAddIcon       from '@mui/icons-material/PersonAdd';
import PlayCircleIcon      from '@mui/icons-material/PlayCircle';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import AccountBalanceIcon  from '@mui/icons-material/AccountBalance';
import PhoneIcon                  from '@mui/icons-material/Phone';
import AccountCircleOutlinedIcon  from '@mui/icons-material/AccountCircleOutlined';
import ScienceIcon        from '@mui/icons-material/Science';
import BrushIcon          from '@mui/icons-material/Brush';
import PsychologyIcon     from '@mui/icons-material/Psychology';
import AutoStoriesIcon    from '@mui/icons-material/AutoStories';

import { selectHomeReviews, selectCourseCustomizations, selectTeachersSection } from '../../../features/content/contentSlice.js';
import { useGetPublicTeachersQuery }          from '../../../features/users/usersApi.js';
import { useGetCoursesQuery }                 from '../../../features/courses/coursesApi.js';
import { getCourseAppearance } from '../../../utils/courseAppearance.js';
import PageHero from '../../../components/ui/PageHero.jsx';

/* ── Animation ──────────────────────────────────────────────────── */
const fadeUp = {
  initial:     { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, margin: '-50px' },
  transition:  { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

/* ── Subject icons & colors ─────────────────────────────────────── */
const SUBJECT_ICON_MAP = {
  math:    FunctionsIcon,
  uzbek:   HistoryEduIcon,
  history: AccountBalanceIcon,
  english: TranslateIcon,
  it:      ComputerIcon,
  russian: MenuBookIcon,
};

/* Palette for courses without a specific subject icon (other) */
const OTHER_ICONS   = [ScienceIcon, BrushIcon, PsychologyIcon, AutoStoriesIcon, LaptopIcon, SchoolIcon, MenuBookIcon, LightbulbIcon];
const OTHER_PALETTE = ['#1976D2','#10B981','#F59E0B','#7C3AED','#EC4899','#EF4444','#06B6D4','#D97706'];

const SUBJECT_COLOR_MAP = {
  math:    '#1976D2',
  uzbek:   '#10B981',
  history: '#F59E0B',
  english: '#7C3AED',
  it:      '#EC4899',
  russian: '#EF4444',
};

/* Icon key → component map (must match admin panel ICON_MAP) */
const HOME_ICON_MAP = {
  science:     ScienceIcon,
  brush:       BrushIcon,
  psychology:  PsychologyIcon,
  autoStories: AutoStoriesIcon,
  laptop:      LaptopIcon,
  school:      SchoolIcon,
  menuBook:    MenuBookIcon,
  lightbulb:   LightbulbIcon,
  functions:   FunctionsIcon,
  historyEdu:  HistoryEduIcon,
  translate:   TranslateIcon,
  computer:    ComputerIcon,
  balance:     AccountBalanceIcon,
};

/* ── Design tokens (module-level) ───────────────────────────────── */
const P  = '#2563eb';
const P2 = '#7c3aed';

/* ── Teacher card color palette ─────────────────────────────────── */
const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

/* ── Trust keys (module-level, shared) ──────────────────────────── */
const TRUST_KEYS = ['home.trust1', 'home.trust2', 'home.trust3'];

/* ── Eyebrow ────────────────────────────────────────────────────── */
function Eyebrow({ text, color = P }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75, mb: 1.75 }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography sx={{
        fontSize: '0.7rem', fontWeight: 700,
        letterSpacing: '0.11em', textTransform: 'uppercase',
        color: 'text.secondary',
      }}>
        {text}
      </Typography>
    </Box>
  );
}

/* ── Consultation form widget ───────────────────────────────────── */
function ConsultHeroForm({ t, lang }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const bdr    = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.07)';

  const [form, setForm] = useState({ name: '', phone: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (form.name.trim() && form.phone.trim()) {
      setSent(true);
      setForm({ name: '', phone: '' });
    }
  };

  return (
    <Box sx={{
      position: 'relative',
      maxWidth: 490,
      mx: { xs: 'auto', md: 0 },
      ml: { md: 'auto' },
    }}>
      {/* ── Card — premium glassmorphism ─────────────────────────── */}
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        sx={{
          position: 'relative', zIndex: 1,
          borderRadius: '28px',
          bgcolor: isDark ? 'rgba(16,20,44,0.92)' : 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: isDark
            ? '1px solid rgba(255,255,255,0.14)'
            : '1px solid rgba(255,255,255,0.95)',
          boxShadow: isDark
            ? '0 32px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10)'
            : '0 24px 72px rgba(37,99,235,0.16), 0 8px 28px rgba(124,58,237,0.09), inset 0 1px 0 rgba(255,255,255,1)',
          overflow: 'hidden',
          p: { xs: 3.5, md: 4.5 },
        }}
      >
        {/* ── Иконка + заголовок ─────────────────────────────────── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Box sx={{
            width: 58, height: 58, borderRadius: '18px', flexShrink: 0,
            background: `linear-gradient(135deg, ${P} 0%, ${P2} 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 10px 26px rgba(37,99,235,0.38)`,
          }}>
            <SchoolIcon sx={{ fontSize: 27, color: 'white' }} />
          </Box>
          <Box>
            <Typography sx={{
              fontWeight: 800, fontSize: '1.2rem',
              lineHeight: 1.2, color: 'text.primary', letterSpacing: '-0.2px',
            }}>
              {t('home.consultSectionTitle')}
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', mt: 0.35 }}>
              {t('home.consultFree')}
            </Typography>
          </Box>
        </Box>

        {/* ── Форма или success ──────────────────────────────────── */}
        {sent ? (
          <Box sx={{ textAlign: 'center', py: 3.5 }}>
            <Box sx={{
              width: 60, height: 60, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2.5,
              boxShadow: '0 12px 30px rgba(16,185,129,0.32)',
            }}>
              <CheckCircleIcon sx={{ fontSize: 30, color: 'white' }} />
            </Box>
            <Typography fontWeight={800} sx={{ mb: 0.75, fontSize: '1.05rem', color: 'text.primary' }}>
              {t('home.consultThanks')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
              {t('home.consultThanksDesc')}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.4}>
            {/* Имя */}
            <Box sx={{ position: 'relative' }}>
              <Box sx={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'text.disabled', pointerEvents: 'none', display: 'flex',
              }}>
                <AccountCircleOutlinedIcon sx={{ fontSize: 17 }} />
              </Box>
              <Box component="input"
                placeholder={t('home.consultName')}
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                sx={{
                  width: '100%', pl: '44px', pr: '16px', py: '15px',
                  borderRadius: '13px',
                  border: `1.5px solid ${bdr}`,
                  bgcolor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(241,245,255,0.80)',
                  color: isDark ? 'rgba(255,255,255,0.92)' : 'text.primary',
                  fontSize: '0.88rem',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  '&::placeholder': { color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.35)', opacity: 1 },
                  '&:focus': {
                    borderColor: P,
                    bgcolor: isDark ? 'rgba(37,99,235,0.12)' : '#fff',
                    boxShadow: isDark ? `0 0 0 3px rgba(37,99,235,0.30)` : `0 0 0 3.5px ${P}1a`,
                  },
                }}
              />
            </Box>

            {/* Телефон */}
            <Box sx={{ position: 'relative' }}>
              <Box sx={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                color: 'text.disabled', pointerEvents: 'none', display: 'flex',
              }}>
                <PhoneIcon sx={{ fontSize: 16 }} />
              </Box>
              <Box component="input"
                placeholder={t('home.consultPhone')}
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                sx={{
                  width: '100%', pl: '44px', pr: '16px', py: '15px',
                  borderRadius: '13px',
                  border: `1.5px solid ${bdr}`,
                  bgcolor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(241,245,255,0.80)',
                  color: isDark ? 'rgba(255,255,255,0.92)' : 'text.primary',
                  fontSize: '0.88rem',
                  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
                  transition: 'all 0.2s',
                  '&::placeholder': { color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.35)', opacity: 1 },
                  '&:focus': {
                    borderColor: P,
                    bgcolor: isDark ? 'rgba(37,99,235,0.12)' : '#fff',
                    boxShadow: isDark ? `0 0 0 3px rgba(37,99,235,0.30)` : `0 0 0 3.5px ${P}1a`,
                  },
                }}
              />
            </Box>

            {/* Кнопка — solid gradient */}
            <Button fullWidth size="large"
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.phone.trim()}
              endIcon={<ArrowForwardIcon />}
              sx={{
                py: 1.65, borderRadius: '13px',
                fontWeight: 700, fontSize: '0.96rem', textTransform: 'none',
                background: `linear-gradient(135deg, ${P} 0%, ${P2} 100%)`,
                color: 'white', border: 'none',
                boxShadow: `0 8px 24px rgba(37,99,235,0.38)`,
                transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                '&:hover': {
                  background: `linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)`,
                  boxShadow: `0 12px 32px rgba(37,99,235,0.52)`,
                  transform: 'translateY(-2px)',
                },
                '&.Mui-disabled': {
                  background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                  color: 'text.disabled', boxShadow: 'none',
                },
              }}
            >
              {t('home.consultBtn')}
            </Button>
          </Stack>
        )}

        {/* ── Соц. доказательство — аватары + счётчик ───────────── */}
        {!sent && (
          <Box sx={{
            mt: 2.75, pt: 2.25,
            borderTop: `1px solid ${bdr}`,
            display: 'flex', alignItems: 'center', gap: 1.5,
          }}>
            <Stack direction="row" sx={{ '& > *:not(:first-of-type)': { ml: '-8px' } }}>
              {['#2563eb','#7c3aed','#10b981','#f59e0b'].map((c, i) => (
                <Avatar key={i} sx={{
                  width: 28, height: 28, bgcolor: c,
                  fontSize: '0.62rem', fontWeight: 800,
                  border: `2px solid ${isDark ? '#10142c' : '#fff'}`,
                }}>
                  {['А','М','Д','К'][i]}
                </Avatar>
              ))}
            </Stack>
            <Typography sx={{ fontSize: '0.76rem', color: 'text.secondary', lineHeight: 1.35 }}>
              <Box component="span" sx={{ fontWeight: 700, color: P }}>5 000+</Box>
              {' '}{t('home.consultStudents')}
            </Typography>
          </Box>
        )}
      </Box>

    </Box>
  );
}

/* ════════════════════════════════════════════════════════════════ */
export default function Home() {
  const theme    = useTheme();
  const navigate = useNavigate();
  const { t }   = useTranslation();
  const isDark   = theme.palette.mode === 'dark';
  const lang     = i18n.language === 'ru' ? 'ru' : 'uz';
  const reviews         = useSelector(selectHomeReviews);
  const courseCustoms   = useSelector(selectCourseCustomizations);
  const teachersSection = useSelector(selectTeachersSection);

  /* ── Public teachers for preview section ───────────────────────── */
  const { data: teachersData } = useGetPublicTeachersQuery();
  const teachers = teachersData?.data ?? [];

  /* ── Courses ────────────────────────────────────────────────────── */
  const { data: coursesRes } = useGetCoursesQuery({ limit: 500 });
  const allCourses    = coursesRes?.data ?? [];
  /* Active+published only (admin JWT returns all, so filter on client) */
  /* Only active+published courses for public sections */
  const publicCourses = useMemo(
    () => allCourses.filter((c) => c.isActive && c.isPublished),
    [allCourses]
  );

  /* Real stats */
  const totalCourses  = publicCourses.length;
  const totalTeachers = teachers.length;
  // Sum up students across teachers (each teacher has totalStudents field)
  const totalStudents = teachers.reduce((acc, tc) => acc + (tc.totalStudents ?? 0), 0);

  /* ── Design tokens ─────────────────────────────────────────── */
  const bdr = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';

  /* Smooth gradient hover — shared across all cards */
  const hoverCard = {
    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: isDark
        ? '0 16px 48px rgba(0,0,0,0.35)'
        : '0 16px 48px rgba(37,99,235,0.08)',
      borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(37,99,235,0.18)',
      background: isDark
        ? 'linear-gradient(145deg, rgba(37,99,235,0.06) 0%, rgba(124,58,237,0.04) 100%)'
        : 'linear-gradient(145deg, rgba(37,99,235,0.025) 0%, rgba(124,58,237,0.015) 100%)',
    },
  };

  const STATS = [
    { value: totalStudents > 0 ? `${totalStudents.toLocaleString()}+` : '500+',  labelKey: 'home.stat1', color: P        },
    { value: totalCourses  > 0 ? `${totalCourses}+`                  : '10+',   labelKey: 'home.stat2', color: P2       },
    { value: totalTeachers > 0 ? `${totalTeachers}+`                 : '5+',    labelKey: 'home.stat3', color: '#10b981' },
    { value: '5+',                                                               labelKey: 'home.stat4', color: '#f59e0b' },
  ];

  const BENEFITS = [
    { titleKey: 'home.b1Title', descKey: 'home.b1Desc', Icon: SchoolIcon,         color: P        },
    { titleKey: 'home.b2Title', descKey: 'home.b2Desc', Icon: LightbulbIcon,      color: '#f59e0b' },
    { titleKey: 'home.b3Title', descKey: 'home.b3Desc', Icon: CardMembershipIcon, color: P2       },
    { titleKey: 'home.b4Title', descKey: 'home.b4Desc', Icon: LaptopIcon,         color: '#10b981' },
  ];

  const HOW_STEPS = [
    { num: '01', Icon: PersonAddIcon,        titleKey: 'home.how1Title', descKey: 'home.how1Desc', color: P        },
    { num: '02', Icon: PlayCircleIcon,       titleKey: 'home.how2Title', descKey: 'home.how2Desc', color: P2       },
    { num: '03', Icon: WorkspacePremiumIcon, titleKey: 'home.how3Title', descKey: 'home.how3Desc', color: '#10b981' },
  ];

  /* ── Hero background — premium aurora mesh ──────────────────
     Light mode: rich 4-stop gradient with subtle warm accent
     Dark mode:  deep midnight base with brand glow + starfield */
  const heroBg = isDark
    ? 'linear-gradient(135deg, #070a18 0%, #0c0f24 45%, #0f0a26 100%)'
    : 'linear-gradient(135deg, #c5d9ff 0%, #d4c5fe 35%, #e8c5f5 70%, #ffd5e0 100%)';

  /* Twinkling stars positions — deterministic so they stay put */
  const STARS = [
    { top: '12%', left: '18%', size: 2, delay: '0s'   },
    { top: '20%', left: '72%', size: 3, delay: '1.2s' },
    { top: '32%', left: '8%',  size: 2, delay: '0.5s' },
    { top: '45%', left: '88%', size: 2, delay: '2s'   },
    { top: '58%', left: '24%', size: 3, delay: '1.5s' },
    { top: '15%', left: '52%', size: 2, delay: '2.8s' },
    { top: '68%', left: '78%', size: 2, delay: '0.8s' },
    { top: '78%', left: '14%', size: 2, delay: '2.2s' },
    { top: '38%', left: '64%', size: 2, delay: '3.2s' },
    { top: '82%', left: '48%', size: 3, delay: '1.8s' },
  ];

  /* Floating feature pills — premium credibility */
  const FEATURE_PILLS = lang === 'ru'
    ? ['🎓 Лицензия Минобразования', '🏆 #1 в Узбекистане', '⚡ 5000+ выпускников']
    : ['🎓 Litsenziyalangan', '🏆 #1 O\'zbekistonda', '⚡ 5000+ bitiruvchilar'];

  return (
    <Box sx={{ mx: { xs: -2, sm: -3 } }}>

      {/* ══════════════════════════ HERO ════════════════════════ */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        minHeight: { xs: '100dvh', md: '88vh' },
        pb: { xs: 0, md: '80px' },
        display: 'flex', alignItems: 'center',
        background: heroBg,
        isolation: 'isolate',

        /* ── Keyframes — aurora drift + star twinkle + pulse ── */
        '@keyframes auroraDrift': {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%':      { transform: 'translate(28px,-22px) scale(1.04)' },
        },
        '@keyframes auroraDrift2': {
          '0%, 100%': { transform: 'translate(0,0) scale(1)' },
          '50%':      { transform: 'translate(-22px,18px) scale(1.06)' },
        },
        '@keyframes twinkle': {
          '0%, 100%': { opacity: 0.25, transform: 'scale(1)' },
          '50%':      { opacity: 1,    transform: 'scale(1.4)' },
        },
        '@keyframes livePulse': {
          '0%, 100%': { transform: 'scale(1)',   boxShadow: '0 0 0 0   rgba(16,185,129,0.55)' },
          '70%':      { transform: 'scale(1.1)', boxShadow: '0 0 0 10px rgba(16,185,129,0)' },
        },

        /* grain */
        '&::before': {
          content: '""',
          position: 'absolute', inset: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.72\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.04\'/%3E%3C/svg%3E")',
          backgroundRepeat: 'repeat', backgroundSize: '200px 200px',
          pointerEvents: 'none', zIndex: 0,
          opacity: isDark ? 0.26 : 0.08,
          mixBlendMode: isDark ? 'screen' : 'multiply',
        },
        /* bottom fade */
        '&::after': {
          content: '""',
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: '120px',
          background: isDark
            ? 'linear-gradient(to bottom, transparent, #070a18)'
            : 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.92))',
          pointerEvents: 'none', zIndex: 0,
        },
      }}>

        {/* ── Top accent gradient line — premium framing ─────── */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: isDark
            ? 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.45) 25%, rgba(236,72,153,0.45) 75%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.45) 25%, rgba(124,58,237,0.45) 75%, transparent 100%)',
          zIndex: 1, pointerEvents: 'none',
        }} />

        {/* ── Aurora blob 1 — top-left ─────────────────────── */}
        <Box sx={{
          position: 'absolute', top: '-8%', left: '-6%',
          width: { xs: 540, md: 700 }, height: { xs: 540, md: 700 },
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(37,99,235,0.65) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(37,99,235,0.92) 0%, transparent 65%)',
          filter: 'blur(110px)',
          animation: 'auroraDrift 18s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── Aurora blob 2 — bottom-right ─────────────────── */}
        <Box sx={{
          position: 'absolute', bottom: '-8%', right: '-6%',
          width: { xs: 500, md: 660 }, height: { xs: 500, md: 660 },
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(124,58,237,0.55) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(124,58,237,0.90) 0%, transparent 65%)',
          filter: 'blur(110px)',
          animation: 'auroraDrift2 22s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── Center fill blob — fixes empty-center ─────────── */}
        <Box sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: 520, md: 760 }, height: { xs: 260, md: 360 },
          borderRadius: '50%',
          background: isDark
            ? 'radial-gradient(circle, rgba(37,99,235,0.28) 0%, transparent 65%)'
            : 'radial-gradient(circle, rgba(37,99,235,0.38) 0%, transparent 65%)',
          filter: 'blur(100px)',
          animation: 'auroraDrift 16s ease-in-out infinite reverse',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── Top inner highlight — "lit from above" ─────────── */}
        <Box sx={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '42%',
          background: isDark
            ? 'linear-gradient(to bottom, rgba(255,255,255,0.06) 0%, transparent 100%)'
            : 'linear-gradient(to bottom, rgba(255,255,255,0.30) 0%, transparent 100%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* ── Diagonal light streak ──────────────────────────── */}
        <Box sx={{
          position: 'absolute', top: '-60%', left: '20%',
          width: '45%', height: '220%',
          background: isDark
            ? 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)'
            : 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.16) 50%, transparent 60%)',
          transform: 'rotate(14deg)',
          pointerEvents: 'none', zIndex: 0,
        }} />


        {/* ── Twinkling starfield — премиум эффект ───────────── */}
        {STARS.map((s, i) => (
          <Box key={i} sx={{
            position: 'absolute',
            top: s.top, left: s.left,
            width: s.size, height: s.size,
            borderRadius: '50%',
            bgcolor: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(37,99,235,0.55)',
            boxShadow: isDark
              ? `0 0 ${s.size * 3}px rgba(255,255,255,0.7)`
              : `0 0 ${s.size * 3}px rgba(37,99,235,0.45)`,
            animation: `twinkle 3.5s ease-in-out ${s.delay} infinite`,
            pointerEvents: 'none', zIndex: 0,
          }} />
        ))}

        {/* ── Constellation: connecting lines (SVG) ──────────── */}
        <Box component="svg" viewBox="0 0 100 100" preserveAspectRatio="none" sx={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 0,
          opacity: isDark ? 0.18 : 0.14,
        }}>
          <line x1="18" y1="12" x2="52" y2="15"   stroke="currentColor" strokeWidth="0.08"
                style={{ color: isDark ? '#a5b4fc' : '#6366f1' }} />
          <line x1="52" y1="15" x2="72" y2="20"   stroke="currentColor" strokeWidth="0.08"
                style={{ color: isDark ? '#a5b4fc' : '#6366f1' }} />
          <line x1="8"  y1="32" x2="24" y2="58"   stroke="currentColor" strokeWidth="0.08"
                style={{ color: isDark ? '#c4b5fd' : '#7c3aed' }} />
          <line x1="64" y1="38" x2="88" y2="45"   stroke="currentColor" strokeWidth="0.08"
                style={{ color: isDark ? '#a5b4fc' : '#6366f1' }} />
          <line x1="78" y1="68" x2="48" y2="82"   stroke="currentColor" strokeWidth="0.08"
                style={{ color: isDark ? '#c4b5fd' : '#7c3aed' }} />
          <line x1="14" y1="78" x2="48" y2="82"   stroke="currentColor" strokeWidth="0.08"
                style={{ color: isDark ? '#c4b5fd' : '#7c3aed' }} />
        </Box>


        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: { xs: 3, md: 5 }, pb: { xs: 10, md: 14 } }}>
          <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">

            {/* ── Left col ─────────────────────────────────────── */}
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Live badge — animated pulse + real-time count */}
                <Box sx={{
                  display: 'inline-flex', alignItems: 'center', gap: 1.1,
                  px: 2, py: 0.85, mb: 3, borderRadius: '100px',
                  bgcolor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.68)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.95)'}`,
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  boxShadow: isDark
                    ? '0 4px 18px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.10)'
                    : '0 4px 18px rgba(37,99,235,0.08), inset 0 1px 0 rgba(255,255,255,1)',
                }}>
                  <Box sx={{
                    width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981',
                    flexShrink: 0,
                    animation: 'livePulse 2s ease-out infinite',
                  }} />
                  <Typography sx={{
                    fontSize: '0.74rem', fontWeight: 700,
                    letterSpacing: '0.04em',
                    color: isDark ? 'rgba(255,255,255,0.92)' : 'rgba(30,30,80,0.85)',
                  }}>
                    {t('home.heroBadge')}
                  </Typography>
                  <Box sx={{ width: '1px', height: 12, bgcolor: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)' }} />
                  <Typography sx={{
                    fontSize: '0.72rem', fontWeight: 600,
                    color: isDark ? 'rgba(255,255,255,0.70)' : 'rgba(30,30,80,0.65)',
                  }}>
                    {lang === 'ru' ? '247 онлайн' : "247 onlayn"}
                  </Typography>
                </Box>

                {/* Floating feature pills — premium credibility */}
                <Stack direction="row" flexWrap="wrap" gap={0.85} sx={{ mb: 3 }}>
                  {FEATURE_PILLS.map((pill) => (
                    <Box key={pill} sx={{
                      display: 'inline-flex', alignItems: 'center',
                      px: 1.35, py: 0.4, borderRadius: '8px',
                      fontSize: '0.7rem', fontWeight: 600,
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
                      color: isDark ? 'rgba(255,255,255,0.78)' : 'rgba(30,30,80,0.72)',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.95)'}`,
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                    }}>
                      {pill}
                    </Box>
                  ))}
                </Stack>

                {/* H1 — multi-color premium gradient highlights */}
                <Typography
                  component="h1"
                  sx={{
                    fontWeight: 800, lineHeight: 1.08,
                    letterSpacing: { xs: '-0.5px', md: '-1.8px' },
                    fontSize: { xs: '2.4rem', sm: '3rem', md: '3.85rem' },
                    color: isDark ? 'white' : 'text.primary',
                    mb: 2.5,
                    textShadow: isDark ? '0 2px 14px rgba(0,0,0,0.25)' : 'none',
                  }}
                >
                  {t('home.heroTitle1')}{' '}
                  <Box component="span" sx={{
                    background: isDark
                      ? 'linear-gradient(120deg, #fb923c 0%, #f97316 50%, #ec4899 100%)'
                      : 'linear-gradient(120deg, #ea580c 0%, #f97316 50%, #db2777 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}>
                    {t('home.heroHighlight')}
                  </Box>
                  {t('home.heroTitle2') ? <> {t('home.heroTitle2')}</> : null}
                </Typography>

                {/* Subtitle */}
                <Typography sx={{
                  color: isDark ? 'rgba(255,255,255,0.74)' : 'text.secondary',
                  mb: 4, lineHeight: 1.75, fontWeight: 400,
                  fontSize: { xs: '1rem', md: '1.08rem' },
                  maxWidth: 500,
                }}>
                  {t('home.heroSubtitle')}
                </Typography>

                {/* CTA cluster — primary + secondary */}
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  sx={{ mb: 4 }}
                >
                  <Button
                    size="large"
                    onClick={() => navigate('/courses')}
                    endIcon={<ArrowForwardIcon />}
                    sx={{
                      background: `linear-gradient(135deg, ${P} 0%, ${P2} 100%)`,
                      color: 'white', fontWeight: 700,
                      fontSize: '0.95rem', px: 4, py: 1.5,
                      borderRadius: '12px', textTransform: 'none',
                      boxShadow: `0 10px 32px rgba(37,99,235,0.42)`,
                      transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""', position: 'absolute', inset: 0,
                        background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                        transform: 'translateX(-100%)',
                        transition: 'transform 0.6s',
                      },
                      '&:hover': {
                        background: `linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)`,
                        boxShadow: `0 16px 42px rgba(37,99,235,0.55)`,
                        transform: 'translateY(-2px)',
                        '&::before': { transform: 'translateX(100%)' },
                      },
                    }}
                  >
                    {t('home.btnCourses')}
                  </Button>

                  <Button
                    size="large"
                    onClick={() => navigate('/online-tests')}
                    startIcon={<PlayCircleIcon />}
                    sx={{
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.55)',
                      color: isDark ? 'rgba(255,255,255,0.92)' : 'text.primary',
                      fontWeight: 700, fontSize: '0.93rem', px: 3.25, py: 1.5,
                      borderRadius: '12px', textTransform: 'none',
                      border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)'}`,
                      backdropFilter: 'blur(14px)',
                      WebkitBackdropFilter: 'blur(14px)',
                      transition: 'all 0.22s',
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.85)',
                        borderColor: isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.18)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    {lang === 'ru' ? 'Тест уровня' : 'Bilim sinovi'}
                  </Button>
                </Stack>

                {/* Social proof — avatar stack + rating */}
                <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" rowGap={2}>
                  <Stack direction="row" alignItems="center" spacing={1.2}>
                    <Stack direction="row" sx={{ '& > *:not(:first-of-type)': { ml: '-10px' } }}>
                      {[
                        { c: '#2563eb', l: 'А' },
                        { c: '#7c3aed', l: 'М' },
                        { c: '#10b981', l: 'Д' },
                        { c: '#f59e0b', l: 'К' },
                        { c: '#ec4899', l: 'Н' },
                      ].map(({ c, l }, i) => (
                        <Avatar key={i} sx={{
                          width: 34, height: 34, bgcolor: c,
                          fontSize: '0.72rem', fontWeight: 800, color: 'white',
                          border: `2.5px solid ${isDark ? '#0c0f24' : 'white'}`,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                        }}>{l}</Avatar>
                      ))}
                    </Stack>
                    <Box>
                      <Stack direction="row" alignItems="center" spacing={0.3}>
                        {[1,2,3,4,5].map(s => (
                          <StarIcon key={s} sx={{
                            fontSize: 13,
                            color: '#f59e0b',
                            filter: 'drop-shadow(0 0 4px rgba(245,158,11,0.45))',
                          }} />
                        ))}
                        <Typography sx={{
                          ml: 0.6, fontSize: '0.78rem', fontWeight: 700,
                          color: isDark ? 'white' : 'text.primary',
                        }}>4.9</Typography>
                      </Stack>
                      <Typography sx={{
                        fontSize: '0.72rem', fontWeight: 500,
                        color: isDark ? 'rgba(255,255,255,0.62)' : 'text.secondary',
                      }}>
                        {t('home.graduatesCount')}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Divider */}
                  <Box sx={{
                    width: '1px', height: 36,
                    bgcolor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.10)',
                    display: { xs: 'none', sm: 'block' },
                  }} />

                  {/* Trust check */}
                  <Stack direction="column" spacing={0.3}>
                    <Stack direction="row" alignItems="center" spacing={0.6}>
                      <CheckCircleIcon sx={{
                        fontSize: 15,
                        color: isDark ? '#34d399' : '#059669',
                      }} />
                      <Typography sx={{
                        fontSize: '0.78rem', fontWeight: 700,
                        color: isDark ? 'white' : 'text.primary',
                      }}>
                        {t('home.guarantee')}
                      </Typography>
                    </Stack>
                    <Typography sx={{
                      fontSize: '0.7rem', fontWeight: 500,
                      color: isDark ? 'rgba(255,255,255,0.60)' : 'text.secondary',
                    }}>
                      {t('home.guaranteeSub')}
                    </Typography>
                  </Stack>
                </Stack>
              </motion.div>
            </Grid>

            {/* ── Right col: consultation form ──────────────────── */}
            <Grid item xs={12} md={6}>
              <ConsultHeroForm t={t} lang={lang} />
            </Grid>

          </Grid>
        </Container>
      </Box>
      {/* ═══════════════════════════════════════════════════════ */}


      {/* ══════════════════════════ STATS ═══════════════════════ */}
      <Box sx={{
        position: 'relative', zIndex: 2,
        bgcolor: 'background.paper',
        mt: { xs: 0, md: '-64px' },
        borderRadius: { xs: 0, md: '28px 28px 0 0' },
        boxShadow: { md: isDark
          ? '0 -12px 48px rgba(0,0,0,0.35)'
          : '0 -12px 48px rgba(37,99,235,0.10)' },
        borderBottom: `1px solid ${bdr}`,
      }}>
        <Container maxWidth="lg">
          <Grid container>
            {STATS.map((s, i) => (
              <Grid item xs={6} md={3} key={s.labelKey}>
                <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.07 }}>
                  <Box sx={{
                    textAlign: 'center',
                    py: { xs: 4.5, md: 5.5 }, px: 2,
                    position: 'relative',
                    '&::after': i < 3 ? {
                      content: '""', position: 'absolute',
                      right: 0, top: '22%', bottom: '22%',
                      width: '1px', bgcolor: bdr,
                    } : {},
                    borderBottom: { xs: i < 2 ? `1px solid ${bdr}` : 'none', md: 'none' },
                  }}>
                    <Typography sx={{
                      fontSize: { xs: '2.2rem', md: '2.85rem' },
                      fontWeight: 800, lineHeight: 1, mb: 0.75,
                      whiteSpace: 'nowrap',
                      background: `linear-gradient(135deg, ${s.color} 10%, ${s.color}bb 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      {s.value}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', fontWeight: 400 }}>
                      {t(s.labelKey)}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      {/* ═══════════════════════════════════════════════════════ */}


      {/* ══════════════════════════ SUBJECTS ════════════════════ */}
      <Box sx={{ py: { xs: 9, md: 12 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <motion.div {...fadeUp}>
            <Box sx={{ textAlign: 'center', mb: 7 }}>
              <Eyebrow text={t('home.subjectsEyebrow')} />
              <Typography variant="h3" fontWeight={800}
                sx={{ letterSpacing: '-0.5px', mb: 1.5, lineHeight: 1.15 }}>
                {t('home.subjectsTitle')}
              </Typography>
              <Typography color="text.secondary"
                sx={{ maxWidth: 440, mx: 'auto', lineHeight: 1.8, fontSize: '0.975rem' }}>
                {t('home.subjectsSubtitle')}
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={1.5}>
            {publicCourses.map((course, i) => {
              const title  = course.title?.[lang] || course.title?.ru || course.title?.uz || '—';
              const { color, iconKey } = getCourseAppearance(course, courseCustoms);
              const Icon = HOME_ICON_MAP[iconKey] ?? MenuBookIcon;
              return (
                <Grid item xs={12} sm={6} md={4} key={course._id}>
                  <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.05 }}>
                    <Box
                      onClick={() => navigate(`/courses/${course._id}`)}
                      sx={{
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 2,
                        p: '14px 18px',
                        borderRadius: '12px',
                        border: `1px solid ${bdr}`,
                        bgcolor: 'background.paper',
                        ...hoverCard,
                      }}
                    >
                      <Box sx={{
                        width: 42, height: 42, borderRadius: '11px', flexShrink: 0,
                        bgcolor: color + '18',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color,
                      }}>
                        <Icon sx={{ fontSize: 20 }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={600} noWrap sx={{ fontSize: '0.875rem' }}>
                          {title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t(`subjects.${course.subject}`, { defaultValue: course.subject })}
                        </Typography>
                      </Box>
                      <ArrowForwardIcon sx={{ fontSize: 15, color: 'text.disabled', flexShrink: 0, opacity: 0.45 }} />
                    </Box>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 5.5 }}>
            <Button
              variant="outlined" size="large"
              onClick={() => navigate('/courses')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                borderRadius: '10px', px: 4, fontWeight: 600,
                textTransform: 'none', borderColor: bdr, color: 'text.primary',
                transition: 'all 0.22s',
                '&:hover': {
                  borderColor: P, color: P,
                  bgcolor: isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {t('home.btnAllCourses')}
            </Button>
          </Box>
        </Container>
      </Box>
      {/* ═══════════════════════════════════════════════════════ */}


      {/* ══════════════════════ HOW IT WORKS ════════════════════ */}
      <Box sx={{
        py: { xs: 9, md: 12 }, bgcolor: 'background.paper',
        borderTop: `1px solid ${bdr}`, borderBottom: `1px solid ${bdr}`,
      }}>
        <Container maxWidth="lg">
          <motion.div {...fadeUp}>
            <Box sx={{ textAlign: 'center', mb: 7 }}>
              <Eyebrow text={t('home.howEyebrow')} color={P2} />
              <Typography variant="h3" fontWeight={800}
                sx={{ letterSpacing: '-0.5px', mb: 1.5, lineHeight: 1.15 }}>
                {t('home.howTitle')}
              </Typography>
              <Typography color="text.secondary"
                sx={{ maxWidth: 420, mx: 'auto', lineHeight: 1.8, fontSize: '0.975rem' }}>
                {t('home.howSubtitle')}
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={2.5} alignItems="stretch">
            {HOW_STEPS.map(({ num, Icon, titleKey, descKey, color }, i) => (
              <Grid item xs={12} sm={6} md={4} key={num}>
                <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.1 }} style={{ height: '100%' }}>
                  <Box sx={{
                    height: '100%', p: 3.5,
                    borderRadius: '16px',
                    border: `1px solid ${bdr}`,
                    bgcolor: 'background.default',
                    position: 'relative',
                    '&::before': {
                      content: '""', position: 'absolute',
                      top: 0, left: 0, right: 0, height: 3,
                      background: `linear-gradient(90deg, ${color}, ${color}88)`,
                      borderRadius: '16px 16px 0 0',
                    },
                    ...hoverCard,
                  }}>
                    {/* Watermark number */}
                    <Typography sx={{
                      position: 'absolute', top: 10, right: 16,
                      fontSize: '5.5rem', fontWeight: 900, lineHeight: 1,
                      color: color + '09', userSelect: 'none', pointerEvents: 'none',
                    }}>
                      {num}
                    </Typography>

                    {/* Icon */}
                    <Box sx={{
                      width: 48, height: 48, borderRadius: '14px', mb: 3,
                      bgcolor: color + '0f', border: `1px solid ${color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color,
                    }}>
                      <Icon sx={{ fontSize: 22 }} />
                    </Box>

                    <Typography sx={{
                      fontSize: '0.62rem', fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color, mb: 1,
                    }}>
                      {t('home.step')} {num}
                    </Typography>
                    <Typography fontWeight={700} sx={{ mb: 1, lineHeight: 1.3, fontSize: '1.05rem' }}>
                      {t(titleKey)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                      {t(descKey)}
                    </Typography>

                    {i < HOW_STEPS.length - 1 && (
                      <Box sx={{
                        display: { xs: 'none', md: 'flex' },
                        position: 'absolute', right: -19, top: '50%',
                        transform: 'translateY(-50%)',
                        color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(37,99,235,0.35)',
                        zIndex: 10, alignItems: 'center',
                      }}>
                        <ArrowForwardIcon sx={{ fontSize: 20 }} />
                      </Box>
                    )}
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      {/* ═══════════════════════════════════════════════════════ */}


      {/* ══════════════════════════ BENEFITS ════════════════════ */}
      <Box sx={{ py: { xs: 9, md: 12 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <motion.div {...fadeUp}>
            <Box sx={{ textAlign: 'center', mb: 7 }}>
              <Eyebrow text={t('home.benefitsEyebrow')} />
              <Typography variant="h3" fontWeight={800}
                sx={{ letterSpacing: '-0.5px', mb: 1.5, lineHeight: 1.15 }}>
                {t('home.benefitsTitle')}
              </Typography>
              <Typography color="text.secondary"
                sx={{ maxWidth: 440, mx: 'auto', lineHeight: 1.8, fontSize: '0.975rem' }}>
                {t('home.benefitsSubtitle')}
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={2}>
            {BENEFITS.map(({ titleKey, descKey, Icon, color }, i) => (
              <Grid item xs={12} sm={6} key={titleKey}>
                <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }}>
                  <Box sx={{
                    display: 'flex', gap: 2.5, p: 3,
                    borderRadius: '14px',
                    border: `1px solid ${bdr}`,
                    bgcolor: 'background.paper',
                    height: '100%',
                    boxShadow: `inset 4px 0 0 ${color}`,
                    ...hoverCard,
                  }}>
                    <Box sx={{
                      width: 46, height: 46, borderRadius: '13px', flexShrink: 0,
                      bgcolor: color + '0f', border: `1px solid ${color}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color,
                    }}>
                      <Icon sx={{ fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography fontWeight={700} sx={{ mb: 0.75, lineHeight: 1.3, fontSize: '0.95rem' }}>
                        {t(titleKey)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
                        {t(descKey)}
                      </Typography>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
      {/* ═══════════════════════════════════════════════════════ */}


      {/* ══════════════════════════ REVIEWS ═════════════════════ */}
      <Box sx={{
        py: { xs: 9, md: 12 }, bgcolor: 'background.paper',
        borderTop: `1px solid ${bdr}`, borderBottom: `1px solid ${bdr}`,
      }}>
        <Container maxWidth="lg">
          <motion.div {...fadeUp}>
            <Box sx={{ textAlign: 'center', mb: 7 }}>
              <Eyebrow text={t('home.reviewsEyebrow')} color="#f59e0b" />
              <Typography variant="h3" fontWeight={800}
                sx={{ letterSpacing: '-0.5px', mb: 1.5, lineHeight: 1.15 }}>
                {t('home.reviewsTitle')}
              </Typography>
              <Typography color="text.secondary"
                sx={{ maxWidth: 420, mx: 'auto', lineHeight: 1.8, fontSize: '0.975rem' }}>
                {t('home.reviewsSubtitle')}
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={2}>
            {reviews.map((r, i) => {
              const COLORS = [P, P2, '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];
              const ac = COLORS[i % COLORS.length];
              return (
                <Grid item xs={12} sm={6} md={4} key={r.id}>
                  <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: i * 0.08 }} style={{ height: '100%' }}>
                    <Box sx={{
                      height: '100%', display: 'flex', flexDirection: 'column',
                      p: 3, borderRadius: '16px',
                      border: `1px solid ${bdr}`,
                      bgcolor: 'background.default',
                      position: 'relative', overflow: 'hidden',
                      '&::before': {
                        content: '""', position: 'absolute',
                        top: 0, left: 0, right: 0, height: 3,
                        background: `linear-gradient(90deg, ${ac}, ${ac}66)`,
                      },
                      ...hoverCard,
                    }}>
                      {/* Large quote watermark */}
                      <Typography sx={{
                        position: 'absolute', top: 4, right: 14,
                        fontSize: '5rem', lineHeight: 1,
                        color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                        fontFamily: 'Georgia, serif', fontWeight: 900,
                        userSelect: 'none', pointerEvents: 'none',
                      }}>
                        "
                      </Typography>

                      {/* Stars */}
                      <Stack direction="row" spacing={0.3} sx={{ mb: 2.25 }}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <StarIcon key={j} sx={{ fontSize: 13, color: j < r.rating ? '#f59e0b' : bdr }} />
                        ))}
                      </Stack>

                      {/* Review body */}
                      <Typography sx={{
                        flex: 1, lineHeight: 1.85, mb: 2.5,
                        fontSize: '0.9rem', color: 'text.primary',
                      }}>
                        {lang === 'ru' ? r.textRu : r.textUz}
                      </Typography>

                      {/* Author */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{
                          bgcolor: ac, width: 36, height: 36,
                          fontSize: '0.82rem', fontWeight: 700,
                        }}>
                          {(r.avatar ?? r.name[0]).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography fontWeight={700} sx={{ lineHeight: 1.25, fontSize: '0.875rem' }}>
                            {r.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {lang === 'ru' ? r.roleRu : r.roleUz}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>
      {/* ═══════════════════════════════════════════════════════ */}


      {/* ═══════════════════ TEACHERS ══════════════════════════ */}
      {teachersSection.show && <Box sx={{ py: { xs: 9, md: 12 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <motion.div {...fadeUp}>
            <Box sx={{ textAlign: 'center', mb: 7 }}>
              <Eyebrow text={t('home.teachersEyebrow')} color="#10b981" />
              <Typography variant="h3" fontWeight={800}
                sx={{ letterSpacing: '-0.5px', mb: 1.5, lineHeight: 1.15 }}>
                {t('home.teachersTitle')}
              </Typography>
              <Typography color="text.secondary"
                sx={{ maxWidth: 460, mx: 'auto', lineHeight: 1.8, fontSize: '0.975rem' }}>
                {t('home.teachersSubtitle')}
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={2}>
            {teachers.slice(0, [3, 6].includes(teachersSection.limit) ? teachersSection.limit : 3).map((teacher, idx) => {
              const color    = teacher.color || PALETTE[idx % PALETTE.length];
              const initials = (teacher.name?.[0] ?? '?').toUpperCase();
              const subject  = teacher.subject ?? '—';
              const bioText  = teacher.bio ?? '';
              const experience   = teacher.experience ?? 0;
              const rating       = teacher.rating ?? 5;
              const achievements = teacher.achievements ?? [];
              return (
                <Grid item xs={12} sm={6} md={4} key={teacher._id ?? idx}>
                  <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: idx * 0.1 }} style={{ height: '100%' }}>
                    <Box sx={{
                      height: '100%', p: 3,
                      borderRadius: '16px',
                      border: `1px solid ${bdr}`,
                      bgcolor: 'background.paper',
                      display: 'flex', flexDirection: 'column',
                      ...hoverCard,
                    }}>
                      {/* Header: initials + name + subject */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                        <Box sx={{
                          width: 54, height: 54, borderRadius: '14px', flexShrink: 0,
                          bgcolor: color + '12',
                          border: `1.5px solid ${color}28`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: color, fontWeight: 900, fontSize: '1.35rem',
                        }}>
                          {teacher.avatar?.url
                            ? <img src={teacher.avatar.url} alt={teacher.name} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                            : initials}
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography fontWeight={700} noWrap sx={{ fontSize: '0.92rem', lineHeight: 1.3 }}>
                            {teacher.name}
                          </Typography>
                          <Box sx={{
                            mt: 0.6, display: 'inline-block',
                            fontSize: '0.67rem', fontWeight: 700,
                            color: color,
                            bgcolor: color + '10',
                            px: 1, py: 0.3, borderRadius: '6px',
                          }}>
                            {subject}
                          </Box>
                        </Box>
                      </Box>

                      {/* Mini stats */}
                      <Box sx={{
                        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
                        mb: 2.25, p: 1.75, borderRadius: '10px',
                        bgcolor: color + '07',
                        border: `1px solid ${color}15`,
                      }}>
                        {[
                          { val: `${experience}+`, sub: t('home.yearsExp')      },
                          { val: `${teacher.totalStudents ?? 0}+`, sub: t('home.studentsLabel') },
                          { val: `${rating}`,      sub: t('home.ratingLabel')   },
                        ].map((s, j) => (
                          <Box key={j} sx={{
                            textAlign: 'center',
                            borderRight: j < 2 ? `1px solid ${color}18` : 'none',
                          }}>
                            <Typography fontWeight={800} sx={{ fontSize: '0.9rem', color: color, lineHeight: 1.2 }}>
                              {s.val}
                            </Typography>
                            <Typography sx={{ fontSize: '0.58rem', color: 'text.disabled', lineHeight: 1.4 }}>
                              {s.sub}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      {/* Bio */}
                      <Typography variant="body2" color="text.secondary" sx={{
                        lineHeight: 1.8, mb: 2, flex: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {bioText}
                      </Typography>

                      {/* Achievement tags */}
                      <Stack direction="row" gap={0.65} flexWrap="wrap" sx={{ mb: 2.5 }}>
                        {achievements.slice(0, 2).map((a, ai) => (
                          <Box key={ai} sx={{
                            fontSize: '0.65rem', px: 1, py: 0.35,
                            borderRadius: '6px',
                            border: `1px solid ${color}25`,
                            color: 'text.secondary',
                            whiteSpace: 'nowrap',
                          }}>
                            {a}
                          </Box>
                        ))}
                      </Stack>

                      {/* CTA */}
                      <Button
                        fullWidth variant="outlined"
                        onClick={() => navigate('/courses')}
                        sx={{
                          mt: 'auto', borderRadius: '10px',
                          borderColor: `${color}45`,
                          color: color, fontWeight: 600,
                          textTransform: 'none', py: 0.9,
                          fontSize: '0.86rem',
                          transition: 'all 0.22s',
                          '&:hover': {
                            borderColor: color,
                            bgcolor: color + '08',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        {t('home.teachersCta')}
                      </Button>
                    </Box>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 5.5 }}>
            <Button
              variant="outlined" size="large"
              onClick={() => navigate('/teachers')}
              endIcon={<ArrowForwardIcon />}
              sx={{
                borderRadius: '10px', px: 4, fontWeight: 600,
                textTransform: 'none', borderColor: bdr, color: 'text.primary',
                transition: 'all 0.22s',
                '&:hover': {
                  borderColor: P, color: P,
                  bgcolor: isDark ? 'rgba(37,99,235,0.08)' : 'rgba(37,99,235,0.04)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {t('home.allTeachers')}
            </Button>
          </Box>
        </Container>
      </Box>}
      {/* ═══════════════════════════════════════════════════════ */}


      {/* ═══════════════════════════════════════════════════════════
          CTA BANNER — premium SaaS conversion section
      ═══════════════════════════════════════════════════════════ */}
      <Box sx={{
        position: 'relative',
        overflow: 'hidden',
        borderTop: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        py: { xs: 8, md: 11 },
        textAlign: 'center',
        /* Dot-grid texture */
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(59,130,246,0.13)' : 'rgba(37,99,235,0.09)'} 1.5px, transparent 1.5px)`,
          backgroundSize: '22px 22px',
          pointerEvents: 'none',
        },
        /* Radial glow center */
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: isDark
            ? 'radial-gradient(ellipse 90% 65% at 50% 60%, rgba(37,99,235,0.14) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 90% 65% at 50% 60%, rgba(37,99,235,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}>
        {/* 3px top accent bar */}
        <Box sx={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${P} 0%, ${P2} 50%, #ec4899 100%)`,
        }} />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <motion.div {...fadeUp}>

            {/* Eyebrow */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              px: 1.75, py: 0.6,
              borderRadius: '24px',
              bgcolor: isDark ? 'rgba(37,99,235,0.14)' : 'rgba(37,99,235,0.08)',
              border: `1.5px solid ${isDark ? 'rgba(37,99,235,0.28)' : 'rgba(37,99,235,0.18)'}`,
              mb: 3,
              width: 'fit-content',
              mx: 'auto',
            }}>
              <Box sx={{
                width: 6, height: 6,
                borderRadius: '50%',
                bgcolor: P,
                boxShadow: `0 0 8px ${P}`,
                flexShrink: 0,
              }} />
              <Typography sx={{
                fontSize: '0.7rem', fontWeight: 700, letterSpacing: 1.3,
                color: P, lineHeight: 1,
              }}>
                PARVOZ ACADEMY
              </Typography>
            </Box>

            {/* Title */}
            <Typography
              variant="h3"
              fontWeight={800}
              sx={{
                letterSpacing: '-0.5px',
                lineHeight: 1.15,
                mb: 2,
                background: `linear-gradient(135deg, ${P} 0%, ${P2} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                display: 'inline-block',
              }}
            >
              {t('home.ctaTitle')}
            </Typography>

            {/* Subtitle */}
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                lineHeight: 1.8,
                maxWidth: 500,
                mx: 'auto',
                mb: 4.5,
                display: 'block',
              }}
            >
              {t('home.ctaSubtitle')}
            </Typography>

            {/* Buttons */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="center"
              sx={{ mb: 0 }}
            >
              <Button
                size="large"
                onClick={() => navigate('/register')}
                endIcon={<ArrowForwardIcon />}
                sx={{
                  background: `linear-gradient(135deg, ${P} 0%, ${P2} 100%)`,
                  color: 'white', fontWeight: 700,
                  fontSize: '0.95rem', px: 4.5, py: 1.5,
                  borderRadius: '12px', textTransform: 'none',
                  boxShadow: `0 8px 28px rgba(37,99,235,0.38)`,
                  position: 'relative', overflow: 'hidden',
                  '&::before': {
                    content: '""', position: 'absolute', inset: 0,
                    background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
                    transform: 'translateX(-100%)',
                    transition: 'transform 0.55s',
                  },
                  '&:hover': {
                    background: `linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)`,
                    boxShadow: `0 14px 38px rgba(37,99,235,0.5)`,
                    transform: 'translateY(-2px)',
                    '&::before': { transform: 'translateX(100%)' },
                  },
                  transition: 'all 0.22s',
                }}
              >
                {t('home.btnRegister')}
              </Button>

              <Button
                size="large"
                onClick={() => navigate('/courses')}
                sx={{
                  fontWeight: 600,
                  fontSize: '0.93rem', px: 3.5, py: 1.5,
                  borderRadius: '12px', textTransform: 'none',
                  color: 'text.primary',
                  border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.11)'}`,
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(37,99,235,0.05)',
                    borderColor: isDark ? 'rgba(255,255,255,0.3)' : P,
                    color: P,
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.22s',
                }}
              >
                {t('home.btnCourses')}
              </Button>
            </Stack>


          </motion.div>
        </Container>
      </Box>

    </Box>
  );
}
