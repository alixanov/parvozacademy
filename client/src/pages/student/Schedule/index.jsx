import {
  Box, Typography, Card, CardContent, Grid, Chip, Stack, Avatar,
  CircularProgress, Tabs, Tab, Divider,
} from '@mui/material';
import { useState, useMemo } from 'react';
import { motion }            from 'framer-motion';
import { useTranslation }    from 'react-i18next';
import AccessTimeIcon        from '@mui/icons-material/AccessTime';
import VideocamIcon          from '@mui/icons-material/Videocam';
import MeetingRoomIcon       from '@mui/icons-material/MeetingRoom';
import CalendarMonthIcon     from '@mui/icons-material/CalendarMonth';
import EventBusyIcon         from '@mui/icons-material/EventBusy';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import PlayCircleIcon        from '@mui/icons-material/PlayCircle';
import ScheduleIcon          from '@mui/icons-material/Schedule';
import SchoolIcon            from '@mui/icons-material/School';
import PageHeader            from '../../../components/common/PageHeader/index.jsx';
import { useGetMyGroupsQuery }       from '../../../features/groups/groupsApi.js';
import { useGetSessionsByGroupQuery } from '../../../features/sessions/sessionsApi.js';
import i18n from '../../../utils/i18n.js';

/* ─── constants ──────────────────────────────────────────────────────────── */
const COLORS = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

const DAYS_LIST  = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
const DAY_TO_DOW = { Du: 1, Se: 2, Ch: 3, Pa: 4, Ju: 5, Sh: 6 };
const DOW_TO_DAY = { 1: 'Du', 2: 'Se', 3: 'Ch', 4: 'Pa', 5: 'Ju', 6: 'Sh' };

function getWeekDates() {
  const today  = new Date();
  const dow    = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  const map = {};
  DAYS_LIST.forEach((day, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    map[day] = d.toISOString().slice(0, 10);
  });
  return map;
}

const TODAY_DATE = new Date().toISOString().slice(0, 10);

function courseTitle(course) {
  if (!course) return '—';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const raw = course.title;
  if (typeof raw === 'object') return raw[lang] ?? raw.uz ?? raw.ru ?? '—';
  return raw ?? '—';
}

