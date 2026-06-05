import {
  Box, Typography, Stack, Avatar, Button, IconButton,
  Tooltip, LinearProgress, Divider, Chip,
  Dialog, DialogActions, DialogContent,
  TextField, MenuItem, CircularProgress, Alert, Grid,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import SendIcon           from '@mui/icons-material/Send';
import GroupsIcon         from '@mui/icons-material/Groups';
import AccessTimeIcon     from '@mui/icons-material/AccessTime';
import CalendarTodayIcon  from '@mui/icons-material/CalendarToday';
import DoneAllIcon        from '@mui/icons-material/DoneAll';
import ArrowForwardIcon   from '@mui/icons-material/ArrowForward';
import PeopleIcon         from '@mui/icons-material/People';
import EventBusyIcon      from '@mui/icons-material/EventBusy';
import LinkIcon           from '@mui/icons-material/Link';
import AssignmentIcon     from '@mui/icons-material/Assignment';
import ChevronRightIcon   from '@mui/icons-material/ChevronRight';
import TrendingUpIcon     from '@mui/icons-material/TrendingUp';
import SchoolIcon         from '@mui/icons-material/School';
import OndemandVideoIcon  from '@mui/icons-material/OndemandVideo';
import AutoAwesomeIcon    from '@mui/icons-material/AutoAwesome';
import LockIcon           from '@mui/icons-material/Lock';
import { useSelector }    from 'react-redux';
import { useTheme }       from '@mui/material/styles';
import { selectUser }     from '../../../features/auth/authSlice.js';
import { useGetTeacherDashboardQuery }                      from '../../../features/teacher/teacherApi.js';
import { useSendSessionLinkMutation, useCompleteSessionMutation } from '../../../features/sessions/sessionsApi.js';
import i18n from '../../../utils/i18n.js';

/* ─── constants ─────────────────────────────────────────────────────────── */
const LINK_TYPES = [
  { value: 'zoom',        label: 'Zoom' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'youtube',     label: 'YouTube' },
  { value: 'telegram',    label: 'Telegram' },
  { value: 'other',       label: 'Boshqa havola' },
];

const PALETTE = ['#6366F1','#7C3AED','#10B981','#F59E0B','#EF4444','#3B82F6','#0891B2','#EC4899'];

const STATUS_CFG = {
  scheduled: { label: 'Rejalashtirilgan', color: '#94A3B8', bg: '#F1F5F9' },
  live:       { label: 'Jonli',            color: '#10B981', bg: '#ECFDF5' },
  completed:  { label: 'Yakunlangan',      color: '#6366F1', bg: '#EEF2FF' },
  cancelled:  { label: 'Bekor qilindi',    color: '#EF4444', bg: '#FEF2F2' },
};

const DOW_RU  = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const MON_RU  = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
const DOW_FULL = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
const MON_FULL = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];

