import {
  Box, Container, Grid, Typography, Card, CardContent,
  Button, TextField, InputAdornment,
  Stack, Avatar, useTheme, CircularProgress,
} from '@mui/material';
import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import i18n              from '../../../utils/i18n.js';
import SearchIcon        from '@mui/icons-material/Search';
import SchoolIcon        from '@mui/icons-material/School';
import PeopleIcon        from '@mui/icons-material/People';
import TimerIcon         from '@mui/icons-material/Timer';
import StarIcon          from '@mui/icons-material/Star';
import ArrowForwardIcon  from '@mui/icons-material/ArrowForward';
import FunctionsIcon     from '@mui/icons-material/Functions';
import HistoryEduIcon    from '@mui/icons-material/HistoryEdu';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TranslateIcon     from '@mui/icons-material/Translate';
import ComputerIcon      from '@mui/icons-material/Computer';
import MenuBookIcon      from '@mui/icons-material/MenuBook';
import LaptopIcon        from '@mui/icons-material/Laptop';
import ScienceIcon       from '@mui/icons-material/Science';
import BrushIcon         from '@mui/icons-material/Brush';
import PsychologyIcon    from '@mui/icons-material/Psychology';
import AutoStoriesIcon   from '@mui/icons-material/AutoStories';
import LightbulbIcon     from '@mui/icons-material/Lightbulb';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import TuneIcon          from '@mui/icons-material/Tune';
import LayersIcon         from '@mui/icons-material/Layers';
import ShoppingCartIcon   from '@mui/icons-material/ShoppingCart';
import { SUBJECT_COLORS, formatPrice } from '../../../data/mockData.js';
import PageBanner from '../../../components/ui/PageBanner.jsx';
import { useGetCoursesQuery } from '../../../features/courses/coursesApi.js';
import { useGetPublishedPackagesQuery } from '../../../features/packages/packagesApi.js';
import { selectCourseCustomizations } from '../../../features/content/contentSlice.js';
import { getCourseAppearance } from '../../../utils/courseAppearance.js';

/* ─── subject icon map ───────────────────────────────────────────── */
const SUBJECT_ICON_MAP = {
  math:    FunctionsIcon,
  uzbek:   HistoryEduIcon,
  history: AccountBalanceIcon,
  english: TranslateIcon,
  it:      ComputerIcon,
  other:   MenuBookIcon,
};

/* ─── custom icon map (matches keys stored in courseCustomizations) ── */
const COURSE_ICON_MAP = {
  science:      ScienceIcon,
  brush:        BrushIcon,
  psychology:   PsychologyIcon,
  autoStories:  AutoStoriesIcon,
  laptop:       LaptopIcon,
  school:       SchoolIcon,
  menuBook:     MenuBookIcon,
  lightbulb:    LightbulbIcon,
  functions:    FunctionsIcon,
  historyEdu:   HistoryEduIcon,
  translate:    TranslateIcon,
  computer:     ComputerIcon,
  balance:      AccountBalanceIcon,
};

/* ─── build { text, bg } from a custom hex color ─────────────────── */
function colorPair(hex) {
  try {
    const r  = parseInt(hex.slice(1, 3), 16);
    const g  = parseInt(hex.slice(3, 5), 16);
    const b  = parseInt(hex.slice(5, 7), 16);
    const tr = Math.round(r * 0.14 + 255 * 0.86).toString(16).padStart(2, '0');
    const tg = Math.round(g * 0.14 + 255 * 0.86).toString(16).padStart(2, '0');
    const tb = Math.round(b * 0.14 + 255 * 0.86).toString(16).padStart(2, '0');
    return { text: hex, bg: `#${tr}${tg}${tb}` };
  } catch {
    return { text: hex, bg: '#F0F4FF' };
  }
}

/* ─── auto-assign palette when no custom color/icon set ─────────── */
const AUTO_PALETTE = ['#1976D2','#10B981','#F59E0B','#7C3AED','#EC4899','#EF4444','#06B6D4','#D97706'];
const AUTO_ICONS   = [FunctionsIcon, TranslateIcon, ComputerIcon, HistoryEduIcon, ScienceIcon, BrushIcon, LaptopIcon, SchoolIcon];

