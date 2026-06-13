import {
  Box, Grid, Typography, Card, CardContent, CardActions,
  Chip, Button, Stack, CircularProgress, Avatar, Alert,
} from '@mui/material';
import { useNavigate }    from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMemo }        from 'react';
import { motion }         from 'framer-motion';
import PlayCircleIcon      from '@mui/icons-material/PlayCircle';
import MenuBookIcon        from '@mui/icons-material/MenuBook';
import CheckCircleIcon     from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon  from '@mui/icons-material/HourglassEmpty';
import AccessTimeIcon      from '@mui/icons-material/AccessTime';
import ArrowForwardIcon    from '@mui/icons-material/ArrowForward';
import ScheduleIcon        from '@mui/icons-material/Schedule';
import PageHeader          from '../../../components/common/PageHeader/index.jsx';
import { useGetMyGroupsQuery }       from '../../../features/groups/groupsApi.js';
import { useGetMyApplicationsQuery } from '../../../features/enrollment/enrollmentApi.js';
import i18n from '../../../utils/i18n.js';

const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

export default function StudentCourses() {
  const navigate    = useNavigate();
  const { t }       = useTranslation();
  const lang        = i18n.language === 'ru' ? 'ru' : 'uz';

  /* All groups the student is a member of (active + not-yet-started) */
  const { data: groupsRes, isLoading: groupsLoading } = useGetMyGroupsQuery();
  const groups = groupsRes?.data ?? groupsRes ?? [];

  /* Pending online applications (paid but no group yet) */
  const { data: appsRes, isLoading: appsLoading } = useGetMyApplicationsQuery();
  const myApps = appsRes?.data ?? appsRes ?? [];

  const isLoading = groupsLoading || appsLoading;

  /* Active groups — course started */
  const activeGroups = useMemo(() => groups.filter((g) => g.isActive === true), [groups]);

  /* Not-yet-started groups — admin added student but group not started */
  const pendingGroups = useMemo(() => groups.filter((g) => g.isActive === false), [groups]);

  /* Set of course IDs already covered by groups (both active + pending) */
  const groupCourseIds = useMemo(() => {
    const ids = new Set();
    groups.forEach((g) => {
      const cid = g.course?._id ?? g.course;
      if (cid) ids.add(String(cid));
    });
    return ids;
  }, [groups]);

  /* Online paid applications not yet assigned to a group */
  const onlinePendingApps = useMemo(() =>
    myApps.filter((a) => {
      if (a.status !== 'pending') return false;
      const cid = a.course?._id ?? a.course;
      return cid && !groupCourseIds.has(String(cid));
    }),
  [myApps, groupCourseIds]);

  const isEmpty = activeGroups.length === 0 && pendingGroups.length === 0 && onlinePendingApps.length === 0;

  const getTitle = (c) => {
    if (!c) return '—';
    const raw = c?.title;
    if (!raw) return '—';
    if (typeof raw === 'object') return raw[lang] ?? raw.uz ?? raw.ru ?? '—';
    return raw;
  };

  /* ── Shared card renderer ─────────────────────────────────────────────────── */
  const renderCard = (group, idx, state) => {
    const c     = group.course;
    const color = PALETTE[idx % PALETTE.length];
    const title = getTitle(c);
    const teacherName = group.teacher?.name ?? '—';

    const isActive  = state === 'active';
    const isPending = state === 'pending';

    return (
      <Grid item xs={12} sm={6} md={4} key={group._id}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.22 }}
          style={{ height: '100%' }}
        >
          <Card sx={{
            height: '100%', display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden',
            border: isActive ? `2px solid ${color}` : `2px dashed ${isPending ? '#F59E0B' : color}`,
            transition: 'box-shadow 0.18s, transform 0.18s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
          }}>
            {/* Top color bar */}
            <Box sx={{ height: 6, background: `linear-gradient(90deg, ${isActive ? color : '#F59E0B'} 0%, ${isActive ? color + '88' : '#FDE68A'} 100%)` }} />

            {/* Status badge */}
            <Box sx={{
              position: 'absolute', top: 16, right: 12,
              bgcolor: isActive ? color : '#FEF3C7',
              color: isActive ? 'white' : '#92400E',
              borderRadius: 4, px: 1.25, py: 0.4,
              display: 'flex', alignItems: 'center', gap: 0.5,
              fontSize: '0.68rem', fontWeight: 700,
            }}>
              {isActive
                ? <><CheckCircleIcon sx={{ fontSize: 12 }} />{lang === 'ru' ? 'Идёт' : 'Faol'}</>
                : <><ScheduleIcon sx={{ fontSize: 12 }} />{lang === 'ru' ? 'Скоро начнётся' : 'Tez boshlanadi'}</>
              }
            </Box>

            <CardContent sx={{ flex: 1, p: 2.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5, pr: 9 }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: (isActive ? color : '#F59E0B') + '18', color: isActive ? color : '#D97706', flexShrink: 0, borderRadius: 2 }}>
                  <MenuBookIcon sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>{title}</Typography>
                  <Typography variant="caption" color="text.secondary">{teacherName}</Typography>
                </Box>
              </Stack>

              {/* Chips */}
              <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5, mb: 1.5 }}>
                {c?.subject && (
                  <Chip label={c.subject} size="small"
                    sx={{ bgcolor: (isActive ? color : '#F59E0B') + '14', color: isActive ? color : '#D97706', fontWeight: 600, fontSize: '0.68rem', height: 22 }} />
                )}
                {c?.duration != null && (
                  <Chip icon={<AccessTimeIcon sx={{ fontSize: '12px !important' }} />}
                    label={`${c.duration} ${t('common.month')}`}
                    size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 22 }} />
                )}
              </Stack>

              {/* Group info */}
              <Box sx={{ p: 1.25, bgcolor: (isActive ? color : '#F59E0B') + '0A', borderRadius: 1.5, border: `1px solid ${(isActive ? color : '#F59E0B')}20` }}>
                <Typography variant="caption" color={isActive ? color : '#D97706'} fontWeight={700}>
                  {lang === 'ru' ? 'Группа:' : 'Guruh:'} {group.name}
                </Typography>
                {group.type && group.type !== 'individual_package' && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    {group.type === 'online' ? (lang === 'ru' ? 'Онлайн' : 'Online')
                      : group.type === 'offline' ? (lang === 'ru' ? 'Оффлайн' : 'Offline')
                      : group.type === 'individual_online' ? (lang === 'ru' ? 'Индивидуальный онлайн' : 'Individual online')
                      : group.type === 'individual_offline' ? (lang === 'ru' ? 'Индивидуальный оффлайн' : 'Individual offline')
                      : group.type}
                  </Typography>
                )}
              </Box>

              {/* Not started — hint message */}
              {isPending && (
                <Box sx={{ mt: 1.5 }}>
                  <Alert severity="success" icon={<CheckCircleIcon sx={{ fontSize: 16 }} />} sx={{ borderRadius: 2, py: 0.5, fontSize: '0.75rem', mb: 0.75 }}>
                    <strong>{lang === 'ru' ? '✅ Оплата подтверждена' : "✅ To'lov tasdiqlandi"}</strong>
                  </Alert>
                  <Alert severity="warning" sx={{ borderRadius: 2, py: 0.5, fontSize: '0.75rem' }}>
                    {lang === 'ru'
                      ? 'Вы зачислены в группу. Курс начнётся в ближайшее время — следите за уведомлениями.'
                      : "Siz guruhga qo'shildingiz. Kurs tez orada boshlanadi — xabarnomalarni kuting."}
                  </Alert>
                </Box>
              )}
            </CardContent>

            <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
              {isActive ? (
                <Button
                  variant="contained" fullWidth
                  startIcon={<PlayCircleIcon />}
                  endIcon={<ArrowForwardIcon />}
                  sx={{ borderRadius: 2, py: 1, bgcolor: color, fontWeight: 700, '&:hover': { bgcolor: color, filter: 'brightness(0.9)' }, boxShadow: `0 4px 12px ${color}40` }}
                  onClick={() => {
                    if (group.type === 'individual_package') {
                      const pkgId = group.package?._id ?? group.package;
                      navigate(pkgId ? `/student/video-lessons?pkg=${pkgId}` : '/student/video-lessons');
                    } else {
                      navigate('/student/homework');
                    }
                  }}
                >
                  {group.type === 'individual_package'
                    ? (lang === 'ru' ? 'Смотреть модули' : "Modullarni ko'rish")
                    : t('student.enterLesson')}
                </Button>
              ) : (
                <Button variant="outlined" fullWidth disabled startIcon={<ScheduleIcon />}
                  sx={{ borderRadius: 2, py: 1, borderColor: '#F59E0B', color: '#D97706', '&.Mui-disabled': { borderColor: '#FDE68A', color: '#D97706' } }}>
                  {lang === 'ru' ? 'Скоро будет доступно' : 'Tez orada ochiladi'}
                </Button>
              )}
            </CardActions>
          </Card>
        </motion.div>
      </Grid>
    );
  };

  return (
    <Box>
      <PageHeader
        icon={<MenuBookIcon />}
        title={t('student.myCourses')}
        actions={
          <Chip
            label={`${activeGroups.length} ${lang === 'ru' ? 'активных' : 'faol'}`}
            color="primary" variant="outlined" size="small"
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
          />
        }
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty state */}
      {!isLoading && isEmpty && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', py: 8, textAlign: 'center' }}>
          <MenuBookIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">{t('student.notInGroup')}</Typography>
        </Card>
      )}

      {!isLoading && !isEmpty && (
        <Box>
          {/* ── Active courses ──────────────────────────────────────── */}
          {activeGroups.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: 1 }}>
                {lang === 'ru' ? '✅ Активные курсы' : '✅ Faol kurslar'}
              </Typography>
              <Grid container spacing={3}>
                {activeGroups.map((g, i) => renderCard(g, i, 'active'))}
              </Grid>
            </Box>
          )}

          {/* ── Not started (admin added student to group, group not started) ── */}
          {pendingGroups.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Alert severity="info" icon={<ScheduleIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  {lang === 'ru' ? 'Скоро начнётся' : 'Tez orada boshlanadi'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lang === 'ru'
                    ? 'Вы уже зачислены. Администратор запустит курс в ближайшее время.'
                    : "Siz allaqachon qo'shildingiz. Administrator kursni tez orada boshlaydi."}
                </Typography>
              </Alert>
              <Grid container spacing={3}>
                {pendingGroups.map((g, i) => renderCard(g, i, 'pending'))}
              </Grid>
            </Box>
          )}

          {/* ── Online paid but no group yet ───────────────────────── */}
          {onlinePendingApps.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Alert severity="warning" icon={<HourglassEmptyIcon />} sx={{ mb: 2, borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={600}>
                  {lang === 'ru' ? 'Ожидает назначения в группу' : 'Guruhga biriktirilish kutilmoqda'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {lang === 'ru'
                    ? 'Оплата принята. Администратор назначит вас в группу и откроет доступ.'
                    : "To'lov qabul qilindi. Administrator sizni guruhga qo'shib, kirishni ochadi."}
                </Typography>
              </Alert>
              <Grid container spacing={3}>
                {onlinePendingApps.map((app, i) => {
                  const c = app.course;
                  const color = '#F59E0B';
                  return (
                    <Grid item xs={12} sm={6} md={4} key={app._id}>
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} style={{ height: '100%' }}>
                        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', border: `2px dashed ${color}` }}>
                          <Box sx={{ height: 6, bgcolor: color }} />
                          <Box sx={{ position: 'absolute', top: 16, right: 12, bgcolor: '#FEF3C7', color: '#92400E', borderRadius: 4, px: 1.25, py: 0.4, display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.68rem', fontWeight: 700 }}>
                            <HourglassEmptyIcon sx={{ fontSize: 12 }} />
                            {lang === 'ru' ? 'Обрабатывается' : 'Tekshirilmoqda'}
                          </Box>
                          <CardContent sx={{ flex: 1, p: 2.5 }}>
                            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5, pr: 9 }}>
                              <Avatar sx={{ width: 40, height: 40, bgcolor: color + '18', color: '#D97706', flexShrink: 0, borderRadius: 2 }}>
                                <MenuBookIcon sx={{ fontSize: 20 }} />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>{getTitle(c)}</Typography>
                                <Typography variant="caption" color="text.secondary">{app.tariffKey}</Typography>
                              </Box>
                            </Stack>
                            <Alert severity="warning" sx={{ borderRadius: 2, py: 0.5, fontSize: '0.75rem' }}>
                              {lang === 'ru'
                                ? 'Оплата получена. Ожидайте — скоро вас добавят в группу.'
                                : "To'lov qabul qilindi. Kuting — tez orada guruhga qo'shilasiz."}
                            </Alert>
                          </CardContent>
                          <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                            <Button variant="outlined" fullWidth disabled startIcon={<HourglassEmptyIcon />}
                              sx={{ borderRadius: 2, py: 1, borderColor: color, color, '&.Mui-disabled': { borderColor: '#FDE68A', color: '#D97706' } }}>
                              {lang === 'ru' ? 'Скоро будет доступно' : 'Tez orada ochiladi'}
                            </Button>
                          </CardActions>
                        </Card>
                      </motion.div>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
