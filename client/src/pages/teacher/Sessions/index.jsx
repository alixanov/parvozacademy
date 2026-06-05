import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Typography, Stack, Select, MenuItem, Button,
  Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, CircularProgress, Alert, InputAdornment,
  TextField, Pagination, useTheme, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import SearchIcon            from '@mui/icons-material/Search';
import AccessTimeIcon        from '@mui/icons-material/AccessTime';
import ChevronRightIcon      from '@mui/icons-material/ChevronRight';
import CalendarTodayIcon     from '@mui/icons-material/CalendarToday';
import EventRepeatIcon       from '@mui/icons-material/EventRepeat';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import GroupsIcon            from '@mui/icons-material/Groups';
import PlayCircleIcon        from '@mui/icons-material/PlayCircle';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import ArchiveIcon           from '@mui/icons-material/Archive';
import LockIcon              from '@mui/icons-material/Lock';
import i18n                  from '../../../utils/i18n.js';
import { useGetTeacherGroupsQuery }   from '../../../features/teacher/teacherApi.js';
import { useCompleteGroupMutation }   from '../../../features/groups/groupsApi.js';
import {
  useGetSessionsByGroupQuery,
  useGenerateGroupSessionsMutation,
} from '../../../features/sessions/sessionsApi.js';

/* ─── helpers ───────────────────────────────────────────────── */
function gName(group) {
  if (!group) return '';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const n = group.name;
  if (typeof n === 'object') return n[lang] ?? n.uz ?? n.ru ?? '';
  return n ?? '';
}
function cTitle(course) {
  if (!course) return '';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const t = course.title;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '';
  return t ?? '';
}
function minutesUntil(dateIso, startTime) {
  if (!dateIso || !startTime) return null;
  const [hh, mm] = startTime.split(':').map(Number);
  const start = new Date(dateIso);
  start.setHours(hh, mm, 0, 0);
  return Math.round((start - Date.now()) / 60_000);
}
function startLabel(dateIso, startTime, status) {
  if (status === 'live')      return { text: 'Идёт сейчас', color: '#10B981', pulse: true };
  if (status === 'completed') return { text: 'Завершено',   color: '#9CA3AF', pulse: false };
  if (status === 'cancelled') return { text: 'Отменено',    color: '#EF4444', pulse: false };
  const mins = minutesUntil(dateIso, startTime);
  if (mins === null) return null;
  if (mins <= 0 && mins > -120)  return { text: 'Идёт сейчас',              color: '#10B981', pulse: true  };
  if (mins > 0   && mins <= 60)  return { text: `Через ${mins} мин`,        color: '#F59E0B', pulse: false };
  if (mins > 60  && mins <= 180) return { text: `Через ${Math.round(mins / 60)} ч`, color: '#F59E0B', pulse: false };
  const today = new Date(); today.setHours(0,0,0,0);
  const day   = new Date(dateIso); day.setHours(0,0,0,0);
  const diffD = Math.round((day - today) / 86_400_000);
  if (diffD === 0) return { text: `Сегодня ${startTime}`, color: '#1976D2', pulse: false };
  if (diffD === 1) return { text: `Завтра ${startTime}`,  color: '#7C3AED', pulse: false };
  if (diffD > 1 && diffD <= 7) return { text: `Через ${diffD} дн.`, color: '#6B7280', pulse: false };
  return null; // > 7 дней — дата уже показана в первой строке, доп. метка не нужна
}

const DAYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

/* ─── Статус-пилюля ──────────────────────────────────────────── */
const STATUS_CFG = {
  scheduled: { bg: 'rgba(59,130,246,0.12)',  color: '#3B82F6', dot: '#3B82F6', label: 'Запланировано' },
  live:       { bg: 'rgba(16,185,129,0.12)', color: '#10B981', dot: '#10B981', label: 'Идёт'          },
  completed:  { bg: 'rgba(156,163,175,0.1)', color: '#9CA3AF', dot: '#9CA3AF', label: 'Завершено'     },
  cancelled:  { bg: 'rgba(239,68,68,0.1)',   color: '#EF4444', dot: '#EF4444', label: 'Отменено'      },
};

