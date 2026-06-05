import {
  Box, Typography, Stack, Grid, Avatar, Chip, Button,
  Divider, CircularProgress, LinearProgress, Tooltip,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate }    from 'react-router-dom';
import { motion }         from 'framer-motion';
import SchoolIcon         from '@mui/icons-material/School';
import AssignmentIcon     from '@mui/icons-material/Assignment';
import QuizIcon           from '@mui/icons-material/Quiz';
import TrendingUpIcon     from '@mui/icons-material/TrendingUp';
import ArrowForwardIcon   from '@mui/icons-material/ArrowForward';
import NotificationsIcon  from '@mui/icons-material/Notifications';
import CalendarTodayIcon  from '@mui/icons-material/CalendarToday';
import PaymentIcon        from '@mui/icons-material/Payment';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import AutoAwesomeIcon    from '@mui/icons-material/AutoAwesome';
import EventBusyIcon      from '@mui/icons-material/EventBusy';
import GroupsIcon         from '@mui/icons-material/Groups';
import AccessTimeIcon     from '@mui/icons-material/AccessTime';
import { useTheme }       from '@mui/material/styles';
import { useSelector }    from 'react-redux';
import { useTranslation } from 'react-i18next';
import { selectUser }     from '../../../features/auth/authSlice.js';
import { useGetStudentDashboardQuery }    from '../../../features/dashboard/dashboardApi.js';
import { useGetMyGroupsQuery }           from '../../../features/groups/groupsApi.js';
import i18n from '../../../utils/i18n.js';

