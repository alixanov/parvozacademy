import {
  Box, Typography, Grid, Stack, Avatar, Button, IconButton,
  Tooltip, List, ListItem, ListItemText,
  Table, TableBody, TableCell, TableHead, TableRow,
  TextField, MenuItem, CircularProgress, Alert, Tab, Tabs,
  useTheme,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ArrowBackIcon      from '@mui/icons-material/ArrowBack';
import AccessTimeIcon     from '@mui/icons-material/AccessTime';
import DoneAllIcon        from '@mui/icons-material/DoneAll';
import AttachFileIcon     from '@mui/icons-material/AttachFile';
import AssignmentIcon     from '@mui/icons-material/Assignment';
import PeopleIcon         from '@mui/icons-material/People';
import SendIcon           from '@mui/icons-material/Send';
import AddIcon            from '@mui/icons-material/Add';
import DeleteIcon         from '@mui/icons-material/Delete';
import LinkIcon           from '@mui/icons-material/Link';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import CheckIcon          from '@mui/icons-material/Check';
import RemoveCircleIcon   from '@mui/icons-material/RemoveCircle';
import PauseCircleIcon    from '@mui/icons-material/PauseCircle';
import CalendarMonthIcon  from '@mui/icons-material/CalendarMonth';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import LockIcon           from '@mui/icons-material/Lock';
import { DateBadge }      from '../../../components/common/DateBadge/index.jsx';
import {
  useGetSessionByIdQuery,
  useSendSessionLinkMutation,
  useCompleteSessionMutation,
  useAddSessionMaterialsMutation,
  useRemoveSessionMaterialMutation,
  useCreateSessionHomeworkMutation,
  useGetSessionHomeworkQuery,
  useGetSessionAttendanceQuery,
} from '../../../features/sessions/sessionsApi.js';
import { useGetGroupMembersQuery } from '../../../features/groups/groupsApi.js';
import { useMarkAttendanceMutation } from '../../../features/attendance/attendanceApi.js';
import i18n from '../../../utils/i18n.js';

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const LINK_TYPES = [
  { value: 'zoom',        label: 'Zoom' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'youtube',     label: 'YouTube Live' },
  { value: 'telegram',    label: 'Telegram' },
  { value: 'other',       label: 'Boshqa havola' },
];

const MATERIAL_TYPES = [
  { value: 'pdf',   label: 'PDF' },
  { value: 'video', label: 'Video' },
  { value: 'link',  label: 'Havola' },
  { value: 'doc',   label: 'DOC / PPTX' },
  { value: 'other', label: 'Boshqa' },
];

/* rgba-based bgs work on any background (light or dark) */
const STATUS_CFG = {
  scheduled: { label: 'Rejalashtirilgan', bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6', dot: '#3B82F6' },
  live:      { label: 'Jonli',            bg: 'rgba(16,185,129,0.12)',  color: '#10B981', dot: '#10B981' },
  completed: { label: 'Yakunlangan',      bg: 'rgba(107,114,128,0.12)', color: '#9CA3AF', dot: '#9CA3AF' },
  cancelled: { label: 'Bekor qilindi',    bg: 'rgba(239,68,68,0.12)',   color: '#EF4444', dot: '#EF4444' },
};

const ATTEND_STATUS = [
  { value: 'present', label: 'Keldi',    color: '#10B981', Icon: CheckIcon          },
  { value: 'late',    label: 'Kechikdi', color: '#F59E0B', Icon: PauseCircleIcon    },
  { value: 'absent',  label: 'Kelmadi',  color: '#EF4444', Icon: RemoveCircleIcon   },
];

const GROUP_PALETTE = ['#1976D2', '#7C3AED', '#10B981', '#EF4444', '#F59E0B', '#0891B2'];

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

/* ─── Panel wrapper ──────────────────────────────────────────────────────── */
function PanelCard({ children, ...sx }) {
  return (
    <Box sx={{
      borderRadius: 2.5,
      boxShadow: '0 1px 4px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
      bgcolor: 'background.paper', overflow: 'hidden',
      ...sx,
    }}>
      {children}
    </Box>
  );
}

function PanelHeader({ icon, title, subtitle, color = '#1976D2' }) {
  return (
    <Box sx={{
      px: 2.5, py: 1.75,
      borderBottom: '1px solid', borderColor: 'divider',
      display: 'flex', alignItems: 'center', gap: 1.25,
    }}>
      <Box sx={{
        width: 32, height: 32, borderRadius: 1.5, bgcolor: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.3 }}>{title}</Typography>
        {subtitle && (
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.3 }}>{subtitle}</Typography>
        )}
      </Box>
    </Box>
  );
}

