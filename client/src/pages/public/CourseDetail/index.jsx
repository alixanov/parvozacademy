import {
  Box, Container, Grid, Typography, Card, CardContent,
  Avatar, Chip, Button, Stack, Divider, List,
  ListItem, ListItemIcon, ListItemText, Accordion,
  AccordionSummary, AccordionDetails, Rating, Alert, Paper,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';

import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation }  from 'react-i18next';
import { useSelector }     from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import { selectIsAuth, selectUser } from '../../../features/auth/authSlice.js';
import {
  selectEnrolledCourses,
  selectVerifications,
} from '../../../features/payment/paymentSlice.js';
import PaymentModal from '../../../components/payment/PaymentModal/index.jsx';
import { motion } from 'framer-motion';
import ExpandMoreIcon   from '@mui/icons-material/ExpandMore';
import CheckIcon        from '@mui/icons-material/Check';
import PlayCircleIcon   from '@mui/icons-material/PlayCircle';
import TimerIcon        from '@mui/icons-material/Timer';
import PeopleIcon       from '@mui/icons-material/People';
import SchoolIcon       from '@mui/icons-material/School';
import ListAltIcon      from '@mui/icons-material/ListAlt';
import PersonIcon       from '@mui/icons-material/Person';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import LaptopIcon       from '@mui/icons-material/Laptop';
import StarIcon         from '@mui/icons-material/Star';
import BlockIcon        from '@mui/icons-material/Block';
import HowToRegIcon     from '@mui/icons-material/HowToReg';
import { SUBJECT_COLORS, formatPrice } from '../../../data/mockData.js';
import { useGetCourseByIdQuery }       from '../../../features/courses/coursesApi.js';
import i18n from '../../../utils/i18n.js';

// Icon / color / i18n mapping by tariff key
const TARIFF_META = {
  online:             { color: '#1976D2', Icon: LaptopIcon,  nameKey: 'page.pricing.plan_online_name',             descKey: 'page.pricing.plan_online_desc',             popular: false },
  offline:            { color: '#7C3AED', Icon: SchoolIcon,  nameKey: 'page.pricing.plan_offline_name',            descKey: 'page.pricing.plan_offline_desc',            popular: true  },
  individual_offline: { color: '#7C3AED', Icon: PersonIcon,  nameKey: 'page.pricing.plan_individual_offline_name', descKey: 'page.pricing.plan_individual_offline_desc', popular: false },
  individual_online:  { color: '#EC4899', Icon: PersonIcon,  nameKey: 'page.pricing.plan_individual_online_name',  descKey: 'page.pricing.plan_individual_online_desc',  popular: false },
};

