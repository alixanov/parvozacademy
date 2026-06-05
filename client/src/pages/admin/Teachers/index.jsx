import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip,
  Avatar, Button, IconButton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel,
  Alert, CircularProgress, InputAdornment,
} from '@mui/material';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AddIcon            from '@mui/icons-material/Add';
import SearchIcon         from '@mui/icons-material/Search';
import EditIcon              from '@mui/icons-material/Edit';
import DeleteIcon            from '@mui/icons-material/Delete';
import CloseIcon             from '@mui/icons-material/Close';
import VisibilityIcon        from '@mui/icons-material/Visibility';
import VisibilityOffIcon     from '@mui/icons-material/VisibilityOff';
import LockIcon              from '@mui/icons-material/Lock';
import PeopleIcon            from '@mui/icons-material/People';
import MenuBookIcon          from '@mui/icons-material/MenuBook';
import StarIcon              from '@mui/icons-material/Star';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import TranslateIcon         from '@mui/icons-material/Translate';
import PowerSettingsNewIcon  from '@mui/icons-material/PowerSettingsNew';
import { motion }            from 'framer-motion';
import { formatPrice }       from '../../../data/mockData.js';
import PageHeader            from '../../../components/common/PageHeader/index.jsx';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useSetUserActiveMutation,
} from '../../../features/users/usersApi.js';
import { useGetCoursesQuery } from '../../../features/courses/coursesApi.js';
import { useGetGroupsQuery }  from '../../../features/groups/groupsApi.js';

const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];
const COLOR_OPTIONS = ['#1976D2','#10B981','#F59E0B','#7C3AED','#EC4899','#EF4444','#06B6D4','#D97706','#3B82F6','#64748B'];
const EMPTY   = { nameUz:'', nameRu:'', email:'', phone:'', subject:'', experience:1, bio:'', salary:3000000, password:'', passwordPlain:'', color: '#1976D2' };

const stripPhone = (raw = '') => {
  const d = raw.replace(/\D/g, '');
  if (d.startsWith('998') && d.length >= 11) return d.slice(3, 12);
  if (d.startsWith('0')   && d.length === 10) return d.slice(1);
  return d.slice(0, 9);
};

/** Get course title in the current language */
function courseTitle(course, lang) {
  const t = course?.title;
  if (!t) return '—';
  if (typeof t === 'object') return (lang === 'ru' ? t.ru : t.uz) ?? t.uz ?? t.ru ?? '—';
  return t;
}

/** Returns the correct localized name of a teacher */
function tName(teacher, lang) {
  if (!teacher) return '?';
  if (lang === 'ru' && teacher.nameRu) return teacher.nameRu;
  return teacher.nameUz || teacher.name || '?';
}

