import {
  Box, Typography, Card, CardContent, Grid, Chip, Stack, Avatar, Button,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, IconButton,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { useTranslation }    from 'react-i18next';
import AccessTimeIcon        from '@mui/icons-material/AccessTime';
import PeopleIcon            from '@mui/icons-material/People';
import VideocamIcon          from '@mui/icons-material/Videocam';
import MeetingRoomIcon       from '@mui/icons-material/MeetingRoom';
import CalendarMonthIcon     from '@mui/icons-material/CalendarMonth';
import EventBusyIcon         from '@mui/icons-material/EventBusy';
import LinkIcon              from '@mui/icons-material/Link';
import SendIcon              from '@mui/icons-material/Send';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import CloseIcon             from '@mui/icons-material/Close';
import PlayCircleIcon        from '@mui/icons-material/PlayCircle';
import PageHeader            from '../../../components/common/PageHeader/index.jsx';
import { useGetGroupsQuery }         from '../../../features/groups/groupsApi.js';
import { useGetTeacherSessionsQuery, useSendSessionLinkMutation } from '../../../features/sessions/sessionsApi.js';
import i18n from '../../../utils/i18n.js';

const COURSE_COLORS = ['#1976D2', '#EF4444', '#7C3AED', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#06B6D4'];
const DAYS_LIST  = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
const DAY_TO_DOW = { Du: 1, Se: 2, Ch: 3, Pa: 4, Ju: 5, Sh: 6 };
const DOW_TO_DAY = { 1: 'Du', 2: 'Se', 3: 'Ch', 4: 'Pa', 5: 'Ju', 6: 'Sh' };
const DAY_LABELS = { Du: 'Dushanba', Se: 'Seshanba', Ch: 'Chorshanba', Pa: 'Payshanba', Ju: 'Juma', Sh: 'Shanba' };

const LINK_TYPES = [
  { value: 'zoom',         label: 'Zoom' },
  { value: 'google_meet',  label: 'Google Meet' },
  { value: 'youtube',      label: 'YouTube Live' },
  { value: 'telegram',     label: 'Telegram' },
  { value: 'other',        label: 'Boshqa' },
];

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
  const t = course.title;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '—';
  return t ?? '—';
}

/* ── Send Link Dialog ───────────────────────────────────────────────────────── */
function SendLinkDialog({ open, session, onClose, onSent }) {
  const [url,  setUrl]  = useState('');
  const [type, setType] = useState('zoom');
  const [err,  setErr]  = useState('');
  const [sendLink, { isLoading }] = useSendSessionLinkMutation();

  const handleSend = async () => {
    setErr('');
    if (!url.trim()) { setErr('URL majburiy'); return; }
    try {
      await sendLink({ id: session._id, url: url.trim(), type }).unwrap();
      onSent?.();
      onClose();
      setUrl('');
    } catch (e) {
      setErr(e?.data?.message ?? 'Xatolik yuz berdi');
    }
  };

  const handleClose = () => {
    setUrl('');
    setErr('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#EFF6FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LinkIcon sx={{ fontSize: 16, color: '#1976D2' }} />
          </Box>
          <Box>
            <Typography fontWeight={800} fontSize="0.95rem">Trансляция havolasi</Typography>
            {session && (
              <Typography variant="caption" color="text.secondary">
                {session.startTime} — {session.groupName}
              </Typography>
            )}
          </Box>
        </Stack>
        <IconButton size="small" onClick={handleClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1.5 }}>
        <Stack spacing={2}>
          <TextField
            select size="small" label="Platforma" fullWidth
            value={type} onChange={(e) => setType(e.target.value)}
          >
            {LINK_TYPES.map((lt) => (
              <MenuItem key={lt.value} value={lt.value}>{lt.label}</MenuItem>
            ))}
          </TextField>

          <TextField
            size="small" label="Havola (URL)" fullWidth
            value={url} onChange={(e) => setUrl(e.target.value)}
            placeholder="https://zoom.us/j/..."
            InputProps={{ startAdornment: <LinkIcon sx={{ mr: 0.5, fontSize: 14, color: '#CBD5E1' }} /> }}
          />

          {err && (
            <Typography variant="caption" color="error">{err}</Typography>
          )}

          <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <Typography variant="caption" color="#92400E">
              ⏰ Dars boshlanishidan <strong>15 daqiqa oldin</strong> barcha o'quvchilarga avtomatik xabarnoma yuboriladi.
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} sx={{ borderRadius: 2 }}>Bekor qilish</Button>
        <Button variant="contained" onClick={handleSend} disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={14} /> : <SendIcon sx={{ fontSize: 15 }} />}
          sx={{ borderRadius: 2 }}>
          Yuborish
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export default function TeacherSchedule() {
  const { t } = useTranslation();
  const [linkDialog, setLinkDialog] = useState(null); // { _id, startTime, groupName }

  const { data: groupsRes, isLoading }   = useGetGroupsQuery({ limit: 100 });
  const { data: sessionsRes, refetch }   = useGetTeacherSessionsQuery({ dateRange: 'today', limit: 50 });
  const groups   = groupsRes?.data ?? [];
  const sessions = sessionsRes?.data ?? sessionsRes ?? [];

  const DAY_DATES = useMemo(getWeekDates, []);

  /* Build weekly grid */
  const week = useMemo(() =>
    DAYS_LIST.map((day) => {
      const dow = DAY_TO_DOW[day];
      const lessons = groups
        .flatMap((g, gIdx) => {
          const entry = (g.schedule ?? []).find((s) => s.dayOfWeek === dow);
          if (!entry) return [];
          return [{
            id:        `${g._id}-${day}`,
            groupId:   g._id,
            startTime: entry.startTime ?? '—',
            endTime:   entry.endTime   ?? '—',
            course:    courseTitle(g.course),
            group:     g.name,
            type:      g.type ?? 'offline',
            students:  g.maxStudents ?? 0,
            color:     COURSE_COLORS[gIdx % COURSE_COLORS.length],
            isActive:  g.isActive ?? true,
            days:      (g.schedule ?? [])
              .map((s) => DOW_TO_DAY[s.dayOfWeek] ?? '?')
              .sort((a, b) => (DAY_TO_DOW[a] ?? 0) - (DAY_TO_DOW[b] ?? 0)),
          }];
        })
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      return { day, date: DAY_DATES[day], label: DAY_LABELS[day], lessons };
    }),
  [groups, DAY_DATES]);

  const allLessons = week.flatMap((d) => d.lessons);

  /* Match today's sessions with grid lessons to get session._id */
  const todaySessions = useMemo(() => {
    const map = {};
    sessions.forEach((s) => {
      const key = `${s.group?._id ?? s.group}-${s.startTime}`;
      map[key] = s;
    });
    return map;
  }, [sessions]);

  const STATS = [
    { label: t('scheduleLabels.weeklyLessons'), value: allLessons.length,                                     color: '#1976D2' },
    { label: t('scheduleLabels.onlineLessons'),  value: allLessons.filter((l) => l.type === 'online').length, color: '#10B981' },
    { label: t('scheduleLabels.offlineLessons'), value: allLessons.filter((l) => l.type !== 'online').length, color: '#7C3AED' },
    { label: t('scheduleLabels.totalHours'),     value: `${(allLessons.length * 1.5).toFixed(0)}h`,           color: '#F59E0B' },
  ];

  return (
    <Box>
      <PageHeader icon={<CalendarMonthIcon />} title={t('teacher.schedule')} />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {STATS.map((s) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {isLoading && <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>}

      {!isLoading && groups.length === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', py: 6 }}>
          <Stack alignItems="center" spacing={2}>
            <EventBusyIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
            <Typography variant="h6" color="text.secondary">{t('teacher.noGroupsEmpty')}</Typography>
            <Typography variant="body2" color="text.disabled">{t('teacher.noGroupsHint')}</Typography>
          </Stack>
        </Card>
      )}

      {!isLoading && groups.length > 0 && (
        <Grid container spacing={2}>
          {week.map(({ day, date, label, lessons }) => {
            const isToday = date === TODAY_DATE;
            return (
              <Grid item xs={12} sm={6} md={4} key={day}>
                <Card elevation={0} sx={{
                  border: isToday ? '2px solid' : '1px solid',
                  borderColor: isToday ? 'primary.main' : 'divider',
                  boxShadow: isToday ? 2 : 0,
                }}>
                  {/* Day header */}
                  <Box sx={{
                    px: 2, py: 1.25,
                    bgcolor: isToday ? 'primary.main' : 'action.hover',
                    borderRadius: '14px 14px 0 0',
                  }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" fontWeight={700} color={isToday ? 'white' : 'text.primary'}>
                        {label}
                      </Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        {isToday && (
                          <Chip label={t('teacher.todayChip')} size="small"
                            sx={{ bgcolor: 'primary.contrastText', color: 'primary.main', fontWeight: 700, height: 20 }} />
                        )}
                        <Typography variant="caption" color={isToday ? 'rgba(255,255,255,0.8)' : 'text.secondary'}>
                          {date?.slice(8)}.{date?.slice(5, 7)}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  <CardContent sx={{ p: 1.5, minHeight: 72 }}>
                    {lessons.length === 0 ? (
                      <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ py: 2 }}>
                        {t('schedule.noLessons', { defaultValue: "Dars yo'q" })}
                      </Typography>
                    ) : (
                      lessons.map((l) => {
                        const sessionKey = `${l.groupId}-${l.startTime}`;
                        const session    = isToday ? todaySessions[sessionKey] : null;
                        const hasLink    = !!session?.lessonLink?.url;

                        return (
                          <Box key={l.id} sx={{
                            mb: 1, p: 1.25, borderRadius: 1.5,
                            border: '1px solid', borderColor: l.color + '33',
                            bgcolor: l.color + '08',
                          }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <AccessTimeIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                  {l.startTime}–{l.endTime}
                                </Typography>
                              </Stack>
                              <Stack direction="row" spacing={0.4}>
                                {!l.isActive && (
                                  <Chip label={t('schedule.notStarted', { defaultValue: 'Boshlanmagan' })} size="small"
                                    sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }} />
                                )}
                                <Chip
                                  icon={l.type === 'online'
                                    ? <VideocamIcon sx={{ fontSize: '10px !important' }} />
                                    : <MeetingRoomIcon sx={{ fontSize: '10px !important' }} />}
                                  label={l.type === 'online' ? t('scheduleLabels.online') : 'Offline'}
                                  size="small"
                                  color={l.type === 'online' ? 'success' : 'default'}
                                  sx={{ height: 18, fontSize: '0.7rem' }}
                                />
                              </Stack>
                            </Stack>

                            <Typography variant="body2" fontWeight={600} sx={{ color: l.color, lineHeight: 1.3, mb: 0.3 }}>
                              {l.group}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ mb: 0.4 }}>
                              {l.course}
                            </Typography>

                            {l.days?.length > 0 && (
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

                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                              <Avatar sx={{ width: 14, height: 14, bgcolor: l.color + '33', color: l.color, fontSize: '0.55rem' }}>
                                {l.group[0]}
                              </Avatar>
                              <PeopleIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                              <Typography variant="caption" color="text.disabled">
                                {t('teacher.studentsCount', { count: l.students })}
                              </Typography>
                            </Stack>

                            {/* ── Stream link button (only today) ── */}
                            {isToday && session && (
                              <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed', borderColor: l.color + '30' }}>
                                {hasLink ? (
                                  <Stack spacing={0.75}>
                                    <Stack direction="row" spacing={0.75} alignItems="center">
                                      <CheckCircleIcon sx={{ fontSize: 13, color: '#10B981' }} />
                                      <Typography variant="caption" color="success.main" fontWeight={700}>
                                        Havola yuborilgan
                                      </Typography>
                                    </Stack>
                                    <Stack direction="row" spacing={0.75}>
                                      <Button size="small" variant="outlined"
                                        startIcon={<PlayCircleIcon sx={{ fontSize: 13 }} />}
                                        onClick={() => window.open(session.lessonLink.url, '_blank', 'noopener,noreferrer')}
                                        sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.72rem', height: 28,
                                          borderColor: '#10B981', color: '#10B981', flex: 1,
                                          '&:hover': { bgcolor: '#F0FDF4', borderColor: '#10B981' } }}>
                                        Ochish
                                      </Button>
                                      <Button size="small" variant="outlined"
                                        startIcon={<LinkIcon sx={{ fontSize: 13 }} />}
                                        onClick={() => setLinkDialog({ ...session, groupName: l.group })}
                                        sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.72rem', height: 28,
                                          borderColor: l.color + '80', color: l.color }}>
                                        O'zgartirish
                                      </Button>
                                    </Stack>
                                  </Stack>
                                ) : (
                                  <Button size="small" variant="contained" fullWidth
                                    startIcon={<LinkIcon sx={{ fontSize: 13 }} />}
                                    onClick={() => setLinkDialog({ ...session, groupName: l.group })}
                                    sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.75rem', height: 30,
                                      bgcolor: l.color, '&:hover': { bgcolor: l.color, filter: 'brightness(0.9)' } }}>
                                    Trансляция havolasi yuborish
                                  </Button>
                                )}
                              </Box>
                            )}
                          </Box>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Send Link Dialog */}
      <SendLinkDialog
        open={!!linkDialog}
        session={linkDialog}
        onClose={() => setLinkDialog(null)}
        onSent={() => refetch()}
      />
    </Box>
  );
}