export default function CourseDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const location    = useLocation();
  const { t }       = useTranslation();
  const isAuth      = useSelector(selectIsAuth);
  const user        = useSelector(selectUser);
  const enrolledMap = useSelector(selectEnrolledCourses);
  const verifications = useSelector(selectVerifications);
  const lang        = i18n.language;

  const { data: courseRes, isLoading: courseLoading, isError: courseError } = useGetCourseByIdQuery(id);

  const [payOpen, setPayOpen]               = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [showFloatingBar, setShowFloating]  = useState(false);
  const [blockDialog, setBlockDialog]       = useState(false);
  const buyCardRef = useRef(null);

  /* ── Derived from API data (after hooks) ──────────────────────── */
  const course = courseRes?.data ?? null;

  /* Floating mobile buy bar — observe when card leaves viewport */
  useEffect(() => {
    const el = buyCardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowFloating(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [course]);

  if (courseLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (courseError || !course) return <Navigate to="/courses" replace />;

  const sc = SUBJECT_COLORS[course.subject] ?? SUBJECT_COLORS.other;

  const courseTitle = typeof course.title === 'object'
    ? (course.title[lang] ?? course.title.uz)
    : (course.title ?? '');
  const courseDesc = typeof course.description === 'object'
    ? (course.description[lang] ?? course.description.uz)
    : (course.description ?? '');

  const isEnrolled   = Boolean(user && (enrolledMap[user._id] ?? []).includes(course._id));
  const verification = user
    ? (verifications.find((v) => v.userId === user._id && v.courseId === course._id) ?? null)
    : null;

  // Build plan list from course.tariffs (only the ones the admin configured for this course)
  const planOptions = (course.tariffs ?? []).map((tar) => {
    const meta = TARIFF_META[tar.key] ?? { color: '#64748B', Icon: SchoolIcon, nameKey: '', descKey: '', popular: false };
    return { id: tar.key, price: tar.price, name: tar.name, ...meta };
  });

  // Auto-select first plan if none selected yet
  const effectivePlanId = selectedPlanId ?? planOptions[0]?.id ?? null;
  const selectedPlan = planOptions.find((p) => p.id === effectivePlanId) ?? planOptions[0];

  const handleEnroll = () => {
    if (!isAuth) { navigate('/register', { state: { from: location } }); return; }
    if (user?.role === 'admin' || user?.role === 'teacher') { setBlockDialog(true); return; }
    if (isEnrolled) { navigate('/student'); return; }
    setPayOpen(true);
  };

  const syllabus = course.syllabus ?? [];
  const outcomes = course.outcomes ?? [];

  // For single-plan courses — extract vars so JSX stays clean
  const isSinglePlan    = planOptions.length === 1;
  const soloPlan        = isSinglePlan ? planOptions[0] : null;
  const SoloPlanIcon    = soloPlan?.Icon ?? SchoolIcon;
  const ActivePlanIcon  = selectedPlan?.Icon ?? SchoolIcon;

  return (
    <Box sx={{ mx: { xs: -2, sm: -3 } }}>
      {/* Hero banner */}
      <Box sx={{ background: `linear-gradient(135deg, ${sc.text}dd 0%, ${sc.text}88 100%)`, py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}>
            <Chip label={sc.label} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mb: 2, fontWeight: 600 }} />
            <Typography variant="h3" fontWeight={800} sx={{ color: 'white', mb: 2, maxWidth: 680 }}>
              {courseTitle}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, maxWidth: 560, lineHeight: 1.8 }}>
              {courseDesc}
            </Typography>
            <Stack direction="row" spacing={3} flexWrap="wrap">
              {[
                { icon: <TimerIcon sx={{ fontSize: 18 }} />, text: `${course.duration ?? 0} ${t('page.courses.duration')}` },
                { icon: <SchoolIcon sx={{ fontSize: 18 }} />, text: `${course.lessons ?? 0} ${t('teacher.lessonWord')}` },
                { icon: <PeopleIcon sx={{ fontSize: 18 }} />, text: `${course.totalStudents ?? 0}+ ${t('page.teachers.studentsCount')}` },
                { icon: <StarIcon sx={{ fontSize: 18 }} />, text: `${course.rating?.average ?? 0} ★` },
              ].map(({ icon, text }) => (
                <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'rgba(255,255,255,0.9)' }}>
                  {icon}
                  <Typography variant="body2">{text}</Typography>
                </Box>
              ))}
            </Stack>
          </motion.div>
        </Container>
      </Box>

      {/* Body */}
      <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>

            {/* ── Left column — on mobile shows BELOW right panel ── */}
            <Grid item xs={12} md={8} order={{ xs: 2, md: 1 }}>

              {/* What you'll learn */}
              {outcomes.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      <Typography variant="h6" fontWeight={700}>{t('page.courseDetail.whatLearn')}</Typography>
                    </Stack>
                    <Grid container spacing={1.5}>
                      {outcomes.map((o, i) => (
                        <Grid item xs={12} sm={6} key={i}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <CheckIcon sx={{ fontSize: 17, color: 'success.main', mt: '3px', flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{o[lang] ?? o.uz}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              )}

              {/* Syllabus */}
              {syllabus.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <ListAltIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="h6" fontWeight={700}>
                        {t('page.courseDetail.syllabus')} ({course.modules ?? 0} {t('page.courseDetail.moduleWord')} · {course.lessons ?? 0} {t('teacher.lessonWord')})
                      </Typography>
                    </Stack>
                    {syllabus.map(({ title, lessons, duration }, i) => {
                      const moduleText   = title[lang]    ?? title.uz;
                      const durationText = duration[lang] ?? duration.uz;
                      return (
                        <Accordion key={i} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 1, borderRadius: '8px !important' }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem', fontWeight: 700 }}>{i + 1}</Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>{moduleText}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {lessons} {t('teacher.lessonWord')} · {durationText}
                                </Typography>
                              </Box>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense disablePadding>
                              {Array.from({ length: Math.min(lessons, 4) }).map((_, j) => (
                                <ListItem key={j} sx={{ px: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 30 }}>
                                    <PlayCircleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={`${i + 1}.${j + 1} — ${t('teacher.lessonWord')} ${j + 1}`}
                                    primaryTypographyProps={{ fontSize: '0.85rem' }}
                                  />
                                </ListItem>
                              ))}
                              {lessons > 4 && (
                                <ListItem sx={{ px: 0 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    +{lessons - 4} {t('page.courseDetail.moreLessonsLabel')}
                                  </Typography>
                                </ListItem>
                              )}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Teacher */}
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    <Typography variant="h6" fontWeight={700}>{t('page.courseDetail.aboutTeacher')}</Typography>
                  </Stack>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    {course.teacher?.avatar?.url ? (
                      <Avatar src={course.teacher.avatar.url} sx={{ width: 64, height: 64 }} />
                    ) : (
                      <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, fontSize: '1.5rem', fontWeight: 700 }}>
                        {(course.teacher?.name?.[0] ?? '?').toUpperCase()}
                      </Avatar>
                    )}
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>{course.teacher?.name ?? '—'}</Typography>
                      <Typography variant="body2" color="text.secondary">{course.teacher?.subject ?? ''}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Rating value={course.rating?.average ?? 0} precision={0.1} size="small" readOnly />
                        <Typography variant="caption">{course.rating?.average ?? 0} · {course.teacher?.experience ?? 0} {t('page.teachers.yearsExp')}</Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* ── Right column: plan selection + enroll — on mobile shows FIRST ── */}
            <Grid item xs={12} md={4} order={{ xs: 1, md: 2 }}>
              <Box sx={{ position: { md: 'sticky' }, top: 80 }}>
                <Card
                  ref={buyCardRef}
                  elevation={0}
                  sx={{
                    border: '1.5px solid',
                    borderColor: isEnrolled
                      ? 'success.main'
                      : (selectedPlan?.color ?? sc.text) + '55',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: isEnrolled
                      ? '0 4px 30px #10B98120'
                      : `0 4px 30px ${selectedPlan?.color ?? sc.text}1A`,
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  {/* ── Gradient header ── */}
                  {isEnrolled ? (
                    <Box sx={{
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      px: 3, py: 2.25,
                      display: 'flex', alignItems: 'center', gap: 1.5,
                    }}>
                      <CheckCircleIcon sx={{ color: 'white', fontSize: 28, flexShrink: 0 }} />
                      <Box>
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.25 }}>
                          {lang === 'ru' ? 'Вы записаны' : 'Siz yozildingiz'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                          {lang === 'ru' ? 'Курс уже доступен' : 'Kurs allaqachon mavjud'}
                        </Typography>
                      </Box>
                    </Box>
                  ) : selectedPlan ? (
                    <Box sx={{
                      background: `linear-gradient(135deg, ${selectedPlan.color} 0%, ${selectedPlan.color}bb 100%)`,
                      px: 3, pt: 2.5, pb: 3,
                    }}>
                      {/* Plan label row */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.75 }}>
                        <Box sx={{
                          bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 1.5,
                          width: 34, height: 34, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <ActivePlanIcon sx={{ color: 'white', fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
                            {selectedPlan.name || (selectedPlan.nameKey ? t(selectedPlan.nameKey) : selectedPlan.id)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                            {selectedPlan.descKey
                              ? t(selectedPlan.descKey)
                              : (lang === 'ru' ? 'Ежемесячная оплата' : "Oylik to'lov")}
                          </Typography>
                        </Box>
                      </Box>
                      {/* Big price */}
                      <Typography sx={{
                        fontSize: { xs: '2.6rem', md: '2.9rem' },
                        fontWeight: 900, color: 'white', lineHeight: 1,
                        letterSpacing: '-0.02em',
                      }}>
                        {formatPrice(selectedPlan.price)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.3, display: 'block' }}>
                        {t('common.sum')}/{t('common.month')}
                      </Typography>
                    </Box>
                  ) : null}

                  {/* ── Stats row (duration / lessons / rating) ── */}
                  {!isEnrolled && (
                    <Box sx={{
                      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                      borderBottom: '1px solid', borderColor: 'divider',
                    }}>
                      {[
                        { Icon: TimerIcon,  val: `${course.duration ?? 0}`, label: lang === 'ru' ? 'месяцев' : 'oy' },
                        { Icon: SchoolIcon, val: course.lessons ?? 0,       label: lang === 'ru' ? 'уроков'  : 'dars' },
                        { Icon: StarIcon,   val: course.rating?.average
                            ? course.rating.average.toFixed(1) : '—',       label: lang === 'ru' ? 'рейтинг' : 'reyting' },
                      ].map(({ Icon, val, label }, idx) => (
                        <Box key={label} sx={{
                          py: 1.6, px: 0.5,
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          borderRight: idx < 2 ? '1px solid' : 'none',
                          borderColor: 'divider',
                          textAlign: 'center', gap: 0.25,
                        }}>
                          <Icon sx={{ color: selectedPlan?.color ?? sc.text, fontSize: 17 }} />
                          <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.1 }}>{val}</Typography>
                          <Typography variant="caption" color="text.secondary"
                            sx={{ lineHeight: 1.1, fontSize: '0.63rem' }}>
                            {label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <CardContent sx={{ p: 3 }}>

                    {/* ── Multi-plan selector ── */}
                    {!isSinglePlan && planOptions.length > 1 && (
                      <>
                        <Typography variant="caption" fontWeight={700} color="text.disabled"
                          sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}>
                          {t('payment.choosePlan')}
                        </Typography>
                        <Stack spacing={1} sx={{ mb: 2.5 }}>
                          {planOptions.map(({ id: planId, color, price, name, popular, nameKey, Icon }) => {
                            const isSelected  = effectivePlanId === planId;
                            const displayName = name || (nameKey ? t(nameKey) : planId);
                            return (
                              <Paper key={planId} variant="outlined"
                                onClick={() => setSelectedPlanId(planId)}
                                sx={{
                                  p: 1.5, borderRadius: 2, cursor: 'pointer',
                                  border: '2px solid',
                                  borderColor: isSelected ? color : 'divider',
                                  bgcolor: isSelected ? color + '10' : 'transparent',
                                  position: 'relative', transition: 'all 0.15s',
                                  boxShadow: isSelected ? `0 2px 12px ${color}30` : 'none',
                                  '&:hover': { borderColor: color, bgcolor: color + '0A' },
                                }}
                              >
                                {popular && (
                                  <Chip label={t('page.pricing.popular')} size="small"
                                    sx={{ position: 'absolute', top: -10, right: 10,
                                      bgcolor: color, color: 'white',
                                      fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                                )}
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                  <Box sx={{
                                    width: 34, height: 34, borderRadius: 1.5, flexShrink: 0,
                                    bgcolor: isSelected ? color + '22' : color + '14', color,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>
                                    <Icon sx={{ fontSize: 18 }} />
                                  </Box>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" fontWeight={700} noWrap>{displayName}</Typography>
                                    <Typography variant="caption" noWrap
                                      sx={{ color: isSelected ? color : 'text.secondary', fontWeight: isSelected ? 600 : 400 }}>
                                      {formatPrice(price)} {t('common.sum')}/{t('common.month')}
                                    </Typography>
                                  </Box>
                                  {isSelected && (
                                    <CheckCircleIcon sx={{ color, fontSize: 18, flexShrink: 0 }} />
                                  )}
                                </Stack>
                              </Paper>
                            );
                          })}
                        </Stack>
                      </>
                    )}

                    {/* Rejection alert */}
                    {verification?.status === 'rejected' && (
                      <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
                        {t('payment.rejectedMsg')}
                        {verification.reviewNote && (
                          <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                            {t('payment.adminNote')}: {verification.reviewNote}
                          </Typography>
                        )}
                      </Alert>
                    )}

                    {/* ── CTA button ── */}
                    {isEnrolled ? (
                      <Button
                        fullWidth variant="contained" size="large"
                        sx={{
                          py: 1.6, borderRadius: 2.5, mb: 1.5,
                          fontSize: '1rem', fontWeight: 700,
                          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                          boxShadow: '0 8px 20px #10B98140',
                          transition: 'all 0.18s',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                            filter: 'brightness(0.9)',
                            boxShadow: '0 12px 28px #10B98155',
                            transform: 'translateY(-1px)',
                          },
                        }}
                        onClick={() => navigate('/student')}
                      >
                        {t('payment.goToCourse')} →
                      </Button>
                    ) : verification?.status === 'pending' ? (
                      <Box sx={{ mb: 1.5 }}>
                        <Chip
                          label={t('payment.pendingChip')} color="warning"
                          sx={{ width: '100%', py: 2, fontWeight: 700, fontSize: '0.9rem', borderRadius: 2.5 }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block"
                          textAlign="center" sx={{ mt: 0.75 }}>
                          {t('payment.awaitingApproval')}
                        </Typography>
                      </Box>
                    ) : (
                      <Button
                        fullWidth variant="contained" size="large"
                        sx={{
                          py: 1.6, borderRadius: 2.5, mb: 1.5,
                          fontSize: '1rem', fontWeight: 700,
                          background: `linear-gradient(135deg, ${selectedPlan?.color ?? sc.text} 0%, ${selectedPlan?.color ?? sc.text}bb 100%)`,
                          boxShadow: `0 8px 20px ${selectedPlan?.color ?? sc.text}44`,
                          transition: 'all 0.18s',
                          '&:hover': {
                            background: `linear-gradient(135deg, ${selectedPlan?.color ?? sc.text} 0%, ${selectedPlan?.color ?? sc.text}bb 100%)`,
                            filter: 'brightness(0.88)',
                            boxShadow: `0 12px 28px ${selectedPlan?.color ?? sc.text}60`,
                            transform: 'translateY(-1px)',
                          },
                        }}
                        onClick={handleEnroll}
                      >
                        {!isAuth
                          ? `${t('page.courseDetail.btnRegisterEnroll')} →`
                          : verification?.status === 'rejected'
                            ? `${t('payment.retryPayment')} →`
                            : `${t('page.courseDetail.btnEnroll')} — ${formatPrice(selectedPlan?.price ?? 0)} →`}
                      </Button>
                    )}

                    {/* Trial lesson */}
                    <Button
                      fullWidth variant="outlined" size="large"
                      sx={{
                        py: 1.3, borderRadius: 2.5, mb: 3,
                        borderColor: (selectedPlan?.color ?? sc.text) + '55',
                        color: selectedPlan?.color ?? sc.text,
                        fontWeight: 600,
                        '&:hover': {
                          borderColor: selectedPlan?.color ?? sc.text,
                          bgcolor: (selectedPlan?.color ?? sc.text) + '08',
                        },
                      }}
                      onClick={() => navigate('/contacts')}
                    >
                      {t('page.courseDetail.trialLesson')}
                    </Button>

                    {/* ── Features list with icon-boxes ── */}
                    <Typography variant="caption" fontWeight={700} color="text.disabled"
                      sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.75 }}>
                      {lang === 'ru' ? 'Что включено' : 'Nima kiradi'}
                    </Typography>
                    <Stack spacing={1.5}>
                      {[
                        { Icon: TimerIcon,       text: `${course.duration ?? 0} ${t('page.courses.duration')} ${t('page.courseDetail.durationSuffix')}` },
                        { Icon: PlayCircleIcon,  text: `${course.lessons ?? 0} ${t('page.courseDetail.lessonsFeature')}` },
                        { Icon: ListAltIcon,     text: t('page.courseDetail.feature3') },
                        { Icon: PeopleIcon,      text: t('page.courseDetail.feature4') },
                        { Icon: CheckCircleIcon, text: t('page.courseDetail.feature5') },
                      ].map(({ Icon, text }) => (
                        <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 30, height: 30, borderRadius: '10px', flexShrink: 0,
                            bgcolor: (selectedPlan?.color ?? sc.text) + '14',
                            color: selectedPlan?.color ?? sc.text,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Icon sx={{ fontSize: 15 }} />
                          </Box>
                          <Typography variant="body2" fontWeight={500}>{text}</Typography>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── Mobile floating enroll bar ── */}
      {!isEnrolled && verification?.status !== 'pending' && (
        <Box
          sx={{
            display: { xs: showFloatingBar ? 'flex' : 'none', md: 'none' },
            position: 'fixed',
            bottom: 62,
            left: 0, right: 0,
            zIndex: 1300,
            bgcolor: 'background.paper',
            borderTop: '1px solid', borderColor: 'divider',
            px: 2, py: 1.5, gap: 2,
            alignItems: 'center',
            boxShadow: '0 -6px 24px rgba(0,0,0,0.14)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography sx={{
              fontWeight: 900, lineHeight: 1,
              fontSize: '1.35rem',
              color: selectedPlan?.color ?? sc.text,
            }}>
              {formatPrice(selectedPlan?.price ?? 0)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('common.sum')}/{t('common.month')}
            </Typography>
          </Box>
          <Button
            variant="contained" size="large"
            sx={{
              borderRadius: 2.5, py: 1.25, px: 2.5, flexShrink: 0,
              fontWeight: 700, fontSize: '0.95rem',
              background: `linear-gradient(135deg, ${selectedPlan?.color ?? sc.text} 0%, ${selectedPlan?.color ?? sc.text}bb 100%)`,
              boxShadow: `0 6px 18px ${selectedPlan?.color ?? sc.text}44`,
              '&:hover': { filter: 'brightness(0.9)', transform: 'translateY(-1px)' },
            }}
            onClick={handleEnroll}
          >
            {lang === 'ru' ? 'Записаться →' : "Yozilish →"}
          </Button>
        </Box>
      )}

      {/* Payment modal — plan already selected, skip plan step */}
      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        course={course}
        initialPlanId={selectedPlanId}
      />

      {/* Block dialog for admin/teacher */}
      <Dialog open={blockDialog} onClose={() => setBlockDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pt: 3, pb: 1 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: '#FEF3C7', mx: 'auto', mb: 1.5 }}>
            <BlockIcon sx={{ fontSize: 30, color: '#D97706' }} />
          </Avatar>
          <Typography variant="h6" fontWeight={800}>Kursga yozilish mumkin emas</Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>{user?.role === 'admin' ? 'Administrator' : "O'qituvchi"}</strong> hisobi orqali kurs sotib olib bo'lmaydi.
          </Typography>
          <Alert severity="info" icon={<HowToRegIcon />} sx={{ borderRadius: 2, textAlign: 'left' }}>
            Kursga yozilmoqchi bo'lsangiz — boshqa telefon raqam bilan <strong>o'quvchi (abituriyent)</strong> sifatida ro'yxatdan o'ting.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', gap: 1, px: 3, pb: 3 }}>
          <Button
            variant="contained" fullWidth startIcon={<HowToRegIcon />}
            href="/register"
            sx={{ borderRadius: 2, py: 1.1, fontWeight: 700 }}
          >
            Yangi o'quvchi sifatida ro'yxatdan o'tish
          </Button>
          <Button
            variant="outlined" fullWidth
            onClick={() => setBlockDialog(false)}
            sx={{ borderRadius: 2, py: 1.1 }}
          >
            Yopish
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