function StatusPill({ status }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.scheduled;
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.6,
      px: 1.25, py: 0.35, borderRadius: 5,
      bgcolor: cfg.bg, color: cfg.color,
      fontSize: '0.69rem', fontWeight: 700,
      border: `1px solid ${cfg.color}25`,
    }}>
      <Box sx={{
        width: 5, height: 5, borderRadius: '50%', bgcolor: cfg.dot, flexShrink: 0,
        ...(status === 'live' && {
          animation: 'pulseDot 1.4s ease-in-out infinite',
          '@keyframes pulseDot': { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.4, transform: 'scale(0.65)' } },
        }),
      }} />
      {cfg.label}
    </Box>
  );
}

/* ─── Список занятий группы ──────────────────────────────────── */
const LIMIT = 15;

function GroupSessions({ group, search, statusFilter, color, onAllDone, isLocked }) {
  const navigate = useNavigate();
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const [page, setPage]      = useState(1);
  const [generating, setGen] = useState(false);
  const [genDone,    setDone]= useState(false);

  const { data, isLoading, isError, refetch } = useGetSessionsByGroupQuery(
    { group: group._id, status: statusFilter || undefined, page, limit: LIMIT },
    { skip: !group._id },
  );
  const [generateSessions] = useGenerateGroupSessionsMutation();

  const sessions = data?.data ?? [];
  const total    = data?.pagination?.total ?? sessions.length;
  const pages    = data?.pagination?.pages ?? (Math.ceil(total / LIMIT) || 1);

  /* Отдельный запрос: сколько ЗАПЛАНИРОВАННЫХ занятий осталось?
     Если 0 — все уроки проведены, можно завершать курс.          */
  const { data: pendingData } = useGetSessionsByGroupQuery(
    { group: group._id, status: 'scheduled', page: 1, limit: 1 },
    { skip: !group._id || !group.isActive },
  );
  const pendingTotal = pendingData?.pagination?.total ?? null;
  const allDone      = group.isActive && pendingTotal === 0 && total > 0;

  /* Уведомляем родителя через эффект (не во время рендера) */
  useEffect(() => {
    if (onAllDone && pendingTotal !== null) {
      onAllDone(String(group._id), allDone);
    }
  }, [allDone, group._id, onAllDone, pendingTotal]);

  const filtered = search
    ? sessions.filter((s) =>
        (s.topic || '').toLowerCase().includes(search.toLowerCase()) ||
        (s.date  || '').includes(search),
      )
    : sessions;

  const handleGenerate = async () => {
    setGen(true);
    try { await generateSessions(group._id).unwrap(); setDone(true); refetch(); }
    catch { /* ignore */ }
    setGen(false);
  };

  /* ── Группа заблокирована (не активирована Admin'ом) ── */
  if (isLocked) return (
    <Box sx={{
      py: 4, textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
    }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: '14px',
        bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
        border: '1.5px dashed',
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <LockIcon sx={{ fontSize: 22, color: 'text.disabled' }} />
      </Box>
      <Box>
        <Typography variant="body2" fontWeight={700} color="text.secondary" mb={0.25}>
          Guruh admin tomonidan aktivatsiyalanmagan
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Admin guruhni aktivlashtirgandan so'ng darslarni boshlash mumkin
        </Typography>
      </Box>
    </Box>
  );

  if (isLoading) return (
    <Box sx={{ py: 4, textAlign: 'center' }}>
      <CircularProgress size={22} sx={{ color }} />
    </Box>
  );
  if (isError) return (
    <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>Ошибка загрузки занятий</Alert>
  );

  /* Пустое состояние */
  if (!filtered.length) {
    const schedule    = group.schedule ?? [];
    const hasSchedule = schedule.length > 0;
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Box sx={{
          width: 48, height: 48, borderRadius: '14px', mx: 'auto', mb: 1.5,
          bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CalendarTodayIcon sx={{ fontSize: 22, color: 'text.disabled' }} />
        </Box>
        <Typography variant="body2" fontWeight={700} color="text.secondary" mb={0.75}>
          {search ? 'Ничего не найдено' : 'Занятия ещё не созданы'}
        </Typography>
        {hasSchedule && !search && (
          <Stack direction="row" spacing={0.75} justifyContent="center" flexWrap="wrap" mb={2}>
            {schedule.map((slot, i) => (
              <Box key={i} sx={{
                display: 'inline-flex', alignItems: 'center', gap: 0.4,
                px: 1, py: 0.35, borderRadius: 1.5,
                bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                fontSize: '0.7rem', fontWeight: 600, color: 'text.secondary',
              }}>
                <AccessTimeIcon sx={{ fontSize: 11 }} />
                {DAYS_RU[slot.dayOfWeek ?? slot.day] ?? '?'} · {slot.startTime}
              </Box>
            ))}
          </Stack>
        )}
        {!search && (
          genDone
            ? <Alert severity="success" sx={{ display: 'inline-flex', borderRadius: 2, py: 0.5, fontSize: '0.82rem' }}>
                Занятия созданы ✓
              </Alert>
            : <Button
                variant="outlined" size="small"
                startIcon={generating ? <CircularProgress size={13} color="inherit" /> : <EventRepeatIcon />}
                disabled={generating} onClick={handleGenerate}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: '0.8rem',
                  borderColor: color, color, '&:hover': { borderColor: color, bgcolor: `${color}10` } }}
              >
                Сгенерировать занятия
              </Button>
        )}
      </Box>
    );
  }

  /* Таблица */
  return (
    <>
      <TableContainer>
        <Table size="small" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              {[
                { label: 'ДАТА',   width: 190 },
                { label: 'ВРЕМЯ',  width: 80  },
                { label: 'ТЕМА',   width: 'auto' },
                { label: 'СТАТУС', width: 140 },
                { label: '',       width: 32  },
              ].map(({ label, width }) => (
                <TableCell key={label} sx={{
                  width, py: 0.85, px: 1.5,
                  fontSize: '0.58rem', letterSpacing: '0.08em',
                  fontWeight: 800, color: 'text.disabled',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'transparent',
                }}>
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence>
              {filtered.map((s, idx) => {
                const lbl = startLabel(s.date, s.startTime, s.status);
                const isToday = (() => {
                  if (!s.date) return false;
                  const d = new Date(s.date); d.setHours(0,0,0,0);
                  const t = new Date();       t.setHours(0,0,0,0);
                  return d.getTime() === t.getTime();
                })();
                const isLive = s.status === 'live';

                return (
                  <motion.tr
                    key={s._id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.18, delay: idx * 0.03 }}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/teacher/sessions/${s._id}`)}
                  >
                    {/* ДАТА */}
                    <TableCell sx={{
                      py: 1.25, px: 1.5,
                      borderColor: 'divider',
                      bgcolor: isLive
                        ? (isDark ? 'rgba(16,185,129,0.07)' : 'rgba(16,185,129,0.04)')
                        : isToday
                          ? (isDark ? 'rgba(59,130,246,0.06)' : 'rgba(59,130,246,0.03)')
                          : 'transparent',
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                    }}>
                      <Stack spacing={0.2}>
                        <Typography sx={{
                          fontSize: '0.83rem',
                          fontWeight: isToday || isLive ? 700 : 500,
                          color: isLive ? '#10B981' : isToday ? '#3B82F6' : 'text.primary',
                          lineHeight: 1.3,
                        }}>
                          {s.date
                            ? new Date(s.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', weekday: 'short' })
                            : '—'}
                        </Typography>
                        {lbl && (
                          <Stack direction="row" alignItems="center" spacing={0.4}>
                            {lbl.pulse && (
                              <FiberManualRecordIcon sx={{
                                fontSize: 7, color: lbl.color,
                                animation: 'pDot 1.4s ease-in-out infinite',
                                '@keyframes pDot': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
                              }} />
                            )}
                            <Typography sx={{ fontSize: '0.67rem', fontWeight: 600, color: lbl.color, lineHeight: 1.2 }}>
                              {lbl.text}
                            </Typography>
                          </Stack>
                        )}
                      </Stack>
                    </TableCell>

                    {/* ВРЕМЯ */}
                    <TableCell sx={{ py: 1.25, px: 1.5, borderColor: 'divider' }}>
                      <Stack direction="row" spacing={0.4} alignItems="center">
                        <AccessTimeIcon sx={{ fontSize: 12, color: isLive ? '#10B981' : 'text.disabled' }} />
                        <Typography sx={{
                          fontSize: '0.8rem', fontWeight: isLive ? 700 : 400,
                          color: isLive ? '#10B981' : 'text.secondary',
                        }}>
                          {s.startTime ?? '—'}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* ТЕМА */}
                    <TableCell sx={{ py: 1.25, px: 1.5, borderColor: 'divider' }}>
                      <Typography sx={{ fontSize: '0.82rem', color: s.topic ? 'text.primary' : 'text.disabled' }} noWrap>
                        {s.topic || 'без темы'}
                      </Typography>
                    </TableCell>

                    {/* СТАТУС */}
                    <TableCell sx={{ py: 1.25, px: 1.5, borderColor: 'divider' }}>
                      <StatusPill status={s.status} />
                    </TableCell>

                    <TableCell align="right" sx={{ py: 1.25, px: 1.5, borderColor: 'divider' }}>
                      <ChevronRightIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                    </TableCell>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </TableContainer>

      {pages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 1.5, pb: 1, px: 2 }}>
          <Pagination count={pages} page={page} size="small" onChange={(_, v) => setPage(v)}
            sx={{ '& .MuiPaginationItem-root': { color: 'text.secondary' } }} />
        </Box>
      )}
    </>
  );
}

/* ─── Цветовая палитра групп ─────────────────────────────────── */
const PALETTE = ['#1976D2', '#7C3AED', '#10B981', '#EF4444', '#F59E0B', '#0891B2', '#EC4899'];

/* ─── Главная страница ───────────────────────────────────────── */
export default function TeacherSessionsPage() {
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [groupFilter,  setGroupFilter]  = useState('all');
  const [doneGroups,   setDoneGroups]   = useState({});  // groupId → bool
  const [confirmG,     setConfirmG]     = useState(null); // group to complete

  const { data: groupsData, isLoading: loadingGroups, refetch } = useGetTeacherGroupsQuery();
  const groups = groupsData?.data ?? groupsData ?? [];

  const [completeGroup, { isLoading: completing }] = useCompleteGroupMutation();

  const handleAllDone = useCallback((gId, done) => {
    setDoneGroups((prev) => prev[gId] === done ? prev : { ...prev, [gId]: done });
  }, []);

  const handleComplete = async () => {
    if (!confirmG) return;
    try {
      await completeGroup(confirmG._id).unwrap();
      setConfirmG(null);
      refetch();
    } catch { /* ignore */ }
  };

  /* Завершённые и инд. пакеты → не показываем здесь (у них своя страница) */
  const activeGroups = groups.filter(
    (g) => g.status !== 'completed' && g.type !== 'individual_package',
  );

  const shownGroups = groupFilter === 'all'
    ? activeGroups
    : activeGroups.filter((g) => g._id === groupFilter);

  const activeCount = activeGroups.filter((g) => g.isActive).length;

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', py: { xs: 2, md: 3 }, px: { xs: 1.5, md: 0 } }}>

      {/* ── Hero-шапка ────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{
          mb: 3, px: 3, py: 2.5, borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: isDark
            ? '0 4px 24px rgba(0,0,0,0.35)'
            : '0 4px 24px rgba(25,118,210,0.08)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Декоративный градиент */}
          <Box sx={{
            position: 'absolute', top: -30, right: -30,
            width: 180, height: 180, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(25,118,210,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }}
            justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{
                width: 46, height: 46, borderRadius: '14px', flexShrink: 0,
                background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(25,118,210,0.35)',
              }}>
                <GroupsIcon sx={{ fontSize: 22, color: '#fff' }} />
              </Box>
              <Box>
                <Typography fontWeight={800} fontSize="1.22rem" lineHeight={1.2}>
                  Мои занятия
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Предстоящие и прошедшие занятия по всем группам
                </Typography>
              </Box>
            </Stack>

            {/* Статы */}
            {!loadingGroups && activeGroups.length > 0 && (
              <Stack direction="row" spacing={1.25}>
                <Box sx={{
                  px: 1.5, py: 0.75, borderRadius: 2,
                  bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  border: '1px solid', borderColor: 'divider',
                  textAlign: 'center',
                }}>
                  <Typography fontSize="1.15rem" fontWeight={800} lineHeight={1.1} color="text.primary">
                    {activeGroups.length}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">групп</Typography>
                </Box>
                {activeCount > 0 && (
                  <Box sx={{
                    px: 1.5, py: 0.75, borderRadius: 2,
                    bgcolor: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                    textAlign: 'center',
                  }}>
                    <Typography fontSize="1.15rem" fontWeight={800} lineHeight={1.1} color="#10B981">
                      {activeCount}
                    </Typography>
                    <Typography variant="caption" color="#10B981" sx={{ opacity: 0.8 }}>активных</Typography>
                  </Box>
                )}
              </Stack>
            )}
          </Stack>
        </Box>
      </motion.div>

      {/* ── Фильтры ───────────────────────────────────────────────── */}
      <Box sx={{
        mb: 3, p: 1.5,
        borderRadius: 2.5,
        bgcolor: 'background.paper',
        border: '1px solid', borderColor: 'divider',
        boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 4px rgba(0,0,0,0.05)',
      }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25}>
          <TextField
            size="small"
            placeholder="Поиск по теме или дате…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2, fontSize: '0.85rem',
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <Select
            size="small" value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            displayEmpty
            sx={{
              minWidth: 160, fontSize: '0.85rem',
              '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 },
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            }}
          >
            <MenuItem value="all" sx={{ fontSize: '0.85rem' }}>Все группы</MenuItem>
            {loadingGroups
              ? <MenuItem disabled sx={{ fontSize: '0.85rem' }}>Загрузка…</MenuItem>
              : activeGroups.map((g) => (
                  <MenuItem key={g._id} value={g._id} sx={{ fontSize: '0.85rem' }}>
                    {gName(g)}
                  </MenuItem>
                ))
            }
          </Select>

          <Select
            size="small" value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            displayEmpty
            renderValue={(v) => v
              ? (
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: STATUS_CFG[v]?.dot }} />
                  <span style={{ fontSize: '0.85rem' }}>{STATUS_CFG[v]?.label}</span>
                </Stack>
              )
              : <span style={{ fontSize: '0.85rem', color: theme.palette.text.disabled }}>Все статусы</span>
            }
            sx={{
              minWidth: 150,
              '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 },
              bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
            }}
          >
            <MenuItem value="" sx={{ fontSize: '0.85rem' }}>Все статусы</MenuItem>
            {Object.entries(STATUS_CFG).map(([val, cfg]) => (
              <MenuItem key={val} value={val} sx={{ fontSize: '0.85rem' }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.dot }} />
                  <span>{cfg.label}</span>
                </Stack>
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Box>

      {/* ── Список групп ──────────────────────────────────────────── */}
      {loadingGroups ? (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress size={28} sx={{ color: 'text.disabled' }} />
          <Typography variant="caption" color="text.disabled" display="block" mt={1.5}>
            Загрузка групп…
          </Typography>
        </Box>
      ) : shownGroups.length === 0 ? (
        <Box sx={{
          py: 8, textAlign: 'center',
          bgcolor: 'background.paper', borderRadius: 3,
          border: '1px solid', borderColor: 'divider',
        }}>
          <GroupsIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="body2" color="text.disabled" fontWeight={600}>Групп не найдено</Typography>
        </Box>
      ) : (
        shownGroups.map((g, gi) => {
          const color      = PALETTE[gi % PALETTE.length];
          const isActive   = g.isActive;
          const isCompleted = g.status === 'completed';
          const hasUpcoming = !isActive && g.startDate && new Date(g.startDate) > new Date();
          const allDone     = doneGroups[String(g._id)] === true;
          // Заблокировано если группа ещё не активирована admin'ом (isActive=false и не завершена)
          const isInactive  = !g.isActive && g.status !== 'completed';

          return (
            <motion.div
              key={g._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: gi * 0.07 }}
            >
              <Box sx={{
                mb: 2.5, borderRadius: 3, overflow: 'hidden',
                bgcolor: 'background.paper',
                border: '1px solid', borderColor: 'divider',
                boxShadow: isDark
                  ? '0 2px 12px rgba(0,0,0,0.3)'
                  : '0 2px 12px rgba(0,0,0,0.06)',
                transition: 'box-shadow 0.2s, border-color 0.2s',
                '&:hover': {
                  borderColor: `${color}40`,
                  boxShadow: isDark
                    ? `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${color}30`
                    : `0 6px 24px rgba(0,0,0,0.1), 0 0 0 1px ${color}25`,
                },
              }}>

                {/* ── Шапка группы ── */}
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 2,
                  px: 2.5, py: 1.75,
                  bgcolor: isDark ? `${color}0D` : `${color}07`,
                  borderBottom: '1px solid', borderColor: 'divider',
                  position: 'relative',
                }}>
                  {/* Левая цветная полоска */}
                  <Box sx={{
                    position: 'absolute', left: 0, top: 0, bottom: 0,
                    width: 4, bgcolor: color,
                    boxShadow: `2px 0 12px ${color}50`,
                  }} />

                  {/* Иконка группы */}
                  <Box sx={{
                    width: 38, height: 38, borderRadius: '11px', flexShrink: 0, ml: 0.5,
                    bgcolor: `${color}18`,
                    border: `1.5px solid ${color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color,
                  }}>
                    <GroupsIcon sx={{ fontSize: 18 }} />
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Имя группы + курс */}
                    <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                      <Typography fontWeight={800} fontSize="0.95rem" color="text.primary">
                        {gName(g)}
                      </Typography>
                      {cTitle(g.course) && (
                        <Typography fontSize="0.75rem" color="text.secondary">
                          · {cTitle(g.course)}
                        </Typography>
                      )}
                      {/* Статус группы */}
                      <Chip
                        size="small"
                        icon={isInactive ? <LockIcon style={{ fontSize: 10, marginLeft: 6 }} /> : undefined}
                        label={isActive ? 'Aktivlashtirilgan' : hasUpcoming ? 'Tez kunda' : 'Aktivatsiya kutilmoqda'}
                        sx={{
                          height: 20, fontSize: '0.62rem', fontWeight: 700,
                          bgcolor: isActive
                            ? 'rgba(16,185,129,0.12)'
                            : isInactive
                              ? isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)'
                              : 'rgba(251,146,60,0.12)',
                          color: isActive ? '#10B981' : isInactive ? '#EF4444' : '#FB923C',
                          border: 'none',
                          '& .MuiChip-icon': { color: '#EF4444' },
                        }}
                      />
                    </Stack>

                    {/* Расписание */}
                    {(g.schedule ?? []).length > 0 && (
                      <Stack direction="row" spacing={1} flexWrap="wrap" mt={0.3}>
                        {g.schedule.map((slot, i) => (
                          <Typography key={i} sx={{
                            fontSize: '0.67rem', color: 'text.disabled',
                            display: 'inline-flex', alignItems: 'center', gap: 0.3,
                          }}>
                            <AccessTimeIcon sx={{ fontSize: 10, color }} />
                            <span style={{ color: `${color}99`, fontWeight: 600 }}>
                              {DAYS_RU[slot.dayOfWeek ?? slot.day] ?? '?'}
                            </span>
                            {' '}{slot.startTime}–{slot.endTime}
                          </Typography>
                        ))}
                      </Stack>
                    )}
                  </Box>

                  {/* Правый блок */}
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                    {g.memberCount != null && (
                      <Box sx={{
                        px: 1.1, py: 0.4, borderRadius: 1.5,
                        bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary',
                        display: 'flex', alignItems: 'center', gap: 0.4,
                      }}>
                        <PlayCircleIcon sx={{ fontSize: 12, color }} />
                        {g.memberCount} уч.
                      </Box>
                    )}

                    {/* ── Завершить курс: появляется только когда ВСЕ уроки проведены ── */}
                    {isCompleted ? (
                      <Box sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.5,
                        px: 1.2, py: 0.4, borderRadius: 1.5,
                        bgcolor: 'rgba(99,102,241,0.12)',
                        border: '1px solid rgba(99,102,241,0.25)',
                        fontSize: '0.68rem', fontWeight: 700, color: '#6366F1',
                      }}>
                        <CheckCircleIcon sx={{ fontSize: 13 }} />
                        Yakunlangan
                      </Box>
                    ) : allDone && isActive ? (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                        onClick={() => setConfirmG(g)}
                        sx={{
                          borderRadius: 2, fontSize: '0.72rem', px: 1.5, py: 0.5,
                          fontWeight: 700, whiteSpace: 'nowrap',
                          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                          boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 6px 18px rgba(99,102,241,0.45)' },
                          transition: 'all .2s',
                        }}
                      >
                        Kursni yakunlash
                      </Button>
                    ) : null}
                  </Stack>
                </Box>

                {/* ── Таблица занятий ── */}
                <Box sx={{ px: 0.5, pb: 0.5 }}>
                  <GroupSessions
                    group={g}
                    search={search}
                    statusFilter={statusFilter}
                    color={color}
                    onAllDone={handleAllDone}
                    isLocked={isInactive}
                  />
                </Box>
              </Box>
            </motion.div>
          );
        })
      )}

      {/* ══ Диалог подтверждения завершения курса ══════════════════ */}
      <Dialog
      open={!!confirmG}
      onClose={() => setConfirmG(null)}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ArchiveIcon sx={{ fontSize: 20, color: '#fff' }} />
          </Box>
          Kursni yakunlash
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          <b style={{ color: 'text.primary' }}>{confirmG && (typeof confirmG.name === 'object' ? confirmG.name.ru ?? confirmG.name.uz : confirmG.name)}</b> guruhi uchun kursni yakunlamoqchimisiz?
        </Typography>
        <Box sx={{
          p: 1.5, borderRadius: 2,
          bgcolor: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <Typography variant="caption" color="#6366F1" fontWeight={600}>
            ✓ Barcha darslar o'tkazildi
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            Kurs yakunlanganidan so'ng o'quvchilar "Bitiruvchi" maqomini oladi va guruh arxivga o'tadi. Bu amalni bekor qilib bo'lmaydi.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={() => setConfirmG(null)} sx={{ borderRadius: 2 }}>
          Bekor qilish
        </Button>
        <Button
          variant="contained"
          disabled={completing}
          onClick={handleComplete}
          sx={{
            borderRadius: 2, fontWeight: 700,
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          }}
        >
          {completing ? <CircularProgress size={18} color="inherit" /> : 'Ha, yakunlash'}
        </Button>
      </DialogActions>
    </Dialog>
    </Box>
  );
}
