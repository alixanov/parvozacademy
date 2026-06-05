import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip,
  Button, IconButton, Tabs, Tab, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Switch,
  FormControlLabel, Avatar, Tooltip, Snackbar, Alert,
  Rating, Divider, Select, MenuItem, FormControl, InputLabel,
  CircularProgress,
} from '@mui/material';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import AddIcon             from '@mui/icons-material/Add';
import EditIcon            from '@mui/icons-material/Edit';
import DeleteIcon          from '@mui/icons-material/Delete';
import WebIcon             from '@mui/icons-material/Web';
import StarIcon            from '@mui/icons-material/Star';
import ComputerIcon        from '@mui/icons-material/Computer';
import FunctionsIcon       from '@mui/icons-material/Functions';
import HistoryEduIcon      from '@mui/icons-material/HistoryEdu';
import TranslateIcon       from '@mui/icons-material/Translate';
import AccountBalanceIcon  from '@mui/icons-material/AccountBalance';
import MenuBookIcon        from '@mui/icons-material/MenuBook';
import ScienceIcon         from '@mui/icons-material/Science';
import BrushIcon           from '@mui/icons-material/Brush';
import PsychologyIcon      from '@mui/icons-material/Psychology';
import AutoStoriesIcon     from '@mui/icons-material/AutoStories';
import LaptopIcon          from '@mui/icons-material/Laptop';
import SchoolIcon          from '@mui/icons-material/School';
import LightbulbIcon       from '@mui/icons-material/Lightbulb';
import { formatPrice } from '../../../data/mockData.js';
import PageHeader      from '../../../components/common/PageHeader/index.jsx';
import { useGetCoursesQuery, useActivateCourseMutation } from '../../../features/courses/coursesApi.js';
import { useGetUsersQuery, useSetUserActiveMutation } from '../../../features/users/usersApi.js';
import { getCourseAppearance, COURSE_PALETTE } from '../../../utils/courseAppearance.js';
import {
  selectHomeReviews, selectTeam,
  selectTestSubjects, selectPlans,
  selectCourseCustomizations,
  selectTeachersSection,
  setTeachersSection,
  upsertReview, deleteReview,
  upsertTeamMember, deleteTeamMember,
  upsertTestSubject, deleteTestSubject,
  upsertPlan, deletePlan,
} from '../../../features/content/contentSlice.js';