/* ─── helpers ───────────────────────────────────────────────────────────── */
function cTitle(course) {
  if (!course) return '';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const t = course.title;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '';
  return t ?? '';
}
function gName(group) {
  if (!group) return '';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const n = group.name;
  if (typeof n === 'object') return n[lang] ?? n.uz ?? n.ru ?? '';
  return n ?? '';
}
function minutesUntil(dateIso, startTime) {
  if (!dateIso || !startTime) return null;
  const [hh, mm] = startTime.split(':').map(Number);
  const s = new Date(dateIso); s.setHours(hh, mm, 0, 0);
  return Math.round((s - Date.now()) / 60_000);
}
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MON_RU[d.getMonth()]}`;
}
function greeting(lang = 'uz') {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return lang === 'ru' ? 'Доброе утро'   : 'Xayrli tong';
  if (h >= 12 && h < 17) return lang === 'ru' ? 'Добрый день'   : 'Xayrli kun';
  if (h >= 17 && h < 21) return lang === 'ru' ? 'Добрый вечер'  : 'Xayrli kech';
  return lang === 'ru' ? 'Доброй ночи' : 'Yaxshi kechalar';
}

/* ─── Send Link Dialog ───────────────────────────────────────────────────── */
function SendLinkDialog({ open, session, onClose, onSent }) {
  const [form,  setForm]  = useState({ url: '', type: 'zoom' });
  const [error, setError] = useState('');
  const [sendLink, { isLoading }] = useSendSessionLinkMutation();

  useEffect(() => {
    if (open) setForm({ url: session?.lessonLink?.url ?? '', type: session?.lessonLink?.type ?? 'zoom' });
  }, [open]);

  const handleSubmit = async () => {
    setError('');
    if (!form.url.trim()) { setError('URL majburiy'); return; }
    try {
      await sendLink({ id: session._id, url: form.url.trim(), type: form.type }).unwrap();
      onSent?.();
      onClose();
    } catch (e) { setError(e?.data?.message ?? 'Xatolik yuz berdi'); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#EFF6FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LinkIcon sx={{ color: '#1976D2', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography fontWeight={800} lineHeight={1.2}>Dars manzilini yuborish</Typography>
            <Typography variant="caption" color="text.secondary">
              {gName(session?.group)} · {session?.date
                ? new Date(session.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
                : ''} {session?.startTime ?? ''}
            </Typography>
          </Box>
        </Stack>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Stack spacing={1.5}>
          <TextField select size="small" label="Platforma" fullWidth
            value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}>
            {LINK_TYPES.map((lt) => <MenuItem key={lt.value} value={lt.value}>{lt.label}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Havola URL *" fullWidth
            placeholder="https://t.me/...  yoki  https://youtu.be/..."
            value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
            InputProps={{ startAdornment: <LinkIcon sx={{ mr: 0.5, fontSize: 15, color: 'text.disabled' }} /> }}
          />
        </Stack>
        <Box sx={{ mt: 1.5, px: 1.25, py: 1, borderRadius: 1.5, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary">
            Dars hali boshlanmaydi — faqat manzil xabari yuboriladi
          </Typography>
        </Box>
      </Box>
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, color: 'text.secondary' }}>Bekor</Button>
        <Button variant="contained" onClick={handleSubmit}
          disabled={isLoading || !form.url}
          startIcon={isLoading ? <CircularProgress size={13} color="inherit" /> : <SendIcon />}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Yuborish
        </Button>
      </Stack>
    </Dialog>
  );
}

/* ─── Complete Dialog ────────────────────────────────────────────────────── */
function CompleteDialog({ open, session, onClose, onDone }) {
  const [topic, setTopic] = useState('');
  const [completeSession, { isLoading }] = useCompleteSessionMutation();

  const handleComplete = async () => {
    try {
      await completeSession({ id: session._id, topic }).unwrap();
      onDone?.();
      onClose();
    } catch { /* */ }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <Box sx={{ px: 3, pt: 3, pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#F0FDF4',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircleIcon sx={{ color: '#10B981', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography fontWeight={800} lineHeight={1.2}>Darsni yakunlash</Typography>
            <Typography variant="caption" color="text.secondary">{gName(session?.group)}</Typography>
          </Box>
        </Stack>
        <TextField size="small" label="Dars mavzusi (ixtiyoriy)" fullWidth
          placeholder="Masalan: React Hooks asoslari"
          multiline rows={2} value={topic}
          onChange={(e) => setTopic(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }} />
        <Box sx={{ mt: 1.5, px: 1.25, py: 1, borderRadius: 1.5, bgcolor: 'action.hover' }}>
          <Typography variant="caption" color="text.secondary">
            Keyin davomat, uyga vazifa va materiallarni ham qo'shishingiz mumkin
          </Typography>
        </Box>
      </Box>
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, color: 'text.secondary' }}>Bekor</Button>
        <Button variant="contained" color="success" onClick={handleComplete}
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={13} color="inherit" /> : <DoneAllIcon />}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}>
          Yakunlash
        </Button>
      </Stack>
    </Dialog>
  );
}

/* ─── Session Card (redesigned) ──────────────────────────────────────────── */
function SessionCard({ session, index, onSendLink, onComplete, onDetail }) {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const color   = PALETTE[index % PALETTE.length];
  const st      = STATUS_CFG[session.status] ?? STATUS_CFG.scheduled;
  const group   = session.group ?? {};
  const isLive  = session.status === 'live';
  const isDone  = session.status === 'completed';
  const isCancelled = session.status === 'cancelled';

  const isLocked    = !group.isActive && group.status !== 'completed';  // admin ещё не активировал группу
  const minsLeft    = minutesUntil(session.date, session.startTime);
  const canSendLink = !isDone && !isCancelled && !isLocked;
  const canComplete = !isDone && !isCancelled && !isLocked && (isLive || (minsLeft !== null && minsLeft <= 0));

  let countdownLabel = null;
  if (!isDone && !isCancelled && minsLeft !== null) {
    if      (minsLeft > 0  && minsLeft <= 60)  countdownLabel = `${minsLeft} дақ`;
    else if (minsLeft <= 0 && minsLeft > -180) countdownLabel = isLive ? 'Jonli' : `${Math.abs(minsLeft)} дақ oldin`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.28, ease: 'easeOut' }}>
      <Box sx={{
        position: 'relative', overflow: 'hidden', borderRadius: 2.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: isLive ? `${color}50` : isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        boxShadow: isLive
          ? `0 0 0 1px ${color}25, 0 8px 24px ${color}18`
          : isDark ? '0 2px 8px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.05)',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: `${color}50`,
          boxShadow: `0 4px 20px ${color}15`,
          transform: 'translateY(-1px)',
        },
      }}>
        {/* Top accent line */}
        <Box sx={{
          height: 3, bgcolor: color,
          ...(isLive && {
            background: `linear-gradient(90deg, ${color}, ${color}88, ${color})`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s linear infinite',
            '@keyframes shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
          }),
        }} />

        <Box sx={{ px: 2.5, py: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>

            {/* Left info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5} flexWrap="wrap">
                <Typography fontWeight={800} fontSize="0.95rem" noWrap>{gName(group)}</Typography>
                {isLive && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5,
                    px: 1, py: 0.2, borderRadius: 5, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                    <Box sx={{
                      width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981',
                      animation: 'livePulse 1.4s ease-in-out infinite',
                      '@keyframes livePulse': { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.5, transform: 'scale(1.3)' } },
                    }} />
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#059669' }}>LIVE</Typography>
                  </Box>
                )}
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Stack direction="row" spacing={0.4} alignItems="center">
                  <AccessTimeIcon sx={{ fontSize: 13, color: color }} />
                  <Typography variant="caption" fontWeight={700} color={color}>
                    {session.startTime ?? '—'}{session.endTime ? ` – ${session.endTime}` : ''}
                  </Typography>
                </Stack>
                {cTitle(group.course) && (
                  <Typography variant="caption" color="text.disabled" noWrap sx={{ maxWidth: 160 }}>
                    {cTitle(group.course)}
                  </Typography>
                )}
              </Stack>

              {/* Countdown badge */}
              {countdownLabel && (
                <Box sx={{
                  mt: 0.75, display: 'inline-flex', alignItems: 'center', gap: 0.4,
                  px: 1, py: 0.3, borderRadius: 1, bgcolor: isLive ? `${color}12` : '#FFF7ED',
                  border: `1px solid ${isLive ? color + '30' : '#FED7AA'}`,
                }}>
                  <AccessTimeIcon sx={{ fontSize: 10, color: isLive ? color : '#F97316' }} />
                  <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: isLive ? color : '#EA580C' }}>
                    {countdownLabel}
                  </Typography>
                </Box>
              )}

              {/* Link */}
              {session.lessonLink?.url && (
                <Box sx={{ mt: 0.75, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                  <LinkIcon sx={{ fontSize: 11, color: '#6366F1' }} />
                  <Typography component="a" href={session.lessonLink.url} target="_blank" rel="noopener"
                    sx={{ fontSize: '0.67rem', color: '#6366F1', fontWeight: 600,
                      textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    {LINK_TYPES.find((l) => l.value === session.lessonLink.type)?.label ?? 'Havola'} ↗
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Right: actions */}
            <Stack direction="column" spacing={0.75} alignItems="flex-end" sx={{ flexShrink: 0 }}>
              {/* Status chip */}
              <Box sx={{ px: 1.25, py: 0.3, borderRadius: 5, bgcolor: isDark ? `${st.color}20` : st.bg }}>
                <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: st.color }}>
                  {st.label}
                </Typography>
              </Box>

              <Stack direction="row" spacing={0.5} alignItems="center">
                {isLocked ? (
                  /* ── Замок: группа не активирована admin'ом ── */
                  <Tooltip title="Admin tomonidan aktivatsiyalanmagan">
                    <Box sx={{
                      display: 'flex', alignItems: 'center', gap: 0.5,
                      px: 1, py: 0.4, borderRadius: 1.5,
                      bgcolor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.07)',
                      border: '1px dashed rgba(239,68,68,0.35)',
                      cursor: 'default',
                    }}>
                      <LockIcon sx={{ fontSize: 13, color: '#EF4444' }} />
                      <Typography sx={{ fontSize: '0.64rem', fontWeight: 700, color: '#EF4444' }}>
                        Qulflangan
                      </Typography>
                    </Box>
                  </Tooltip>
                ) : (
                  <>
                    {canSendLink && (
                      <Tooltip title={session.lessonLink?.url ? 'Havolani yangilash' : 'Dars manzilini yuborish'}>
                        <IconButton size="small" onClick={() => onSendLink(session)}
                          sx={{ width: 30, height: 30, border: '1px solid', borderColor: 'divider',
                            borderRadius: 1.5, '&:hover': { bgcolor: `${color}12`, borderColor: color } }}>
                          <LinkIcon sx={{ fontSize: 15, color: session.lessonLink?.url ? color : 'text.secondary' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {canComplete && (
                      <Tooltip title="Darsni yakunlash">
                        <IconButton size="small" onClick={() => onComplete(session)}
                          sx={{ width: 30, height: 30, border: '1px solid', borderColor: '#A7F3D0',
                            borderRadius: 1.5, bgcolor: '#F0FDF4', '&:hover': { bgcolor: '#DCFCE7' } }}>
                          <DoneAllIcon sx={{ fontSize: 15, color: '#10B981' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </>
                )}
                <Tooltip title="Batafsil">
                  <IconButton size="small" onClick={() => onDetail(session._id)}
                    sx={{ width: 30, height: 30, border: '1px solid', borderColor: 'divider',
                      borderRadius: 1.5, '&:hover': { bgcolor: 'action.hover' } }}>
                    <ChevronRightIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Stack>
        </Box>
      </Box>
    </motion.div>
  );
}

/* ─── KPI Card ───────────────────────────────────────────────────────────── */
function KpiCard({ label, value, suffix, icon: Icon, color, delay = 0, isLoading, onClick }) {
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.32, ease: 'easeOut' }} style={{ height: '100%' }}>
      <Box onClick={onClick}
        sx={{
          height: '100%', p: 2.5, borderRadius: 3, position: 'relative', overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          background: isDark
            ? `linear-gradient(135deg, ${color}22 0%, ${color}08 100%)`
            : `linear-gradient(135deg, ${color}14 0%, ${color}04 100%)`,
          border: '1px solid',
          borderColor: isDark ? `${color}35` : `${color}22`,
          transition: 'all 0.2s ease',
          '&:hover': onClick ? {
            transform: 'translateY(-2px)',
            boxShadow: `0 8px 28px ${color}22`,
            borderColor: `${color}55`,
          } : {},
        }}>

        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          {/* Left: label + value */}
          <Box>
            <Typography sx={{
              fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.09em',
              color: 'text.disabled', fontWeight: 700, mb: 1.25, display: 'block',
            }}>
              {label}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="baseline">
              <Typography sx={{
                fontSize: '2rem', fontWeight: 900, lineHeight: 1, color,
                fontVariantNumeric: 'tabular-nums',
                textShadow: `0 2px 12px ${color}40`,
              }}>
                {isLoading ? '—' : value}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', fontWeight: 600 }}>
                {suffix}
              </Typography>
            </Stack>
          </Box>

          {/* Right: icon */}
          <Box sx={{
            width: 42, height: 42, borderRadius: 2.5, flexShrink: 0,
            bgcolor: isDark ? `${color}20` : `${color}15`,
            border: `1px solid ${color}25`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon sx={{ fontSize: 22, color, opacity: 0.9 }} />
          </Box>
        </Stack>
      </Box>
    </motion.div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const [now, setNow] = useState(new Date());
  const user = useSelector(selectUser);
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const surname     = (lang === 'ru' ? user?.nameRu : user?.nameUz) || user?.name || '';
  const displayName = surname.split(' ')[0] ?? '';

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const { data: res, isLoading, refetch } = useGetTeacherDashboardQuery(undefined, { pollingInterval: 60_000 });

  const data           = res?.data ?? {};
  const stats          = data.stats           ?? {};
  /* Filter out completed-group sessions — those belong to Archive */
  const todaySessions = (data.todaySessions ?? []).filter(
    (s) => s.group?.status !== 'completed',
  );
  const upcoming = (data.upcomingSessions ?? []).filter(
    (s) => s.group?.status !== 'completed',
  );
  const groups = (data.groups ?? []).filter(
    (g) => g.status !== 'completed' && g.type !== 'individual_package',
  );
  const recentHomework = data.recentHomework  ?? [];

  const [linkDlg,     setLinkDlg]     = useState(null);
  const [completeDlg, setCompleteDlg] = useState(null);

  const liveCount   = todaySessions.filter((s) => s.status === 'live').length;
  const pendingHw   = stats.pendingSubmissions ?? 0;

  const todayFull = `${DOW_FULL[now.getDay()]}, ${now.getDate()} ${MON_FULL[now.getMonth()]}`;

  /* Clock string HH:MM */
  const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

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
            ? 'linear-gradient(135deg, #1E1B4B 0%, #312E81 40%, #1E3A5F 100%)'
            : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #1D4ED8 100%)',
          px: { xs: 3, sm: 4 }, py: { xs: 3, sm: 3.5 },
          minHeight: 130,
        }}>
          {/* Decorative circles */}
          <Box sx={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200,
            borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', right: 60, bottom: -60, width: 160, height: 160,
            borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <Box sx={{ position: 'absolute', left: '40%', top: -30, width: 120, height: 120,
            borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2} sx={{ position: 'relative', zIndex: 1 }}>

            {/* Left: greeting */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                <AutoAwesomeIcon sx={{ fontSize: 16, color: '#FCD34D' }} />
                <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {greeting(lang)}
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, fontWeight: 900, color: '#fff',
                lineHeight: 1.15, mb: 0.75 }}>
                {displayName || 'Ustoz'}
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

            {/* Right: next lesson + live + hw */}
            <Stack direction="column" spacing={1} alignItems={{ xs: 'flex-start', sm: 'flex-end' }}>


              {/* LIVE badge */}
              {liveCount > 0 && (
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 0.75,
                  px: 1.5, py: 0.6, borderRadius: 2,
                  bgcolor: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.4)',
                }}>
                  <Box sx={{
                    width: 8, height: 8, borderRadius: '50%', bgcolor: '#34D399',
                    animation: 'heroPulse 1.4s ease-in-out infinite',
                    '@keyframes heroPulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
                  }} />
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 800, color: '#34D399' }}>
                    {liveCount} ta jonli dars
                  </Typography>
                </Box>
              )}

              {/* Pending homework */}
              {pendingHw > 0 && (
                <Box sx={{
                  px: 1.5, py: 0.6, borderRadius: 2,
                  bgcolor: 'rgba(251,191,36,0.2)', border: '1px solid rgba(251,191,36,0.4)',
                }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <AssignmentIcon sx={{ fontSize: 14, color: '#FCD34D' }} />
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#FCD34D' }}>
                      {pendingHw} ta uy ishi kutmoqda
                    </Typography>
                  </Stack>
                </Box>
              )}
            </Stack>
          </Stack>
        </Box>
      </motion.div>

      {/* ══════════════════════════════════════════════════
          KPI CARDS (4 cards)
      ══════════════════════════════════════════════════ */}
      <Grid container spacing={2} sx={{ mb: 3.5 }}>
        {[
          { label: 'Jami guruhlar',    value: stats.totalGroups       ?? 0, suffix: 'ta', icon: GroupsIcon,      color: '#6366F1', delay: 0.05, path: '/teacher/sessions' },
          { label: "O'quvchilar",      value: stats.totalStudents     ?? 0, suffix: 'ta', icon: PeopleIcon,      color: '#7C3AED', delay: 0.10, path: '/teacher/students' },
          { label: 'Bu oy darslar',    value: stats.sessionsThisMonth ?? 0, suffix: 'ta', icon: OndemandVideoIcon, color: '#10B981', delay: 0.15 },
          { label: 'Uy ishi kutmoqda', value: stats.pendingSubmissions ?? 0, suffix: 'ta', icon: AssignmentIcon,  color: '#F59E0B', delay: 0.20, path: '/teacher/homework' },
        ].map((k) => (
          <Grid item xs={6} sm={3} key={k.label}>
            <KpiCard {...k} isLoading={isLoading} onClick={k.path ? () => navigate(k.path) : undefined} />
          </Grid>
        ))}
      </Grid>

      {isLoading && <LinearProgress sx={{ mb: 3, borderRadius: 1, '& .MuiLinearProgress-bar': { borderRadius: 1 } }} />}

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT: two-column
      ══════════════════════════════════════════════════ */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' }, alignItems: 'flex-start' }}>

        {/* ══ LEFT COLUMN ═══════════════════════════════════════════════════ */}
        <Box sx={{ flex: '1 1 0', minWidth: 0 }}>

          {/* ── Today's sessions ── */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.75}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: isDark ? '#1E3A5F' : '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CalendarTodayIcon sx={{ fontSize: 16, color: '#3B82F6' }} />
              </Box>
              <Typography fontWeight={800} fontSize="1rem">Bugungi darslar</Typography>
              <Box sx={{ px: 1, py: 0.2, borderRadius: 5,
                bgcolor: todaySessions.length > 0 ? '#3B82F6' : isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
              }}>
                <Typography sx={{ fontSize: '0.68rem', fontWeight: 800,
                  color: todaySessions.length > 0 ? '#fff' : 'text.disabled' }}>
                  {todaySessions.length}
                </Typography>
              </Box>
            </Stack>
            <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
              onClick={() => navigate('/teacher/sessions')}
              sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem',
                textTransform: 'none', borderRadius: 2, px: 1.5,
                '&:hover': { bgcolor: 'action.hover' } }}>
              Barchasi
            </Button>
          </Stack>

          {todaySessions.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <Box sx={{
                borderRadius: 3, overflow: 'hidden', mb: 3,
                border: '1px solid', borderColor: 'divider',
                bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
              }}>
                {/* Top: no lessons today */}
                <Stack alignItems="center" spacing={0.75} sx={{ py: 3.5 }}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: 2.5,
                    bgcolor: isDark ? 'rgba(255,255,255,0.05)' : '#F1F5F9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <EventBusyIcon sx={{ fontSize: 22, color: 'text.disabled' }} />
                  </Box>
                  <Typography fontWeight={700} color="text.secondary" fontSize="0.9rem">
                    Bugun dars yo'q
                  </Typography>
                </Stack>

                {/* Next lesson row */}
                {upcoming[0] && (() => {
                  const next = upcoming[0];
                  const d = new Date(next.date);
                  const dateStr = `${DOW_RU[d.getDay()]}, ${d.getDate()} ${MON_RU[d.getMonth()]}`;
                  return (
                    <>
                      <Divider />
                      <Stack direction="row" alignItems="center" spacing={2}
                        sx={{ px: 3, py: 2, bgcolor: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.04)' }}>
                        {/* Icon */}
                        <Box sx={{
                          width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                          bgcolor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <CalendarTodayIcon sx={{ fontSize: 18, color: '#6366F1' }} />
                        </Box>

                        {/* Label + date */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: '0.62rem', textTransform: 'uppercase',
                            letterSpacing: '0.09em', color: 'text.disabled', fontWeight: 700, mb: 0.25 }}>
                            Keyingi dars
                          </Typography>
                          <Typography fontWeight={700} fontSize="0.88rem" color="text.primary">
                            {dateStr}
                          </Typography>
                          {next.group && (
                            <Typography variant="caption" color="text.disabled" noWrap>
                              {gName(next.group)}
                            </Typography>
                          )}
                        </Box>

                        {/* Time */}
                        <Box sx={{
                          px: 1.5, py: 0.75, borderRadius: 2,
                          bgcolor: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(99,102,241,0.12)',
                          border: `1px solid rgba(99,102,241,0.25)`,
                        }}>
                          <Typography sx={{
                            fontSize: '1.15rem', fontWeight: 900, color: '#6366F1',
                            fontVariantNumeric: 'tabular-nums', lineHeight: 1,
                          }}>
                            {next.startTime}
                          </Typography>
                        </Box>
                      </Stack>
                    </>
                  );
                })()}
              </Box>
            </motion.div>
          ) : (
            <Stack spacing={1.5} sx={{ mb: 3 }}>
              {todaySessions.map((s, i) => (
                <SessionCard key={s._id} session={s} index={i}
                  onSendLink={setLinkDlg}
                  onComplete={setCompleteDlg}
                  onDetail={(id) => navigate(`/teacher/sessions/${id}`)}
                />
              ))}
            </Stack>
          )}

          {/* ── Upcoming 7 days ── */}
          {upcoming.length > 0 && (
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" mb={1.75}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: isDark ? '#1A1A2E' : '#F5F3FF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AccessTimeIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                </Box>
                <Typography fontWeight={800} fontSize="1rem">Keyingi 7 kun</Typography>
                <Box sx={{ px: 1, py: 0.2, borderRadius: 5, bgcolor: isDark ? 'rgba(124,58,237,0.15)' : '#EDE9FE' }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#7C3AED' }}>
                    {upcoming.length}
                  </Typography>
                </Box>
              </Stack>

              <Box sx={{
                bgcolor: 'background.paper', borderRadius: 3,
                border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}>
                {upcoming.map((s, i) => {
                  const color     = PALETTE[i % PALETTE.length];
                  const grp       = s.group ?? {};
                  const courseTxt = cTitle(grp.course);
                  const d         = new Date(s.date);
                  const isToday   = (() => {
                    const t = new Date(); t.setHours(0,0,0,0);
                    const sd = new Date(s.date); sd.setHours(0,0,0,0);
                    return t.getTime() === sd.getTime();
                  })();
                  return (
                    <motion.div key={s._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.04 }}>
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={2}
                          onClick={() => navigate(`/teacher/sessions/${s._id}`)}
                          sx={{ px: 2.5, py: 1.5, cursor: 'pointer', transition: 'background 0.15s',
                            '&:hover': { bgcolor: 'action.hover' } }}>

                          {/* Date badge */}
                          <Box sx={{
                            width: 44, textAlign: 'center', flexShrink: 0,
                            px: 0.5, py: 0.75, borderRadius: 2,
                            bgcolor: isToday ? `${color}12` : isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                            border: isToday ? `1px solid ${color}30` : '1px solid transparent',
                          }}>
                            <Typography sx={{ fontSize: '0.58rem', textTransform: 'uppercase',
                              color: isToday ? color : 'text.disabled', fontWeight: 800, letterSpacing: '0.05em' }}>
                              {DOW_RU[d.getDay()]}
                            </Typography>
                            <Typography sx={{ fontSize: '1.1rem', fontWeight: 900, lineHeight: 1.1,
                              color: isToday ? color : 'text.primary' }}>
                              {d.getDate()}
                            </Typography>
                            <Typography sx={{ fontSize: '0.58rem', color: 'text.disabled' }}>
                              {MON_RU[d.getMonth()]}
                            </Typography>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>{gName(grp)}</Typography>
                            {courseTxt && (
                              <Typography variant="caption" color="text.disabled" noWrap>{courseTxt}</Typography>
                            )}
                          </Box>

                          <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexShrink: 0 }}>
                            <Box sx={{ px: 1, py: 0.25, borderRadius: 1.5, bgcolor: `${color}12` }}>
                              <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color }}>
                                {s.startTime}
                              </Typography>
                            </Box>
                          </Stack>

                          <ChevronRightIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
                        </Stack>
                        {i < upcoming.length - 1 && <Divider />}
                      </Box>
                    </motion.div>
                  );
                })}
              </Box>
            </Box>
          )}
        </Box>

        {/* ══ RIGHT COLUMN ══════════════════════════════════════════════════ */}
        <Box sx={{ width: { xs: '100%', lg: 300 }, flexShrink: 0 }}>

          {/* ── My groups ── */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.75}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: isDark ? '#0C2340' : '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GroupsIcon sx={{ fontSize: 16, color: '#1976D2' }} />
              </Box>
              <Typography fontWeight={800} fontSize="1rem">Guruhlarim</Typography>
            </Stack>
            <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
              onClick={() => navigate('/teacher/sessions')}
              sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem',
                textTransform: 'none', borderRadius: 2, px: 1.5,
                '&:hover': { bgcolor: 'action.hover' } }}>
              Ko'rish
            </Button>
          </Stack>

          {groups.length === 0 ? (
            <Box sx={{ borderRadius: 3, py: 4, mb: 3,
              border: '1px dashed', borderColor: 'divider', textAlign: 'center',
              bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' }}>
              <Typography variant="body2" color="text.disabled">Guruh yo'q</Typography>
            </Box>
          ) : (
            <Stack spacing={1.25} sx={{ mb: 3 }}>
              {groups.slice(0, 5).map((g, i) => {
                const color    = PALETTE[i % PALETTE.length];
                const next     = g.nextSession;
                const hasFutureStart = g.startDate && !g.isActive && new Date(g.startDate) > new Date();
                const daysLeft = hasFutureStart
                  ? Math.ceil((new Date(g.startDate) - new Date()) / 86_400_000)
                  : null;

                return (
                  <motion.div key={g._id}
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.06 }}>
                    <Box
                      onClick={() => navigate('/teacher/sessions')}
                      sx={{
                        borderRadius: 2.5, px: 2, py: 1.75, cursor: 'pointer',
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                        transition: 'all 0.18s ease',
                        '&:hover': {
                          borderColor: `${color}50`,
                          boxShadow: `0 4px 16px ${color}15`,
                          transform: 'translateX(3px)',
                        },
                        position: 'relative', overflow: 'hidden',
                      }}>
                      {/* Left accent */}
                      <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
                        bgcolor: color, borderRadius: '3px 0 0 3px' }} />

                      <Box sx={{ pl: 1.5 }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.3}>
                          <Box sx={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                            bgcolor: hasFutureStart ? '#F97316' : g.isActive ? '#10B981' : '#94A3B8',
                            ...(g.isActive && {
                              boxShadow: '0 0 0 3px rgba(16,185,129,0.2)',
                              animation: 'groupPulse 2s ease-in-out infinite',
                              '@keyframes groupPulse': { '0%,100%': { boxShadow: '0 0 0 3px rgba(16,185,129,0.2)' }, '50%': { boxShadow: '0 0 0 6px rgba(16,185,129,0.08)' } },
                            }),
                          }} />
                          <Typography variant="body2" fontWeight={800} noWrap sx={{ flex: 1, minWidth: 0 }}>
                            {gName(g)}
                          </Typography>
                          <Stack direction="row" spacing={0.4} alignItems="center" sx={{ flexShrink: 0 }}>
                            <PeopleIcon sx={{ fontSize: 11, color: 'text.disabled' }} />
                            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontWeight: 600 }}>
                              {g.memberCount}
                            </Typography>
                          </Stack>
                        </Stack>

                        {cTitle(g.course) && (
                          <Typography variant="caption" color="text.disabled" noWrap
                            sx={{ display: 'block', mb: hasFutureStart || next ? 0.5 : 0 }}>
                            {cTitle(g.course)}
                          </Typography>
                        )}

                        {hasFutureStart && (
                          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4,
                            px: 1, py: 0.25, borderRadius: 1, bgcolor: '#FFF7ED', border: '1px solid #FED7AA' }}>
                            <Stack direction="row" spacing={0.4} alignItems="center">
                              <CalendarTodayIcon sx={{ fontSize: 10, color: '#EA580C' }} />
                              <Typography sx={{ fontSize: '0.65rem', color: '#EA580C', fontWeight: 700 }}>
                                {daysLeft === 0 ? 'Bugun boshlanadi!' : `${daysLeft} kundan keyin`}
                              </Typography>
                            </Stack>
                          </Box>
                        )}

                        {!hasFutureStart && next && (
                          <Stack direction="row" spacing={0.4} alignItems="center">
                            <AccessTimeIcon sx={{ fontSize: 11, color }} />
                            <Typography sx={{ fontSize: '0.67rem', color, fontWeight: 700 }}>
                              {fmtDate(next.nextDate)} · {next.nextTime ?? ''}
                            </Typography>
                          </Stack>
                        )}
                      </Box>
                    </Box>
                  </motion.div>
                );
              })}
            </Stack>
          )}

          {/* ── Recent homework ── */}
          {recentHomework.length > 0 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.75}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: isDark ? '#1C1810' : '#FFFBEB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AssignmentIcon sx={{ fontSize: 16, color: '#D97706' }} />
                  </Box>
                  <Typography fontWeight={800} fontSize="1rem">Uy ishlari</Typography>
                </Stack>
                <Button size="small" endIcon={<ArrowForwardIcon sx={{ fontSize: 13 }} />}
                  onClick={() => navigate('/teacher/homework')}
                  sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem',
                    textTransform: 'none', borderRadius: 2, px: 1.5,
                    '&:hover': { bgcolor: 'action.hover' } }}>
                  Ko'rish
                </Button>
              </Stack>

              <Box sx={{
                bgcolor: 'background.paper', borderRadius: 3,
                border: '1px solid', borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
                overflow: 'hidden',
                boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                {recentHomework.map((hw, i) => (
                  <motion.div key={hw._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 + i * 0.05 }}>
                    <Box>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2, py: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, flexShrink: 0,
                          bgcolor: isDark ? 'rgba(251,191,36,0.12)' : '#FEF9C3',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AssignmentIcon sx={{ fontSize: 15, color: '#D97706' }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>{hw.title}</Typography>
                          <Typography variant="caption" color="text.disabled">
                            {gName(hw.group) || '—'}{hw.dueDate ? ` · ${fmtDate(hw.dueDate)}` : ''}
                          </Typography>
                        </Box>
                        <ChevronRightIcon sx={{ fontSize: 14, color: 'text.disabled', flexShrink: 0 }} />
                      </Stack>
                      {i < recentHomework.length - 1 && <Divider />}
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Dialogs ── */}
      <SendLinkDialog
        open={Boolean(linkDlg)}
        session={linkDlg}
        onClose={() => setLinkDlg(null)}
        onSent={() => refetch()}
      />
      <CompleteDialog
        open={Boolean(completeDlg)}
        session={completeDlg}
        onClose={() => setCompleteDlg(null)}
        onDone={() => refetch()}
      />
    </Box>
  );
}