const EASING = [0.25, 0.46, 0.45, 0.94];

const cardVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.28, delay: Math.min(i * 0.045, 0.22), ease: EASING },
  }),
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.16 } },
};

/* ═══════════════════════════════════════════════════════════════════
   CourseCard
═══════════════════════════════════════════════════════════════════ */
function CourseCard({ course, index, customColor, customIconKey }) {
  const navigate = useNavigate();
  const { t }   = useTranslation();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const lang    = i18n.language === 'ru' ? 'ru' : 'uz';

  const subject = course.subject ?? 'other';
  // Use passed custom values (from getCourseAppearance called in parent)
  const sc          = customColor ? colorPair(customColor) : colorPair(AUTO_PALETTE[index % AUTO_PALETTE.length]);
  const SubjectIcon = (customIconKey && COURSE_ICON_MAP[customIconKey]) ?? AUTO_ICONS[index % AUTO_ICONS.length];

  const title       = course.title?.[lang] ?? course.title?.uz ?? '';
  const price       = course.price?.amount ?? 0;
  const duration    = course.duration ?? 0;
  const students    = course.totalStudents ?? 0;
  const rating      = course.rating?.average ?? 0;
  const level       = course.level ?? 'beginner';
  const teacher     = course.teacher ?? {};
  const teacherName = teacher.name ?? '—';
  const teacherInit = teacherName[0] ?? '?';

  const LEVELS = {
    beginner:     t('level.beginner'),
    intermediate: t('level.intermediate'),
    advanced:     t('level.advanced'),
  };

  const ratingInt = Math.round(rating);

  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible" exit="exit" layout style={{ height: '100%' }}>
      <Card onClick={() => navigate(`/courses/${course._id}`)} sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        cursor: 'pointer', overflow: 'hidden',
        transition: 'transform 0.22s, box-shadow 0.22s, border-color 0.22s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.45)' : `0 12px 32px ${sc.text}18`,
          borderColor: sc.text + '38',
        },
      }}>
        {/* Thumbnail */}
        <Box sx={{
          position: 'relative', height: 132,
          background: isDark ? `linear-gradient(145deg, ${sc.text}18 0%, ${sc.text}08 100%)` : `linear-gradient(145deg, ${sc.bg} 0%, ${sc.bg}EE 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {course.thumbnail?.url ? (
            <Box component="img" src={course.thumbnail.url} alt={title}
              sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <Box sx={{ position: 'absolute', right: -28, bottom: -28, width: 110, height: 110, borderRadius: '50%', bgcolor: sc.text + '0B' }} />
              <Box sx={{ position: 'absolute', left: -18, top: -18, width: 80, height: 80, borderRadius: '50%', bgcolor: sc.text + '07' }} />
              <Box sx={{
                width: 60, height: 60, borderRadius: '18px', position: 'relative', zIndex: 1,
                bgcolor: isDark ? sc.text + '18' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isDark ? 'none' : `0 4px 18px ${sc.text}20`,
                border: isDark ? `1px solid ${sc.text}25` : 'none',
              }}>
                <SubjectIcon sx={{ fontSize: 28, color: sc.text }} />
              </Box>
            </>
          )}

        </Box>

        {/* Card body */}
        <CardContent sx={{ flex: 1, p: 2.5, display: 'flex', flexDirection: 'column' }}>
          {subject !== 'other' && (
            <Box sx={{ mb: 1.25 }}>
              <Typography sx={{
                display: 'inline-block', fontSize: '0.67rem', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: sc.text, bgcolor: sc.text + '12', px: 1, py: 0.3, borderRadius: '6px',
              }}>
                {t(`subjects.${subject}`, { defaultValue: subject })}
              </Typography>
            </Box>
          )}

          <Typography variant="subtitle1" fontWeight={700} sx={{
            mb: 1.5, lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {title}
          </Typography>

          {/* Teacher */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Avatar sx={{
              width: 24, height: 24, bgcolor: sc.text + '18', color: sc.text,
              fontSize: '0.68rem', fontWeight: 800, border: `1.5px solid ${sc.text}25`,
            }}>
              {teacherInit}
            </Avatar>
            <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
              {teacherName}
            </Typography>
          </Box>

          {/* Meta */}
          <Stack direction="row" sx={{ mb: 2, gap: 2, flexWrap: 'wrap' }}>
            {[
              { Icon: TimerIcon,  text: `${duration} ${t('common.month')}` },
              { Icon: PeopleIcon, text: `${students}` },
            ].map(({ Icon, text }) => (
              <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Icon sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography variant="caption" color="text.secondary">{text}</Typography>
              </Box>
            ))}
          </Stack>

          {/* Rating */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2.5 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <StarIcon key={i} sx={{ fontSize: 13, color: i < ratingInt ? '#F59E0B' : 'divider' }} />
            ))}
            <Typography variant="caption" fontWeight={700} sx={{ ml: 0.5, color: '#F59E0B' }}>
              {Number(rating).toFixed(1)}
            </Typography>
          </Box>

          {/* Price + CTA */}
          <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1, color: sc.text }}>
                {formatPrice(price)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('common.sum')}/{t('common.month')}
              </Typography>
            </Box>
            <Button variant="outlined" size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: '13px !important' }} />}
              onClick={(e) => { e.stopPropagation(); navigate(`/courses/${course._id}`); }}
              sx={{
                borderRadius: 2.5, borderColor: sc.text + '55', color: sc.text,
                fontWeight: 600, fontSize: '0.78rem', px: 1.75, py: 0.85,
                textTransform: 'none', flexShrink: 0,
                '&:hover': { borderColor: sc.text, bgcolor: sc.text + '08' },
              }}>
              {t('common.view')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PackageCard
═══════════════════════════════════════════════════════════════════ */
const PKG_PALETTE = ['#7C3AED','#10B981','#F59E0B','#1976D2','#EF4444','#06B6D4'];

function PackageCard({ pkg, index }) {
  const navigate = useNavigate();
  const { t }   = useTranslation();
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const lang    = i18n.language === 'ru' ? 'ru' : 'uz';

  const color       = PKG_PALETTE[index % PKG_PALETTE.length];
  const title       = pkg.title?.[lang] ?? pkg.title?.uz ?? '';
  const desc        = pkg.description?.[lang] ?? pkg.description?.uz ?? '';
  const price       = pkg.price?.amount ?? 0;
  const moduleCount = pkg.modules?.length ?? 0;
  const purchases   = pkg.purchaseCount ?? 0;
  const teacherName = pkg.teacher?.name ?? '—';
  const teacherInit = teacherName[0]?.toUpperCase() ?? '?';

  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible" exit="exit" layout style={{ height: '100%' }}>
      <Card onClick={() => navigate(`/packages/${pkg._id}`)} sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        cursor: 'pointer', overflow: 'hidden',
        transition: 'transform 0.22s, box-shadow 0.22s, border-color 0.22s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: isDark ? '0 12px 32px rgba(0,0,0,0.45)' : `0 12px 32px ${color}18`,
          borderColor: color + '38',
        },
      }}>
        {/* Thumbnail */}
        <Box sx={{
          position: 'relative', height: 132,
          background: isDark
            ? `linear-gradient(145deg, ${color}18 0%, ${color}08 100%)`
            : `linear-gradient(145deg, ${color}14 0%, ${color}08 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {pkg.thumbnail ? (
            <Box component="img" src={pkg.thumbnail} alt={title}
              sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <Box sx={{ position: 'absolute', right: -28, bottom: -28, width: 110, height: 110, borderRadius: '50%', bgcolor: color + '0B' }} />
              <Box sx={{ position: 'absolute', left: -18, top: -18, width: 80, height: 80, borderRadius: '50%', bgcolor: color + '07' }} />
              <Box sx={{
                width: 60, height: 60, borderRadius: '18px', position: 'relative', zIndex: 1,
                bgcolor: isDark ? color + '18' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isDark ? 'none' : `0 4px 18px ${color}20`,
                border: isDark ? `1px solid ${color}25` : 'none',
              }}>
                <LayersIcon sx={{ fontSize: 28, color }} />
              </Box>
            </>
          )}
          {/* Badge */}
          <Box sx={{
            position: 'absolute', top: 10, right: 10,
            bgcolor: color, color: 'white',
            fontSize: '0.62rem', fontWeight: 700, px: 1, py: 0.3, borderRadius: '6px',
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            {lang === 'ru' ? 'Инд. пакет' : 'Ind. paket'}
          </Box>
        </Box>

        {/* Card body */}
        <CardContent sx={{ flex: 1, p: 2.5, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{
            mb: 1.5, lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {title}
          </Typography>

          {/* Teacher */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Avatar sx={{
              width: 24, height: 24, bgcolor: color + '18', color,
              fontSize: '0.68rem', fontWeight: 800, border: `1.5px solid ${color}25`,
            }}>
              {teacherInit}
            </Avatar>
            <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
              {teacherName}
            </Typography>
          </Box>

          {/* Meta */}
          <Stack direction="row" sx={{ mb: 2.5, gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LayersIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                {moduleCount} {lang === 'ru' ? 'модулей' : 'ta modul'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <ShoppingCartIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">{purchases}</Typography>
            </Box>
          </Stack>

          {/* Price + CTA */}
          <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, lineHeight: 1, color }}>
                {formatPrice(price)}
              </Typography>
              <Typography variant="caption" color="text.secondary">{t('common.sum')}</Typography>
            </Box>
            <Button variant="outlined" size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: '13px !important' }} />}
              onClick={(e) => { e.stopPropagation(); navigate(`/packages/${pkg._id}`); }}
              sx={{
                borderRadius: 2.5, borderColor: color + '55', color,
                fontWeight: 600, fontSize: '0.78rem', px: 1.75, py: 0.85,
                textTransform: 'none', flexShrink: 0,
                '&:hover': { borderColor: color, bgcolor: color + '08' },
              }}>
              {t('common.view')}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Courses page
═══════════════════════════════════════════════════════════════════ */
export default function Courses() {
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const theme     = useTheme();
  const isDark    = theme.palette.mode === 'dark';
  const [params]  = useSearchParams();
  const lang      = i18n.language === 'ru' ? 'ru' : 'uz';

  const [activeFilter, setActiveFilter] = useState('all');
  const [query, setQuery] = useState('');

  const courseCustoms = useSelector(selectCourseCustomizations);
  const { data, isLoading } = useGetCoursesQuery({ limit: 500 });
  const { data: pkgData }   = useGetPublishedPackagesQuery({ limit: 100 });
  const allCourses    = data?.data ?? [];
  const allPackages   = (pkgData?.data ?? pkgData?.packages ?? []).filter((p) => p.status === 'published');
  // Only show active+published courses (admin JWT returns everything)
  const publicCourses = useMemo(
    () => allCourses.filter((c) => c.isActive && c.isPublished),
    [allCourses],
  );

  // Filters = one chip per course — color from getCourseAppearance (consistent)
  const FILTERS = useMemo(() => {
    const courseFilters = publicCourses.map((c) => {
      const title           = c.title?.[lang] ?? c.title?.ru ?? c.title?.uz ?? '—';
      const { color }       = getCourseAppearance(c, courseCustoms);
      return { value: c._id, label: title, color };
    });
    return [
      { value: 'all', label: t('page.courses.allFilters'), color: null },
      ...courseFilters,
    ];
  }, [publicCourses, lang, courseCustoms, t]);

  const filtered = useMemo(
    () => publicCourses.filter((c) => {
      const matchFilter = activeFilter === 'all' || c._id === activeFilter;
      const matchQuery  = !query
        || (c.title?.uz ?? '').toLowerCase().includes(query.toLowerCase())
        || (c.title?.ru ?? '').toLowerCase().includes(query.toLowerCase())
        || (c.teacher?.name ?? '').toLowerCase().includes(query.toLowerCase());
      return matchFilter && matchQuery;
    }),
    [publicCourses, activeFilter, query],
  );

  const resultLabel = lang === 'ru'
    ? `${filtered.length} курс${filtered.length === 1 ? '' : 'ов'} найдено`
    : `${filtered.length} ta kurs topildi`;

  return (
    <Box sx={{ mx: { xs: -2, sm: -3 } }}>
      <PageBanner
        eyebrow="Parvoz Academy"
        title={t('nav.courses')}
        subtitle={t('page.courses.subtitle')}
        color="#1976D2"
        stats={[
          { value: `${publicCourses.length || allCourses.length}+`, label: lang === 'ru' ? 'курсов' : 'ta kurs' },
          { value: '1 000+', label: lang === 'ru' ? 'студентов' : "o'quvchi" },
          { value: '★ 4.8', label: lang === 'ru' ? 'рейтинг' : 'reyting' },
        ]}
        visual={
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
            {[
              { Icon: FunctionsIcon,      label: lang === 'ru' ? 'Математика'  : 'Matematika',  color: '#1976D2' },
              { Icon: TranslateIcon,      label: lang === 'ru' ? 'Английский'  : 'Ingliz tili', color: '#7C3AED' },
              { Icon: ComputerIcon,       label: lang === 'ru' ? 'Информатика' : 'Informatika', color: '#10B981' },
              { Icon: MenuBookIcon,       label: lang === 'ru' ? 'Узбекский'   : "O'zbek tili", color: '#F59E0B' },
              { Icon: AccountBalanceIcon, label: lang === 'ru' ? 'История'     : 'Tarix',        color: '#EF4444' },
              { Icon: HistoryEduIcon,     label: lang === 'ru' ? 'Русский'     : 'Rus tili',     color: '#06B6D4' },
            ].map(({ Icon, label, color }) => (
              <Box key={label} sx={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.8,
                p: 1.75,
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'background.default',
                border: '1px solid', borderColor: 'divider', borderRadius: '14px',
                transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' },
              }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon sx={{ fontSize: 20, color }} />
                </Box>
                <Typography sx={{ fontSize: '0.66rem', fontWeight: 600, color: 'text.secondary', textAlign: 'center', lineHeight: 1.25 }}>
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        }
      >
        <TextField
          placeholder={t('page.courses.search')} value={query}
          onChange={(e) => setQuery(e.target.value)}
          sx={{
            maxWidth: 460, width: '100%',
            '& .MuiOutlinedInput-root': {
              bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'background.default',
              borderRadius: 3,
              '& fieldset': { borderColor: 'divider' },
              '&.Mui-focused fieldset': { borderColor: '#1976D2', borderWidth: '1.5px' },
            },
          }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.disabled', fontSize: 20 }} /></InputAdornment> }}
        />
      </PageBanner>

      {/* Filter bar */}
      <Box sx={{
        bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider',
        position: 'sticky', top: 64, zIndex: 10,
        boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <Container maxWidth="lg">
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1, py: 1.5, overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' }, msOverflowStyle: 'none', scrollbarWidth: 'none',
          }}>
            <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: 'text.disabled', mr: 0.5 }}>
              <TuneIcon sx={{ fontSize: 18 }} />
            </Box>
            {FILTERS.map(({ value, label, color }) => {
              const active   = activeFilter === value;
              const btnColor = color || '#1976D2';
              return (
                <Button key={value} size="small" disableElevation onClick={() => setActiveFilter(value)}
                  startIcon={value !== 'all' ? <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: active ? 'white' : btnColor, flexShrink: 0 }} /> : null}
                  sx={{
                    flexShrink: 0, px: 2, py: 0.6, borderRadius: '20px',
                    fontWeight: active ? 700 : 500, fontSize: '0.82rem', whiteSpace: 'nowrap', minWidth: 'unset',
                    textTransform: 'none', border: '1.5px solid',
                    borderColor: active ? btnColor : 'divider',
                    bgcolor: active ? btnColor : 'transparent',
                    color: active ? 'white' : 'text.secondary',
                    transition: 'all 0.18s',
                    '&:hover': { borderColor: btnColor, bgcolor: active ? btnColor : btnColor + '12', color: active ? 'white' : btnColor },
                  }}>
                  {label}
                </Button>
              );
            })}
            {query && (
              <Button size="small" onClick={() => setQuery('')}
                sx={{
                  flexShrink: 0, ml: 0.5, px: 1.5, py: 0.6, borderRadius: '20px',
                  textTransform: 'none', fontWeight: 600, fontSize: '0.75rem',
                  border: '1.5px solid', borderColor: 'error.light', color: 'error.main', bgcolor: 'transparent',
                  '&:hover': { borderColor: 'error.main', bgcolor: 'error.main', color: 'white' },
                }}>
                ✕ {t('common.reset')}
              </Button>
            )}
          </Box>
        </Container>
      </Box>

      {/* Grid */}
      <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: 'background.default', minHeight: 400 }}>
        <Container maxWidth="lg">
          {isLoading ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <CircularProgress />
            </Box>
          ) : filtered.length === 0 ? (
            <Box component={motion.div} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              sx={{ textAlign: 'center', py: { xs: 8, md: 12 } }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '24px', bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                <SearchIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>{t('page.courses.noResults')}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
                {lang === 'ru' ? 'Попробуйте изменить фильтр или поисковый запрос' : "Filtrni yoki qidiruv so'zini o'zgartiring"}
              </Typography>
              <Button size="small" onClick={() => { setQuery(''); setActiveFilter('all'); }}
                sx={{ px: 3, py: 0.75, borderRadius: '20px', fontWeight: 600, textTransform: 'none', fontSize: '0.85rem', border: '1.5px solid', borderColor: '#1976D2', bgcolor: '#1976D2', color: 'white', '&:hover': { bgcolor: '#1565C0' } }}>
                {t('common.reset')}
              </Button>
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>{resultLabel}</Typography>
                {(activeFilter !== 'all' || query) && (
                  <Box onClick={() => { setActiveFilter('all'); setQuery(''); }}
                    sx={{ color: 'primary.main', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', '&:hover': { opacity: 0.75 } }}>
                    {lang === 'ru' ? 'Сбросить фильтры' : "Filtrlarni tozalash"}
                  </Box>
                )}
              </Box>
              <Grid container spacing={3}>
                <AnimatePresence mode="popLayout">
                  {filtered.map((course, i) => {
                    const { color, iconKey } = getCourseAppearance(course, courseCustoms);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={course._id}>
                        <CourseCard
                          course={course}
                          index={i}
                          customColor={color}
                          customIconKey={iconKey}
                        />
                      </Grid>
                    );
                  })}
                </AnimatePresence>
              </Grid>
            </>
          )}
        </Container>
      </Box>

      {/* Individual Packages section */}
      {allPackages.length > 0 && (
        <Box sx={{ pt: 1, pb: { xs: 4, md: 6 } }}>
          <Container maxWidth="lg">
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.25 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: '#7C3AED18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LayersIcon sx={{ color: '#7C3AED', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800}>
                  {lang === 'ru' ? 'Индивидуальные пакеты' : 'Individual paketlar'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {lang === 'ru' ? 'Самостоятельное обучение в удобном темпе' : "O'z sur'atida mustaqil o'qish"}
                </Typography>
              </Box>
            </Stack>
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <AnimatePresence mode="popLayout">
                {allPackages.map((pkg, i) => (
                  <Grid item xs={12} sm={6} md={4} key={pkg._id}>
                    <PackageCard pkg={pkg} index={i} />
                  </Grid>
                ))}
              </AnimatePresence>
            </Grid>
          </Container>
        </Box>
      )}

      {/* Bottom CTA */}
      <Box sx={{ bgcolor: isDark ? '#0d1117' : '#f0f5ff', borderTop: '1px solid', borderColor: 'divider', py: { xs: 5, md: 6.5 } }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" gap={3}>
            <Box>
              <Typography fontWeight={800} sx={{ fontSize: { xs: '1.3rem', md: '1.55rem' }, mb: 0.75 }}>
                {lang === 'ru' ? 'Не нашли подходящий курс?' : 'Mos kursni topa olmadingizmi?'}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', maxWidth: 480 }}>
                {lang === 'ru'
                  ? 'Запишитесь на консультацию — поможем выбрать лучший курс для вас'
                  : "Konsultatsiyaga yozing — siz uchun eng mos kursni tanlab beramiz"}
              </Typography>
            </Box>
            <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/contacts')}
              sx={{
                flexShrink: 0,
                background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 100%)',
                fontWeight: 700, borderRadius: 3, textTransform: 'none',
                px: 3.5, py: 1.4, fontSize: '0.95rem',
                boxShadow: '0 6px 22px rgba(25,118,210,0.36)',
                '&:hover': { background: 'linear-gradient(135deg, #1251A0 0%, #1565C0 100%)' },
              }}>
              {lang === 'ru' ? 'Получить консультацию' : 'Konsultatsiya olish'}
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