/* ─── Send Link Panel ────────────────────────────────────────────────────── */
function SendLinkPanel({ session, onRefetch }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [form, setForm] = useState({ url: session?.lessonLink?.url ?? '', type: session?.lessonLink?.type ?? 'telegram' });
  const [err, setErr]   = useState('');
  const [sendLink, { isLoading }] = useSendSessionLinkMutation();

  useEffect(() => {
    setForm({ url: session?.lessonLink?.url ?? '', type: session?.lessonLink?.type ?? 'telegram' });
  }, [session?.lessonLink?.url, session?.lessonLink?.type]);

  const handleSubmit = async () => {
    setErr('');
    if (!form.url.trim()) { setErr('URL majburiy'); return; }
    try {
      await sendLink({ id: session._id, url: form.url.trim(), type: form.type }).unwrap();
      onRefetch?.();
    } catch (e) { setErr(e?.data?.message ?? 'Xatolik'); }
  };

  return (
    <PanelCard>
      <PanelHeader
        icon={<LinkIcon sx={{ fontSize: 17, color: '#1976D2' }} />}
        title="Dars manzili (havola)"
        subtitle="O'quvchilarga dars havolasi yuboriladi. Dars hali boshlanmaydi."
        color="#1976D2"
      />
      <Box sx={{ p: 2.5 }}>
        {/* Текущая ссылка */}
        {session?.lessonLink?.url && (
          <Box sx={{
            mb: 2, p: 1.25, borderRadius: 2,
            bgcolor: isDark ? 'rgba(25,118,210,0.12)' : 'rgba(25,118,210,0.06)',
            border: '1px solid rgba(25,118,210,0.2)',
            display: 'flex', alignItems: 'center', gap: 1,
          }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: 1.5,
              bgcolor: isDark ? 'rgba(25,118,210,0.2)' : 'rgba(25,118,210,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <LinkIcon sx={{ fontSize: 14, color: '#1D4ED8' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: '#60A5FA', mb: 0.1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {LINK_TYPES.find((l) => l.value === session.lessonLink.type)?.label ?? 'Havola'}
              </Typography>
              <Typography
                component="a" href={session.lessonLink.url} target="_blank" rel="noopener"
                sx={{ fontSize: '0.8rem', color: 'primary.main', fontWeight: 600,
                  textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  '&:hover': { textDecoration: 'underline' } }}>
                {session.lessonLink.url}
              </Typography>
            </Box>
          </Box>
        )}

        {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>{err}</Alert>}

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField select size="small" label="Platforma" sx={{ minWidth: 145,
            '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
            value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
            {LINK_TYPES.map((lt) => <MenuItem key={lt.value} value={lt.value} sx={{ fontSize: '0.85rem' }}>{lt.label}</MenuItem>)}
          </TextField>
          <TextField size="small" label="Havola URL *" fullWidth
            value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
            placeholder="https://t.me/...  yoki  https://youtu.be/..."
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
            InputProps={{ startAdornment: <LinkIcon sx={{ mr: 0.75, fontSize: 14, color: 'text.disabled' }} /> }}
          />
        </Stack>

        <Button
          variant="contained" size="small"
          sx={{ mt: 2, borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2.5,
            boxShadow: '0 4px 12px rgba(25,118,210,0.25)' }}
          startIcon={isLoading ? <CircularProgress size={13} color="inherit" /> : <SendIcon />}
          disabled={isLoading || !form.url}
          onClick={handleSubmit}>
          {session?.lessonLink?.url ? '📍 Manzilni yangilash' : '📍 Manzilni o\'quvchilarga yuborish'}
        </Button>
      </Box>
    </PanelCard>
  );
}

/* ─── Complete Panel ─────────────────────────────────────────────────────── */
function CompletePanel({ session, onRefetch }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [topic, setTopic] = useState('');
  const [completeSession, { isLoading }] = useCompleteSessionMutation();

  const handleComplete = async () => {
    try {
      await completeSession({ id: session._id, topic }).unwrap();
      onRefetch?.();
    } catch { /* ignore */ }
  };

  if (session?.status === 'completed' || session?.status === 'cancelled') return null;

  return (
    <Box sx={{
      borderRadius: 2.5, overflow: 'hidden',
      border: '1.5px solid',
      borderColor: isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.35)',
      bgcolor: isDark ? 'rgba(16,185,129,0.07)' : 'rgba(16,185,129,0.05)',
    }}>
      <Box sx={{
        px: 2.5, py: 1.75,
        borderBottom: '1px solid',
        borderColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)',
        display: 'flex', alignItems: 'center', gap: 1.25,
      }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: 1.5,
          bgcolor: isDark ? 'rgba(16,185,129,0.18)' : 'rgba(16,185,129,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <DoneAllIcon sx={{ fontSize: 17, color: '#10B981' }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#10B981' }}>Darsni yakunlash</Typography>
          <Typography sx={{ fontSize: '0.71rem', color: isDark ? '#6EE7B7' : '#059669' }}>
            Mavzuni kiriting va darsni yakunlangan deb belgilang
          </Typography>
        </Box>
      </Box>
      <Box sx={{ p: 2.5 }}>
        <TextField size="small" label="Dars mavzusi (ixtiyoriy)" fullWidth
          placeholder="Masalan: React useState va useEffect"
          value={topic} onChange={(e) => setTopic(e.target.value)}
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }} />
        <Button variant="contained" color="success"
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2.5, boxShadow: '0 4px 12px rgba(16,185,129,0.25)' }}
          startIcon={isLoading ? <CircularProgress size={13} color="inherit" /> : <CheckCircleIcon />}
          disabled={isLoading} onClick={handleComplete}>
          ✅ Dars o'tkazildi deb belgilash
        </Button>
      </Box>
    </Box>
  );
}

