import {
  Box, Container, Grid, Typography, Card, CardContent,
  Avatar, Chip, Button, Stack, Divider, List,
  ListItem, ListItemIcon, ListItemText, Accordion,
  AccordionSummary, AccordionDetails, CircularProgress, Alert,
} from '@mui/material';

import { useParams, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector }    from 'react-redux';
import { useState, useRef, useEffect } from 'react';
import { selectIsAuth, selectUser } from '../../../features/auth/authSlice.js';
import { useGetPackageByIdQuery, useCheckPackageAccessQuery } from '../../../features/packages/packagesApi.js';
import PaymentModal from '../../../components/payment/PaymentModal/index.jsx';
import { motion } from 'framer-motion';
import ExpandMoreIcon    from '@mui/icons-material/ExpandMore';
import CheckIcon         from '@mui/icons-material/Check';
import PlayCircleIcon    from '@mui/icons-material/PlayCircle';
import PictureAsPdfIcon  from '@mui/icons-material/PictureAsPdf';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LayersIcon        from '@mui/icons-material/Layers';
import PersonIcon        from '@mui/icons-material/Person';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import LockIcon          from '@mui/icons-material/Lock';
import TimerOffIcon      from '@mui/icons-material/TimerOff';
import DevicesIcon       from '@mui/icons-material/Devices';
import QuizIcon          from '@mui/icons-material/Quiz';
import { formatPrice } from '../../../data/mockData.js';
import i18n from '../../../utils/i18n.js';

const PKG_COLOR = '#7C3AED';

function getTitle(t) {
  if (!t) return '';
  if (typeof t === 'string') return t;
  return t[i18n.language] ?? t.uz ?? t.ru ?? '';
}

