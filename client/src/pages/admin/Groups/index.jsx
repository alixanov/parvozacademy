import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip,
  Table, TableBody, TableCell, TableHead, TableRow,
  Button, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Avatar, Divider,
  List, ListItem, ListItemAvatar, ListItemText, ListItemSecondaryAction,
  LinearProgress, Stepper, Step, StepLabel, Rating,
  Alert, CircularProgress, Tabs, Tab,
} from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import AddIcon            from '@mui/icons-material/Add';
import EditIcon           from '@mui/icons-material/Edit';
import DeleteIcon         from '@mui/icons-material/Delete';
import CloseIcon          from '@mui/icons-material/Close';
import PeopleIcon         from '@mui/icons-material/People';
import GroupsIcon         from '@mui/icons-material/Groups';
import PersonAddIcon      from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon   from '@mui/icons-material/PersonRemove';
import SearchIcon         from '@mui/icons-material/Search';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import VideocamIcon       from '@mui/icons-material/Videocam';
import MeetingRoomIcon    from '@mui/icons-material/MeetingRoom';
import PersonIcon         from '@mui/icons-material/Person';
import InventoryIcon      from '@mui/icons-material/Inventory';
import InputAdornmentMUI  from '@mui/material/InputAdornment';
import BlockIcon          from '@mui/icons-material/Block';
import LockOpenIcon       from '@mui/icons-material/LockOpen';
import LockIcon           from '@mui/icons-material/Lock';
import AlarmIcon          from '@mui/icons-material/Alarm';
import WarningAmberIcon   from '@mui/icons-material/WarningAmber';
import HourglassTopIcon   from '@mui/icons-material/HourglassTop';
import PaymentsIcon       from '@mui/icons-material/Payments';
import PlayCircleIcon     from '@mui/icons-material/PlayCircle';
import FlagIcon           from '@mui/icons-material/Flag';
import CalendarMonthIcon  from '@mui/icons-material/CalendarMonth';
import PageHeader       from '../../../components/common/PageHeader/index.jsx';
import { DAYS_LIST, addMinutesToTime } from '../../../features/lms/lmsSlice.js';
import { DateBadge, DueDateBadge }    from '../../../components/common/DateBadge/index.jsx';
import { useGetCoursesQuery }    from '../../../features/courses/coursesApi.js';
import { useGetUsersQuery }      from '../../../features/users/usersApi.js';
import { useGetTariffPlansQuery } from '../../../features/tariffs/tariffsApi.js';
import {
  useGetGroupsQuery,
  useGetGroupMembersQuery,
  useGetGroupMembersWithPaymentsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useActivateGroupMutation,
  useCompleteGroupMutation,
  useDeleteGroupMutation,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
  useSetMemberAccessMutation,
} from '../../../features/groups/groupsApi.js';
import i18n from '../../../utils/i18n.js';
import { formatPrice } from '../../../data/mockData.js';

const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

// Uzbek short day code ↔ ISO day of week (1=Mon … 6=Sat)
const DAY_TO_DOW = { Du: 1, Se: 2, Ch: 3, Pa: 4, Ju: 5, Sh: 6 };
const DOW_TO_DAY = { 0: '?', 1: 'Du', 2: 'Se', 3: 'Ch', 4: 'Pa', 5: 'Ju', 6: 'Sh' };

function groupDays(g)  { return (g.schedule ?? []).map((s) => DOW_TO_DAY[s.dayOfWeek] ?? '?'); }
function groupTime(g)  { return g.schedule?.[0]?.startTime ?? '—'; }

/** Вычисляем отображаемый статус группы по startDate и isActive */
function groupStatus(g, t) {
  if (g.startDate && new Date(g.startDate) > new Date()) {
    return { label: t('groups.statusPending'), color: 'warning', tooltip: t('groups.tooltipPending') };
  }
  return g.isActive
    ? { label: t('groups.statusActive'),   color: 'success', tooltip: t('groups.tooltipDeactivate') }
    : { label: t('groups.statusInactive'), color: 'default', tooltip: t('groups.tooltipActivate') };
}
function cTitle(course, lang) {
  if (!course) return '—';
  const t = typeof course === 'object' ? course.title : course;
  if (!t) return '—';
  if (typeof t === 'object') return t[lang] ?? t.ru ?? t.uz ?? '—';
  return t;
}

const EMPTY_FORM = {
  name: '', course: '', teacherId: '', teacherName: '',
  capacity: 20, studentIds: [], days: [], time: '09:00',
  duration: 90, type: 'online',
  tariffKey: '', tariffName: '', price: 0,
};

// ─── STEP 0: Basic info ────────────────────────────────────────────────────────
const TYPE_META = [
  { value: 'online',              label: 'Online',               icon: <VideocamIcon sx={{ fontSize: 18 }} />,    color: '#1976D2' },
  { value: 'offline',             label: 'Offline',              icon: <MeetingRoomIcon sx={{ fontSize: 18 }} />, color: '#10B981' },
  { value: 'individual_offline',  label: 'Individual (Offline)', icon: <PersonIcon sx={{ fontSize: 18 }} />,      color: '#7C3AED' },
  { value: 'individual_online',   label: 'Individual (Online)',  icon: <PersonIcon sx={{ fontSize: 18 }} />,      color: '#EC4899' },
  { value: 'individual_package',  label: 'Инд. пакет',           icon: <InventoryIcon sx={{ fontSize: 18 }} />,   color: '#7C3AED' },
];