/* ── Form Dialog ─────────────────────────────────────────────── */
function TeacherDialog({ open, onClose, teacher, onSave, loading, apiError }) {
  const { t, i18n }            = useTranslation();
  const lang                   = i18n.language;
  const [form, setForm]        = useState(EMPTY);
  const [localError, setLocal] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);

  const { data: coursesRes } = useGetCoursesQuery({ limit: 100 }, { skip: !open });
  const courses = (coursesRes?.data ?? []).filter((c) => c.isActive !== false);

  const handleEnter = () => {
    setShowCurrent(false);
    setShowNew(false);
    setForm(teacher
      ? {
          ...EMPTY,
          ...teacher,
          nameUz:        teacher.nameUz || teacher.name || '',
          nameRu:        teacher.nameRu || '',
          phone:         stripPhone(teacher.phone || ''),
          password:      '',
          passwordPlain: teacher.passwordPlain || '',
          color:         teacher.color || '#1976D2',
        }
      : EMPTY);
    setLocal('');
  };

  const ch = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const handlePhone = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
    setForm((p) => ({ ...p, phone: digits }));
  };

  const handleSave = () => {
    if (!form.nameUz.trim())      return setLocal("Ism (O'zbekcha) majburiy");
    if (form.phone.length !== 9)  return setLocal("Telefon raqam 9 ta raqamdan iborat bo'lishi kerak");
    if (!teacher && !form.password)            return setLocal(t('form.passwordRequired'));
    if (!teacher && form.password.length < 6) return setLocal('Parol kamida 6 ta belgi');
    setLocal('');
    onSave({ ...form, phone: `+998${form.phone}` });
  };

  const error = localError || apiError;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      TransitionProps={{ onEnter: handleEnter }}
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontWeight:700 }}>
        {teacher ? t('dialog.editTeacher') : t('dialog.addTeacher')}
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb:2, borderRadius:2 }}>{error}</Alert>}

        <Grid container spacing={2.5}>

          {/* ── Bilingual name block ── */}
          <Grid item xs={12}>
            <Box sx={{
              p: 2, borderRadius: 2,
              border: '1px solid', borderColor: 'divider',
              bgcolor: 'action.hover',
            }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <TranslateIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                <Typography variant="caption" fontWeight={700} color="primary.main">
                  Ism (ikki tilda)
                </Typography>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Ism — O'zbekcha *"
                    fullWidth
                    size="small"
                    value={form.nameUz}
                    onChange={ch('nameUz')}
                    placeholder="Azizbek Karimov"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography variant="caption" fontWeight={700} color="primary.main">UZ</Typography>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Ism — Ruscha"
                    fullWidth
                    size="small"
                    value={form.nameRu}
                    onChange={ch('nameRu')}
                    placeholder="Азизбек Каримов"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Typography variant="caption" fontWeight={700} color="text.secondary">RU</Typography>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* ── Contact ── */}
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('form.phone') + ' *'} fullWidth size="small"
              value={form.phone} onChange={handlePhone}
              placeholder="90 123 45 67"
              inputProps={{ maxLength: 9, inputMode: 'numeric' }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Chip
                      label="+998"
                      size="small"
                      sx={{
                        height: 22, fontSize: '0.72rem', fontWeight: 700,
                        bgcolor: 'rgba(25,118,210,0.10)',
                        color: 'primary.main',
                        border: 'none',
                        borderRadius: '4px',
                        mr: 0.5,
                        '& .MuiChip-label': { px: 0.75 },
                      }}
                    />
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email" type="email" fullWidth size="small"
              value={form.email || ''} onChange={ch('email')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          {/* ── Subject + Experience ── */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>{t('form.subject')}</InputLabel>
              <Select label={t('form.subject')} value={form.subject} onChange={ch('subject')}
                sx={{ borderRadius: 2 }}>
                {courses.length === 0 && (
                  <MenuItem value="" disabled>
                    <Typography variant="caption" color="text.disabled">
                      Kurslar yuklanmoqda…
                    </Typography>
                  </MenuItem>
                )}
                {courses.map((c) => (
                  <MenuItem key={c._id} value={courseTitle(c, 'uz')}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {courseTitle(c, lang)}
                        </Typography>
                        {typeof c.title === 'object' && c.title.ru && c.title.uz && lang !== 'ru' && (
                          <Typography variant="caption" color="text.secondary">
                            {c.title.ru}
                          </Typography>
                        )}
                        {typeof c.title === 'object' && c.title.uz && lang === 'ru' && (
                          <Typography variant="caption" color="text.secondary">
                            {c.title.uz}
                          </Typography>
                        )}
                      </Box>
                    </Stack>
                  </MenuItem>
                ))}
                <MenuItem value="Boshqa">
                  <Typography variant="body2" color="text.secondary">— Boshqa —</Typography>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('teachers.experience')} type="number" fullWidth size="small"
              value={form.experience} onChange={ch('experience')}
              inputProps={{ min:0, max:50 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          {/* ── Bio ── */}
          <Grid item xs={12}>
            <TextField
              label={t('teachers.bio')} fullWidth multiline rows={2} size="small"
              value={form.bio || ''} onChange={ch('bio')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          {/* ── Color picker ── */}
          <Grid item xs={12}>
            <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ display: 'block', mb: 1.25 }}>
                Karta rangi
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {COLOR_OPTIONS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setForm((p) => ({ ...p, color: c }))}
                    sx={{
                      width: 30, height: 30, borderRadius: '8px', bgcolor: c, cursor: 'pointer', flexShrink: 0,
                      border: form.color === c ? '3px solid' : '2px solid transparent',
                      borderColor: form.color === c ? 'text.primary' : 'transparent',
                      boxShadow: form.color === c ? `0 0 0 2px ${c}55` : 'none',
                      transition: 'transform 0.15s',
                      '&:hover': { transform: 'scale(1.18)' },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* ── Salary ── */}
          <Grid item xs={12} sm={6}>
            <TextField
              label={`${t('teachers.salary')} (${t('common.sum')})`}
              type="number" fullWidth size="small"
              value={form.salary} onChange={ch('salary')}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>

          {/* ── Current password (edit mode only) ── */}
          {teacher && (
            <Grid item xs={12} sm={6}>
              {form.passwordPlain ? (
                /* Known password: show with eye toggle */
                <TextField
                  label="Joriy parol"
                  type={showCurrent ? 'text' : 'password'}
                  fullWidth size="small"
                  value={form.passwordPlain}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" sx={{ color: 'success.main' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" edge="end" onClick={() => setShowCurrent((p) => !p)}>
                          {showCurrent
                            ? <VisibilityOffIcon fontSize="small" />
                            : <VisibilityIcon   fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      bgcolor: 'success.main' + '0A',
                      '& fieldset': { borderColor: 'success.main' + '60' },
                    },
                    '& input': { cursor: 'default', fontFamily: showCurrent ? 'inherit' : 'monospace' },
                  }}
                  helperText="✓ Parol mavjud — ko'rish uchun ko'zni bosing"
                  FormHelperTextProps={{ sx: { color: 'success.main' } }}
                />
              ) : (
                /* Unknown password: old account */
                <TextField
                  label="Joriy parol"
                  fullWidth size="small"
                  value="Noma'lum"
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" sx={{ color: 'warning.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'warning.main' + '0A' },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'var(--mui-palette-warning-main)',
                      fontStyle: 'italic',
                    },
                  }}
                  helperText="Eski hisob — yangi parol o'rnating ↘"
                  FormHelperTextProps={{ sx: { color: 'warning.main' } }}
                />
              )}
            </Grid>
          )}

          {/* ── New / create password ── */}
          <Grid item xs={12} sm={6}>
            <TextField
              label={teacher ? t('teachers.newPassword') : `${t('form.password')} *`}
              type={showNew ? 'text' : 'password'}
              fullWidth size="small"
              value={form.password || ''} onChange={ch('password')}
              placeholder={teacher ? "O'zgartirmasangiz bo'sh qoldiring" : ''}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end" onClick={() => setShowNew((p) => !p)}>
                      {showNew ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px:3, py:2, gap:1 }}>
        <Button sx={{ borderRadius:2 }} onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" sx={{ borderRadius:2 }} onClick={handleSave} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}>
          {teacher ? t('common.save') : t('common.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function AdminTeachers() {
  const { t, i18n } = useTranslation();
  const lang        = i18n.language;

  const { data, isLoading } = useGetUsersQuery({ role: 'teacher', limit: 100 });
  const teachers = data?.data ?? [];

  const { data: groupsRes } = useGetGroupsQuery({ limit: 200 });
  const allGroups = groupsRes?.data ?? [];

  // Per-teacher stats computed from groups
  const teacherStats = useMemo(() => {
    const map = {};
    for (const g of allGroups) {
      const tid = typeof g.teacher === 'object' ? g.teacher?._id : g.teacher;
      if (!tid) continue;
      const key = String(tid);
      if (!map[key]) map[key] = { groups: 0, students: 0 };
      map[key].groups   += 1;
      map[key].students += g.memberCount ?? 0;
    }
    return map;
  }, [allGroups]);

  const [createUser, { isLoading: creating, error: createErr }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating, error: updateErr }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: deleting }]                   = useDeleteUserMutation();
  const [setActive]                                             = useSetUserActiveMutation();
  const [addOpen, setAddOpen]   = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [delId, setDelId]       = useState(null);
  const [snackMsg, setSnack]    = useState('');
  const [search, setSearch]     = useState('');

  const apiErrMsg = (err) => err?.data?.message || err?.data?.error || '';

  const handleAdd = async (form) => {
    try {
      await createUser({ ...form, role: 'teacher' }).unwrap();
      setAddOpen(false);
      setSnack(t('common.saved'));
    } catch { /* shown in dialog */ }
  };

  const handleEdit = async (form) => {
    try {
      await updateUser({ id: editItem._id, ...form }).unwrap();
      setEditItem(null);
      setSnack(t('common.saved'));
    } catch { /* shown in dialog */ }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(delId).unwrap();
      setDelId(null);
    } catch (e) { setSnack(apiErrMsg(e) || 'Xato'); }
  };

  const handleToggleActive = (tr) => setActive({ id: tr._id, isActive: !tr.isActive });

  const filteredTeachers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((tr) =>
      (tr.name       ?? '').toLowerCase().includes(q) ||
      (tr.nameUz     ?? '').toLowerCase().includes(q) ||
      (tr.nameRu     ?? '').toLowerCase().includes(q) ||
      (tr.phone      ?? '').includes(q) ||
      (tr.subject    ?? '').toLowerCase().includes(q)
    );
  }, [teachers, search]);

  const activeCount   = teachers.filter((tr) =>  tr.isActive).length;
  const inactiveCount = teachers.filter((tr) => !tr.isActive).length;
  const avgRating     = teachers.length
    ? (teachers.reduce((a, tr) => a + (tr.rating ?? 5), 0) / teachers.length).toFixed(1)
    : '—';

  const STATS = [
    { label: t('teachers.total'),     value: teachers.length, color: '#1976D2' },
    { label: t('common.active'),      value: activeCount,     color: '#10B981' },
    { label: t('status.inactive'),    value: inactiveCount,   color: '#EF4444' },
    { label: t('teachers.avgRating'), value: avgRating,       color: '#F59E0B' },
  ];

  const color  = (tr, idx) => tr.color || PALETTE[idx % PALETTE.length];

  return (
    <Box>
      <PageHeader
        icon={<SupervisorAccountIcon />}
        title={t('teachers.management')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius:2 }} onClick={() => setAddOpen(true)}>
            {t('dialog.addTeacher')}
          </Button>
        }
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb:4 }}>
        {STATS.map((s, i) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06, duration:0.22 }}>
              <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:2 }}>
                <CardContent sx={{ p:1, '&:last-child': { pb:1 }, textAlign:'center' }}>
                  <Typography variant="subtitle1" fontWeight={800} color={s.color} lineHeight={1.2}>
                    {isLoading ? <CircularProgress size={14} /> : s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize:'0.62rem', mt:0.15 }}>
                    {s.label}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Search bar */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
            <TextField
              size="small"
              placeholder="Ism, telefon, fan bo'yicha qidirish…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              {filteredTeachers.length} / {teachers.length} ta
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Empty */}
      {!isLoading && teachers.length === 0 && (
        <Card elevation={0} sx={{ p:5, textAlign:'center', border:'1px dashed', borderColor:'divider', borderRadius:3 }}>
          <SupervisorAccountIcon sx={{ fontSize:56, color:'text.disabled', mb:1 }} />
          <Typography color="text.secondary">
            {t('teachers.noTeachers', { defaultValue: "Hali o'qituvchi yo'q. \"Qo'shish\" tugmasini bosing." })}
          </Typography>
        </Card>
      )}

      {/* No results */}
      {!isLoading && teachers.length > 0 && filteredTeachers.length === 0 && (
        <Card elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 3, mb: 2 }}>
          <SearchIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">"{search}" bo'yicha hech narsa topilmadi</Typography>
        </Card>
      )}

      {/* Teacher cards */}
      <Grid container spacing={3}>
        {filteredTeachers.map((tr, idx) => {
          const displayName = tName(tr, lang);
          const altRaw      = lang === 'ru' ? (tr.nameUz || tr.name) : tr.nameRu;
          const altName     = altRaw && altRaw !== displayName ? altRaw : null;

          return (
            <Grid item xs={12} sm={6} md={4} key={tr._id}>
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }}>
                <Card elevation={0} sx={{
                  opacity: tr.isActive ? 1 : 0.65,
                  border:'1px solid',
                  borderColor: tr.isActive ? 'divider' : 'error.light',
                  borderLeft: `4px solid ${color(tr, idx)}`,
                  borderRadius: 3,
                }}>
                  <CardContent sx={{ p:3 }}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb:2 }}>
                      <Avatar sx={{ width:52, height:52, bgcolor: color(tr, idx), fontSize:'1.4rem', fontWeight:700, flexShrink:0, mt:0.25 }}>
                        {displayName[0]?.toUpperCase() ?? '?'}
                      </Avatar>
                      <Box sx={{ flex:1, minWidth:0 }}>
                        {/* Primary name */}
                        <Typography variant="subtitle1" fontWeight={700} noWrap>
                          {displayName}
                        </Typography>
                        {/* Alt-language name (shown as secondary if exists) */}
                        {altName && (
                          <Typography variant="caption" color="text.secondary" noWrap
                            sx={{ display:'flex', alignItems:'center', gap:0.4 }}>
                            <TranslateIcon sx={{ fontSize:11 }} />
                            {altName}
                          </Typography>
                        )}
                        <Typography variant="body2" color="text.secondary" noWrap sx={{ mt: 0.25 }}>
                          {tr.subject || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{tr.phone}</Typography>
                      </Box>

                      {/* Active toggle */}
                      <Tooltip title={tr.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}>
                        <Box onClick={() => handleToggleActive(tr)} sx={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          gap: 0.4, cursor: 'pointer', flexShrink: 0,
                        }}>
                          <Box sx={{
                            width: 34, height: 34, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: tr.isActive ? '#10B981' : '#EF4444',
                            boxShadow: tr.isActive
                              ? '0 0 0 4px #10B98128, 0 2px 10px #10B98150'
                              : '0 0 0 4px #EF444428, 0 2px 10px #EF444450',
                            transition: 'all .2s',
                            '&:hover': { transform: 'scale(1.1)', filter: 'brightness(1.1)' },
                            '&:active': { transform: 'scale(0.94)' },
                          }}>
                            <PowerSettingsNewIcon sx={{ fontSize: 17, color: '#fff' }} />
                          </Box>
                          <Typography sx={{
                            fontSize: '0.6rem', fontWeight: 700, lineHeight: 1,
                            color: tr.isActive ? '#10B981' : '#EF4444',
                          }}>
                            {tr.isActive ? t('common.active') : t('status.inactive')}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </Stack>

                    <Grid container spacing={1.5} sx={{ mb:2 }}>
                      {[
                        { icon:<PeopleIcon sx={{ fontSize:14 }} />,   label:`${teacherStats[String(tr._id)]?.students ?? 0} talaba`, color:'#1976D2' },
                        { icon:<MenuBookIcon sx={{ fontSize:14 }} />, label:`${teacherStats[String(tr._id)]?.groups  ?? 0} guruh`,  color:'#7C3AED' },
                        { icon:<StarIcon sx={{ fontSize:14 }} />,     label:`${tr.experience ?? 0} yil`, color:'#F59E0B' },
                      ].map((stat) => (
                        <Grid item xs={4} key={stat.label}>
                          <Box sx={{ textAlign:'center', p:1, bgcolor:'action.hover', borderRadius:1.5 }}>
                            <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ color:stat.color, mb:0.25 }}>
                              {stat.icon}
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize:'0.65rem' }}>
                              {stat.label}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    {tr.bio && (
                      <Typography variant="caption" color="text.secondary" sx={{ mb:1.5, display:'block' }} noWrap>
                        {tr.bio}
                      </Typography>
                    )}

                    <Divider sx={{ mb:1.5 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="text.secondary">{t('teachers.salary')}</Typography>
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          {formatPrice(tr.salary ?? 0)} {t('common.sum')}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title={t('common.edit')}>
                          <IconButton size="small" sx={{ color: color(tr, idx) }} onClick={() => setEditItem(tr)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton size="small" color="error" onClick={() => setDelId(tr._id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {/* Add dialog */}
      <TeacherDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        teacher={null}
        onSave={handleAdd}
        loading={creating}
        apiError={apiErrMsg(createErr)}
      />

      {/* Edit dialog */}
      <TeacherDialog
        open={!!editItem}
        onClose={() => setEditItem(null)}
        teacher={editItem}
        onSave={handleEdit}
        loading={updating}
        apiError={apiErrMsg(updateErr)}
      />

      {/* Delete confirm */}
      <Dialog open={!!delId} onClose={() => setDelId(null)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>{t('dialog.deleteTitle')}</DialogTitle>
        <DialogContent>
          <Typography>{t('dialog.deleteText')}</Typography>
        </DialogContent>
        <DialogActions sx={{ px:3, py:1.5 }}>
          <Button sx={{ borderRadius:2 }} onClick={() => setDelId(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" sx={{ borderRadius:2 }} onClick={handleDelete} disabled={deleting}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snack */}
      {snackMsg && (
        <Box sx={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:9999 }}>
          <Alert severity="success" onClose={() => setSnack('')} sx={{ boxShadow:4, borderRadius:2 }}>{snackMsg}</Alert>
        </Box>
      )}
    </Box>
  );
}
