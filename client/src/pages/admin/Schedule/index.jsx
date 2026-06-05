import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip,
  Select, MenuItem, FormControl, InputLabel, Avatar,
  CircularProgress, Alert,
} from '@mui/material';
import { useState, useMemo }  from 'react';
import { useTranslation }     from 'react-i18next';
import { useGetGroupsQuery }  from '../../../features/groups/groupsApi.js';
import { useGetUsersQuery }   from '../../../features/users/usersApi.js';
import i18n                   from '../../../utils/i18n.js';
import AccessTimeIcon         from '@mui/icons-material/AccessTime';
import PeopleIcon             from '@mui/icons-material/People';
import VideocamIcon           from '@mui/icons-material/Videocam';
import MeetingRoomIcon        from '@mui/icons-material/MeetingRoom';
import PersonIcon             from '@mui/icons-material/Person';
import CalendarMonthIcon      from '@mui/icons-material/CalendarMonth';
import EventBusyIcon          from '@mui/icons-material/EventBusy';
import PageHeader             from '../../../components/common/PageHeader/index.jsx';

/* ─── constants ──────────────────────────────────────────────────────────── */
const PALETTE    = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];
const DAYS_LIST  = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Yak'];
const DAY_TO_DOW = { Du: 1, Se: 2, Ch: 3, Pa: 4, Ju: 5, Sh: 6, Yak: 0 };
const DOW_TO_DAY = { 1: 'Du', 2: 'Se', 3: 'Ch', 4: 'Pa', 5: 'Ju', 6: 'Sh', 0: 'Yak' };
const DAY_LABELS = {
  Du: 'Dushanba', Se: 'Seshanba', Ch: 'Chorshanba',
  Pa: 'Payshanba', Ju: 'Juma', Sh: 'Shanba', Yak: 'Yakshanba',
};
const REST_DAYS  = new Set(['Yak']); // Sunday is always a rest day

const TODAY_DATE = new Date().toISOString().slice(0, 10);

function getWeekDates() {
  const today  = new Date();
  const dow    = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const map = {};
  // Du=+0, Se=+1, Ch=+2, Pa=+3, Ju=+4, Sh=+5, Yak=+6 (Sun after Sat)
  DAYS_LIST.forEach((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    map[day] = d.toISOString().slice(0, 10);
  });
  return map;
}

function courseTitle(course, lang) {
  if (!course) return '—';
  const t = course.title;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '—';
  return t ?? '—';
}