function fmtDate(iso, lang = 'uz') {
  if (!iso) return '—';
  const locale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
  return new Date(iso).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

/* ─── Session status chip ────────────────────────────────────────────────── */
const SESSION_STATUS = {
  scheduled: { color: '#3B82F6', label: { uz: 'Rejalashtirilgan', ru: 'Запланировано' }, Icon: ScheduleIcon },
  live:      { color: '#10B981', label: { uz: 'Hozir davom etmoqda', ru: 'Идёт сейчас' }, Icon: PlayCircleIcon },
  completed: { color: '#9CA3AF', label: { uz: 'Yakunlangan', ru: 'Завершено' }, Icon: CheckCircleIcon },
  cancelled: { color: '#EF4444', label: { uz: 'Bekor qilindi', ru: 'Отменено' }, Icon: EventBusyIcon },
};

function SessionStatusChip({ status, lang }) {
  const cfg = SESSION_STATUS[status] ?? SESSION_STATUS.scheduled;
  const { Icon } = cfg;
  return (
    <Chip
      icon={<Icon sx={{ fontSize: '13px !important', color: `${cfg.color} !important` }} />}
      label={cfg.label[lang]}
      size="small"
      sx={{ bgcolor: cfg.color + '18', color: cfg.color, fontWeight: 700, fontSize: '0.68rem', height: 22 }}
    />
  );
}

/* ─── Sessions list for a single group ──────────────────────────────────── */
function GroupSessionsList({ groupId, color, lang }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0); // 0 = upcoming, 1 = past

  const now = new Date().toISOString();
  const { data: res, isLoading } = useGetSessionsByGroupQuery(
    { group: groupId, limit: 50 },
    { skip: !groupId },
  );
  const allSessions = res?.data ?? res ?? [];

  const upcoming = allSessions.filter((s) => s.status === 'scheduled' || s.status === 'live');
  const past     = allSessions.filter((s) => s.status === 'completed' || s.status === 'cancelled');
  const list     = tab === 0 ? upcoming : past;

  if (isLoading) {
    return (
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (allSessions.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary' }}>
        <EventBusyIcon sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
        <Typography variant="body2">
          {lang === 'ru' ? 'Занятия ещё не созданы' : 'Darslar hali yaratilmagan'}
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}>
          <Tab label={
            <Stack direction="row" spacing={0.75} alignItems="center">
              <span>{lang === 'ru' ? 'Предстоящие' : 'Kelgusi darslar'}</span>
              <Chip label={upcoming.length} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: color + '18', color }} />
            </Stack>
          } />
          <Tab label={
            <Stack direction="row" spacing={0.75} alignItems="center">
              <span>{lang === 'ru' ? 'Прошедшие' : 'O\'tgan darslar'}</span>
              <Chip label={past.length} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
            </Stack>
          } />
        </Tabs>
      </Box>

      {list.length === 0 ? (
        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">{t('common.noData')}</Typography>
        </Box>
      ) : (
        <Stack spacing={0} divider={<Divider />}>
          {list.map((s, idx) => (
            <Box key={s._id ?? idx} sx={{ px: 3, py: 2,
              bgcolor: s.status === 'live' ? '#10B98106' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
              transition: 'background 0.15s',
            }}>
              <Stack direction="row" spacing={2} alignItems="center">
                {/* Session number */}
                <Avatar sx={{ width: 36, height: 36, bgcolor: color + '18', color, fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                  {s.sessionNumber ?? (idx + 1)}
                </Avatar>

                {/* Date & time */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.5 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {fmtDate(s.date, lang)}
                    </Typography>
                    {(s.startTime || s.date) && (
                      <Stack direction="row" spacing={0.4} alignItems="center">
                        <AccessTimeIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {s.startTime ?? fmtTime(s.date)}
                          {s.endTime ? ` – ${s.endTime}` : ''}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                  {/* Topic */}
                  {s.topic && (
                    <Typography variant="body2" color="text.secondary"
                      sx={{ mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.topic}
                    </Typography>
                  )}
                </Box>

                {/* Status */}
                <Box sx={{ flexShrink: 0 }}>
                  <SessionStatusChip status={s.status} lang={lang} />
                </Box>

                {/* Type */}
                <Box sx={{ flexShrink: 0 }}>
                  {s.type === 'online' ? (
                    <Chip icon={<VideocamIcon sx={{ fontSize: '13px !important' }} />}
                      label={lang === 'ru' ? 'Онлайн' : 'Online'} size="small"
                      sx={{ bgcolor: '#10B98118', color: '#10B981', height: 22, fontSize: '0.68rem' }} />
                  ) : (
                    <Chip icon={<MeetingRoomIcon sx={{ fontSize: '13px !important' }} />}
                      label="Offline" size="small"
                      sx={{ bgcolor: '#64748B18', color: '#64748B', height: 22, fontSize: '0.68rem' }} />
                  )}
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function StudentSchedule() {
  const { t }  = useTranslation();
  const lang   = i18n.language === 'ru' ? 'ru' : 'uz';
  const locale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';

  const { data: groupsRes, isLoading } = useGetMyGroupsQuery();
  const groups = groupsRes?.data ?? groupsRes ?? [];

  const [groupIdx, setGroupIdx] = useState(0);
  const DAY_DATES = useMemo(getWeekDates, []);

  /* ── Weekly recurring grid ── */
  const week = useMemo(() =>
    DAYS_LIST.map((day) => {
      const dow = DAY_TO_DOW[day];
      const lessons = groups
        .flatMap((g, gIdx) => {
          const entry = (g.schedule ?? []).find((s) => s.dayOfWeek === dow);
          if (!entry) return [];
          return [{
            id:        `${g._id}-${day}`,
            startTime: entry.startTime ?? '—',
            endTime:   entry.endTime   ?? '—',
            course:    courseTitle(g.course),
            group:     g.name,
            teacher:   g.teacher?.name ?? '—',
            type:      g.type ?? 'offline',
            color:     COLORS[gIdx % COLORS.length],
            days:      (g.schedule ?? [])
              .map((s) => DOW_TO_DAY[s.dayOfWeek] ?? '?')
              .sort((a, b) => (DAY_TO_DOW[a] ?? 0) - (DAY_TO_DOW[b] ?? 0)),
          }];
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return { day, date: DAY_DATES[day], label: t(`scheduleLabels.dayFull.${day}`), lessons };
    }),
  [groups, DAY_DATES, t]);

  const allLessons = week.flatMap((d) => d.lessons);
  const selectedGroup = groups[groupIdx];

  return (
    <Box>
      <PageHeader
        icon={<CalendarMonthIcon />}
        title={t('student.schedule')}
        actions={
          <Chip
            label={`${t('scheduleLabels.currentWeek')} · ${new Date().toLocaleDateString(locale, { month: 'long', day: 'numeric' })}`}
            color="primary" variant="outlined" size="small"
          />
        }
      />

      {isLoading && (
        <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
      )}

      {!isLoading && groups.length === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', py: 6 }}>
          <Stack alignItems="center" spacing={2}>
            <EventBusyIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
            <Typography variant="h6" color="text.secondary">{t('scheduleLabels.noGroups')}</Typography>
            <Typography variant="body2" color="text.disabled">{t('scheduleLabels.noGroupsHint')}</Typography>
          </Stack>
        </Card>
      )}

      {!isLoading && groups.length > 0 && (
        <>
          {/* ── Weekly recurring grid ── */}
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5 }}>
            {lang === 'ru' ? 'Расписание на неделю' : 'Haftalik dars jadvali'}
          </Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {week.map(({ day, date, label, lessons }, i) => {
              const isToday = date === TODAY_DATE;
              return (
                <Grid item xs={12} sm={6} md={4} key={day}>
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}>
                    <Card elevation={0} sx={{
                      height: '100%', border: isToday ? '2px solid' : '1px solid',
                      borderColor: isToday ? 'primary.main' : 'divider',
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700}>{label}</Typography>
                            <Typography variant="caption" color="text.disabled">{date}</Typography>
                          </Box>
                          {isToday && <Chip label={t('scheduleLabels.today')} size="small" color="primary" />}
                        </Stack>

                        {lessons.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 2 }}>
                            <Typography variant="body2" color="text.disabled">
                              {t('schedule.noLessons', { defaultValue: lang === 'ru' ? "Нет занятий" : "Dars yo'q" })}
                            </Typography>
                          </Box>
                        ) : (
                          <Stack spacing={1.5}>
                            {lessons.map((lesson) => (
                              <Box key={lesson.id} sx={{
                                p: 1.5, borderRadius: 2,
                                bgcolor: lesson.color + '0D',
                                borderLeft: `3px solid ${lesson.color}`,
                              }}>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                                  <AccessTimeIcon sx={{ fontSize: 13, color: lesson.color }} />
                                  <Typography variant="caption" fontWeight={700} color={lesson.color}>
                                    {lesson.startTime} – {lesson.endTime}
                                  </Typography>
                                </Stack>
                                <Typography variant="body2" fontWeight={700}>{lesson.course}</Typography>
                                <Typography variant="caption" color="text.secondary">{lesson.teacher}</Typography>
                                {lesson.days?.length > 0 && (
                                  <Stack direction="row" spacing={0.35} flexWrap="wrap" sx={{ mt: 0.5, gap: 0.3 }}>
                                    {lesson.days.map((d) => (
                                      <Chip key={d}
                                        label={t(`scheduleLabels.dayShort.${d}`, { defaultValue: d })}
                                        size="small"
                                        sx={{
                                          height: 17, fontSize: '0.6rem', fontWeight: 800,
                                          bgcolor: d === DOW_TO_DAY[new Date().getDay()] ? lesson.color + '30' : lesson.color + '14',
                                          color: lesson.color, borderRadius: 0.6,
                                          border: d === DOW_TO_DAY[new Date().getDay()] ? `1px solid ${lesson.color}` : 'none',
                                        }}
                                      />
                                    ))}
                                  </Stack>
                                )}
                                <Chip
                                  icon={lesson.type === 'online'
                                    ? <VideocamIcon sx={{ fontSize: '13px !important' }} />
                                    : <MeetingRoomIcon sx={{ fontSize: '13px !important' }} />}
                                  label={lesson.type === 'online' ? t('scheduleLabels.online') : 'Offline'}
                                  size="small"
                                  sx={{
                                    mt: 0.75, height: 20, fontSize: '0.65rem',
                                    bgcolor: lesson.type === 'online' ? '#10B98118' : '#64748B18',
                                    color:   lesson.type === 'online' ? '#10B981'   : '#64748B',
                                  }}
                                />
                              </Box>
                            ))}
                          </Stack>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>

          {/* ── All sessions per group ── */}
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5 }}>
            {lang === 'ru' ? 'Все занятия' : 'Barcha darslar'}
          </Typography>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            {/* Group tabs */}
            <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
              <Tabs
                value={groupIdx}
                onChange={(_, v) => setGroupIdx(v)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ px: 2 }}
              >
                {groups.map((g, i) => (
                  <Tab
                    key={g._id}
                    label={
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: COLORS[i % COLORS.length] }} />
                        <span>{g.name}</span>
                      </Stack>
                    }
                  />
                ))}
              </Tabs>
            </Box>

            {/* Group header */}
            {selectedGroup && (
              <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider',
                bgcolor: COLORS[groupIdx % COLORS.length] + '08' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{
                    width: 36, height: 36,
                    bgcolor: COLORS[groupIdx % COLORS.length] + '22',
                    color: COLORS[groupIdx % COLORS.length],
                  }}>
                    <SchoolIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{selectedGroup.name}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {courseTitle(selectedGroup.course) !== '—' && (
                        <Chip
                          label={courseTitle(selectedGroup.course)}
                          size="small"
                          sx={{
                            height: 18, fontSize: '0.68rem',
                            bgcolor: COLORS[groupIdx % COLORS.length] + '18',
                            color: COLORS[groupIdx % COLORS.length],
                          }}
                        />
                      )}
                      {selectedGroup.teacher?.name && (
                        <Typography variant="caption" color="text.secondary">
                          {selectedGroup.teacher.name}
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            )}

            {/* Sessions list */}
            {selectedGroup && (
              <GroupSessionsList
                groupId={selectedGroup._id}
                color={COLORS[groupIdx % COLORS.length]}
                lang={lang}
              />
            )}
          </Card>
        </>
      )}
    </Box>
  );
}