/* ─── Materials Panel ────────────────────────────────────────────────────── */
function MaterialsPanel({ session, onRefetch }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [form, setForm] = useState({ name: '', url: '', type: 'link' });
  const [err, setErr]   = useState('');
  const [addMaterials,  { isLoading: adding }]   = useAddSessionMaterialsMutation();
  const [removeMaterial, { isLoading: removing }] = useRemoveSessionMaterialMutation();

  const handleAdd = async () => {
    setErr('');
    if (!form.name.trim()) { setErr('Nomi majburiy'); return; }
    if (!form.url.trim())  { setErr('URL majburiy');  return; }
    try {
      await addMaterials({ id: session._id, materials: [form] }).unwrap();
      setForm({ name: '', url: '', type: 'link' });
      onRefetch?.();
    } catch (e) { setErr(e?.data?.message ?? 'Xatolik'); }
  };

  const handleRemove = async (idx) => {
    await removeMaterial({ id: session._id, idx }).unwrap().catch(() => {});
    onRefetch?.();
  };

  const mats = session?.materials ?? [];

  return (
    <PanelCard>
      <PanelHeader
        icon={<AttachFileIcon sx={{ fontSize: 17, color: '#7C3AED' }} />}
        title={`Dars materiallari (${mats.length})`}
        subtitle="Fayllar, havolalar va videolar"
        color="#7C3AED"
      />
      <Box sx={{ p: 2.5 }}>
        {/* Список материалов */}
        {mats.length === 0 && (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <AttachFileIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
            <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>Hali material yo'q</Typography>
          </Box>
        )}
        {mats.map((m, i) => (
          <Box key={i} sx={{
            display: 'flex', alignItems: 'center', gap: 1, mb: 1,
            p: 1.25, borderRadius: 2,
            bgcolor: isDark ? 'rgba(124,58,237,0.1)' : 'rgba(124,58,237,0.05)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: 1.5,
              bgcolor: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <AttachFileIcon sx={{ fontSize: 14, color: '#7C3AED' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }} noWrap>{m.name}</Typography>
              <Typography
                component="a" href={m.url} target="_blank" rel="noopener"
                sx={{ fontSize: '0.72rem', color: '#7C3AED', textDecoration: 'none',
                  display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  '&:hover': { textDecoration: 'underline' } }}>
                {m.url.length > 45 ? m.url.slice(0, 45) + '…' : m.url}
              </Typography>
            </Box>
            <Box sx={{
              px: 0.75, py: 0.25, borderRadius: 1,
              bgcolor: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.1)',
              fontSize: '0.62rem', fontWeight: 700, color: '#7C3AED', flexShrink: 0,
            }}>
              {m.type ?? 'other'}
            </Box>
            <IconButton size="small" onClick={() => handleRemove(i)} disabled={removing}
              sx={{ color: '#EF4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.08)' }, borderRadius: 1.5 }}>
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}

        {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>{err}</Alert>}

        {/* Добавить */}
        <Box sx={{
          mt: mats.length ? 2 : 0, pt: mats.length ? 2 : 0,
          borderTop: mats.length ? '1px solid' : 'none',
          borderColor: 'divider',
        }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.disabled',
            textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
            Yangi material
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
            <TextField size="small" label="Nomi *" sx={{ flex: 2,
              '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
              value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <TextField size="small" label="URL *" sx={{ flex: 3,
              '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
              value={form.url} onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
              placeholder="https://..." />
            <TextField select size="small" label="Tur" sx={{ minWidth: 110,
              '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
              value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
              {MATERIAL_TYPES.map((t) => <MenuItem key={t.value} value={t.value} sx={{ fontSize: '0.85rem' }}>{t.label}</MenuItem>)}
            </TextField>
          </Stack>
          <Button size="small" variant="outlined" color="secondary"
            sx={{ mt: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            startIcon={adding ? <CircularProgress size={13} color="inherit" /> : <AddIcon />}
            disabled={adding} onClick={handleAdd}>
            Qo'shish
          </Button>
        </Box>
      </Box>
    </PanelCard>
  );
}

/* ─── Homework Panel ─────────────────────────────────────────────────────── */
function HomeworkPanel({ sessionId }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [form, setForm] = useState({ title: '', description: '', dueDate: '' });
  const [err, setErr]   = useState('');

  const { data: hwRes, refetch } = useGetSessionHomeworkQuery(sessionId);
  const homeworks = hwRes?.data ?? [];

  const [createHw, { isLoading }] = useCreateSessionHomeworkMutation();

  const handleCreate = async () => {
    setErr('');
    if (!form.title.trim()) { setErr('Sarlavha majburiy'); return; }
    if (!form.dueDate)      { setErr('Muddat majburiy');   return; }
    try {
      await createHw({ id: sessionId, ...form }).unwrap();
      setForm({ title: '', description: '', dueDate: '' });
      refetch();
    } catch (e) { setErr(e?.data?.message ?? 'Xatolik'); }
  };

  return (
    <PanelCard>
      <PanelHeader
        icon={<AssignmentIcon sx={{ fontSize: 17, color: '#D97706' }} />}
        title={`Uyga vazifa (${homeworks.length})`}
        subtitle="O'quvchilarga topshiriq berish va bildirishnoma yuborish"
        color="#F59E0B"
      />
      <Box sx={{ p: 2.5 }}>
        {/* Список домашних заданий */}
        {homeworks.length === 0 && (
          <Box sx={{ py: 2, textAlign: 'center', mb: 2 }}>
            <AssignmentIcon sx={{ fontSize: 28, color: 'text.disabled', mb: 0.5 }} />
            <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled' }}>Hali vazifa yo'q</Typography>
          </Box>
        )}
        {homeworks.map((hw) => (
          <Box key={hw._id} sx={{
            mb: 1.25, p: 1.5, borderRadius: 2,
            bgcolor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.25)',
          }}>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{hw.title}</Typography>
            {hw.description && (
              <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary', mt: 0.3 }}>{hw.description}</Typography>
            )}
            <Box sx={{ mt: 0.75, display: 'inline-block' }}>
              <DateBadge iso={hw.dueDate} />
            </Box>
          </Box>
        ))}

        {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>{err}</Alert>}

        <Box sx={{
          borderTop: homeworks.length ? '1px solid' : 'none',
          borderColor: 'divider',
          pt: homeworks.length ? 2 : 0,
        }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.disabled',
            textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1.25 }}>
            Yangi vazifa
          </Typography>
          <Stack spacing={1.25}>
            <TextField size="small" label="Sarlavha *" fullWidth
              value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }} />
            <TextField size="small" label="Tavsif (ixtiyoriy)" fullWidth multiline rows={2}
              value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }} />
            <TextField size="small" label="Topshirish muddati *" type="date" fullWidth
              value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }} />
            <Button size="small" variant="contained" color="warning"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, alignSelf: 'flex-start', px: 2.5,
                boxShadow: '0 4px 12px rgba(245,158,11,0.25)' }}
              startIcon={isLoading ? <CircularProgress size={13} color="inherit" /> : <SendIcon />}
              disabled={isLoading} onClick={handleCreate}>
              Yuborish + o'quvchilarni xabardor qilish
            </Button>
          </Stack>
        </Box>
      </Box>
    </PanelCard>
  );
}

/* ─── Attendance Panel ───────────────────────────────────────────────────── */
function AttendancePanel({ sessionId, groupId, sessionDate }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { data: attendRes, refetch: refetchAttend } = useGetSessionAttendanceQuery(sessionId);
  const { data: membersRes }                        = useGetGroupMembersQuery(groupId, { skip: !groupId });

  const existingAttend = attendRes?.data;
  const members        = membersRes?.data ?? [];

  const [records, setRecords] = useState({});
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    if (existingAttend?.records) {
      const map = {};
      existingAttend.records.forEach((r) => { map[String(r.student?._id ?? r.student)] = r.status; });
      setRecords(map);
    } else {
      const map = {};
      members.forEach((m) => { map[String(m.student._id)] = 'present'; });
      setRecords(map);
    }
  }, [existingAttend, members.length]);

  const [markAttendance] = useMarkAttendanceMutation?.() ?? [async () => {}];

  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const recs = members.map((m) => ({
        student: m.student._id,
        status:  records[String(m.student._id)] ?? 'present',
      }));
      await markAttendance({ groupId, date: sessionDate, sessionId, records: recs }).unwrap();
      setSaved(true);
      refetchAttend();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const setStatus = (sid, status) => setRecords((p) => ({ ...p, [String(sid)]: status }));

  const countPresent = members.filter((m) => records[String(m.student._id)] === 'present').length;
  const countLate    = members.filter((m) => records[String(m.student._id)] === 'late').length;
  const countAbsent  = members.filter((m) => records[String(m.student._id)] === 'absent').length;

  return (
    <PanelCard>
      <PanelHeader
        icon={<PeopleIcon sx={{ fontSize: 17, color: '#1976D2' }} />}
        title={`Davomat (${members.length} o'quvchi)`}
        subtitle="Har bir o'quvchi uchun davomat holatini belgilang"
        color="#1976D2"
      />
      <Box sx={{ p: 2.5 }}>
        {saved && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}>
            Davomat saqlandi ✓
          </Alert>
        )}

        {/* Мини-статистика */}
        {members.length > 0 && (
          <Stack direction="row" spacing={1.5} mb={2}>
            {[
              { label: 'Keldi',    count: countPresent, color: '#10B981' },
              { label: 'Kechikdi', count: countLate,    color: '#F59E0B' },
              { label: 'Kelmadi',  count: countAbsent,  color: '#EF4444' },
            ].map((s) => (
              <Box key={s.label} sx={{
                flex: 1, textAlign: 'center', py: 1, borderRadius: 2,
                bgcolor: s.color + '18', border: '1px solid ' + s.color + '30',
              }}>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.count}</Typography>
                <Typography sx={{ fontSize: '0.68rem', color: s.color, fontWeight: 600 }}>{s.label}</Typography>
              </Box>
            ))}
          </Stack>
        )}

        {members.length === 0 ? (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <PeopleIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 0.5 }} />
            <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled' }}>O'quvchilar yo'q</Typography>
          </Box>
        ) : (
          <>
            <Stack spacing={0.75} mb={2}>
              {members.map((m) => {
                const sid    = String(m.student._id);
                const status = records[sid] ?? 'present';
                const initials = m.student.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() ?? '?';

                const rowBg = status === 'absent'
                  ? 'rgba(239,68,68,0.06)'
                  : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';

                const avatarBg = isDark
                  ? (status === 'present' ? 'rgba(16,185,129,0.2)'  : status === 'late' ? 'rgba(245,158,11,0.2)'  : 'rgba(239,68,68,0.2)')
                  : (status === 'present' ? 'rgba(16,185,129,0.15)' : status === 'late' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)');

                return (
                  <Box key={sid} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 1.5, py: 1, borderRadius: 2,
                    bgcolor: rowBg,
                    border: '1px solid',
                    borderColor: status === 'present' ? 'rgba(16,185,129,0.25)' : status === 'late' ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)',
                    transition: 'all 0.1s',
                  }}>
                    <Avatar sx={{
                      width: 30, height: 30, fontSize: '0.72rem', fontWeight: 800,
                      bgcolor: avatarBg,
                      color: status === 'present' ? '#10B981' : status === 'late' ? '#F59E0B' : '#EF4444',
                    }}>
                      {initials}
                    </Avatar>
                    <Typography sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 500 }}>
                      {m.student.name}
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      {ATTEND_STATUS.map((as) => (
                        <Tooltip key={as.value} title={as.label}>
                          <Box onClick={() => setStatus(m.student._id, as.value)} sx={{
                            width: 30, height: 30, borderRadius: 1.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.12s',
                            bgcolor: status === as.value ? as.color + '20' : 'transparent',
                            border: '1.5px solid',
                            borderColor: status === as.value ? as.color : 'divider',
                            color: status === as.value ? as.color : 'text.disabled',
                            '&:hover': { borderColor: as.color, color: as.color, bgcolor: as.color + '12' },
                          }}>
                            <as.Icon sx={{ fontSize: 16 }} />
                          </Box>
                        </Tooltip>
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>

            <Button variant="contained"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 12px rgba(25,118,210,0.25)' }}
              startIcon={saving ? <CircularProgress size={13} color="inherit" /> : <CheckCircleIcon />}
              disabled={saving} onClick={handleSave}>
              Davomatni saqlash
            </Button>
          </>
        )}
      </Box>
    </PanelCard>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
const DAYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

export default function TeacherSessionDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [tab, setTab] = useState(0);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { data: res, isLoading, refetch } = useGetSessionByIdQuery(id);
  const session = res?.data;

  const group    = session?.group   ?? {};
  const status   = session?.status  ?? 'scheduled';
  const st       = STATUS_CFG[status] ?? STATUS_CFG.scheduled;
  const isLive   = status === 'live';
  const isDone   = status === 'completed';
  const isLocked = !group.isActive && group.status !== 'completed'; // группа не активирована admin'ом

  // Цвет группы (по хэшу имени)
  const groupColor = (() => {
    const n = gName(group) || '';
    let hash = 0;
    for (let i = 0; i < n.length; i++) hash = (hash * 31 + n.charCodeAt(i)) | 0;
    return GROUP_PALETTE[Math.abs(hash) % GROUP_PALETTE.length];
  })();

  if (isLoading) return (
    <Box sx={{ py: 10, textAlign: 'center' }}>
      <CircularProgress sx={{ color: 'text.disabled' }} />
    </Box>
  );

  if (!session) return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <Typography color="text.secondary">Sessiya topilmadi</Typography>
    </Box>
  );

  const dateStr = session.date
    ? new Date(session.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric', weekday: 'long' })
    : '—';

  const scheduleSlots = (group.schedule ?? []);
  const courseTxt     = cTitle(group.course);

  /* meta box color - subtle tint that works in light + dark */
  const metaBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto', py: { xs: 2, md: 3.5 }, px: { xs: 2, md: 0 } }}>

      {/* ── Назад ── */}
      <Box sx={{ mb: 2.5 }}>
        <Button
          startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
          onClick={() => navigate(-1)} size="small"
          sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', color: 'text.secondary',
            '&:hover': { color: 'text.primary', bgcolor: 'action.hover' }, borderRadius: 2, px: 1.25 }}>
          Barcha darslar
        </Button>
      </Box>

      {/* ── Замок: группа не активирована ── */}
      {isLocked && (
        <Box sx={{
          mb: 2.5, px: 2, py: 1.5, borderRadius: 2.5,
          display: 'flex', alignItems: 'center', gap: 1.5,
          bgcolor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.3)',
        }}>
          <Box sx={{
            width: 36, height: 36, borderRadius: 2, flexShrink: 0,
            bgcolor: 'rgba(239,68,68,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <LockIcon sx={{ fontSize: 18, color: '#EF4444' }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#EF4444', mb: 0.15 }}>
              Guruh aktivatsiyalanmagan
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
              Admin guruhni aktivlashtirgandan so'ng dars boshlash va manzil yuborish mumkin bo'ladi
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Hero-карточка занятия ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{
          borderRadius: 3, overflow: 'hidden',
          boxShadow: isLive
            ? `0 0 0 2px #10B981, 0 4px 24px rgba(16,185,129,0.12)`
            : `0 2px 12px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)`,
          bgcolor: 'background.paper', mb: 3,
        }}>
          {/* Live progress bar */}
          {isLive && (
            <Box sx={{
              height: 3, bgcolor: '#10B981',
              animation: 'shimmer 2s linear infinite',
              background: 'linear-gradient(90deg, #10B981 0%, #34D399 50%, #10B981 100%)',
              backgroundSize: '200% 100%',
              '@keyframes shimmer': { '0%': { backgroundPosition: '200% 0' }, '100%': { backgroundPosition: '-200% 0' } },
            }} />
          )}

          <Box sx={{ display: 'flex', gap: 0 }}>
            {/* Левая полоска */}
            <Box sx={{
              width: 5, flexShrink: 0,
              bgcolor: groupColor,
              boxShadow: `inset -4px 0 8px ${groupColor}30`,
            }} />

            <Box sx={{ flex: 1, p: 2.5 }}>
              {/* Заголовок */}
              <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={2}>
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mb={0.4}>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>
                      {gName(group) || '—'}
                    </Typography>
                    {/* Status pill */}
                    <Box sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.5,
                      px: 1.1, py: 0.3, borderRadius: 5,
                      bgcolor: st.bg, color: st.color, fontSize: '0.7rem', fontWeight: 700,
                    }}>
                      <Box sx={{
                        width: 6, height: 6, borderRadius: '50%', bgcolor: st.dot,
                        ...(isLive && {
                          animation: 'pulseLive 1.4s ease-in-out infinite',
                          '@keyframes pulseLive': { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.4, transform: 'scale(0.65)' } },
                        }),
                      }} />
                      {st.label}
                    </Box>
                  </Stack>
                  {courseTxt && (
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{courseTxt}</Typography>
                  )}
                </Box>
              </Stack>

              {/* Мета-инфо */}
              <Grid container spacing={1.5}>
                {[
                  {
                    label: 'SANA',
                    value: dateStr,
                    icon: <CalendarMonthIcon sx={{ fontSize: 13 }} />,
                  },
                  {
                    label: 'VAQT',
                    value: `${session.startTime ?? '—'} – ${session.endTime ?? ''}`,
                    icon: <AccessTimeIcon sx={{ fontSize: 13 }} />,
                  },
                  {
                    label: 'O\'QITUVCHI',
                    value: session.teacher?.name ?? '—',
                    icon: null,
                  },
                  {
                    label: 'TARIF',
                    value: group.type ?? '—',
                    icon: null,
                  },
                ].map(({ label, value, icon }) => (
                  <Grid item xs={6} sm={3} key={label}>
                    <Box sx={{ p: 1.25, borderRadius: 2, bgcolor: metaBg }}>
                      <Stack direction="row" spacing={0.4} alignItems="center" mb={0.3}>
                        {icon && <Box sx={{ color: 'text.disabled' }}>{icon}</Box>}
                        <Typography sx={{
                          fontSize: '0.6rem', fontWeight: 700, color: 'text.disabled',
                          textTransform: 'uppercase', letterSpacing: '0.07em',
                        }}>
                          {label}
                        </Typography>
                      </Stack>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.3 }}>{value}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              {/* Тема */}
              {session.topic && (
                <Box sx={{ mt: 1.5, px: 1.5, py: 1, borderRadius: 2, bgcolor: metaBg,
                  display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontSize: '0.67rem', fontWeight: 700, color: 'text.disabled',
                    textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 56 }}>
                    MAVZU
                  </Typography>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{session.topic}</Typography>
                </Box>
              )}

              {/* Ссылка */}
              {session.lessonLink?.url && (
                <Box sx={{
                  mt: 1, px: 1.5, py: 1, borderRadius: 2,
                  bgcolor: isDark ? 'rgba(25,118,210,0.12)' : 'rgba(25,118,210,0.06)',
                  display: 'flex', alignItems: 'center', gap: 1,
                  border: '1px solid rgba(25,118,210,0.2)',
                }}>
                  <LinkIcon sx={{ fontSize: 14, color: 'primary.main', flexShrink: 0 }} />
                  <Typography
                    component="a" href={session.lessonLink.url} target="_blank" rel="noopener"
                    sx={{ fontSize: '0.8rem', color: 'primary.main', fontWeight: 600,
                      textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      '&:hover': { textDecoration: 'underline' } }}>
                    {LINK_TYPES.find((l) => l.value === session.lessonLink.type)?.label ?? 'Dars'}: {session.lessonLink.url}
                  </Typography>
                </Box>
              )}

              {/* Расписание */}
              {scheduleSlots.length > 0 && (
                <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
                  {scheduleSlots.map((slot, i) => (
                    <Box key={i} sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.4,
                      px: 0.9, py: 0.3, borderRadius: 1.5,
                      bgcolor: 'action.hover', fontSize: '0.67rem', fontWeight: 600, color: 'text.secondary',
                    }}>
                      <AccessTimeIcon sx={{ fontSize: 10 }} />
                      {DAYS_RU[slot.dayOfWeek ?? slot.day] ?? '?'} · {slot.startTime}–{slot.endTime}
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* ── Tabs ── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{
          display: 'flex', gap: 0.5, p: 0.5, borderRadius: 2,
          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          width: 'fit-content',
        }}>
          {[
            { label: 'Dars manzili', icon: <LinkIcon sx={{ fontSize: 15 }} />         },
            { label: 'Materiallar', icon: <AttachFileIcon sx={{ fontSize: 15 }} />     },
            { label: 'Uyga vazifa', icon: <AssignmentIcon sx={{ fontSize: 15 }} />     },
            { label: 'Davomat',     icon: <PeopleIcon sx={{ fontSize: 15 }} />         },
          ].map((t, i) => (
            <Box key={i} onClick={() => setTab(i)} sx={{
              display: 'flex', alignItems: 'center', gap: 0.6,
              px: 1.5, py: 0.8, borderRadius: 1.5, cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: tab === i ? 700 : 500,
              transition: 'all 0.15s',
              bgcolor: tab === i ? 'background.paper' : 'transparent',
              color:   tab === i ? 'text.primary' : 'text.disabled',
              boxShadow: tab === i ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              userSelect: 'none',
            }}>
              <Box sx={{ color: tab === i ? groupColor : 'text.disabled', display: 'flex', alignItems: 'center' }}>
                {t.icon}
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>{t.label}</Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ── Tab content ── */}
      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {tab === 0 && (
          <Stack spacing={2}>
            {isLocked ? (
              <Box sx={{
                py: 5, textAlign: 'center',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
                borderRadius: 2.5,
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                border: '1.5px dashed',
                borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              }}>
                <Box sx={{
                  width: 52, height: 52, borderRadius: '16px',
                  bgcolor: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)',
                  border: '1.5px dashed rgba(239,68,68,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <LockIcon sx={{ fontSize: 24, color: '#EF4444' }} />
                </Box>
                <Box>
                  <Typography fontWeight={700} color="text.secondary" mb={0.4}>
                    Guruh admin tomonidan aktivatsiyalanmagan
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    Dars manzilini yuborish va darsni yakunlash uchun avval admin guruhni aktivlashtirishi kerak
                  </Typography>
                </Box>
              </Box>
            ) : (
              <>
                {!isDone && <CompletePanel session={session} onRefetch={refetch} />}
                <SendLinkPanel session={session} onRefetch={refetch} />
              </>
            )}
          </Stack>
        )}
        {tab === 1 && <MaterialsPanel session={session} onRefetch={refetch} />}
        {tab === 2 && <HomeworkPanel sessionId={id} groupId={group._id} />}
        {tab === 3 && (
          <AttendancePanel sessionId={id} groupId={group._id} sessionDate={session.date} />
        )}
      </motion.div>
    </Box>
  );
}