function Step0Basic({ form, setForm, courses = [] }) {
  const { t }  = useTranslation();
  const lang   = i18n.language === 'ru' ? 'ru' : 'uz';

  /** Клик по карточке курса — авто-выбор тарифа если он единственный */
  const handleCourseSelect = (courseId) => {
    const course  = courses.find((c) => c._id === courseId);
    const tariffs = course?.tariffs ?? [];
    const pick    = tariffs.length === 1 ? tariffs[0]
                  : tariffs.find((t) => t.key === form.type) ?? null;
    setForm((p) => ({
      ...p,
      course:     courseId,
      type:       pick?.key   ?? p.type,
      tariffKey:  pick?.key   ?? '',
      tariffName: pick?.name  ?? '',
      price:      pick?.price ?? p.price,
    }));
  };

  /** Клик по чипу тарифа на карточке курса — выбирает курс + тип + цену */
  const handleTariffChipSelect = (e, courseId, tariff) => {
    e.stopPropagation();
    setForm((p) => ({
      ...p,
      course:     courseId,
      type:       tariff.key,
      tariffKey:  tariff.key,
      tariffName: tariff.name ?? tariff.key,
      price:      tariff.price ?? p.price,
    }));
  };

  return (
    <Stack spacing={3}>
      {/* Название группы */}
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>{t('groups.groupNameLabel')} *</Typography>
        <TextField fullWidth placeholder={t('groups.groupNamePlaceholder')}
          value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} autoFocus />
      </Box>

      {/* Выбор курса + тарифа одним касанием */}
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>{t('groups.selectCourse')} *</Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
          {t('groups.selectCourseHint')}
        </Typography>
        <Grid container spacing={1.5}>
          {courses.map((course, idx) => {
            const color    = PALETTE[idx % PALETTE.length];
            const title    = cTitle(course, lang);
            const selected = form.course === course._id;
            return (
              <Grid item xs={12} sm={6} key={course._id}>
                <Box onClick={() => handleCourseSelect(course._id)}
                  sx={{ p: 2, borderRadius: 2, cursor: 'pointer', border: '1.5px solid',
                    borderColor: selected ? color : 'divider', bgcolor: selected ? color + '12' : 'action.hover',
                    transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 1.5,
                    '&:hover': { borderColor: color, bgcolor: color + '08' } }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={selected ? 700 : 500}
                      color={selected ? color : 'text.primary'} noWrap>
                      {title}
                    </Typography>
                    {/* Тарифные чипы — кликабельны, выделяют активный */}
                    {course.tariffs?.length > 0 && (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ mt: 0.75, gap: 0.5 }}>
                        {course.tariffs.map((tar) => {
                          const tc       = TYPE_META.find((m) => m.value === tar.key);
                          const chipColor = tc?.color ?? color;
                          const active   = form.course === course._id && form.tariffKey === tar.key;
                          return (
                            <Chip
                              key={tar.key}
                              label={`${tar.name ?? tar.key}  ${formatPrice(tar.price)} so'm`}
                              size="small"
                              onClick={(e) => handleTariffChipSelect(e, course._id, tar)}
                              sx={{
                                height: 20, fontSize: '0.65rem', fontWeight: 700,
                                bgcolor: active ? chipColor + '30' : chipColor + '15',
                                color:   chipColor,
                                border:  active ? `1.5px solid ${chipColor}` : '1.5px solid transparent',
                                borderRadius: 1,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                '&:hover': { bgcolor: chipColor + '28', border: `1.5px solid ${chipColor}` },
                              }}
                            />
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                  {selected && form.tariffKey && <CheckCircleIcon sx={{ color, fontSize: 18, flexShrink: 0 }} />}
                </Box>
              </Grid>
            );
          })}
          {courses.length === 0 && (
            <Grid item xs={12}>
              <Typography variant="body2" color="text.disabled">{t('admin.noCourses')}</Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    </Stack>
  );
}

// ─── STEP 1: Teacher ──────────────────────────────────────────────────────────
function Step1Teacher({ form, setForm, teachers }) {
  const { t } = useTranslation();
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" fontWeight={700}>{t('groups.selectTeacher')} *</Typography>
      {teachers.length === 0 && (
        <Typography variant="body2" color="text.disabled" sx={{ py: 2, textAlign: 'center' }}>
          {t('admin.noTeachers', { defaultValue: 'Преподаватели не найдены' })}
        </Typography>
      )}
      <Grid container spacing={2}>
        {teachers.map((tch, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const sel   = form.teacherId === tch._id;
          return (
            <Grid item xs={12} sm={6} md={4} key={tch._id}>
              <Box onClick={() => setForm((p) => ({ ...p, teacherId: tch._id, teacherName: tch.name }))}
                sx={{ p: 2.5, borderRadius: 2.5, cursor: 'pointer', border: '1.5px solid',
                  borderColor: sel ? color : 'divider', bgcolor: sel ? color + '10' : 'action.hover',
                  transition: 'all 0.18s', position: 'relative',
                  '&:hover': { borderColor: color, bgcolor: color + '08', transform: 'translateY(-2px)' } }}>
                {sel && <CheckCircleIcon sx={{ position: 'absolute', top: 10, right: 10, color, fontSize: 18 }} />}
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                  <Avatar sx={{ width: 44, height: 44, bgcolor: color, fontWeight: 700 }}>
                    {(tch.name?.[0] ?? '?').toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{tch.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{tch.subject ?? ''}</Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Rating value={tch.rating ?? 5} max={5} size="small" readOnly precision={0.1} sx={{ fontSize: '0.75rem' }} />
                  <Typography variant="caption" color="text.secondary">{(tch.rating ?? 5).toFixed(1)}</Typography>
                </Stack>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}

// ─── STEP 2: Schedule ─────────────────────────────────────────────────────────
function Step2Schedule({ form, setForm }) {
  const { t } = useTranslation();
  const toggleDay = (day) => setForm((p) => ({
    ...p, days: p.days.includes(day) ? p.days.filter((d) => d !== day) : [...p.days, day],
  }));

  return (
    <Stack spacing={3}>
      {/* ── Дни недели ──────────────────────────────────────── */}
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>{t('groups.lessonDaysLabel')} *</Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
          {DAYS_LIST.map((day) => {
            const sel = form.days.includes(day);
            return (
              <Chip key={day} label={day} onClick={() => toggleDay(day)}
                variant={sel ? 'filled' : 'outlined'} color={sel ? 'primary' : 'default'}
                sx={{ fontWeight: 700, fontSize: '0.82rem', px: 0.5, cursor: 'pointer' }} />
            );
          })}
        </Stack>
      </Box>

      {/* ── Время, длительность, вместимость ────────────────── */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{t('groups.startTimeLabel')} *</Typography>
          <TextField fullWidth type="time" value={form.time}
            onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))}
            inputProps={{ step: 300 }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{t('groups.durationLabel2')}</Typography>
          <TextField fullWidth type="number" value={form.duration}
            onChange={(e) => setForm((p) => ({ ...p, duration: +e.target.value }))}
            inputProps={{ min: 30, max: 240, step: 15 }} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{t('groups.capacityLabel')}</Typography>
          <TextField fullWidth type="number" value={form.capacity}
            onChange={(e) => setForm((p) => ({ ...p, capacity: +e.target.value }))}
            inputProps={{ min: 1, max: 100 }} />
        </Grid>
      </Grid>

      {/* ── Цена берётся из тарифа (шаг 0) ─────────────────── */}
      {form.price > 0 && (
        <Alert severity="success" icon={false} sx={{ borderRadius: 2, py: 1 }}>
          <Typography variant="body2" fontWeight={700}>
            {t('groups.monthlyFeeLabel')}:{' '}
            <Typography component="span" color="success.dark" fontWeight={800}>
              {formatPrice(form.price)} {t('common.sum')}
            </Typography>
            {form.tariffName && (
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({form.tariffName})
              </Typography>
            )}
          </Typography>
        </Alert>
      )}
    </Stack>
  );
}

// ─── STEP 3: Students ─────────────────────────────────────────────────────────
function Step3Students({ form, setForm, students }) {
  const { t }  = useTranslation();
  const [search, setSearch] = useState('');
  const toggleStu = (sid) => setForm((p) => ({
    ...p,
    studentIds: p.studentIds.includes(sid)
      ? p.studentIds.filter((id) => id !== sid)
      : p.studentIds.length < p.capacity ? [...p.studentIds, sid] : p.studentIds,
  }));
  const filtered = students.filter((s) =>
    (s.name ?? '').toLowerCase().includes(search.toLowerCase()) || (s.phone ?? '').includes(search)
  );
  const fillPct = form.capacity > 0 ? Math.round((form.studentIds.length / form.capacity) * 100) : 0;
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" fontWeight={700}>{t('groups.addStudentsLabel')}</Typography>
        <Chip label={`${form.studentIds.length} / ${form.capacity}`} size="small"
          color={fillPct >= 90 ? 'error' : fillPct >= 70 ? 'warning' : 'primary'} variant="outlined" />
      </Stack>
      <LinearProgress variant="determinate" value={Math.min(fillPct, 100)}
        color={fillPct >= 90 ? 'error' : 'primary'} sx={{ height: 5, borderRadius: 3 }} />
      <TextField fullWidth size="small" placeholder={t('groups.searchByNamePhone')}
        value={search} onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornmentMUI position="start"><SearchIcon fontSize="small" /></InputAdornmentMUI> }} />
      <List dense disablePadding sx={{ maxHeight: 320, overflowY: 'auto' }}>
        {filtered.map((s, idx) => {
          const inGroup  = form.studentIds.includes(s._id);
          const isFull   = !inGroup && form.studentIds.length >= form.capacity;
          const stuColor = PALETTE[idx % PALETTE.length];
          return (
            <ListItem key={s._id} sx={{ py: 0.75, borderRadius: 2, mb: 0.5,
              bgcolor: inGroup ? 'primary.main' + '0F' : 'action.hover',
              border: '1px solid', borderColor: inGroup ? 'primary.main' + '40' : 'transparent' }}>
              <ListItemAvatar>
                <Avatar sx={{ width: 34, height: 34, bgcolor: inGroup ? 'primary.main' : stuColor, fontSize: '0.85rem', fontWeight: 700 }}>
                  {(s.name?.[0] ?? '?').toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={<Typography variant="body2" fontWeight={600}>{s.name}</Typography>}
                secondary={<Typography variant="caption" color="text.secondary">{s.phone ?? ''}</Typography>}
              />
              <ListItemSecondaryAction>
                <Tooltip title={inGroup ? t('groups.removeTooltip') : isFull ? t('groups.groupFullTooltip') : t('groups.addTooltip')}>
                  <span>
                    <IconButton size="small" color={inGroup ? 'error' : 'primary'}
                      disabled={isFull} onClick={() => toggleStu(s._id)}>
                      {inGroup ? <PersonRemoveIcon fontSize="small" /> : <PersonAddIcon fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
    </Stack>
  );
}

// ─── STEP 4: Confirm ──────────────────────────────────────────────────────────
function Step4Confirm({ form, students, courses }) {
  const { t }     = useTranslation();
  const lang      = i18n.language === 'ru' ? 'ru' : 'uz';
  const course    = courses.find((c) => c._id === form.course);
  const courseIdx = courses.findIndex((c) => c._id === form.course);
  const color     = courseIdx >= 0 ? PALETTE[courseIdx % PALETTE.length] : '#64748B';
  const memberList = students.filter((s) => form.studentIds.includes(s._id));

  return (
    <Stack spacing={2.5}>
      <Alert severity="info" sx={{ borderRadius: 2 }}>{t('groups.confirmAlertText')}</Alert>
      <Card elevation={0} sx={{ border: `2px solid ${color}40`, borderRadius: 3, bgcolor: color + '06' }}>
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 2 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color, mt: 0.75, flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={800} color={color}>{form.name}</Typography>
              <Typography variant="body2" color="text.secondary">{cTitle(course, lang)}</Typography>
            </Box>
            {(() => {
              const tm = TYPE_META.find((t) => t.value === form.type) ?? TYPE_META[0];
              return <Chip label={tm.label} size="small" variant="outlined" sx={{ borderColor: tm.color, color: tm.color, fontWeight: 700 }} />;
            })()}
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">{t('groups.teacherCaption')}</Typography>
              <Typography variant="body2" fontWeight={700}>{form.teacherName || '—'}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">{t('groups.scheduleCaption')}</Typography>
              <Typography variant="body2" fontWeight={700}>
                {form.days.length > 0 ? `${form.days.join('/')} · ${form.time}` : '—'}
              </Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">{t('groups.capacityCaption')}</Typography>
              <Typography variant="body2" fontWeight={700}>{form.studentIds.length} / {form.capacity}</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="caption" color="text.secondary" display="block">{t('groups.paymentCaption')}</Typography>
              <Typography variant="body2" fontWeight={700} color="success.main">{formatPrice(form.price)} {t('common.sum')}</Typography>
              {form.tariffName && (
                <Typography variant="caption" color="text.secondary">({form.tariffName})</Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      {memberList.length > 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            {t('groups.studentsToAdd', { count: memberList.length })}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.75 }}>
            {memberList.map((s, idx) => (
              <Chip key={s._id}
                avatar={<Avatar sx={{ bgcolor: PALETTE[idx % PALETTE.length], fontWeight: 700 }}>
                  {(s.name?.[0] ?? '?').toUpperCase()}
                </Avatar>}
                label={s.name} size="small" variant="outlined" />
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

// ─── Activation confirm dialog ────────────────────────────────────────────────
function ActivationConfirmDialog({ open, group, onClose, onConfirm, loading }) {
  const { t }    = useTranslation();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayStr);

  // Reset date when dialog reopens for a new group
  useEffect(() => { if (open) setStartDate(todayStr); }, [open]);

  if (!group) return null;

  const lang      = i18n.language === 'ru' ? 'ru' : 'uz';
  const duration  = group.course?.duration ?? 1;
  const startD    = new Date(startDate + 'T00:00:00');
  const endD      = new Date(startD); endD.setMonth(endD.getMonth() + duration);

  const today     = new Date(); today.setHours(0, 0, 0, 0);
  const diffDays  = Math.round((startD - today) / 86_400_000);
  const isFuture  = diffDays > 0;
  const isPast    = diffDays < 0;

  const fmt = (d) => d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });

  const DAYS_UZ = ['Yak','Du','Se','Ch','Pa','Ju','Sh'];
  const schedule = (group.schedule ?? [])
    .map((s) => `${DAYS_UZ[s.dayOfWeek ?? s.day] ?? '?'} ${s.startTime ?? ''}`)
    .join(' · ');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 0, fontWeight: 800 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 40, height: 40, borderRadius: 2,
            bgcolor: isFuture ? '#FFF7ED' : 'success.light',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlayCircleIcon sx={{ color: isFuture ? '#EA580C' : 'success.dark', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography fontWeight={800} variant="h6" lineHeight={1.2}>
              {isFuture ? t('groups.activateFutureTitle') : t('groups.activateNowTitle')}
            </Typography>
            <Typography variant="caption" color="text.secondary">{cTitle(group.course, lang)}</Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>

        {/* ── Дата начала ── */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
            {t('groups.courseStartDateLabel')}
          </Typography>
          <TextField
            type="date"
            size="small"
            fullWidth
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            inputProps={{ min: todayStr }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontWeight: 600 } }}
          />

          {/* Countdown hint */}
          {isFuture && (
            <Box sx={{
              mt: 1.5, px: 1.5, py: 1, borderRadius: 2,
              bgcolor: '#FFF7ED', border: '1px solid #FED7AA',
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              <AlarmIcon sx={{ fontSize: 18, color: '#EA580C' }} />
              <Box>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#C2410C' }}>
                  {t('groups.startsInDays', { days: diffDays })}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#9A3412' }}>
                  {t('groups.pendingStatusHint')}
                </Typography>
              </Box>
            </Box>
          )}

          {isPast && (
            <Alert severity="info" sx={{ mt: 1, borderRadius: 2, fontSize: '0.8rem' }}>
              {t('groups.pastDateHint')}
            </Alert>
          )}
        </Box>

        {/* ── Timeline ── */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: isFuture ? '#FED7AA' : 'divider', borderRadius: 2, mb: 2 }}>
          <CardContent sx={{ p: 1.75 }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary"
              sx={{ textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.25, display: 'block', fontSize: '0.62rem' }}>
              {t('groups.coursePeriod')}
            </Typography>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={5}>
                <Stack spacing={0.2}>
                  <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    {t('groups.courseStartLabel')}
                  </Typography>
                  <Typography variant="body2" fontWeight={800}
                    color={isFuture ? '#EA580C' : 'success.main'}>
                    {fmt(startD)}
                  </Typography>
                  {isFuture && (
                    <Chip label={t('groups.daysLeftChip', { days: diffDays })} size="small" color="warning"
                      sx={{ fontSize: '0.65rem', height: 18, width: 'fit-content' }} />
                  )}
                  {schedule && (
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary', mt: 0.25 }}>
                      🗓 {schedule}
                    </Typography>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={2} sx={{ textAlign: 'center' }}>
                <Typography variant="caption" color="text.disabled">{duration} {t('groups.monthsShort')}</Typography>
                <Box sx={{ height: 2, bgcolor: 'divider', mt: 0.5 }} />
              </Grid>
              <Grid item xs={5}>
                <Stack spacing={0.2}>
                  <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    {t('groups.courseEndLabel')}
                  </Typography>
                  <Typography variant="body2" fontWeight={800} color="primary.main">
                    {fmt(endD)}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: 'text.secondary' }}>
                    {t('groups.paymentsTotal', { count: duration })}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ── Что произойдёт ── */}
        <Stack spacing={0.75}>
          {[
            { icon: <CalendarMonthIcon sx={{ fontSize: 15, color: '#10B981' }} />,
              text: t('groups.paymentInfoMonth', { count: duration }) },
            { icon: <AlarmIcon sx={{ fontSize: 15, color: '#F59E0B' }} />,
              text: t('groups.paymentDeadlineInfo') },
            { icon: <BlockIcon sx={{ fontSize: 15, color: '#EF4444' }} />,
              text: t('groups.accessBlockedInfo') },
            { icon: <VideocamIcon sx={{ fontSize: 15, color: '#6366F1' }} />,
              text: isFuture
                ? t('groups.teacherNotifyFuture', { days: diffDays })
                : t('groups.allNotifiedNow') },
          ].map((item, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="flex-start" sx={{ py: 0.3 }}>
              <Box sx={{ mt: 0.15, flexShrink: 0 }}>{item.icon}</Box>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
                {item.text}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button sx={{ borderRadius: 2, color: 'text.secondary' }} onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          color={isFuture ? 'warning' : 'success'}
          sx={{ borderRadius: 2, px: 3, fontWeight: 700 }}
          disabled={loading || !startDate}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <PlayCircleIcon />}
          onClick={() => onConfirm(startDate)}>
          {loading
            ? t('groups.savingLabel')
            : isFuture
              ? t('groups.activateBtnFuture', { days: diffDays })
              : t('groups.activateBtnNow')
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── CREATE wizard ────────────────────────────────────────────────────────────
function CreateGroupDialog({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const { data: coursesRes }     = useGetCoursesQuery({ limit: 100 });
  const { data: teachersRes }    = useGetUsersQuery({ role: 'teacher', limit: 100 });
  const { data: studentsRes }    = useGetUsersQuery({ role: 'student', limit: 200 });
  const { data: tariffPlansRes } = useGetTariffPlansQuery();

  const apiCourses  = coursesRes?.data  ?? [];
  const teachers    = teachersRes?.data ?? [];
  const students    = studentsRes?.data ?? [];
  const tariffPlans = Array.isArray(tariffPlansRes?.data) ? tariffPlansRes.data : [];

  const [createGroup, { isLoading: creating }] = useCreateGroupMutation();
  const [addGroupMember]                        = useAddGroupMemberMutation();

  const [step, setStep]   = useState(0);
  const [form, setForm]   = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const STEP_LABELS = [
    t('groups.stepGroup'), t('groups.stepTeacher'),
    t('groups.stepSchedule'), t('groups.stepStudents'), t('groups.stepConfirm'),
  ];

  const handleClose = () => { setStep(0); setForm(EMPTY_FORM); setError(''); onClose(); };

  const validate = () => {
    if (step === 0) {
      if (!form.name.trim())  return t('groups.validateGroupName');
      if (!form.course)       return t('groups.validateCourse');
      if (!form.tariffKey)    return t('groups.validateTariff', { defaultValue: "Kurs tarifini tanlang (narx chipini bosing)" });
    }
    if (step === 1 && !form.teacherId) return t('groups.validateTeacher');
    if (step === 2) {
      if (form.days.length === 0) return t('groups.validateDays');
      if (!form.time)             return t('groups.validateTime');
    }
    return '';
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(''); setStep((s) => s + 1);
  };

  const handleBack = () => { setError(''); setStep((s) => s - 1); };

  const handleCreate = async () => {
    setError('');
    const endTime = addMinutesToTime(form.time, form.duration);
    const payload = {
      name:        form.name,
      course:      form.course,
      teacher:     form.teacherId,
      type:        form.type,
      maxStudents: form.capacity,
      isActive:    false, // groups start INACTIVE — admin must activate explicitly
      price:       { amount: form.price, currency: 'UZS' },
      // startDate is NOT sent — it is set automatically when admin activates the group
      schedule: form.days.map((day) => ({
        dayOfWeek: DAY_TO_DOW[day] ?? 1,
        startTime: form.time,
        endTime,
      })),
    };
    try {
      const res     = await createGroup(payload).unwrap();
      const groupId = res?.data?._id ?? res?.data?.id;
      if (groupId && form.studentIds.length > 0) {
        await Promise.allSettled(
          form.studentIds.map((sid) => addGroupMember({ groupId, studentId: sid }))
        );
      }
      handleClose();
      if (onCreated && res?.data) onCreated(res.data);
    } catch (err) {
      setError(err?.data?.message ?? t('common.error'));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ px: 3, pt: 3, pb: 0 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={800}>{t('groups.createGroupTitle')}</Typography>
          <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
        </Stack>
        <Stepper activeStep={step} alternativeLabel>
          {STEP_LABELS.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
      </DialogTitle>

      <DialogContent sx={{ px: 3, pt: 3, pb: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.2 }}>
            {step === 0 && <Step0Basic form={form} setForm={setForm} courses={apiCourses} />}
            {step === 1 && <Step1Teacher form={form} setForm={setForm} teachers={teachers} />}
            {step === 2 && <Step2Schedule form={form} setForm={setForm} />}
            {step === 3 && <Step3Students form={form} setForm={setForm} students={students} />}
            {step === 4 && <Step4Confirm form={form} students={students} courses={apiCourses} />}
          </motion.div>
        </AnimatePresence>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2.5, gap: 1 }}>
        <Button onClick={handleClose} sx={{ borderRadius: 2, color: 'text.secondary' }}>{t('common.cancel')}</Button>
        <Box sx={{ flex: 1 }} />
        {step > 0 && <Button onClick={handleBack} sx={{ borderRadius: 2 }}>← {t('common.back')}</Button>}
        {step < 4 ? (
          <Button variant="contained" onClick={handleNext} sx={{ borderRadius: 2, px: 3 }}>
            {t('common.next')} →
          </Button>
        ) : (
          <Button variant="contained" onClick={handleCreate} sx={{ borderRadius: 2, px: 3 }}
            disabled={creating}
            startIcon={creating ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}>
            {t('groups.createGroupBtn')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── EDIT dialog ───────────────────────────────────────────────────────────────
function EditGroupDialog({ open, onClose, group }) {
  const { t }    = useTranslation();
  const lang     = i18n.language === 'ru' ? 'ru' : 'uz';
  const { data: teachersRes }    = useGetUsersQuery({ role: 'teacher', limit: 100 });
  const { data: tariffPlansRes } = useGetTariffPlansQuery();
  const { data: coursesRes }     = useGetCoursesQuery({});
  const teachers    = teachersRes?.data ?? [];
  const tariffPlans = Array.isArray(tariffPlansRes?.data) ? tariffPlansRes.data : [];
  const courses     = coursesRes?.data ?? coursesRes?.courses ?? [];

  const [updateGroup, { isLoading: updating }] = useUpdateGroupMutation();
  const [saveError, setSaveError]       = useState('');
  const [changingCourse, setChangingCourse] = useState(false);

  const VALID_TYPES = ['offline', 'online', 'individual_offline', 'individual_online', 'individual_package'];
  const safeType = (raw) => VALID_TYPES.includes(raw) ? raw : 'online';
  const isIndPkg = group?.type === 'individual_package';

  const initForm = (g) => {
    const type = safeType(g?.type);
    return {
      name:        g?.name ?? '',
      course:      String(g?.course?._id ?? g?.course ?? ''),
      teacherId:   String(g?.teacher?._id ?? g?.teacher ?? ''),
      teacherName: g?.teacher?.name ?? '',
      time:        groupTime(g ?? {}) || '09:00',
      days:        groupDays(g ?? {}),
      duration:    90,
      capacity:    g?.maxStudents ?? 20,
      price:       g?.price?.amount ?? 0,
      type,
      tariffKey:   type,   // тариф = тип (key совпадают)
      tariffName:  '',     // заполнится при рендере из tariffPlans
    };
  };

  const [form, setForm] = useState(() => initForm(group));

  useEffect(() => {
    if (open && group) { setForm(initForm(group)); setSaveError(''); setChangingCourse(false); }
  }, [open, String(group?._id)]);

  const handleSave = async () => {
    setSaveError('');
    if (!form.name.trim())       return setSaveError(t('groups.validateGroupName'));
    if (!form.teacherId)         return setSaveError(t('groups.validateTeacher'));
    if (form.days.length === 0)  return setSaveError(t('groups.validateDays'));
    if (!form.time)              return setSaveError(t('groups.validateTime'));

    const safeTime = /^\d{2}:\d{2}$/.test(form.time) ? form.time : '09:00';
    const endTime  = addMinutesToTime(safeTime, form.duration || 90);

    const payload = {
      name:        form.name,
      teacher:     form.teacherId,
      course:      form.course || undefined,
      type:        safeType(form.type),
      maxStudents: form.capacity,
      price:       { amount: Number(form.price) || 0, currency: 'UZS' },
      schedule:    form.days.map((day) => ({
        dayOfWeek: DAY_TO_DOW[day] ?? 1,
        startTime: safeTime,
        endTime,
      })),
    };
    try {
      await updateGroup({ id: group._id, ...payload }).unwrap();
      onClose();
    } catch (err) {
      setSaveError(
        err?.data?.message || err?.data?.error ||
        err?.error || t('common.error')
      );
    }
  };

  const color = PALETTE[0];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>
        {t('groups.editGroupTitle')} — {group?.name}
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Error */}
          {saveError && (
            <Alert severity="error" onClose={() => setSaveError('')} sx={{ borderRadius: 2 }}>
              {saveError}
            </Alert>
          )}

          {/* Name */}
          <TextField label={t('groups.groupNameLabel')} fullWidth value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />

          {/* Course / Subject — read-only display + change toggle */}
          {courses.length > 0 && (() => {
            const currentCourse = courses.find((c) => c._id === form.course);
            const courseIdx     = courses.findIndex((c) => c._id === form.course);
            const courseColor   = courseIdx >= 0 ? PALETTE[courseIdx % PALETTE.length] : '#64748B';
            const courseTitle   = currentCourse ? cTitle(currentCourse, lang) : '—';
            return (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  {t('groups.selectCourse')}
                </Typography>
                {/* Current course display */}
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{
                    flex: 1, p: '10px 14px', borderRadius: 2,
                    border: '1.5px solid', borderColor: courseColor,
                    bgcolor: courseColor + '12',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                  }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: courseColor, flexShrink: 0 }} />
                    <Typography variant="body2" fontWeight={700} color={courseColor} noWrap>
                      {courseTitle}
                    </Typography>
                    {currentCourse && <CheckCircleIcon sx={{ color: courseColor, fontSize: 16, ml: 'auto' }} />}
                  </Box>
                  <Tooltip title={t('common.edit')}>
                    <IconButton size="small" onClick={() => setChangingCourse((v) => !v)}
                      color={changingCourse ? 'primary' : 'default'}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
                {/* Expandable course picker */}
                {changingCourse && (
                  <Grid container spacing={1} sx={{ mt: 1 }}>
                    {courses.map((course, idx) => {
                      const c   = PALETTE[idx % PALETTE.length];
                      const sel = form.course === course._id;
                      return (
                        <Grid item xs={12} sm={6} key={course._id}>
                          <Box
                            onClick={() => { setForm((p) => ({ ...p, course: course._id })); setChangingCourse(false); }}
                            sx={{
                              p: 1.5, borderRadius: 2, cursor: 'pointer', border: '1.5px solid',
                              borderColor: sel ? c : 'divider',
                              bgcolor: sel ? c + '12' : 'action.hover',
                              display: 'flex', alignItems: 'center', gap: 1.5,
                              transition: 'all 0.18s',
                              '&:hover': { borderColor: c, bgcolor: c + '08' },
                            }}
                          >
                            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={sel ? 700 : 500}
                              color={sel ? c : 'text.primary'} sx={{ flex: 1 }} noWrap>
                              {cTitle(course, lang)}
                            </Typography>
                            {sel && <CheckCircleIcon sx={{ color: c, fontSize: 16 }} />}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </Box>
            );
          })()}

          {/* Tariff — not applicable for individual_package (price comes from the package itself) */}
          {tariffPlans.length > 0 && !isIndPkg && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                {t('groups.tariffLabel', { defaultValue: 'Tarif' })}
              </Typography>
              <Grid container spacing={1}>
                {tariffPlans.map((plan) => {
                  const sel = form.tariffKey === plan.key;
                  return (
                    <Grid item xs={12} sm={4} key={plan.key}>
                      <Box
                        onClick={() => setForm((p) => ({
                          ...p,
                          type:       VALID_TYPES.includes(plan.key) ? plan.key : p.type,
                          tariffKey:  plan.key,
                          tariffName: plan.name?.ru ?? plan.key,
                          price:      sel ? p.price : plan.defaultPrice,
                        }))}
                        sx={{
                          p: 1.5, borderRadius: 2, cursor: 'pointer', border: '2px solid',
                          borderColor: sel ? plan.color : 'divider',
                          bgcolor: sel ? plan.color + '12' : 'action.hover',
                          transition: 'all 0.18s',
                          '&:hover': { borderColor: plan.color, bgcolor: plan.color + '08' },
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="body2" fontWeight={700} color={sel ? plan.color : 'text.primary'}>
                            {plan.name?.ru}
                          </Typography>
                          {sel && <CheckCircleIcon sx={{ color: plan.color, fontSize: 16 }} />}
                        </Stack>
                        <Typography variant="caption" fontWeight={700} color={sel ? plan.color : 'text.secondary'}>
                          {formatPrice(plan.defaultPrice)} so'm
                        </Typography>
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}

          {/* Teacher */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>{t('groups.teacherCaption')}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {teachers.map((tch, idx) => {
                const tColor = PALETTE[idx % PALETTE.length];
                const sel    = form.teacherId === tch._id;
                return (
                  <Chip key={tch._id}
                    avatar={<Avatar sx={{ bgcolor: tColor, fontWeight: 700, width: 24, height: 24, fontSize: '0.75rem' }}>
                      {(tch.name?.[0] ?? '?').toUpperCase()}
                    </Avatar>}
                    label={tch.name}
                    onClick={() => setForm((p) => ({ ...p, teacherId: tch._id, teacherName: tch.name }))}
                    variant={sel ? 'filled' : 'outlined'} color={sel ? 'primary' : 'default'}
                    sx={{ fontWeight: sel ? 700 : 500 }} />
                );
              })}
            </Stack>
          </Box>

          {/* Schedule */}
          <Grid container spacing={2}>
            <Grid item xs={isIndPkg ? 12 : 8}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{t('groups.timeLabel')}</Typography>
              <TextField fullWidth size="small" type="time" value={form.time}
                onChange={(e) => setForm((p) => ({ ...p, time: e.target.value }))} />
            </Grid>
            {!isIndPkg && (
              <Grid item xs={4}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{t('groups.priceLabel')}</Typography>
                <TextField fullWidth size="small" type="number" value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: +e.target.value }))} />
              </Grid>
            )}
          </Grid>
          {/* For individual_package — show one-time price info (read-only) */}
          {isIndPkg && (
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#7C3AED08', border: '1px solid #7C3AED20' }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
                Narx (paketdan)
              </Typography>
              <Typography variant="body2" fontWeight={800} color="#7C3AED">
                {(group?.price?.amount ?? 0).toLocaleString()} {group?.price?.currency ?? 'UZS'}
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  — bir martalik to'lov
                </Typography>
              </Typography>
            </Box>
          )}

          {/* Days */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{t('groups.lessonDaysEditLabel')}</Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5 }}>
              {DAYS_LIST.map((day) => {
                const sel = form.days.includes(day);
                return (
                  <Chip key={day} label={day} size="small"
                    onClick={() => setForm((p) => ({
                      ...p, days: p.days.includes(day) ? p.days.filter((d) => d !== day) : [...p.days, day]
                    }))}
                    variant={sel ? 'filled' : 'outlined'} color={sel ? 'primary' : 'default'}
                    sx={{ fontWeight: 700, cursor: 'pointer' }} />
                );
              })}
            </Stack>
          </Box>

          {/* Capacity */}
          <TextField label={t('groups.capacityLabel')} fullWidth size="small" type="number"
            value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: +e.target.value }))}
            inputProps={{ min: 1, max: 100 }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button sx={{ borderRadius: 2 }} onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" sx={{ borderRadius: 2 }} onClick={handleSave} disabled={updating}
          startIcon={updating ? <CircularProgress size={14} color="inherit" /> : null}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─── Payment helpers ────────────────────────────────────────────────────────── */
const MONTH_UZ = ['Yan','Feb','Mar','Apr','May','Iyn','Iyl','Avg','Sen','Okt','Noy','Dek'];
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function fmtMonth(ym) {
  if (!ym) return '—';
  const [y, m] = ym.split('-');
  return `${MONTH_UZ[+m - 1] ?? m} ${y}`;
}
function daysFrom(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - new Date()) / 86400000);
}

/* ─── Mini month dot ─────────────────────────────────────────────────────────── */
function MiniMonthDot({ payment }) {
  const status = payment?.status ?? 'debt';
  const days   = daysFrom(payment?.dueDate);
  const isOver = days !== null && days < 0;

  const cfg = {
    paid:    { color: '#10B981', bg: '#10B98120', Icon: CheckCircleIcon },
    pending: { color: '#F59E0B', bg: '#F59E0B20', Icon: HourglassTopIcon },
    partial: { color: '#3B82F6', bg: '#3B82F620', Icon: PaymentsIcon },
    debt:    { color: isOver ? '#EF4444' : '#94A3B8', bg: isOver ? '#EF444420' : '#94A3B820', Icon: isOver ? AlarmIcon : CalendarMonthIcon },
    refunded:{ color: '#64748B', bg: '#64748B20', Icon: CheckCircleIcon },
  };
  const { color, bg, Icon } = cfg[status] ?? cfg.debt;
  const label = fmtMonth(payment?.month ?? '');

  return (
    <Tooltip title={`${label} — ${status === 'paid' ? "To'langan" : status === 'pending' ? 'Tekshirilmoqda' : isOver ? 'Kechikkan' : "To'lanmagan"}`} arrow>
      <Stack alignItems="center" spacing={0.25} sx={{ cursor: 'default' }}>
        <Box sx={{
          width: 30, height: 30, borderRadius: '50%', bgcolor: bg, color,
          border: `1.5px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon sx={{ fontSize: 14 }} />
        </Box>
        <Typography variant="caption" color={color} sx={{ fontSize: '0.58rem', fontWeight: 700, lineHeight: 1 }}>
          {(payment?.month ?? '').split('-')[1] ? MONTH_UZ[+(payment.month.split('-')[1]) - 1]?.slice(0, 3) : '—'}
        </Typography>
      </Stack>
    </Tooltip>
  );
}

/* ─── Payment status tab content ─────────────────────────────────────────────── */
function PaymentStatusTab({ groupId, group }) {
  const { t } = useTranslation();
  const { data: res, isLoading, refetch } = useGetGroupMembersWithPaymentsQuery(groupId, { skip: !groupId });
  const [setMemberAccess, { isLoading: toggling }] = useSetMemberAccessMutation();

  const isIndPkg = group?.type === 'individual_package';

  const data    = res?.data ?? {};
  const members = data.members ?? [];
  const grp     = data.group   ?? group;

  const duration  = grp?.course?.duration ?? 1;
  const startDate = grp?.startDate;
  const endDate   = startDate
    ? new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + duration))
    : null;

  // 4 states: blocked | manualUnlocked (debt+access granted) | warning | active
  const blockedCount       = members.filter((m) => m.member.paymentBlocked).length;
  const manualUnlockCount  = members.filter((m) => m.member.manualAccessGranted).length;
  const warningCount       = members.filter((m) => !m.member.paymentBlocked && !m.member.hasOverdue && (m.startedUnpaidCount ?? 0) > 0).length;
  const allClear           = blockedCount === 0 && manualUnlockCount === 0 && warningCount === 0 && members.length > 0;

  const handleToggleAccess = async (studentId, currentlyGranted) => {
    try {
      await setMemberAccess({ groupId, studentId, manualAccessGranted: !currentlyGranted }).unwrap();
    } catch { /* ignore — cache invalidated on success */ }
  };

  if (isLoading) return <Box sx={{ py: 5, textAlign: 'center' }}><CircularProgress /></Box>;

  if (members.length === 0) {
    return (
      <Box sx={{ py: 5, textAlign: 'center' }}>
        <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography color="text.secondary">{t('groups.noStudentsYet')}</Typography>
      </Box>
    );
  }

  /* ── individual_package: one-time payment view ── */
  if (isIndPkg) {
    return (
      <Stack spacing={0}>
        <Box sx={{ px: 2, py: 1.25, bgcolor: 'action.hover', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <InventoryIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              {t('groups.oneTimePaymentLabel')} — {members.length} {t('groups.members').toLowerCase()}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Tooltip title="Yangilash">
              <IconButton size="small" onClick={refetch}><CheckCircleIcon sx={{ fontSize: 15, color: 'text.disabled' }} /></IconButton>
            </Tooltip>
          </Stack>
        </Box>

        {members.map((item, idx) => {
          const { member, student, payments } = item;
          const color              = PALETTE[idx % PALETTE.length];
          const isPaid             = payments?.some((p) => p.status === 'paid');
          const isPending          = payments?.some((p) => p.status === 'pending');
          const isManualUnlocked   = member.manualAccessGranted;
          /* effectively blocked = no payment of any kind AND admin hasn't manually unlocked */
          const isEffectivelyBlocked = !isPaid && !isPending && !isManualUnlocked;
          const paidPayment        = payments?.find((p) => p.status === 'paid');
          const amount             = paidPayment?.paidAmount ?? paidPayment?.amount ?? group?.price?.amount ?? 0;

          const borderColor = isEffectivelyBlocked ? '#EF4444'
                            : isManualUnlocked     ? '#FB923C'
                            : isPaid               ? '#10B981'
                            : '#94A3B8';
          const rowBg       = isEffectivelyBlocked ? '#EF444408'
                            : isManualUnlocked     ? '#FB923C06'
                            : 'transparent';

          return (
            <Box key={member._id} sx={{
              px: 2, py: 1.5,
              borderBottom: '1px solid', borderColor: 'divider',
              bgcolor: rowBg, borderLeft: `3px solid ${borderColor}`,
              '&:last-child': { borderBottom: 'none' },
            }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 34, height: 34, bgcolor: color + '20', color, fontWeight: 800, fontSize: '0.88rem', flexShrink: 0 }}>
                  {(student?.name?.[0] ?? '?').toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Typography variant="body2" fontWeight={700} noWrap>{student?.name ?? '—'}</Typography>
                    {/* Warning icon: admin gave access but student hasn't paid */}
                    {isManualUnlocked && !isPaid && (
                      <Tooltip title={t('groups.studentNotPaidWarning')} arrow>
                        <WarningAmberIcon sx={{ fontSize: 15, color: '#FB923C', flexShrink: 0 }} />
                      </Tooltip>
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">{student?.phone ?? ''}</Typography>
                </Box>

                {/* Payment status */}
                {isPaid ? (
                  <Stack alignItems="flex-end" spacing={0.25}>
                    <Chip icon={<CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
                      label={t('status.paid')} size="small" color="success"
                      sx={{ fontSize: '0.68rem', height: 22, fontWeight: 700 }} />
                    {amount > 0 && (
                      <Typography variant="caption" color="success.main" fontWeight={700}>
                        {amount.toLocaleString()} UZS
                      </Typography>
                    )}
                  </Stack>
                ) : isPending ? (
                  <Chip icon={<HourglassTopIcon sx={{ fontSize: '13px !important' }} />}
                    label={t('payment.pending')} size="small" color="warning"
                    sx={{ fontSize: '0.68rem', height: 22, fontWeight: 700 }} />
                ) : (
                  <Chip icon={<AlarmIcon sx={{ fontSize: '13px !important' }} />}
                    label={t('payment.statusDebt')} size="small" color="error"
                    sx={{ fontSize: '0.68rem', height: 22, fontWeight: 700 }} />
                )}

                {/* Access toggle */}
                {isEffectivelyBlocked && (
                  <Tooltip title={t('groups.grantAccessTooltip')}>
                    <Button size="small" variant="contained"
                      startIcon={<LockOpenIcon sx={{ fontSize: 13 }} />}
                      disabled={toggling}
                      onClick={() => setMemberAccess({ groupId, studentId: student._id, manualAccessGranted: true }).unwrap().catch(() => {})}
                      sx={{ fontSize: '0.65rem', px: 1.25, py: 0.4, borderRadius: 2, whiteSpace: 'nowrap',
                        bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}>
                      {t('groups.giveAccessBtn')}
                    </Button>
                  </Tooltip>
                )}
                {isManualUnlocked && (
                  <Tooltip title={t('groups.revokeAccessTooltip')}>
                    <Button size="small" variant="outlined" color="warning"
                      startIcon={<LockIcon sx={{ fontSize: 13 }} />}
                      disabled={toggling}
                      onClick={() => setMemberAccess({ groupId, studentId: student._id, manualAccessGranted: false }).unwrap().catch(() => {})}
                      sx={{ fontSize: '0.65rem', px: 1, py: 0.25, borderRadius: 2, whiteSpace: 'nowrap' }}>
                      {t('groups.revokeAccessBtn')}
                    </Button>
                  </Tooltip>
                )}
              </Stack>
            </Box>
          );
        })}
      </Stack>
    );
  }

  return (
    <Stack spacing={0}>
      {/* Course period summary bar */}
      <Card elevation={0} sx={{ bgcolor: 'action.hover', borderRadius: 0, borderBottom: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={2}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <PlayCircleIcon sx={{ fontSize: 15, color: 'success.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>{t('groups.courseStartedLabel')}</Typography>
                    <DateBadge iso={startDate} />
                  </Box>
                </Stack>
                <Box sx={{ width: 1, bgcolor: 'divider', alignSelf: 'stretch' }} />
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <FlagIcon sx={{ fontSize: 15, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>{t('groups.courseEndLabel2')}</Typography>
                    <DateBadge iso={endDate} />
                  </Box>
                </Stack>
                <Box sx={{ width: 1, bgcolor: 'divider', alignSelf: 'stretch' }} />
                <Box>
                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>{t('groups.courseDurationLabel')}</Typography>
                  <Typography variant="body2" fontWeight={700}>{duration} {t('groups.monthsShort')}</Typography>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
                sx={{ gap: 0.75 }}>
                <Chip icon={<PeopleIcon sx={{ fontSize: '14px !important' }} />}
                  label={t('teacher.studentsCount', { count: members.length })} size="small" variant="outlined" />
                {blockedCount > 0 && (
                  <Chip icon={<BlockIcon sx={{ fontSize: '14px !important' }} />}
                    label={`${blockedCount} ${t('groups.blockedStatus')}`} size="small" color="error" />
                )}
                {manualUnlockCount > 0 && (
                  <Chip icon={<LockOpenIcon sx={{ fontSize: '14px !important' }} />}
                    label={`${manualUnlockCount} ${t('groups.manualUnlockStatus')}`} size="small" color="warning"
                    sx={{ bgcolor: '#FB923C20', color: '#FB923C', border: '1px solid #FB923C60' }} />
                )}
                {warningCount > 0 && (
                  <Chip icon={<AlarmIcon sx={{ fontSize: '14px !important' }} />}
                    label={`${warningCount} ${t('status.pending')}`} size="small" color="warning" />
                )}
                {allClear && (
                  <Chip icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                    label={t('payment.allClearLabel')} size="small" color="success" />
                )}
                <Tooltip title={t('common.refresh')}>
                  <IconButton size="small" onClick={refetch} sx={{ ml: 0.5 }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Member rows */}
      {members.map((item, idx) => {
        const { member, student, payments, paidMonths, progressPct,
                overdueCount, startedUnpaidCount, pendingCount, nextDuePayment } = item;

        const color            = PALETTE[idx % PALETTE.length];
        const isBlocked        = member.paymentBlocked;           // blocked for any reason (neverPaid or overdue), NOT manually granted
        const isManualUnlocked = member.manualAccessGranted;      // admin manually granted access (overrides block)
        const isWarning        = !isBlocked && !isManualUnlocked && (startedUnpaidCount ?? 0) > 0;
        const allOk            = !isBlocked && !isManualUnlocked && !isWarning && overdueCount === 0 && paidMonths >= duration;
        const daysLeft         = daysFrom(nextDuePayment?.dueDate);
        const isOverdue        = daysLeft !== null && daysLeft < 0;

        /* Row border colour: red | orange | yellow | green | gray */
        const borderColor = isBlocked        ? '#EF4444'
                          : isManualUnlocked ? '#FB923C'
                          : isWarning        ? '#F59E0B'
                          : allOk            ? '#10B981'
                          : overdueCount === 0 && pendingCount === 0 && payments.length > 0
                          ? '#10B981'
                          : '#64748B';

        const rowBg = isBlocked        ? '#EF444408'
                    : isManualUnlocked ? '#FB923C06'
                    : isWarning        ? '#F59E0B06'
                    : 'transparent';

        return (
          <Box key={member._id}
            sx={{
              px: 2, py: 1.75,
              borderBottom: '1px solid', borderColor: 'divider',
              bgcolor: rowBg,
              borderLeft: `3px solid ${borderColor}`,
              '&:last-child': { borderBottom: 'none' },
            }}>
            <Grid container spacing={1.5} alignItems="center">

              {/* Student info + status chip */}
              <Grid item xs={12} sm={3}>
                <Stack direction="row" spacing={1.25} alignItems="center">
                  <Avatar sx={{ width: 36, height: 36, bgcolor: color + '20', color, fontWeight: 800, fontSize: '0.9rem' }}>
                    {(student?.name?.[0] ?? '?').toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap sx={{ mb: 0.25 }}>
                      {student?.name ?? '—'}
                    </Typography>

                    {isBlocked ? (
                      <Chip icon={<BlockIcon sx={{ fontSize: '11px !important' }} />}
                        label={t('groups.blockedStatus')} size="small" color="error"
                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                    ) : isManualUnlocked ? (
                      <Chip icon={<LockOpenIcon sx={{ fontSize: '11px !important' }} />}
                        label={t('groups.manualUnlockStatus')} size="small"
                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700,
                              bgcolor: '#FB923C20', color: '#FB923C', border: '1px solid #FB923C60' }} />
                    ) : isWarning ? (
                      <Chip icon={<AlarmIcon sx={{ fontSize: '11px !important' }} />}
                        label={t('status.pending')} size="small" color="warning"
                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                    ) : allOk ? (
                      <Chip icon={<CheckCircleIcon sx={{ fontSize: '11px !important' }} />}
                        label={t('status.active')} size="small" color="success"
                        sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {student?.studentId ?? student?.phone ?? ''}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Grid>

              {/* Month dots */}
              <Grid item xs={12} sm={3}>
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ overflowX: 'auto', pb: 0.25 }}>
                  {payments.length > 0 ? (
                    payments.map((p) => <MiniMonthDot key={p._id} payment={p} />)
                  ) : (
                    <Typography variant="caption" color="text.disabled">{t('groups.noPaymentsYet')}</Typography>
                  )}
                  {Array.from({ length: Math.max(0, duration - payments.length) }).map((_, i) => (
                    <Box key={`e-${i}`} sx={{
                      width: 30, height: 30, borderRadius: '50%',
                      border: '1.5px dashed #CBD5E1', bgcolor: '#F8FAFC',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <CalendarMonthIcon sx={{ fontSize: 13, color: '#CBD5E1' }} />
                    </Box>
                  ))}
                </Stack>
              </Grid>

              {/* Progress bar */}
              <Grid item xs={12} sm={2.5}>
                <Stack spacing={0.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem' }}>
                      {paidMonths} / {duration} {t('groups.monthsShort')}
                    </Typography>
                    <Typography variant="caption" fontWeight={700} sx={{ fontSize: '0.68rem' }}
                      color={paidMonths >= duration ? 'success.main' : isOverdue ? 'error.main' : 'text.secondary'}>
                      {progressPct}%
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={progressPct}
                    sx={{
                      height: 6, borderRadius: 3, bgcolor: '#E2E8F0',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: paidMonths >= duration ? '#10B981'
                               : isBlocked             ? '#EF4444'
                               : isManualUnlocked      ? '#FB923C'
                               : color,
                        borderRadius: 3,
                      },
                    }} />
                </Stack>
              </Grid>

              {/* Next payment info */}
              <Grid item xs={12} sm={1.5}>
                {nextDuePayment ? (
                  <Box>
                    <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem', display: 'block', mb: 0.25 }}>
                      {t('groups.nextPaymentLabel')}
                    </Typography>
                    <DueDateBadge iso={nextDuePayment.dueDate} />
                  </Box>
                ) : (
                  paidMonths >= duration
                    ? <Chip icon={<CheckCircleIcon sx={{ fontSize: '12px !important' }} />}
                        label={t('status.done')} size="small" color="success"
                        sx={{ fontSize: '0.65rem', height: 20 }} />
                    : <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>—</Typography>
                )}
              </Grid>

              {/* ── Access toggle button ── */}
              <Grid item xs={12} sm={2}>
                {isBlocked ? (
                  /* Blocked for any reason (neverPaid or overdue) → grant access */
                  <Tooltip title={t('groups.grantAccessTooltip')}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<LockOpenIcon sx={{ fontSize: 14 }} />}
                      disabled={toggling}
                      onClick={() => handleToggleAccess(student._id, false)}
                      sx={{
                        fontSize: '0.65rem', px: 1.25, py: 0.4, minWidth: 0, borderRadius: 2, whiteSpace: 'nowrap',
                        bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' },
                      }}>
                      {t('groups.giveAccessBtn')}
                    </Button>
                  </Tooltip>
                ) : isManualUnlocked ? (
                  /* Admin manually granted access → allow revocation */
                  <Tooltip title={t('groups.revokeAccessTooltip')}>
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<LockIcon sx={{ fontSize: 14 }} />}
                      disabled={toggling}
                      onClick={() => handleToggleAccess(student._id, true)}
                      sx={{ fontSize: '0.65rem', px: 1, py: 0.25, minWidth: 0, borderRadius: 2, whiteSpace: 'nowrap' }}>
                      {t('groups.revokeAccessBtn')}
                    </Button>
                  </Tooltip>
                ) : null}
              </Grid>

            </Grid>
          </Box>
        );
      })}
    </Stack>
  );
}

// ─── Members view dialog (now: GroupDetailDialog with tabs) ───────────────────
function MembersDialog({ open, onClose, group }) {
  const { t } = useTranslation();
  const lang  = i18n.language === 'ru' ? 'ru' : 'uz';
  const [tab, setTab] = useState(0);

  const [addGroupMember,    { isLoading: adding }]   = useAddGroupMemberMutation();
  const [removeGroupMember, { isLoading: removing }] = useRemoveGroupMemberMutation();
  const { data: studentsRes } = useGetUsersQuery({ role: 'student', limit: 200 });
  const { data: membersRes, isLoading: loadingMembers } = useGetGroupMembersQuery(group?._id, { skip: !group?._id });

  const allStudents = studentsRes?.data ?? [];
  const members     = (membersRes?.data ?? []).map((m) => m.student).filter(Boolean);
  const memberIds   = new Set(members.map((s) => s._id));

  const [search,     setSearch]     = useState('');
  const [pendingAdd, setPendingAdd] = useState(new Set());

  /* Reset pending selections when dialog opens/closes */
  useEffect(() => {
    if (!open) { setSearch(''); setPendingAdd(new Set()); setTab(0); }
  }, [open]);

  if (!group) return null;

  const isIndPkg = group.type === 'individual_package';

  /* Students NOT in group, filtered by search */
  const available = allStudents.filter((s) =>
    !memberIds.has(s._id) &&
    ((s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
     (s.phone ?? '').includes(search))
  );

  /* Toggle student in pending-add set */
  const togglePending = (id) => setPendingAdd((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleRemove = async (studentId) => {
    try { await removeGroupMember({ groupId: group._id, studentId }).unwrap(); } catch { /* ignore */ }
  };

  /* Save all pending additions at once */
  const handleSave = async () => {
    if (pendingAdd.size === 0) return;
    await Promise.allSettled(
      [...pendingAdd].map((sid) => addGroupMember({ groupId: group._id, studentId: sid }).unwrap())
    );
    setPendingAdd(new Set());
  };

  const totalAfterSave = members.length + pendingAdd.size;
  const fillPct = group.maxStudents > 0 ? Math.round((totalAfterSave / group.maxStudents) * 100) : 0;
  const isFull  = totalAfterSave >= group.maxStudents;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontWeight: 700, pb: 0 }}>
        <Box>
          <Typography fontWeight={800} variant="h6">
            {isIndPkg
              ? (cTitle(group.course, lang) || group.name)
              : group.name}
          </Typography>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {totalAfterSave}/{group.maxStudents} {t('groups.members').toLowerCase()}
            </Typography>
            <LinearProgress variant="determinate" value={Math.min(fillPct, 100)}
              color={fillPct >= 90 ? 'error' : 'primary'} sx={{ width: 80, height: 5, borderRadius: 3 }} />
            {group.course?.duration && (
              <Chip label={`${group.course?.duration ?? '?'} ${t('groups.monthsShort')}`} size="small" variant="outlined"
                sx={{ fontSize: '0.65rem', height: 20 }} />
            )}
          </Stack>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      {/* Tabs — for individual_package only show payment tab */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 40 }}>
          <Tab
            icon={<PaymentsIcon sx={{ fontSize: 16 }} />} iconPosition="start"
            label={t('admin.payments')} sx={{ minHeight: 40, fontSize: '0.8rem', gap: 0.5 }} />
          {!isIndPkg && (
            <Tab
              icon={<PeopleIcon sx={{ fontSize: 16 }} />} iconPosition="start"
              label={`${t('groups.members')} (${members.length})`}
              sx={{ minHeight: 40, fontSize: '0.8rem', gap: 0.5 }} />
          )}
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0, minHeight: 380, maxHeight: '65vh', overflowY: 'auto' }}>

        {/* ── TAB 0: Payment status ── */}
        {tab === 0 && <PaymentStatusTab groupId={group._id} group={group} />}

        {/* ── TAB 1: Manage members (only for non-individual_package groups) ── */}
        {!isIndPkg && tab === 1 && (
          loadingMembers ? (
            <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>
          ) : (
            <>
              {/* Current members */}
              <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary"
                  sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {t('groups.members')} ({members.length})
                </Typography>
              </Box>
              {members.length === 0 ? (
                <Box sx={{ px: 2, pb: 2 }}>
                  <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 2 }}>
                    {t('groups.noStudentsYet')}
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding sx={{ pb: 1 }}>
                  {members.map((s) => (
                    <ListItem key={s._id} sx={{ px: 2 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main', fontWeight: 700, width: 34, height: 34, fontSize: '0.85rem' }}>
                          {(s.name?.[0] ?? '?').toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={700}>{s.name}</Typography>}
                        secondary={s.phone ?? ''}
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title={t('groups.removeFromGroup')}>
                          <span>
                            <IconButton size="small" color="error" disabled={removing}
                              onClick={() => handleRemove(s._id)}>
                              <PersonRemoveIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}

              <Divider />

              {/* Add students */}
              <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" fontWeight={700} color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('groups.addToGroup')} ({available.length})
                  </Typography>
                  {pendingAdd.size > 0 && (
                    <Chip label={t('groups.saveWithCount', { count: pendingAdd.size })} size="small" color="primary" variant="outlined"
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                  )}
                </Stack>
              </Box>
              <Box sx={{ px: 2, pb: 1 }}>
                <TextField fullWidth size="small" placeholder={t('groups.searchByNamePhone')}
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  InputProps={{ startAdornment: <InputAdornmentMUI position="start"><SearchIcon fontSize="small" /></InputAdornmentMUI> }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Box>
              {available.length === 0 ? (
                <Box sx={{ px: 2, pb: 2 }}>
                  <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 1 }}>
                    {search ? t('common.noData') : t('groups.groupFull')}
                  </Typography>
                </Box>
              ) : (
                <List dense disablePadding sx={{ maxHeight: 260, overflowY: 'auto', pb: 1 }}>
                  {available.map((s, i) => {
                    const isPending = pendingAdd.has(s._id);
                    const cantAdd   = !isPending && isFull;
                    return (
                      <ListItem key={s._id} sx={{
                        px: 2, bgcolor: isPending ? 'primary.main' + '12' : 'transparent',
                        borderLeft: '3px solid', borderColor: isPending ? 'primary.main' : 'transparent', transition: 'all 0.15s',
                      }}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: isPending ? 'primary.main' : PALETTE[i % PALETTE.length], fontWeight: 700, width: 34, height: 34, fontSize: '0.85rem' }}>
                            {(s.name?.[0] ?? '?').toUpperCase()}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography variant="body2" fontWeight={isPending ? 700 : 400} color={isPending ? 'primary.main' : 'text.primary'}>{s.name}</Typography>}
                          secondary={s.phone ?? ''} />
                        <ListItemSecondaryAction>
                          <Tooltip title={isPending ? t('common.cancel') : cantAdd ? t('groups.groupFullTooltip') : t('groups.addTooltip')}>
                            <span>
                              <IconButton size="small" color={isPending ? 'error' : 'primary'} disabled={cantAdd}
                                onClick={() => togglePending(s._id)}>
                                {isPending ? <PersonRemoveIcon fontSize="small" /> : <PersonAddIcon fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </ListItemSecondaryAction>
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </>
          )
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5, gap: 1 }}>
        <Button sx={{ borderRadius: 2, color: 'text.secondary' }} onClick={onClose}>
          {t('common.close')}
        </Button>
        {tab === 1 && (
          <>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" sx={{ borderRadius: 2, px: 3 }}
              disabled={pendingAdd.size === 0 || adding}
              startIcon={adding ? <CircularProgress size={14} color="inherit" /> : <PersonAddIcon />}
              onClick={handleSave}>
              {pendingAdd.size > 0 ? t('groups.saveWithCount', { count: pendingAdd.size }) : t('common.save')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdminGroups() {
  const { t }  = useTranslation();
  const lang   = i18n.language === 'ru' ? 'ru' : 'uz';

  const { data: groupsRes, isLoading } = useGetGroupsQuery({ limit: 100 });
  const [deleteGroup,   { isLoading: deleting   }] = useDeleteGroupMutation();
  const [activateGroup, { isLoading: activating }] = useActivateGroupMutation();
  const [completeGroup, { isLoading: completing }] = useCompleteGroupMutation();

  const groups = groupsRes?.data ?? [];

  const [createOpen,    setCreateOpen]    = useState(false);
  const [editItem,      setEditItem]      = useState(null);
  const [membersG,      setMembersG]      = useState(null);
  const [delId,         setDelId]         = useState(null);
  const [activateG,      setActivateG]      = useState(null);
  const [activateResult, setActivateResult] = useState(null);
  const [completeG,      setCompleteG]      = useState(null); // group pending completion confirm
  const [search,         setSearch]         = useState('');

  const handleActivateConfirm = async (startDate) => {
    if (!activateG) return;
    try {
      const res = await activateGroup({ id: activateG._id, startDate }).unwrap();
      setActivateResult(res?.data ?? res);
      setActivateG(null);
    } catch { /* ignored */ }
  };

  const handleCompleteConfirm = async () => {
    if (!completeG) return;
    try {
      await completeGroup(completeG._id).unwrap();
      setCompleteG(null);
    } catch { /* ignored */ }
  };

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) =>
      (g.name             ?? '').toLowerCase().includes(q) ||
      (g.teacher?.name    ?? '').toLowerCase().includes(q) ||
      (cTitle(g.course, lang) ?? '').toLowerCase().includes(q)
    );
  }, [groups, search, lang]);

  const activeCount   = useMemo(() => groups.filter((g) => g.isActive).length, [groups]);
  const totalStudents = useMemo(() => groups.reduce((a, g) => a + (g.memberCount ?? 0), 0), [groups]);
  const avgSize      = useMemo(() =>
    activeCount > 0
      ? Math.round(groups.filter((g) => g.isActive).reduce((a, g) => a + (g.memberCount ?? 0), 0) / activeCount)
      : 0,
  [groups, activeCount]);

  return (
    <Box>
      <PageHeader
        icon={<GroupsIcon />}
        title={t('groups.management')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }}
            onClick={() => setCreateOpen(true)}>
            {t('groups.newGroup')}
          </Button>
        }
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: t('groups.totalGroups'),                                    value: groups.length,               color: '#1976D2' },
          { label: t('groups.totalStudents'),                                  value: totalStudents,               color: '#10B981' },
          { label: t('common.active',   { defaultValue: 'Faol guruhlar' }),    value: activeCount,                 color: '#7C3AED' },
          { label: t('status.inactive', { defaultValue: 'Nofaol guruhlar' }), value: groups.length - activeCount,  color: '#94A3B8' },
          { label: t('groups.avgSize'),                                        value: avgSize,                     color: '#F59E0B' },
        ].map((s, i) => (
          <Grid item xs={6} sm={4} md={2.4} key={s.label}>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.22 }}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, textAlign: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={800} color={s.color} lineHeight={1.2}>
                    {isLoading ? <CircularProgress size={14} /> : s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.62rem', mt: 0.15 }}>
                    {s.label}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Search bar */}
      <Card elevation={0} sx={{ mb: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField
              size="small"
              placeholder={t('groups.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornmentMUI position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornmentMUI>
                ),
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {t('groups.groupsCountLabel', { filtered: filteredGroups.length, total: groups.length })}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 0, overflowX: 'auto' }}>
          {isLoading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
          ) : (
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  {[
                    [t('groups.tableGroup'),    'left'],
                    [t('groups.tableCourse'),   'left'],
                    [t('groups.tableTeacher'),  'left'],
                    [t('groups.tableStudents'), 'center'],
                    [t('groups.tableSchedule'), 'left'],
                    [t('groups.tableType'),     'center'],
                    [t('groups.tablePrice'),    'center'],
                    [t('groups.tableStatus'),   'center'],
                    [t('groups.tableStart'),    'center'],
                    [t('teacher.action'),       'right'],
                  ].map(([label, align]) => (
                    <TableCell key={label} align={align}
                      sx={{ py: 1, px: 1.75, fontSize: '0.66rem', fontWeight: 600, color: 'text.disabled',
                        letterSpacing: '0.07em', textTransform: 'uppercase',
                        borderBottom: '1px solid', borderColor: 'divider',
                        bgcolor: 'transparent', whiteSpace: 'nowrap' }}>
                      {label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                      <Stack alignItems="center" spacing={1}>
                        <GroupsIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                        <Typography color="text.secondary">{t('groups.noGroupsEmpty')}</Typography>
                        <Button variant="contained" startIcon={<AddIcon />} size="small"
                          onClick={() => setCreateOpen(true)}>{t('groups.createGroupBtn')}</Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
                {groups.length > 0 && filteredGroups.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                      <Stack alignItems="center" spacing={1}>
                        <SearchIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                        <Typography color="text.secondary">{t('groups.searchNotFound', { query: search })}</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
                {filteredGroups.map((g, idx) => {
                  const isIndPkg    = g.type === 'individual_package';
                  const color       = isIndPkg ? '#7C3AED' : PALETTE[idx % PALETTE.length];
                  const days        = groupDays(g).join(', ');
                  const time        = groupTime(g);
                  const courseName  = cTitle(g.course, lang);
                  const teacherName = g.teacher?.name ?? '—';
                  const enrolled    = g.memberCount ?? 0;
                  const maxStu      = g.maxStudents ?? 9999;

                  /* For individual_package — use g.course (always fresh from API) as display name */
                  const displayName = isIndPkg
                    ? (courseName && courseName !== '—' ? courseName : g.name)
                    : g.name;

                  return (
                    <TableRow key={g._id}
                    sx={{ '&:hover td': { bgcolor: 'action.hover' }, '&:last-child td': { border: 0 }, transition: 'background 0.1s' }}>
                      <TableCell sx={{ py: 1.25, px: 1.75 }}>
                        {isIndPkg ? (
                          /* indPkg — icon only; name is shown in КУРС column */
                          <Tooltip title={displayName}>
                            <Box sx={{
                              width: 28, height: 28, borderRadius: 1.5, flexShrink: 0,
                              bgcolor: '#7C3AED18', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <InventoryIcon sx={{ fontSize: 15, color: '#7C3AED' }} />
                            </Box>
                          </Tooltip>
                        ) : (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                            <Typography variant="body2" fontWeight={700}>{displayName}</Typography>
                          </Stack>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 1.75 }}>
                        {isIndPkg ? (
                          /* For individual_package — show package title (specific offering) */
                          <Typography variant="body2" noWrap sx={{ maxWidth: 140, color: '#7C3AED', fontWeight: 600, fontSize: '0.8rem' }}>
                            {cTitle(g.package, lang) !== '—' ? cTitle(g.package, lang) : courseName}
                          </Typography>
                        ) : (
                          <Typography variant="body2" noWrap sx={{ maxWidth: 140 }}>{courseName}</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 1.75 }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                          <Typography variant="body2">{teacherName}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.25, px: 1.75 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {enrolled}
                          {!isIndPkg && (
                            <Typography component="span" variant="caption" color="text.disabled"> / {maxStu}</Typography>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.25, px: 1.75 }}>
                        {isIndPkg ? (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5,
                            px: 1, py: 0.3, borderRadius: 1.5,
                            bgcolor: '#7C3AED12', border: '1px solid #7C3AED30' }}>
                            <InventoryIcon sx={{ fontSize: 12, color: '#7C3AED' }} />
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED' }}>
                              {t('groups.modulesCount', { count: g.package?.modules?.length ?? 0 })}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">{days} {time}</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.25, px: 1.75 }}>
                        {(() => {
                          const tm = TYPE_META.find((t) => t.value === g.type) ?? TYPE_META[1];
                          return (
                            <Chip
                              label={tm.label}
                              size="small"
                              variant="outlined"
                              sx={{ borderColor: tm.color, color: tm.color, fontSize: '0.68rem', fontWeight: 600 }}
                            />
                          );
                        })()}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 1.25, px: 1.75 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {isIndPkg
                            ? `${(g.package?.price?.amount ?? 0).toLocaleString()} ${g.package?.price?.currency ?? 'UZS'}`
                            : `${formatPrice(g.price?.amount ?? 0)} ${t('common.sum')}`
                          }
                        </Typography>
                      </TableCell>
                      {/* ── Holat ── */}
                      <TableCell align="center" sx={{ py: 1.25, px: 1.75 }}>
                        {(() => {
                          const Pill = ({ color, dot, label, sub }) => (
                            <Stack alignItems="center" spacing={0.3}>
                              <Box sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                px: 1, py: 0.3, borderRadius: 5,
                                bgcolor: dot + '18', border: '1px solid ' + dot + '35',
                              }}>
                                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: dot, flexShrink: 0 }} />
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color, lineHeight: 1 }}>
                                  {label}
                                </Typography>
                              </Box>
                              {sub && (
                                <Typography sx={{ fontSize: '0.6rem', color, fontWeight: 600, opacity: 0.8 }}>
                                  {sub}
                                </Typography>
                              )}
                            </Stack>
                          );

                          if (g.status === 'completed')
                            return <Pill color="#6366F1" dot="#6366F1" label={t('groups.statusCompleted')} />;

                          if (g.status === 'active' && !g.isActive && g.startDate && new Date(g.startDate) > new Date()) {
                            const diffD = Math.round((new Date(g.startDate) - new Date()) / 86_400_000);
                            return <Pill color="#F59E0B" dot="#F59E0B" label={t('groups.statusPending')} sub={t('groups.daysLeftChip', { days: diffD })} />;
                          }

                          if (g.status === 'active')
                            return <Pill color="#10B981" dot="#10B981" label={t('groups.statusActive')} />;

                          return <Pill color="#94A3B8" dot="#94A3B8" label={t('groups.statusInactive')} />;
                        })()}
                      </TableCell>

                      {/* ── Boshlash / Yakunlash ── */}
                      <TableCell align="center" sx={{ py: 1.25, px: 1.75 }}>
                        {/* individual_package groups are always auto-active — no lifecycle buttons */}
                        {isIndPkg ? (
                          <Typography sx={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 600 }}>
                            {t('groups.autoLabel')}
                          </Typography>
                        ) : (
                          <>
                            {/* Not yet activated → show Boshlash
                                Covers: status='inactive', OR active+!isActive without a future startDate */}
                            {(!g.isActive && g.status !== 'completed' && !(g.startDate && new Date(g.startDate) > new Date())) && (
                              <Tooltip title={t('groups.tooltipStartGroup')}>
                                <Button
                                  size="small" variant="contained" color="success"
                                  startIcon={<PlayCircleIcon sx={{ fontSize: 15 }} />}
                                  onClick={() => setActivateG(g)}
                                  sx={{ borderRadius: 2, fontSize: '0.72rem', px: 1.5, py: 0.4,
                                    fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  {t('groups.startGroup')}
                                </Button>
                              </Tooltip>
                            )}
                            {/* Scheduled but not yet started → show start date + cancel option */}
                            {g.status === 'active' && !g.isActive && g.startDate && new Date(g.startDate) > new Date() && (
                              <Stack alignItems="center" spacing={0.5}>
                                <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#EA580C' }}>
                                  📅 {new Date(g.startDate).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}
                                </Typography>
                                <Button size="small" variant="outlined" color="error"
                                  startIcon={<FlagIcon sx={{ fontSize: 13 }} />}
                                  onClick={() => setCompleteG(g)}
                                  sx={{ borderRadius: 1.5, fontSize: '0.65rem', px: 1, py: 0.3,
                                    fontWeight: 700, whiteSpace: 'nowrap', minWidth: 0 }}>
                                  {t('groups.completeGroup')}
                                </Button>
                              </Stack>
                            )}
                            {/* Active and started → Yakunlash */}
                            {g.status === 'active' && g.isActive && (
                              <Tooltip title={t('groups.tooltipCompleteGroup')}>
                                <Button
                                  size="small" variant="outlined" color="error"
                                  startIcon={<FlagIcon sx={{ fontSize: 15 }} />}
                                  onClick={() => setCompleteG(g)}
                                  sx={{ borderRadius: 2, fontSize: '0.72rem', px: 1.5, py: 0.4,
                                    fontWeight: 700, whiteSpace: 'nowrap' }}>
                                  {t('groups.completeGroup')}
                                </Button>
                              </Tooltip>
                            )}
                            {g.status === 'completed' && (
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                                {t('groups.completedGroup')}
                              </Typography>
                            )}
                          </>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ py: 1.25, px: 1.75 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          <Tooltip title={t('groups.viewStudentsList')}>
                            <IconButton size="small" color="primary" onClick={() => setMembersG(g)}>
                              <PeopleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {!isIndPkg && (
                            <Tooltip title={t('common.edit')}>
                              <IconButton size="small" onClick={() => setEditItem(g)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={t('common.delete')}>
                            <IconButton size="small" color="error" onClick={() => setDelId(g._id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateGroupDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(g) => setMembersG(g)}
      />
      {editItem && <EditGroupDialog open={!!editItem} onClose={() => setEditItem(null)} group={editItem} />}
      <MembersDialog open={!!membersG} onClose={() => setMembersG(null)} group={membersG} />

      {/* Activation confirm dialog */}
      <ActivationConfirmDialog
        open={!!activateG}
        group={activateG}
        loading={activating}
        onClose={() => setActivateG(null)}
        onConfirm={handleActivateConfirm}
      />

      {/* Complete confirm dialog */}
      <Dialog open={!!completeG} onClose={() => setCompleteG(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#EF444420',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlagIcon sx={{ color: 'error.main', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography fontWeight={800}>{t('groups.completeDialogTitle')}</Typography>
              <Typography variant="caption" color="text.secondary">{completeG?.name}</Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ borderRadius: 2, mb: 2 }}>
            <Typography variant="body2" fontWeight={700}>{t('groups.completeWarningTitle')}</Typography>
            <Typography variant="caption">{t('groups.completeWarningDesc')}</Typography>
          </Alert>
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">{t('groups.completeGroupLabel')}</Typography>
              <Typography variant="body2" fontWeight={700}>{completeG?.name}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">{t('groups.completeDateLabel')}</Typography>
              <Typography variant="body2" fontWeight={700} color="error.main">
                {new Date().toLocaleDateString('uz-UZ')}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button sx={{ borderRadius: 2 }} onClick={() => setCompleteG(null)}>{t('common.cancel')}</Button>
          <Box sx={{ flex: 1 }} />
          <Button variant="contained" color="error" sx={{ borderRadius: 2, fontWeight: 700 }}
            disabled={completing}
            startIcon={completing ? <CircularProgress size={14} color="inherit" /> : <FlagIcon />}
            onClick={handleCompleteConfirm}>
            {t('groups.completeConfirmBtn')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activation success dialog */}
      {activateResult && (
        <Dialog open={!!activateResult} onClose={() => setActivateResult(null)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ fontWeight: 800, pb: 0 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 28 }} />
              <Typography fontWeight={800}>{t('groups.activateSuccessTitle')}</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ pt: 2 }}>
            <Stack spacing={1.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">{t('groups.activateStudentsCount')}</Typography>
                <Typography variant="body2" fontWeight={700}>{activateResult?.membersCount ?? 0}</Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">{t('groups.activatePaymentsCreated')}</Typography>
                <Typography variant="body2" fontWeight={700} color="success.main">
                  {activateResult?.paymentsGenerated ?? 0}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">{t('groups.activateStartDate')}</Typography>
                <Typography variant="body2" fontWeight={700}>
                  {activateResult?.group?.startDate
                    ? new Date(activateResult.group.startDate).toLocaleDateString('uz-UZ')
                    : '—'}
                </Typography>
              </Stack>
              <Alert severity="info" sx={{ borderRadius: 2, mt: 1 }} icon={false}>
                <Typography variant="caption">
                  {t('groups.accessBlockedInfo')}
                </Typography>
              </Alert>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button variant="contained" sx={{ borderRadius: 2 }} onClick={() => setActivateResult(null)}>
              {t('common.close')}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog open={!!delId} onClose={() => setDelId(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{t('dialog.deleteTitle')}</DialogTitle>
        <DialogContent><Typography>{t('dialog.deleteText')}</Typography></DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button sx={{ borderRadius: 2 }} onClick={() => setDelId(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" sx={{ borderRadius: 2 }}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : null}
            onClick={async () => {
              await deleteGroup(delId);
              setDelId(null);
            }}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