export default function PackageDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t }    = useTranslation();
  const isAuth   = useSelector(selectIsAuth);
  const user     = useSelector(selectUser);
  const lang     = i18n.language;

  const { data: pkgRes,   isLoading, isError } = useGetPackageByIdQuery(id);
  const { data: accessRes }                    = useCheckPackageAccessQuery(id, { skip: !isAuth });

  const [payOpen, setPayOpen]              = useState(false);
  const [showFloatingBar, setShowFloating] = useState(false);
  const buyCardRef = useRef(null);

  const pkg       = pkgRes?.data ?? null;
  const hasAccess = accessRes?.data?.hasAccess ?? false;

  /* Show floating mobile buy bar when the buy card scrolls off screen */
  useEffect(() => {
    const el = buyCardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setShowFloating(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pkg]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }
  if (isError || !pkg) return <Navigate to="/courses" replace />;

  const pkgTitle   = getTitle(pkg.title);
  const pkgDesc    = getTitle(pkg.description);
  const price      = pkg.price?.amount ?? 0;
  const modules    = (pkg.modules ?? []).filter((m) => m.isPublished !== false);
  const teacherName = pkg.teacher?.name ?? '—';
  const teacherInit = (teacherName[0] ?? '?').toUpperCase();

  const handleBuy = () => {
    if (!isAuth) { navigate('/register', { state: { from: location } }); return; }
    setPayOpen(true);
  };

  return (
    <Box sx={{ mx: { xs: -2, sm: -3 } }}>
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <Box sx={{
        background: `linear-gradient(135deg, ${PKG_COLOR}dd 0%, ${PKG_COLOR}88 100%)`,
        py: { xs: 5, md: 7 },
      }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Chip
              label={lang === 'ru' ? 'Индивидуальный пакет' : 'Individual paket'}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', mb: 2, fontWeight: 600 }}
            />
            <Typography variant="h3" fontWeight={800} sx={{
              color: 'white', mb: 2, maxWidth: 680,
              fontSize: { xs: '1.9rem', sm: '2.4rem', md: '3rem' },
            }}>
              {pkgTitle}
            </Typography>
            {pkgDesc && (
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, maxWidth: 560, lineHeight: 1.8 }}>
                {pkgDesc}
              </Typography>
            )}
            <Stack direction="row" spacing={3} flexWrap="wrap">
              {[
                { icon: <LayersIcon sx={{ fontSize: 18 }} />,  text: `${modules.length} ${lang === 'ru' ? 'модулей' : 'ta modul'}` },
                { icon: <TimerOffIcon sx={{ fontSize: 18 }} />, text: lang === 'ru' ? 'Без ограничений' : 'Muddatsiz' },
                { icon: <DevicesIcon sx={{ fontSize: 18 }} />,  text: lang === 'ru' ? 'Любое устройство' : 'Istalgan qurilma' },
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

      {/* ── Body ───────────────────────────────────────────────────── */}
      <Box sx={{ py: { xs: 4, md: 6 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>

            {/* ── Left col — on mobile shows BELOW right panel ── */}
            <Grid item xs={12} md={8} order={{ xs: 2, md: 1 }}>

              {/* Modules accordion */}
              {modules.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <LayersIcon sx={{ color: PKG_COLOR, fontSize: 20 }} />
                      <Typography variant="h6" fontWeight={700}>
                        {lang === 'ru' ? 'Содержание пакета' : 'Paket tarkibi'} ({modules.length} {lang === 'ru' ? 'модулей' : 'ta modul'})
                      </Typography>
                    </Stack>

                    {modules.map((mod, i) => {
                      const modTitle = getTitle(mod.title) || `${lang === 'ru' ? 'Модуль' : 'Modul'} ${i + 1}`;
                      const hasVideo = Boolean(mod.videoUrl);
                      const hasFile  = Boolean(mod.file?.url);
                      const hasQuiz  = mod.quiz?.length > 0;

                      return (
                        <Accordion key={mod._id ?? i} elevation={0}
                          sx={{ border: '1px solid', borderColor: 'divider', mb: 1, borderRadius: '8px !important' }}>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%', pr: 1 }}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: PKG_COLOR, fontSize: '0.75rem', fontWeight: 700 }}>
                                {i + 1}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="subtitle2" fontWeight={600} noWrap>{modTitle}</Typography>
                                <Stack direction="row" spacing={1} mt={0.25}>
                                  {hasVideo && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                      <OndemandVideoIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                      <Typography variant="caption" color="text.secondary">
                                        {lang === 'ru' ? 'Видео' : 'Video'}
                                      </Typography>
                                    </Box>
                                  )}
                                  {hasFile && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                      <PictureAsPdfIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                      <Typography variant="caption" color="text.secondary">
                                        {mod.file?.name || 'PDF'}
                                      </Typography>
                                    </Box>
                                  )}
                                  {hasQuiz && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                                      <QuizIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                      <Typography variant="caption" color="text.secondary">
                                        {mod.quiz.length} {lang === 'ru' ? 'вопр.' : 'savol'}
                                      </Typography>
                                    </Box>
                                  )}
                                </Stack>
                              </Box>
                              {!hasAccess && (
                                <LockIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
                              )}
                            </Box>
                          </AccordionSummary>

                          <AccordionDetails sx={{ pt: 0 }}>
                            {mod.description && (
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                                {mod.description}
                              </Typography>
                            )}
                            <List dense disablePadding>
                              {hasVideo && (
                                <ListItem sx={{ px: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <PlayCircleIcon sx={{ fontSize: 16, color: PKG_COLOR }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={lang === 'ru' ? 'Видео урок' : 'Video dars'}
                                    primaryTypographyProps={{ fontSize: '0.85rem' }}
                                  />
                                </ListItem>
                              )}
                              {hasFile && (
                                <ListItem sx={{ px: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <PictureAsPdfIcon sx={{ fontSize: 16, color: '#EF4444' }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={mod.file?.name || (lang === 'ru' ? 'Материал' : 'Material')}
                                    primaryTypographyProps={{ fontSize: '0.85rem' }}
                                  />
                                </ListItem>
                              )}
                              {hasQuiz && (
                                <ListItem sx={{ px: 0 }}>
                                  <ListItemIcon sx={{ minWidth: 28 }}>
                                    <QuizIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={`${lang === 'ru' ? 'Тест' : 'Test'}: ${mod.quiz.length} ${lang === 'ru' ? 'вопросов' : 'ta savol'}`}
                                    primaryTypographyProps={{ fontSize: '0.85rem' }}
                                  />
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
                    {pkg.teacher?.avatar?.url ? (
                      <Avatar src={pkg.teacher.avatar.url} sx={{ width: 64, height: 64 }} />
                    ) : (
                      <Avatar sx={{ bgcolor: PKG_COLOR, width: 64, height: 64, fontSize: '1.5rem', fontWeight: 700 }}>
                        {teacherInit}
                      </Avatar>
                    )}
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>{teacherName}</Typography>
                      {pkg.teacher?.subject && (
                        <Typography variant="body2" color="text.secondary">{pkg.teacher.subject}</Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* ── Right col: price + buy — on mobile shows FIRST ── */}
            <Grid item xs={12} md={4} order={{ xs: 1, md: 2 }}>
              <Box sx={{ position: { md: 'sticky' }, top: 80 }}>
                <Card
                  ref={buyCardRef}
                  elevation={0}
                  sx={{
                    border: '1.5px solid',
                    borderColor: hasAccess ? 'success.main' : PKG_COLOR + '55',
                    borderRadius: 3,
                    overflow: 'hidden',
                    boxShadow: hasAccess
                      ? '0 4px 30px #10B98120'
                      : `0 4px 30px ${PKG_COLOR}1A`,
                  }}
                >
                  {/* ── Gradient header ── */}
                  {hasAccess ? (
                    <Box sx={{
                      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      px: 3, py: 2.25,
                      display: 'flex', alignItems: 'center', gap: 1.5,
                    }}>
                      <CheckCircleIcon sx={{ color: 'white', fontSize: 28, flexShrink: 0 }} />
                      <Box>
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.25 }}>
                          {lang === 'ru' ? 'Доступ открыт' : 'Kirish ochiq'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                          {lang === 'ru' ? 'Вы уже приобрели этот пакет' : 'Siz bu paketni sotib oldingiz'}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Box sx={{
                      background: `linear-gradient(135deg, ${PKG_COLOR} 0%, #9F67FF 100%)`,
                      px: 3, pt: 2.5, pb: 3,
                    }}>
                      {/* Package label */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.75 }}>
                        <Box sx={{
                          bgcolor: 'rgba(255,255,255,0.18)', borderRadius: 1.5,
                          width: 34, height: 34, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <LayersIcon sx={{ color: 'white', fontSize: 18 }} />
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
                            {lang === 'ru' ? 'Индивидуальный пакет' : 'Individual paket'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                            {lang === 'ru' ? 'Единоразовая оплата' : "Bir martalik to'lov"}
                          </Typography>
                        </Box>
                      </Box>
                      {/* Big price */}
                      <Typography sx={{
                        fontSize: { xs: '2.6rem', md: '2.9rem' },
                        fontWeight: 900, color: 'white', lineHeight: 1,
                        letterSpacing: '-0.02em',
                      }}>
                        {formatPrice(price)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.3, display: 'block' }}>
                        {lang === 'ru' ? 'сум' : "so'm"}
                      </Typography>
                    </Box>
                  )}

                  {/* ── Stats row ── */}
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}>
                    {[
                      { Icon: LayersIcon,   val: modules.length, label: lang === 'ru' ? 'модулей'    : 'modul' },
                      { Icon: TimerOffIcon, val: '∞',            label: lang === 'ru' ? 'доступ'     : 'kirish' },
                      { Icon: DevicesIcon,  val: lang === 'ru' ? 'все' : 'barchasi', label: lang === 'ru' ? 'устройства' : 'qurilmalar' },
                    ].map(({ Icon, val, label }, idx) => (
                      <Box key={label} sx={{
                        py: 1.6, px: 0.5,
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        borderRight: idx < 2 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        textAlign: 'center', gap: 0.25,
                      }}>
                        <Icon sx={{ color: PKG_COLOR, fontSize: 17 }} />
                        <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.1 }}>{val}</Typography>
                        <Typography variant="caption" color="text.secondary"
                          sx={{ lineHeight: 1.1, fontSize: '0.63rem', textTransform: 'capitalize' }}>
                          {label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* ── Actions + features ── */}
                  <CardContent sx={{ p: 3 }}>

                    {/* CTA buy / go-to-learning */}
                    {hasAccess ? (
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
                        {lang === 'ru' ? 'Перейти к обучению →' : "O'qishga o'tish →"}
                      </Button>
                    ) : (
                      <Button
                        fullWidth variant="contained" size="large"
                        sx={{
                          py: 1.6, borderRadius: 2.5, mb: 1.5,
                          fontSize: '1rem', fontWeight: 700,
                          background: `linear-gradient(135deg, ${PKG_COLOR} 0%, #9F67FF 100%)`,
                          boxShadow: `0 8px 20px ${PKG_COLOR}44`,
                          transition: 'all 0.18s',
                          '&:hover': {
                            background: `linear-gradient(135deg, ${PKG_COLOR} 0%, #9F67FF 100%)`,
                            filter: 'brightness(0.88)',
                            boxShadow: `0 12px 28px ${PKG_COLOR}60`,
                            transform: 'translateY(-1px)',
                          },
                        }}
                        onClick={handleBuy}
                      >
                        {!isAuth
                          ? (lang === 'ru' ? 'Зарегистрируйтесь и купите →' : "Ro'yxatdan o'ting →")
                          : `${lang === 'ru' ? 'Купить' : 'Sotib olish'} — ${formatPrice(price)} →`}
                      </Button>
                    )}

                    {/* Ask question */}
                    <Button
                      fullWidth variant="outlined" size="large"
                      sx={{
                        py: 1.3, borderRadius: 2.5, mb: 3,
                        borderColor: PKG_COLOR + '55', color: PKG_COLOR,
                        fontWeight: 600,
                        '&:hover': { borderColor: PKG_COLOR, bgcolor: PKG_COLOR + '08' },
                      }}
                      onClick={() => navigate('/contacts')}
                    >
                      {lang === 'ru' ? 'Задать вопрос' : 'Savol berish'}
                    </Button>

                    {/* Features list */}
                    <Typography variant="caption" fontWeight={700} color="text.disabled"
                      sx={{ textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.75 }}>
                      {lang === 'ru' ? 'Что включено' : 'Nima kiradi'}
                    </Typography>
                    <Stack spacing={1.5}>
                      {[
                        { Icon: LayersIcon,        text: lang === 'ru' ? `${modules.length} модулей в пакете`       : `${modules.length} ta modul` },
                        { Icon: TimerOffIcon,      text: lang === 'ru' ? 'Доступ без ограничений по времени'        : 'Vaqt cheklovisiz kirish' },
                        { Icon: PictureAsPdfIcon,  text: lang === 'ru' ? 'Материалы и файлы'                        : 'Materiallar va fayllar' },
                        { Icon: OndemandVideoIcon, text: lang === 'ru' ? 'Видео уроки'                               : 'Video darslar' },
                        { Icon: QuizIcon,          text: lang === 'ru' ? 'Тесты по темам'                           : "Mavzular bo'yicha testlar" },
                      ].map(({ Icon, text }) => (
                        <Box key={text} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 30, height: 30, borderRadius: '10px', flexShrink: 0,
                            bgcolor: PKG_COLOR + '14', color: PKG_COLOR,
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

      {/* ── Mobile floating buy bar (appears when buy card scrolls off-screen) ── */}
      {!hasAccess && (
        <Box
          sx={{
            display: { xs: showFloatingBar ? 'flex' : 'none', md: 'none' },
            position: 'fixed',
            bottom: 62, /* above BottomNav */
            left: 0,
            right: 0,
            zIndex: 1300,
            bgcolor: 'background.paper',
            borderTop: '1px solid',
            borderColor: 'divider',
            px: 2,
            py: 1.5,
            gap: 2,
            alignItems: 'center',
            boxShadow: '0 -6px 24px rgba(0,0,0,0.14)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'opacity 0.2s',
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 900, color: PKG_COLOR, fontSize: '1.35rem', lineHeight: 1 }}>
              {formatPrice(price)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lang === 'ru' ? 'сум · Единоразово' : "so'm · Bir marta"}
            </Typography>
          </Box>
          <Button
            variant="contained" size="large"
            sx={{
              borderRadius: 2.5, py: 1.25, px: 2.5, flexShrink: 0,
              fontWeight: 700, fontSize: '0.95rem',
              background: `linear-gradient(135deg, ${PKG_COLOR} 0%, #9F67FF 100%)`,
              boxShadow: `0 6px 18px ${PKG_COLOR}44`,
              '&:hover': { filter: 'brightness(0.9)', transform: 'translateY(-1px)' },
            }}
            onClick={handleBuy}
          >
            {lang === 'ru' ? 'Купить →' : 'Sotib olish →'}
          </Button>
        </Box>
      )}

      {/* Payment modal — package mode */}
      <PaymentModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        pkg={pkg}
      />
    </Box>
  );
}