/* ─── constants ─────────────────────────────────────────────────────────── */
const PALETTE = ['#6366F1','#10B981','#F59E0B','#EF4444','#3B82F6','#7C3AED','#0891B2','#EC4899'];
function gName(group) {
  if (!group) return '';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const n = group.name;
  if (typeof n === 'object') return n[lang] ?? n.uz ?? n.ru ?? '';
  return n ?? '';
}

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
function KpiCard({ label, value, suffix, icon: Icon, color, delay = 0, isLoading, onClick }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.32, ease: 'easeOut' }} style={{ height: '100%' }}>
      <Box onClick={onClick} sx={{
        height: '100%', p: 2.5, borderRadius: 3, position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        background: isDark
          ? `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`
          : `linear-gradient(135deg, ${color}14 0%, ${color}04 100%)`,
        border: '1px solid', borderColor: isDark ? `${color}35` : `${color}22`,
        transition: 'all 0.2s ease',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: `0 8px 28px ${color}22`, borderColor: `${color}55` } : {},
      }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography sx={{ fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.09em',
              color: 'text.disabled', fontWeight: 700, mb: 1.25, display: 'block' }}>
              {label}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="baseline">
              <Typography sx={{ fontSize: '2rem', fontWeight: 900, lineHeight: 1, color,
                fontVariantNumeric: 'tabular-nums', textShadow: `0 2px 12px ${color}40` }}>
                {isLoading ? '—' : value}
              </Typography>
              {suffix && <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', fontWeight: 600 }}>{suffix}</Typography>}
            </Stack>
          </Box>
          <Box sx={{ width: 42, height: 42, borderRadius: 2.5, flexShrink: 0,
            bgcolor: isDark ? `${color}20` : `${color}15`,
            border: `1px solid ${color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon sx={{ fontSize: 22, color, opacity: 0.9 }} />
          </Box>
        </Stack>
      </Box>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function StudentDashboard() {
  const navigate = useNavigate();
  const { t }    = useTranslation();
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const user     = useSelector(selectUser);
  const lang     = i18n.language === 'ru' ? 'ru' : 'uz';

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { data: dashRes, isLoading } = useGetStudentDashboardQuery(undefined, { pollingInterval: 60_000 });
  const dashData = dashRes?.data ?? {};

  const { data: groupsRes } = useGetMyGroupsQuery();
  const myGroups = groupsRes?.data ?? groupsRes ?? [];

  const homework      = dashData.homework      ?? { due: 0, done: 0 };
  const attendancePct = dashData.attendancePct ?? 0;
  const testAvgPct    = dashData.testAvgPct    ?? 0;
  const upcomingTests = dashData.upcomingTests ?? [];
  const recentNotifs  = dashData.recentNotifs  ?? [];
  const paymentStatus = dashData.paymentStatus ?? [];

  const unreadCount  = recentNotifs.filter((n) => !n.isRead && !n.read).length;
  const pendingPayment = paymentStatus.find((p) => p.status === 'debt' || p.status === 'pending');

  /* Name */
  const displayName = (() => {
    const n = lang === 'ru' ? user?.nameRu : user?.nameUz;
    return (n || user?.name || '').split(' ')[0] || t('student.defaultUser');
  })();

  /* Greeting via i18n keys */
  const greetingText = (() => {
    const h = now.getHours();
    if (h >= 5  && h < 12) return t('student.greetingMorning');
    if (h >= 12 && h < 17) return t('student.greetingAfternoon');
    if (h >= 17 && h < 21) return t('student.greetingEvening');
    return t('student.greetingNight');
  })();

  /* Locale-aware full date */
  const locale  = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
  const todayFull = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const timeStr   = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  /* Upcoming lesson from groups schedule */
  const nextLesson = (() => {
    const today = now.getDay(); // 0=Sun
    let best = null;
    for (const g of myGroups) {
      for (const slot of (g.schedule ?? [])) {
        const diff = ((slot.dayOfWeek - today + 7) % 7) || 7;
        if (!best || diff < best.diff) {
          best = { diff, group: g, slot };
        }
      }
    }
    return best;
  })();

  return (
    <Box sx={{ pb: 5 }}>

      {/* ══════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}>
        <Box sx={{
          position: 'relative', overflow: 'hidden', borderRadius: 4, mb: 3.5,
          background: isDark
            ? 'linear-gradient(135deg, #1E3A5F 0%, #1B2A4A 40%, #1E1B4B 100%)'
            : 'linear-gradient(135deg, #1D4ED8 0%, #1976D2 50%, #0891B2 100%)',
          px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 3.5 }, minHeight: 130,
        }}>
          {/* Decorative */}
          <Box sx={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200,
            borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', right: 60, bottom: -60, width: 160, height: 160,
            borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ position: 'relative', zIndex: 1 }}>

            {/* Left */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <AutoAwesomeIcon sx={{ fontSize: 16, color: '#FCD34D' }} />
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {greetingText}
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 900, color: '#fff',
                lineHeight: 1.15, mb: 0.75 }}>
                {displayName}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <CalendarTodayIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }} />
                  <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.75)', textTransform: 'capitalize' }}>
                    {todayFull}
                  </Typography>
                </Stack>
                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.3)' }} />
                <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums' }}>
                  {timeStr}
                </Typography>
              </Stack>
            </Box>

            {/* Right badges */}
            <Stack direction="column" spacing={1} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>
              {/* Pending payment warning */}
              {pendingPayment && (
                <Box onClick={() => navigate('/student/payments')} sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
                  px: 1.5, py: 0.75, borderRadius: 2,
                  bgcolor: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
                  transition: 'all 0.15s', '&:hover': { bgcolor: 'rgba(239,68,68,0.3)' },
                }}>
                  <PaymentIcon sx={{ fontSize: 15, color: '#FCA5A5' }} />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#FCA5A5' }}>
                    {t('student.pendingPaymentBadge')}
                  </Typography>
                </Box>
              )}
              {/* Upcoming test badge */}
              {upcomingTests.length > 0 && (
                <Box onClick={() => navigate('/student/tests')} sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
                  px: 1.5, py: 0.75, borderRadius: 2,
                  bgcolor: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)',
                  transition: 'all 0.15s', '&:hover': { bgcolor: 'rgba(124,58,237,0.3)' },
                }}>
                  <QuizIcon sx={{ fontSize: 15, color: '#C4B5FD' }} />
                  <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#C4B5FD' }}>
                    {t('student.upcomingTestsBadge', { count: upcomingTests.length })}
                  </Typography>
                </Box>
              )}
            </Stack>
          </Stack>
        </Box>
      </motion.div>

      {/* ══════════════════════════════════════════════════
          KPI CARDS
      ══════════════════════════════════════════════════ */}
      <Grid container spacing={2} sx={{ mb: 3.5 }}>
        {[
          { label: t('student.kpiGroups'),      value: myGroups.length,                         suffix: t('common.seeAll').includes('се') ? '' : 'ta', icon: GroupsIcon,      color: '#6366F1', delay: 0.05, path: '/student/courses'  },
          { label: t('student.kpiHomework'),    value: homework.due,                            suffix: lang === 'ru' ? '' : 'ta',                     icon: AssignmentIcon,  color: '#F59E0B', delay: 0.10, path: '/student/homework' },
          { label: t('student.kpiAttendance'),  value: attendancePct,                           suffix: '%',                                           icon: CheckCircleIcon, color: '#10B981', delay: 0.15 },
          { label: t('student.kpiAvgScore'),    value: testAvgPct > 0 ? `${testAvgPct}%` : '—', suffix: '',                                           icon: TrendingUpIcon,  color: '#7C3AED', delay: 0.20, path: '/student/tests' },
        ].map((k) => (
          <Grid item xs={6} sm={3} key={k.label}>
            <KpiCard {...k} isLoading={isLoading} onClick={k.path ? () => navigate(k.path) : undefined} />
          </Grid>
        ))}
      </Grid>

      {isLoading && <LinearProgress sx={{ mb: 3, borderRadius: 1, '& .MuiLinearProgress-bar': { borderRadius: 1 } }} />}

      {/* ══════════════════════════════════════════════════
          CONTENT ROW
      ══════════════════════════════════════════════════ */}
      <Grid container spacing={2.5}>

        {/* ── LEFT: My groups + upcoming tests ── */}
        <Grid item xs={12} md={8}>

          {/* My groups */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}>
            <Box sx={{
              mb: 2.5, borderRadius: 3, overflow: 'hidden',
              bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
              boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              {/* Header */}
              <Stack direction="row" justifyContent="space-between" alignItems="center"
                sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider',
                  bgcolor: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)' }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SchoolIcon sx={{ fontSize: 17, color: '#6366F1' }} />
                  </Box>
                  <Typography fontWeight={800} fontSize="0.95rem">{t('student.myGroups')}</Typography>
                  {myGroups.length > 0 && (
                    <Box sx={{ minWidth: 22, height: 22, borderRadius: 5, bgcolor: '#6366F1',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', px: 0.75 }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff' }}>{myGroups.length}</Typography>
                    </Box>
                  )}
                </Stack>
                <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => navigate('/student/courses')}
                  sx={{ textTransform: 'none', fontSize: '0.78rem', color: 'text.secondary',
                    borderRadius: 2, '&:hover': { color: '#6366F1' } }}>
                  {t('common.seeAll')}
                </Button>
              </Stack>

              {/* Body */}
              {myGroups.length === 0 ? (
                <Box sx={{ py: 5, textAlign: 'center' }}>
                  <EventBusyIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>{t('student.notInGroup')}</Typography>
                  <Typography variant="caption" color="text.disabled">{t('student.notInGroupHint')}</Typography>
                </Box>
              ) : (
                <Box>
                  {myGroups.map((g, i) => {
                    const color = PALETTE[i % PALETTE.length];
                    const schedule = (g.schedule ?? []).slice(0, 2);
                    return (
                      <Box key={g._id} sx={{
                        px: 2.5, py: 1.75,
                        borderBottom: i < myGroups.length - 1 ? '1px solid' : 'none',
                        borderColor: 'divider',
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                      }}>
                        <Stack direction="row" alignItems="center" spacing={1.75}>
                          {/* Color bar */}
                          <Box sx={{ width: 4, height: 36, borderRadius: 1, bgcolor: color, flexShrink: 0 }} />
                          {/* Info */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography fontWeight={700} fontSize="0.9rem" noWrap>{gName(g)}</Typography>
                            {g.course && (
                              <Typography variant="caption" color="text.disabled" noWrap>
                                {typeof g.course.title === 'object' ? (g.course.title[lang] ?? g.course.title.uz) : g.course.title}
                              </Typography>
                            )}
                          </Box>
                          {/* Schedule pills */}
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="flex-end">
                            {schedule.map((slot, si) => {
                              const DAYS_UZ = ['Yak','Du','Se','Ch','Pa','Ju','Sha'];
                              const DAYS_RU = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
                              const DAYS = lang === 'ru' ? DAYS_RU : DAYS_UZ;
                              return (
                                <Box key={si} sx={{
                                  display: 'inline-flex', alignItems: 'center', gap: 0.3,
                                  px: 0.75, py: 0.25, borderRadius: 1.5,
                                  bgcolor: isDark ? `${color}18` : `${color}12`,
                                  border: `1px solid ${color}25`,
                                  fontSize: '0.65rem', fontWeight: 700, color,
                                }}>
                                  <AccessTimeIcon sx={{ fontSize: 10 }} />
                                  {DAYS[slot.dayOfWeek ?? 0]} {slot.startTime}
                                </Box>
                              );
                            })}
                          </Stack>
                          {/* Status */}
                          <Chip size="small" label={g.isActive ? t('status.active') : t('status.pending')}
                            sx={{
                              height: 20, fontSize: '0.62rem', fontWeight: 700,
                              bgcolor: g.isActive ? 'rgba(16,185,129,0.12)' : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                              color: g.isActive ? '#10B981' : 'text.disabled',
                              border: 'none',
                            }} />
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </motion.div>

          {/* Upcoming tests */}
          {upcomingTests.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}>
              <Box sx={{
                borderRadius: 3, overflow: 'hidden',
                bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center"
                  sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider',
                    bgcolor: isDark ? 'rgba(124,58,237,0.06)' : 'rgba(124,58,237,0.04)' }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: 'rgba(124,58,237,0.12)',
                      border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <QuizIcon sx={{ fontSize: 17, color: '#7C3AED' }} />
                    </Box>
                    <Typography fontWeight={800} fontSize="0.95rem">{t('student.upcomingTests')}</Typography>
                    <Box sx={{ minWidth: 22, height: 22, borderRadius: 5, bgcolor: '#7C3AED',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', px: 0.75 }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff' }}>{upcomingTests.length}</Typography>
                    </Box>
                  </Stack>
                  <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    onClick={() => navigate('/student/tests')}
                    sx={{ textTransform: 'none', fontSize: '0.78rem', color: 'text.secondary',
                      borderRadius: 2, '&:hover': { color: '#7C3AED' } }}>
                    {t('common.seeAll')}
                  </Button>
                </Stack>
                {upcomingTests.map((test, i) => {
                  const dl = test.endTime
                    ? new Date(test.endTime).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
                    : null;
                  return (
                    <Box key={test._id ?? i} sx={{
                      px: 2.5, py: 1.5,
                      borderBottom: i < upcomingTests.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#7C3AED', flexShrink: 0 }} />
                          <Typography fontSize="0.85rem" fontWeight={600}>{test.title}</Typography>
                        </Stack>
                        {dl && (
                          <Chip size="small" label={dl}
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700,
                              bgcolor: 'rgba(124,58,237,0.1)', color: '#7C3AED', border: 'none' }} />
                        )}
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            </motion.div>
          )}
        </Grid>

        {/* ── RIGHT: Notifications + Payment ── */}
        <Grid item xs={12} md={4}>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}>
            <Box sx={{
              mb: 2.5, borderRadius: 3, overflow: 'hidden',
              bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
              boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center"
                sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <NotificationsIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                  </Box>
                  <Typography fontWeight={800} fontSize="0.95rem">{t('student.notifications')}</Typography>
                  {unreadCount > 0 && (
                    <Box sx={{ minWidth: 22, height: 22, borderRadius: 5, bgcolor: '#EF4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', px: 0.75 }}>
                      <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff' }}>{unreadCount}</Typography>
                    </Box>
                  )}
                </Stack>
                <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                  onClick={() => navigate('/student/notifications')}
                  sx={{ textTransform: 'none', fontSize: '0.78rem', color: 'text.secondary', borderRadius: 2 }}>
                  {t('common.seeAll')}
                </Button>
              </Stack>

              {recentNotifs.length === 0 ? (
                <Box sx={{ py: 3.5, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.disabled">{t('student.noNotifsDash')}</Typography>
                </Box>
              ) : (
                recentNotifs.slice(0, 4).map((n, i) => {
                  const isUnread = !n.isRead && !n.read;
                  return (
                    <Box key={n._id ?? i} sx={{
                      px: 2.5, py: 1.25,
                      borderBottom: i < Math.min(recentNotifs.length, 4) - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      bgcolor: isUnread ? (isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.03)') : 'transparent',
                    }}>
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <Box sx={{ width: 6, height: 6, mt: 0.75, borderRadius: '50%', flexShrink: 0,
                          bgcolor: isUnread ? '#6366F1' : 'text.disabled' }} />
                        <Box>
                          <Typography sx={{ fontSize: '0.78rem', fontWeight: isUnread ? 700 : 400,
                            color: isUnread ? 'text.primary' : 'text.secondary', lineHeight: 1.4 }} noWrap>
                            {n.title || n.message}
                          </Typography>
                          <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', mt: 0.2 }}>
                            {n.createdAt ? new Date(n.createdAt).toLocaleDateString(locale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  );
                })
              )}
            </Box>
          </motion.div>

          {/* Payment status */}
          {paymentStatus.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.22 }}>
              <Box sx={{
                borderRadius: 3, overflow: 'hidden',
                bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                boxShadow: isDark ? '0 2px 12px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
              }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center"
                  sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PaymentIcon sx={{ fontSize: 17, color: '#10B981' }} />
                    </Box>
                    <Typography fontWeight={800} fontSize="0.95rem">{t('student.payments')}</Typography>
                  </Stack>
                  <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                    onClick={() => navigate('/student/payments')}
                    sx={{ textTransform: 'none', fontSize: '0.78rem', color: 'text.secondary', borderRadius: 2 }}>
                    {t('common.seeAll')}
                  </Button>
                </Stack>
                {paymentStatus.slice(0, 3).map((p, i) => {
                  const isPaid  = p.status === 'paid';
                  const isDebt  = p.status === 'debt';
                  const dotColor = isPaid ? '#10B981' : isDebt ? '#EF4444' : '#F59E0B';
                  const groupN = gName(p.group) || (typeof p.group?.name === 'string' ? p.group.name : p.month);
                  return (
                    <Box key={p._id ?? i} sx={{
                      px: 2.5, py: 1.25,
                      borderBottom: i < Math.min(paymentStatus.length, 3) - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                    }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />
                          <Typography fontSize="0.78rem" fontWeight={500} noWrap sx={{ maxWidth: 120 }}>
                            {groupN}
                          </Typography>
                        </Stack>
                        <Chip size="small"
                          label={isPaid ? t('status.paid') : isDebt ? t('common.debt') : t('status.pending')}
                          sx={{
                            height: 20, fontSize: '0.62rem', fontWeight: 700, border: 'none',
                            bgcolor: isPaid ? 'rgba(16,185,129,0.1)' : isDebt ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                            color: isPaid ? '#10B981' : isDebt ? '#EF4444' : '#F59E0B',
                          }} />
                      </Stack>
                    </Box>
                  );
                })}
              </Box>
            </motion.div>
          )}

          {/* Next lesson */}
          {nextLesson && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.28 }}>
              <Box sx={{
                mt: 2.5, borderRadius: 3, overflow: 'hidden',
                bgcolor: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
                border: '1px solid rgba(99,102,241,0.2)',
              }}>
                <Box sx={{ px: 2.5, py: 1.75 }}>
                  <Typography sx={{ fontSize: '0.62rem', fontWeight: 700, color: '#6366F1',
                    textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>
                    {t('student.nextLesson')}
                  </Typography>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography fontWeight={700} fontSize="0.9rem">{gName(nextLesson.group)}</Typography>
                      <Typography variant="caption" color="text.disabled">
                        {(() => {
                          const DAYS_UZ2 = ['Yak','Du','Se','Ch','Pa','Ju','Sha'];
                          const DAYS_RU2 = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
                          const dayName = (lang === 'ru' ? DAYS_RU2 : DAYS_UZ2)[nextLesson.slot.dayOfWeek ?? 0];
                          const diff = nextLesson.diff;
                          if (lang === 'ru') return `${dayName}${diff === 1 ? ' — завтра' : `, через ${diff} дн.`}`;
                          return `${dayName}${diff === 1 ? ' — ertaga' : `, ${diff} kundan so'ng`}`;
                        })()}
                      </Typography>
                    </Box>
                    <Box sx={{ px: 1.5, py: 0.75, borderRadius: 2,
                      bgcolor: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, color: '#6366F1',
                        fontVariantNumeric: 'tabular-nums' }}>
                        {nextLesson.slot.startTime}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </motion.div>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