/* ─── component ──────────────────────────────────────────────────────────── */
export default function AdminSchedule() {
  const { t }  = useTranslation();
  const lang   = i18n.language === 'ru' ? 'ru' : 'uz';

  const { data: groupsRes,  isLoading } = useGetGroupsQuery({ limit: 200 });
  const { data: teachersRes }           = useGetUsersQuery({ role: 'teacher', limit: 100 });

  const groups   = groupsRes?.data  ?? [];
  const teachers = teachersRes?.data ?? [];

  const [filterTeacher, setFilterTeacher] = useState('all');
  const [filterType,    setFilterType]    = useState('all');

  const DAY_DATES = useMemo(getWeekDates, []);

  /* filtered groups */
  const filteredGroups = useMemo(() =>
    groups.filter((g) => {
      if (filterTeacher !== 'all' && (g.teacher?._id ?? g.teacher) !== filterTeacher) return false;
      if (filterType    !== 'all' && g.type !== filterType)                             return false;
      return true;
    }),
  [groups, filterTeacher, filterType]);

  /* weekly grid */
  const week = useMemo(() =>
    DAYS_LIST.map((day) => {
      const dow = DAY_TO_DOW[day];
      const lessons = filteredGroups
        .flatMap((g, gIdx) => {
          const entry = (g.schedule ?? []).find((s) => s.dayOfWeek === dow);
          if (!entry) return [];
          return [{
            id:        `${g._id}-${day}`,
            startTime: entry.startTime ?? '—',
            endTime:   entry.endTime   ?? '—',
            course:    courseTitle(g.course, lang),
            group:     g.name,
            teacher:   g.teacher?.name ?? '—',
            type:      g.type ?? 'offline',
            students:  g.maxStudents ?? 0,
            color:     PALETTE[gIdx % PALETTE.length],
            days:      (g.schedule ?? [])
              .map((s) => DOW_TO_DAY[s.dayOfWeek] ?? '?')
              .sort((a, b) => (DAY_TO_DOW[a] ?? 0) - (DAY_TO_DOW[b] ?? 0)),
          }];
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return { day, date: DAY_DATES[day], label: DAY_LABELS[day], lessons };
    }),
  [filteredGroups, DAY_DATES, lang]);

  const allLessons = week.filter((d) => !REST_DAYS.has(d.day)).flatMap((d) => d.lessons);
  const onlineCount   = allLessons.filter((l) => l.type === 'online').length;
  const offlineCount  = allLessons.filter((l) => l.type === 'offline').length;
  const indivCount    = allLessons.filter((l) => l.type === 'individual_offline' || l.type === 'individual_online').length;

  const STATS = [
    { label: t('schedule.weekLessons', { defaultValue: 'Darslar (hafta)' }), value: allLessons.length,   color: '#1976D2' },
    { label: 'Online',      value: onlineCount,            color: '#10B981' },
    { label: 'Offline',     value: offlineCount,           color: '#7C3AED' },
    { label: 'Individual',  value: indivCount,             color: '#EC4899' },
  ];

  return (
    <Box>
      <PageHeader
        icon={<CalendarMonthIcon />}
        title={t('schedule.management', { defaultValue: 'Dars jadvali' })}
        actions={
          <Chip
            label={`Joriy hafta · ${new Date().toLocaleDateString('ru-RU', { month: 'long', day: 'numeric' })}`}
            color="primary" variant="outlined" size="small"
          />
        }
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {STATS.map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight={800} color={s.color} lineHeight={1.2}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.62rem', mt: 0.15 }}>{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
        <FormControl size="small" sx={{ minWidth: 230 }}>
          <InputLabel>{t('schedule.filterByTeacher', { defaultValue: "O'qituvchi bo'yicha" })}</InputLabel>
          <Select value={filterTeacher}
            label={t('schedule.filterByTeacher', { defaultValue: "O'qituvchi bo'yicha" })}
            onChange={(e) => setFilterTeacher(e.target.value)}>
            <MenuItem value="all">{t('common.all', { defaultValue: 'Barchasi' })}</MenuItem>
            {teachers.map((tc) => (
              <MenuItem key={tc._id} value={tc._id}>{tc.name}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Dars turi</InputLabel>
          <Select value={filterType} label="Dars turi"
            onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="all">Barchasi</MenuItem>
            <MenuItem value="online">Online</MenuItem>
            <MenuItem value="offline">Offline</MenuItem>
            <MenuItem value="individual_offline">Individual (Offline)</MenuItem>
            <MenuItem value="individual_online">Individual (Online)</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Info hint */}
      <Alert severity="info" icon={<CalendarMonthIcon fontSize="small" />}
        sx={{ mb: 3, borderRadius: 2, fontSize: '0.82rem' }}>
        Jadvallar guruhlar orqali boshqariladi — o'zgartirish uchun <strong>Guruhlar</strong> bo'limiga o'ting.
      </Alert>

      {/* Loading */}
      {isLoading && (
        <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>
      )}

      {/* Empty state */}
      {!isLoading && groups.length === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', py: 8 }}>
          <Stack alignItems="center" spacing={2}>
            <EventBusyIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
            <Typography variant="h6" color="text.secondary">Guruhlar topilmadi</Typography>
            <Typography variant="body2" color="text.disabled">
              Avval "Guruhlar" bo'limida guruh yarating va jadval belgilang
            </Typography>
          </Stack>
        </Card>
      )}

      {/* Week grid */}
      {!isLoading && groups.length > 0 && (
        <Grid container spacing={2}>
          {week.map(({ day, date, label, lessons }) => {
            const isToday   = date === TODAY_DATE;
            const isRestDay = REST_DAYS.has(day);
            return (
              <Grid item xs={12} sm={6} md={4} key={day}>
                <Card elevation={0} sx={{
                  border: isToday ? '2px solid' : '1px solid',
                  borderColor: isToday ? 'primary.main' : isRestDay ? '#CBD5E1' : 'divider',
                  boxShadow: isToday ? 3 : 0,
                  height: '100%',
                  opacity: isRestDay ? 0.75 : 1,
                }}>
                  {/* Day header */}
                  <Box sx={{
                    px: 2, py: 1.25,
                    bgcolor: isToday ? 'primary.main'
                           : isRestDay ? '#F1F5F9'
                           : 'action.hover',
                    borderRadius: '12px 12px 0 0',
                  }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle2" fontWeight={700}
                          color={isToday ? 'white' : isRestDay ? '#94A3B8' : 'text.primary'}>
                          {label}
                        </Typography>
                        {isRestDay && (
                          <Chip label="Yetdi" size="small"
                            sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700,
                                  bgcolor: '#EF444418', color: '#EF4444', border: '1px solid #EF444430' }} />
                        )}
                      </Stack>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        {isToday && (
                          <Chip label="Bugun" size="small"
                            sx={{ bgcolor: 'primary.contrastText', color: 'primary.main', fontWeight: 700, height: 20 }} />
                        )}
                        <Typography variant="caption"
                          color={isToday ? 'rgba(255,255,255,0.75)' : '#94A3B8'}>
                          {date?.slice(8)}.{date?.slice(5, 7)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  {/* Lessons */}
                  <CardContent sx={{ p: 1.5, minHeight: 80 }}>
                    {isRestDay ? (
                      /* ── Sunday: always rest day ── */
                      <Stack alignItems="center" justifyContent="center" spacing={1}
                        sx={{ py: 3, color: '#CBD5E1' }}>
                        <EventBusyIcon sx={{ fontSize: 32, color: '#CBD5E1' }} />
                        <Typography variant="body2" color="#94A3B8" fontWeight={600}>
                          Dam olish kuni
                        </Typography>
                        <Typography variant="caption" color="#CBD5E1">
                          Yakshanba — yetdi! 🌿
                        </Typography>
                      </Stack>
                    ) : lessons.length === 0 ? (
                      <Stack alignItems="center" justifyContent="center" spacing={0.75}
                        sx={{ py: 3, color: 'text.disabled' }}>
                        <AccessTimeIcon sx={{ fontSize: 28, opacity: 0.35 }} />
                        <Typography variant="body2" color="text.disabled" textAlign="center">
                          {t('schedule.noLessons', { defaultValue: 'Dars yo\'q' })}
                        </Typography>
                      </Stack>
                    ) : (
                      lessons.map((l) => (
                        <Box key={l.id} sx={{
                          mb: 1, p: 1.25, borderRadius: 1.5,
                          border: '1px solid', borderColor: l.color + '30',
                          bgcolor: l.color + '08',
                        }}>
                          {/* time + type */}
                          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              <AccessTimeIcon sx={{ fontSize: 11, color: 'text.secondary' }} />
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                {l.startTime}–{l.endTime}
                              </Typography>
                            </Stack>
                            <Chip
                              icon={
                                l.type === 'online'
                                  ? <VideocamIcon sx={{ fontSize: '10px !important' }} />
                                  : (l.type === 'individual_offline' || l.type === 'individual_online')
                                    ? <PersonIcon sx={{ fontSize: '10px !important' }} />
                                    : <MeetingRoomIcon sx={{ fontSize: '10px !important' }} />
                              }
                              label={
                                l.type === 'online'              ? 'Online'
                                  : l.type === 'individual_offline' ? 'Indiv. Offline'
                                  : l.type === 'individual_online'  ? 'Indiv. Online'
                                  : 'Offline'
                              }
                              size="small"
                              color={l.type === 'online' ? 'success' : 'default'}
                              sx={{ height: 18, fontSize: '0.68rem' }}
                            />
                          </Stack>

                          {/* group name */}
                          <Typography variant="body2" fontWeight={700}
                            sx={{ color: l.color, lineHeight: 1.3, mb: 0.2 }}>
                            {l.group}
                          </Typography>

                          {/* course */}
                          <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ mb: 0.4 }}>
                            {l.course}
                          </Typography>

                          {/* days pattern */}
                          {l.days.length > 0 && (
                            <Stack direction="row" spacing={0.35} flexWrap="wrap" sx={{ mb: 0.5, gap: 0.3 }}>
                              {l.days.map((d) => (
                                <Chip key={d} label={d} size="small"
                                  sx={{
                                    height: 17, fontSize: '0.6rem', fontWeight: 800,
                                    bgcolor: d === DOW_TO_DAY[new Date().getDay()] ? l.color + '30' : l.color + '14',
                                    color: l.color, borderRadius: 0.6,
                                    border: d === DOW_TO_DAY[new Date().getDay()] ? `1px solid ${l.color}` : 'none',
                                  }}
                                />
                              ))}
                            </Stack>
                          )}

                          {/* teacher + students */}
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                            <Avatar sx={{
                              width: 14, height: 14,
                              bgcolor: l.color + '30', color: l.color, fontSize: '0.5rem',
                            }}>
                              {l.teacher?.[0] ?? '?'}
                            </Avatar>
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                              {l.teacher}
                            </Typography>
                            <PeopleIcon sx={{ fontSize: 10, color: 'text.disabled', ml: 0.25 }} />
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                              {l.students}
                            </Typography>
                          </Stack>
                        </Box>
                      ))
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