/* ── helpers ─────────────────────────────────────────────────── */
const uid = () => `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

function ColorDot({ color, size = 16 }) {
  return <Box sx={{ width: size, height: size, borderRadius: '50%', bgcolor: color, flexShrink: 0, border: '2px solid', borderColor: 'divider' }} />;
}

/* ── Generic delete confirm ──────────────────────────────────── */
function DeleteConfirm({ open, label, onClose, onConfirm }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={700}>{t('dialog.deleteTitle')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{t('dialog.deleteText')}</Typography>
        {label && <Typography variant="subtitle2" fontWeight={700} sx={{ mt: 1 }}>{label}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>{t('common.cancel')}</Button>
        <Button onClick={onConfirm} variant="contained" color="error" sx={{ borderRadius: 2 }}>{t('common.delete')}</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 1 — Yo'nalishlar (Courses as cards)
   ═══════════════════════════════════════════════════════════════ */

const SUBJECT_ICON_MAP = {
  math:    FunctionsIcon,
  uzbek:   HistoryEduIcon,
  history: AccountBalanceIcon,
  english: TranslateIcon,
  it:      ComputerIcon,
  russian: MenuBookIcon,
};

const SUBJECT_COLORS = {
  math:    '#1976D2',
  uzbek:   '#10B981',
  history: '#F59E0B',
  english: '#7C3AED',
  it:      '#EC4899',
  russian: '#EF4444',
};

const OTHER_PALETTE = ['#1976D2','#10B981','#F59E0B','#7C3AED','#EC4899','#EF4444','#06B6D4','#D97706'];
const OTHER_ICONS   = [ScienceIcon, BrushIcon, PsychologyIcon, AutoStoriesIcon, LaptopIcon, SchoolIcon, MenuBookIcon, LightbulbIcon];

/* All selectable icons for the edit dialog */
const ICON_OPTIONS = [
  { key: 'science',      Icon: ScienceIcon,        label: 'Fан' },
  { key: 'brush',        Icon: BrushIcon,           label: 'Дизайн' },
  { key: 'psychology',   Icon: PsychologyIcon,      label: 'Психология' },
  { key: 'autoStories',  Icon: AutoStoriesIcon,     label: 'Китоб' },
  { key: 'laptop',       Icon: LaptopIcon,          label: 'Ноутбук' },
  { key: 'school',       Icon: SchoolIcon,          label: 'Мактаб' },
  { key: 'menuBook',     Icon: MenuBookIcon,        label: 'Китоб' },
  { key: 'lightbulb',   Icon: LightbulbIcon,       label: 'Идея' },
  { key: 'functions',    Icon: FunctionsIcon,       label: 'Математика' },
  { key: 'historyEdu',  Icon: HistoryEduIcon,      label: 'Тарих' },
  { key: 'translate',    Icon: TranslateIcon,       label: 'Тил' },
  { key: 'computer',     Icon: ComputerIcon,        label: 'Компютер' },
  { key: 'balance',      Icon: AccountBalanceIcon,  label: 'Тарих' },
];

const ICON_MAP = Object.fromEntries(ICON_OPTIONS.map(({ key, Icon }) => [key, Icon]));

function SubjectsTab({ setSnack }) {
  const customs = useSelector(selectCourseCustomizations);

  const { data: coursesRes, isLoading } = useGetCoursesQuery({ limit: 500, showAll: true });
  const [activateCourse, { isLoading: toggling }] = useActivateCourseMutation();

  const courses     = coursesRes?.data ?? [];
  const activeCount = courses.filter((c) => c.isActive).length;

  const handleToggle = async (course) => {
    try {
      await activateCourse({ id: course._id, isActive: !course.isActive }).unwrap();
      setSnack(course.isActive ? 'Kurs yashirildi' : 'Kurs faollashtirildi');
    } catch {
      setSnack('Xatolik yuz berdi');
    }
  };

  return (
    <>
      {/* Info bar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {isLoading && <CircularProgress size={14} />}
          <Typography variant="caption" color="text.secondary">
            {isLoading ? 'Yuklanmoqda…' : `Jami ${courses.length} ta kurs`}
          </Typography>
        </Stack>
        <Chip
          label={`${activeCount} ta faol`}
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontSize: '0.68rem' }}
        />
      </Stack>

      {/* Cards grid */}
      <Grid container spacing={2}>
        {courses.length === 0 && !isLoading && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>
              Kurslar topilmadi
            </Typography>
          </Grid>
        )}

        {courses.map((course) => {
          const title    = course.title?.ru || course.title?.uz || '—';
          const { color, iconKey } = getCourseAppearance(course, customs);
          const Icon     = (ICON_MAP[iconKey] ?? MenuBookIcon);
          const isActive = Boolean(course.isActive);

          return (
            <Grid item xs={12} sm={6} md={4} key={course._id}>
              <Card elevation={0} sx={{
                border: '1px solid', borderColor: 'divider',
                borderLeft: `4px solid ${isActive ? color : '#CBD5E1'}`,
                borderRadius: 2,
                opacity: isActive ? 1 : 0.55,
                transition: 'opacity .2s, box-shadow .15s',
                '&:hover': { boxShadow: 2, opacity: 1 },
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {/* Icon */}
                    <Box sx={{
                      width: 42, height: 42, borderRadius: '11px', flexShrink: 0,
                      bgcolor: (isActive ? color : '#94A3B8') + '18',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isActive ? color : '#94A3B8',
                    }}>
                      <Icon sx={{ fontSize: 20 }} />
                    </Box>

                    {/* Title */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>{title}</Typography>
                    </Box>

                    {/* Toggle */}
                    <Tooltip title={isActive ? "Yashirish" : "Ko'rsatish"}>
                      <Switch
                        size="small"
                        checked={isActive}
                        onChange={() => handleToggle(course)}
                        disabled={toggling}
                      />
                    </Tooltip>
                  </Stack>

                  {isActive && (
                    <Chip
                      label="Dashboard da ko'rinadi"
                      size="small"
                      sx={{ mt: 1.25, height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: color + '15', color }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 2 — O'quvchilarimiz fikri (Reviews)
   ═══════════════════════════════════════════════════════════════ */
const BLANK_REV = { id: '', name: '', roleUz: '', roleRu: '', textUz: '', textRu: '', rating: 5 };

function ReviewsTab({ setSnack }) {
  const { t }    = useTranslation();
  const dispatch = useDispatch();
  const reviews  = useSelector(selectHomeReviews);
  const [dlg, setDlg] = useState(null);
  const [del, setDel] = useState(null);

  const open  = (item) => setDlg(item ?? { ...BLANK_REV, id: uid() });
  const close = () => setDlg(null);

  const save = () => {
    if (!dlg.name.trim()) return;
    dispatch(upsertReview({ ...dlg, avatar: dlg.name[0]?.toUpperCase() ?? '?' }));
    setSnack(t('content.saved')); close();
  };

  const remove = () => { dispatch(deleteReview(del.id)); setSnack(t('content.deleted')); setDel(null); };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }} onClick={() => open(null)}>
          {t('content.addReview')}
        </Button>
      </Stack>
      <Grid container spacing={2}>
        {reviews.map((r, idx) => {
          const ac = ['#1976D2','#7C3AED','#10B981','#F59E0B','#EF4444','#06B6D4','#EC4899','#3B82F6'][idx % 8];
          return (
            <Grid item xs={12} sm={6} md={4} key={r.id}>
              <Card elevation={0} sx={{
                border: '1px solid', borderColor: 'divider', borderRadius: 3,
                height: '100%', display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.2s, border-color 0.2s',
                '&:hover': { boxShadow: `0 4px 24px ${ac}18`, borderColor: ac + '50' },
              }}>
                <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Header row */}
                  <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
                    <Avatar sx={{
                      bgcolor: ac, fontWeight: 800, flexShrink: 0,
                      width: 44, height: 44, fontSize: '1.05rem',
                      boxShadow: `0 0 0 3px ${ac}28`,
                    }}>
                      {r.avatar ?? r.name?.[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>{r.name}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mb: 0.5 }}>
                        {r.roleUz}
                      </Typography>
                      {/* ── Stars horizontal fix: remove display:block ── */}
                      <Stack direction="row" spacing={0.25} alignItems="center">
                        <Rating value={r.rating} size="small" readOnly
                          sx={{ '& .MuiRating-icon': { fontSize: '1rem' } }} />
                        <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#F59E0B', ml: 0.5 }}>
                          {r.rating}.0
                        </Typography>
                      </Stack>
                    </Box>
                    <Stack direction="row" sx={{ mt: -0.5 }}>
                      <Tooltip title={t('common.edit')}>
                        <IconButton size="small" onClick={() => open(r)}
                          sx={{ color: 'text.secondary', '&:hover': { color: ac, bgcolor: ac + '15' } }}>
                          <EditIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.delete')}>
                        <IconButton size="small" onClick={() => setDel(r)}
                          sx={{ color: 'text.secondary', '&:hover': { color: '#EF4444', bgcolor: '#EF444415' } }}>
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  <Divider sx={{ mb: 1.5, borderColor: ac + '30' }} />

                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, flex: 1, fontStyle: 'italic' }}>
                    "{r.textUz}"
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={Boolean(dlg)} onClose={close} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>{dlg && reviews.find(r => r.id === dlg.id) ? t('common.edit') : t('content.addReview')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label={t('form.name') + ' *'} fullWidth size="small" value={dlg?.name ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, name: e.target.value }))} />
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
                {t('content.rating')}
              </Typography>
              <Rating value={dlg?.rating ?? 5} onChange={(_, v) => setDlg((p) => ({ ...p, rating: v ?? 5 }))} />
            </Box>
            <Divider><Typography variant="caption">Uzbekcha</Typography></Divider>
            <TextField label="Lavozim (UZ)" fullWidth size="small" value={dlg?.roleUz ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, roleUz: e.target.value }))} />
            <TextField label="Sharh matni (UZ)" fullWidth size="small" multiline rows={3} value={dlg?.textUz ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, textUz: e.target.value }))} />
            <Divider><Typography variant="caption">Русский</Typography></Divider>
            <TextField label="Должность (RU)" fullWidth size="small" value={dlg?.roleRu ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, roleRu: e.target.value }))} />
            <TextField label="Текст отзыва (RU)" fullWidth size="small" multiline rows={3} value={dlg?.textRu ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, textRu: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={close} variant="outlined" sx={{ borderRadius: 2 }}>{t('common.cancel')}</Button>
          <Button onClick={save} variant="contained" sx={{ borderRadius: 2 }}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirm open={Boolean(del)} label={del?.name} onClose={() => setDel(null)} onConfirm={remove} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 3 — Rahbariyat (Management Team)
   ═══════════════════════════════════════════════════════════════ */
const BLANK_TEAM = { id: '', name: '', color: '#1976D2', roleUz: '', roleRu: '', bioUz: '', bioRu: '' };

function TeamTab({ setSnack }) {
  const { t }    = useTranslation();
  const dispatch = useDispatch();
  const team     = useSelector(selectTeam);
  const [dlg, setDlg] = useState(null);
  const [del, setDel] = useState(null);

  const open  = (item) => setDlg(item ?? { ...BLANK_TEAM, id: uid() });
  const close = () => setDlg(null);

  const save = () => {
    if (!dlg.name.trim()) return;
    dispatch(upsertTeamMember({ ...dlg, avatar: dlg.name[0]?.toUpperCase() ?? '?' }));
    setSnack(t('content.saved')); close();
  };

  const remove = () => { dispatch(deleteTeamMember(del.id)); setSnack(t('content.deleted')); setDel(null); };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }} onClick={() => open(null)}>
          {t('content.addMember')}
        </Button>
      </Stack>
      <Grid container spacing={2}>
        {team.map((m) => (
          <Grid item xs={12} sm={6} md={4} key={m.id}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Avatar sx={{ bgcolor: m.color, width: 48, height: 48, fontWeight: 700, fontSize: '1.2rem', flexShrink: 0 }}>
                    {m.avatar ?? m.name[0]}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700}>{m.name}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{m.roleUz}</Typography>
                    <Typography variant="caption" color="text.disabled">{m.roleRu}</Typography>
                  </Box>
                  <Stack direction="row">
                    <IconButton size="small" onClick={() => open(m)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDel(m)}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.6 }}>
                  {m.bioUz}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={Boolean(dlg)} onClose={close} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>{dlg && team.find(m => m.id === dlg.id) ? t('common.edit') : t('content.addMember')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label={t('form.name') + ' *'} fullWidth size="small" value={dlg?.name ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, name: e.target.value }))} />
            <TextField label={t('content.colorHex')} fullWidth size="small" value={dlg?.color ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, color: e.target.value }))}
              InputProps={{ startAdornment: <ColorDot color={dlg?.color ?? '#ccc'} size={20} /> }} />
            <Divider><Typography variant="caption">Uzbekcha</Typography></Divider>
            <TextField label="Lavozim (UZ)" fullWidth size="small" value={dlg?.roleUz ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, roleUz: e.target.value }))} />
            <TextField label="Bio (UZ)" fullWidth size="small" multiline rows={2} value={dlg?.bioUz ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, bioUz: e.target.value }))} />
            <Divider><Typography variant="caption">Русский</Typography></Divider>
            <TextField label="Должность (RU)" fullWidth size="small" value={dlg?.roleRu ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, roleRu: e.target.value }))} />
            <TextField label="Bio (RU)" fullWidth size="small" multiline rows={2} value={dlg?.bioRu ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, bioRu: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={close} variant="outlined" sx={{ borderRadius: 2 }}>{t('common.cancel')}</Button>
          <Button onClick={save} variant="contained" sx={{ borderRadius: 2 }}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirm open={Boolean(del)} label={del?.name} onClose={() => setDel(null)} onConfirm={remove} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 4 — Onlayn testlar
   ═══════════════════════════════════════════════════════════════ */
const BLANK_TEST = { id: '', labelUz: '', labelRu: '', color: '#1976D2', questions: 10, minutes: 10 };

function TestsTab({ setSnack }) {
  const { t }    = useTranslation();
  const dispatch = useDispatch();
  const subs     = useSelector(selectTestSubjects);
  const [dlg, setDlg] = useState(null);
  const [del, setDel] = useState(null);

  const open  = (item) => setDlg(item ?? { ...BLANK_TEST, id: uid() });
  const close = () => setDlg(null);

  const save = () => {
    if (!dlg.labelUz.trim()) return;
    dispatch(upsertTestSubject(dlg));
    setSnack(t('content.saved')); close();
  };

  const remove = () => { dispatch(deleteTestSubject(del.id)); setSnack(t('content.deleted')); setDel(null); };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }} onClick={() => open(null)}>
          {t('content.addTestSubject')}
        </Button>
      </Stack>
      <Grid container spacing={2}>
        {subs.map((s) => (
          <Grid item xs={12} sm={6} md={4} key={s.id}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <ColorDot color={s.color} size={20} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>{s.labelUz}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>{s.labelRu}</Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                      <Chip label={`${s.questions} savol`} size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                      <Chip label={`${s.minutes} min`}     size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                    </Stack>
                  </Box>
                  <Stack direction="row">
                    <IconButton size="small" onClick={() => open(s)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDel(s)}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={Boolean(dlg)} onClose={close} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>{dlg && subs.find(s => s.id === dlg.id) ? t('common.edit') : t('content.addTestSubject')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Fan nomi (UZ) *" fullWidth size="small" value={dlg?.labelUz ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, labelUz: e.target.value }))} />
            <TextField label="Название (RU)" fullWidth size="small" value={dlg?.labelRu ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, labelRu: e.target.value }))} />
            <TextField label={t('content.colorHex')} fullWidth size="small" value={dlg?.color ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, color: e.target.value }))}
              InputProps={{ startAdornment: <ColorDot color={dlg?.color ?? '#ccc'} size={20} /> }} />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Savollar soni" type="number" fullWidth size="small" value={dlg?.questions ?? 10}
                  onChange={(e) => setDlg((p) => ({ ...p, questions: Number(e.target.value) }))} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Vaqt (min)" type="number" fullWidth size="small" value={dlg?.minutes ?? 10}
                  onChange={(e) => setDlg((p) => ({ ...p, minutes: Number(e.target.value) }))} />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={close} variant="outlined" sx={{ borderRadius: 2 }}>{t('common.cancel')}</Button>
          <Button onClick={save} variant="contained" sx={{ borderRadius: 2 }}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirm open={Boolean(del)} label={del?.labelUz} onClose={() => setDel(null)} onConfirm={remove} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 5 — Tariflar (Plans)
   ═══════════════════════════════════════════════════════════════ */
const BLANK_PLAN = { id: '', nameUz: '', nameRu: '', descUz: '', descRu: '', price: 0, color: '#1976D2', popular: false, featuresUz: '', featuresRu: '' };

function PlansTab({ setSnack }) {
  const { t }    = useTranslation();
  const dispatch = useDispatch();
  const plans    = useSelector(selectPlans);
  const [dlg, setDlg] = useState(null);
  const [del, setDel] = useState(null);

  const open  = (item) => setDlg(item ?? { ...BLANK_PLAN, id: uid() });
  const close = () => setDlg(null);

  const save = () => {
    if (!dlg.nameUz.trim()) return;
    dispatch(upsertPlan(dlg));
    setSnack(t('content.saved')); close();
  };

  const remove = () => { dispatch(deletePlan(del.id)); setSnack(t('content.deleted')); setDel(null); };

  return (
    <>
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }} onClick={() => open(null)}>
          {t('content.addPlan')}
        </Button>
      </Stack>
      <Grid container spacing={2}>
        {plans.map((p) => (
          <Grid item xs={12} sm={6} md={4} key={p.id}>
            <Card elevation={0} sx={{ border: '2px solid', borderColor: p.popular ? p.color : 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <ColorDot color={p.color} size={12} />
                      <Typography variant="subtitle1" fontWeight={800}>{p.nameUz}</Typography>
                      {p.popular && <Chip label="Popular" size="small" sx={{ bgcolor: p.color, color: '#fff', fontSize: '0.65rem', height: 18 }} />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary">{p.descUz}</Typography>
                    <Typography variant="h6" fontWeight={800} color={p.color} sx={{ mt: 1 }}>
                      {formatPrice(p.price)} <Typography component="span" variant="caption" color="text.secondary">сум/мес</Typography>
                    </Typography>
                  </Box>
                  <Stack direction="row">
                    <IconButton size="small" onClick={() => open(p)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => setDel(p)}><DeleteIcon fontSize="small" /></IconButton>
                  </Stack>
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.7 }}>
                  {p.featuresUz}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={Boolean(dlg)} onClose={close} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={700}>{dlg && plans.find(x => x.id === dlg.id) ? t('common.edit') : t('content.addPlan')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <TextField label="Nomi (UZ) *" fullWidth size="small" value={dlg?.nameUz ?? ''}
                  onChange={(e) => setDlg((p) => ({ ...p, nameUz: e.target.value }))} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Название (RU)" fullWidth size="small" value={dlg?.nameRu ?? ''}
                  onChange={(e) => setDlg((p) => ({ ...p, nameRu: e.target.value }))} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Narxi (so'm/oy)" type="number" fullWidth size="small" value={dlg?.price ?? ''}
                  onChange={(e) => setDlg((p) => ({ ...p, price: Number(e.target.value) }))} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label={t('content.colorHex')} fullWidth size="small" value={dlg?.color ?? ''}
                  onChange={(e) => setDlg((p) => ({ ...p, color: e.target.value }))}
                  InputProps={{ startAdornment: <ColorDot color={dlg?.color ?? '#ccc'} size={20} /> }} />
              </Grid>
            </Grid>
            <FormControlLabel
              control={<Switch checked={dlg?.popular ?? false} onChange={(e) => setDlg((p) => ({ ...p, popular: e.target.checked }))} />}
              label={<Typography variant="body2">{t('page.pricing.popular')}</Typography>}
            />
            <Divider><Typography variant="caption">Uzbekcha</Typography></Divider>
            <TextField label="Tavsif (UZ)" fullWidth size="small" value={dlg?.descUz ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, descUz: e.target.value }))} />
            <TextField label="Xususiyatlar (UZ) — har bir qator alohida imkoniyat"
              fullWidth size="small" multiline rows={5} value={dlg?.featuresUz ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, featuresUz: e.target.value }))}
              placeholder={"Video darslar\nTestlar\nSertifikat"} />
            <Divider><Typography variant="caption">Русский</Typography></Divider>
            <TextField label="Описание (RU)" fullWidth size="small" value={dlg?.descRu ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, descRu: e.target.value }))} />
            <TextField label="Возможности (RU) — каждая строка = пункт"
              fullWidth size="small" multiline rows={5} value={dlg?.featuresRu ?? ''}
              onChange={(e) => setDlg((p) => ({ ...p, featuresRu: e.target.value }))}
              placeholder={"Видеоуроки\nТесты\nСертификат"} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={close} variant="outlined" sx={{ borderRadius: 2 }}>{t('common.cancel')}</Button>
          <Button onClick={save} variant="contained" sx={{ borderRadius: 2 }}>{t('common.save')}</Button>
        </DialogActions>
      </Dialog>

      <DeleteConfirm open={Boolean(del)} label={del?.nameUz} onClose={() => setDel(null)} onConfirm={remove} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TAB 6 — Teachers section settings
   ═══════════════════════════════════════════════════════════════ */
const TEACHER_PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

function TeachersSettingsTab({ setSnack }) {
  const dispatch = useDispatch();
  const section  = useSelector(selectTeachersSection);
  const { data: teachersData, isLoading } = useGetUsersQuery({ role: 'teacher', limit: 100 });
  const [setUserActive, { isLoading: toggling }] = useSetUserActiveMutation();
  const teachers = teachersData?.data ?? [];

  const handleToggle = async (teacher) => {
    try {
      await setUserActive({ id: teacher._id, isActive: !teacher.isActive }).unwrap();
      setSnack(teacher.isActive ? "O'qituvchi yashirildi" : "O'qituvchi faollashtirildi");
    } catch {
      setSnack('Xatolik yuz berdi');
    }
  };

  const activeCount = teachers.filter((t) => t.isActive !== false).length;

  return (
    <>
      {/* Info bar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {isLoading && <CircularProgress size={14} />}
          <Typography variant="caption" color="text.secondary">
            {isLoading ? 'Yuklanmoqda…' : `Jami ${teachers.length} ta o'qituvchi`}
          </Typography>
        </Stack>

        {/* Compact limit selector: 3 – 6 */}
        <Stack direction="row" spacing={0.75} alignItems="center">
          <Typography variant="caption" color="text.secondary">Ko'rsatish:</Typography>
          {[3, 6].map((n) => (
            <Box
              key={n}
              onClick={() => { dispatch(setTeachersSection({ ...section, limit: n })); setSnack('Saqlandi'); }}
              sx={{
                width: 28, height: 28, borderRadius: '8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.75rem',
                bgcolor: section.limit === n ? 'primary.main' : 'action.hover',
                color:   section.limit === n ? '#fff' : 'text.secondary',
                border: '1.5px solid',
                borderColor: section.limit === n ? 'primary.main' : 'divider',
                transition: 'all 0.15s',
                '&:hover': { borderColor: 'primary.main', color: 'primary.main', bgcolor: 'primary.main' + '12' },
              }}
            >
              {n}
            </Box>
          ))}
        </Stack>
      </Stack>

      {/* Teacher cards — same pattern as SubjectsTab */}
      <Grid container spacing={2}>
        {teachers.length === 0 && !isLoading && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', py: 4 }}>
              O'qituvchilar topilmadi
            </Typography>
          </Grid>
        )}

        {teachers.map((teacher, idx) => {
          const name     = teacher.nameUz || teacher.name || '—';
          const color    = teacher.color || TEACHER_PALETTE[idx % TEACHER_PALETTE.length];
          const initial  = name[0]?.toUpperCase() ?? '?';
          const isActive = teacher.isActive !== false;

          return (
            <Grid item xs={12} sm={6} md={4} key={teacher._id}>
              <Card elevation={0} sx={{
                border: '1px solid', borderColor: 'divider',
                borderLeft: `4px solid ${isActive ? color : '#CBD5E1'}`,
                borderRadius: 2,
                opacity: isActive ? 1 : 0.55,
                transition: 'opacity .2s, box-shadow .15s',
                '&:hover': { boxShadow: 2, opacity: 1 },
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {/* Colored avatar */}
                    <Avatar sx={{
                      width: 42, height: 42, flexShrink: 0,
                      bgcolor: (isActive ? color : '#94A3B8') + '18',
                      color: isActive ? color : '#94A3B8',
                      fontWeight: 800, fontSize: '1rem',
                      border: `1.5px solid ${isActive ? color : '#CBD5E1'}28`,
                    }}>
                      {initial}
                    </Avatar>

                    {/* Name + subject */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>{name}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {teacher.subject || teacher.nameRu || '—'}
                      </Typography>
                    </Box>

                    {/* Toggle — exactly like courses */}
                    <Tooltip title={isActive ? "Yashirish" : "Ko'rsatish"}>
                      <Switch
                        size="small"
                        checked={isActive}
                        onChange={() => handleToggle(teacher)}
                        disabled={toggling}
                      />
                    </Tooltip>
                  </Stack>

                  {isActive && (
                    <Chip
                      label="Bosh sahifada ko'rinadi"
                      size="small"
                      sx={{ mt: 1.25, height: 18, fontSize: '0.6rem', fontWeight: 700, bgcolor: color + '15', color }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
const TAB_LABELS = [
  'content.tabSubjects', 'content.tabReviews', 'content.tabTeam',
  'content.tabTests', 'content.tabPlans', 'content.tabTeachers',
];

export default function AdminContent() {
  const { t }  = useTranslation();
  const [tab,  setTab]  = useState(0);
  const [snack, setSnack] = useState('');

  const TABS = [
    <SubjectsTab         setSnack={setSnack} />,
    <ReviewsTab          setSnack={setSnack} />,
    <TeamTab             setSnack={setSnack} />,
    <TestsTab            setSnack={setSnack} />,
    <PlansTab            setSnack={setSnack} />,
    <TeachersSettingsTab setSnack={setSnack} />,
  ];

  return (
    <Box>
      <PageHeader icon={<WebIcon />} title={t('content.title')} />

      <Snackbar open={Boolean(snack)} autoHideDuration={3000} onClose={() => setSnack('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack('')} sx={{ borderRadius: 2 }}>{snack}</Alert>
      </Snackbar>

      {/* Responsive tabs — scrollable on mobile */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {TAB_LABELS.map((k) => (
            <Tab key={k} label={t(k)} sx={{ fontWeight: 600, fontSize: { xs: '0.75rem', sm: '0.875rem' } }} />
          ))}
        </Tabs>
      </Box>

      {TABS[tab]}
    </Box>
  );
}
