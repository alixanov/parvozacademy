import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip,
  Button, IconButton, Tooltip, Avatar, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem,
  InputAdornment, Snackbar, Alert, DialogContentText,
  CircularProgress, Checkbox, Divider,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation }  from 'react-i18next';
import { Link as RouterLink } from 'react-router-dom';
import AddIcon             from '@mui/icons-material/Add';
import EditIcon            from '@mui/icons-material/Edit';
import DeleteIcon          from '@mui/icons-material/Delete';
import MenuBookIcon        from '@mui/icons-material/MenuBook';
import SearchIcon          from '@mui/icons-material/Search';
import CloseIcon           from '@mui/icons-material/Close';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import CheckCircleIcon     from '@mui/icons-material/CheckCircle';
import CancelIcon          from '@mui/icons-material/Cancel';
import LocalOfferIcon      from '@mui/icons-material/LocalOffer';
import FunctionsIcon       from '@mui/icons-material/Functions';
import HistoryEduIcon      from '@mui/icons-material/HistoryEdu';
import AccountBalanceIcon  from '@mui/icons-material/AccountBalance';
import TranslateIcon       from '@mui/icons-material/Translate';
import ComputerIcon        from '@mui/icons-material/Computer';
import LaptopIcon          from '@mui/icons-material/Laptop';
import ScienceIcon         from '@mui/icons-material/Science';
import BrushIcon           from '@mui/icons-material/Brush';
import PsychologyIcon      from '@mui/icons-material/Psychology';
import AutoStoriesIcon     from '@mui/icons-material/AutoStories';
import SchoolIcon          from '@mui/icons-material/School';
import LightbulbIcon       from '@mui/icons-material/Lightbulb';
import { formatPrice }     from '../../../data/mockData.js';
import { motion }          from 'framer-motion';
import PageHeader          from '../../../components/common/PageHeader/index.jsx';
import {
  useGetCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useActivateCourseMutation,
} from '../../../features/courses/coursesApi.js';
import { useGetUsersQuery }           from '../../../features/users/usersApi.js';
import { useGetTariffPlansQuery }     from '../../../features/tariffs/tariffsApi.js';
import { useGetAllPackagesAdminQuery, useSetPackageStatusMutation } from '../../../features/packages/packagesApi.js';
import InventoryIcon from '@mui/icons-material/Inventory';
import {
  setCourseCustomization,
  selectCourseCustomizations,
} from '../../../features/content/contentSlice.js';
import i18n from '../../../utils/i18n.js';

/* ─── Константы ──────────────────────────────────────────────── */
const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

const COLOR_OPTIONS = ['#1976D2','#10B981','#F59E0B','#7C3AED','#EC4899','#EF4444','#06B6D4','#D97706','#3B82F6','#64748B'];

const ICON_OPTIONS = [
  { key: 'functions',   Icon: FunctionsIcon },
  { key: 'translate',   Icon: TranslateIcon },
  { key: 'computer',    Icon: ComputerIcon },
  { key: 'balance',     Icon: AccountBalanceIcon },
  { key: 'historyEdu',  Icon: HistoryEduIcon },
  { key: 'science',     Icon: ScienceIcon },
  { key: 'brush',       Icon: BrushIcon },
  { key: 'psychology',  Icon: PsychologyIcon },
  { key: 'autoStories', Icon: AutoStoriesIcon },
  { key: 'laptop',      Icon: LaptopIcon },
  { key: 'school',      Icon: SchoolIcon },
  { key: 'menuBook',    Icon: MenuBookIcon },
  { key: 'lightbulb',   Icon: LightbulbIcon },
];

const BLANK_TARIFFS = {
  online:              { checked: false, price: '' },
  offline:             { checked: false, price: '' },
  individual_offline:  { checked: false, price: '' },
  individual_online:   { checked: false, price: '' },
};

const SUBJECT_OPTIONS = [
  { value: 'math',    labelUz: 'Matematika',      labelRu: 'Математика' },
  { value: 'english', labelUz: 'Ingliz tili',     labelRu: 'Английский язык' },
  { value: 'uzbek',   labelUz: "Ona tili",        labelRu: 'Родной язык' },
  { value: 'history', labelUz: 'Tarix',           labelRu: 'История' },
  { value: 'it',      labelUz: 'IT / Dasturlash', labelRu: 'IT / Программирование' },
  { value: 'other',   labelUz: 'Boshqa',          labelRu: 'Другое' },
];

const BLANK = {
  titleUz:        '',
  titleRu:        '',
  subject:        'other',
  colorKey:       '#1976D2',
  iconKey:        'menuBook',
  teacherId:      '',
  duration:       3,
  selectedTariffs: { ...BLANK_TARIFFS },
  descriptionUz:  '',
  descriptionRu:  '',
};

/* ─── Диалог создания / редактирования ───────────────────────── */
function CourseDialog({ open, initial, onClose, onSave, loading, apiError, teachers, tariffPlans }) {
  const { t }  = useTranslation();
  const isNew  = !initial;
  const [form, setForm] = useState(BLANK);
  const [err,  setErr]  = useState({});

  useEffect(() => {
    if (open) {
      setForm(initial ?? BLANK);
      setErr({});
    }
  }, [open, initial]);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  /* Тарифы */
  const toggleTariff = (key, plan) => setForm(p => {
    const cur = p.selectedTariffs[key];
    return {
      ...p,
      selectedTariffs: {
        ...p.selectedTariffs,
        [key]: {
          checked: !cur.checked,
          price:   !cur.checked ? String(plan?.defaultPrice ?? '') : cur.price,
        },
      },
    };
  });

  const setTariffPrice = (key) => (e) => setForm(p => ({
    ...p,
    selectedTariffs: {
      ...p.selectedTariffs,
      [key]: { ...p.selectedTariffs[key], price: e.target.value },
    },
  }));

  const validate = () => {
    const e = {};
    if (!form.titleUz.trim()) e.titleUz   = "O'zbek nomini kiriting";
    if (!form.titleRu.trim()) e.titleRu   = 'Введите название на русском';
    if (!form.teacherId)      e.teacherId = "O'qituvchi tanlanishi shart";
    const hasSelected = Object.values(form.selectedTariffs).some(t => t.checked && Number(t.price) > 0);
    if (!hasSelected) e.tariffs = 'Kamida bitta tarif tanlanishi shart';
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => { if (validate()) onSave(form); };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
        {isNew ? t('dialog.addCourse') : t('dialog.editCourse')}
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}
        <Grid container spacing={2} sx={{ pt: 0.5 }}>

          {/* Название UZ */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fan nomi (UZ) *" placeholder="Masalan: Matematika DTM..."
              fullWidth size="small" autoFocus
              value={form.titleUz} onChange={set('titleUz')}
              error={!!err.titleUz} helperText={err.titleUz}
            />
          </Grid>

          {/* Название RU */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Название (RU) *" placeholder="Например: Математика ЕГЭ..."
              fullWidth size="small"
              value={form.titleRu} onChange={set('titleRu')}
              error={!!err.titleRu} helperText={err.titleRu}
            />
          </Grid>

          {/* Предмет */}
          <Grid item xs={12} sm={6}>
            <TextField select label="Fan (predmet) *" fullWidth size="small"
              value={form.subject} onChange={set('subject')}>
              {SUBJECT_OPTIONS.map(s => (
                <MenuItem key={s.value} value={s.value}>
                  {s.labelUz} / {s.labelRu}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Цвет */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.75, display: 'block' }}>
                Rang (color)
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {COLOR_OPTIONS.map((c) => (
                  <Box key={c} onClick={() => setForm(p => ({ ...p, colorKey: c }))}
                    sx={{
                      width: 26, height: 26, borderRadius: '7px', bgcolor: c, cursor: 'pointer',
                      border: form.colorKey === c ? '2.5px solid white' : '2px solid transparent',
                      boxShadow: form.colorKey === c ? `0 0 0 2px ${c}` : 'none',
                      transition: 'all .15s',
                      '&:hover': { transform: 'scale(1.18)' },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>

          {/* Иконка */}
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.75, display: 'block' }}>
              Ikonka (icon)
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {ICON_OPTIONS.map(({ key, Icon }) => (
                <Box key={key} onClick={() => setForm(p => ({ ...p, iconKey: key }))}
                  sx={{
                    width: 36, height: 36, borderRadius: '10px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: form.iconKey === key ? form.colorKey + '22' : 'action.hover',
                    border: '1.5px solid',
                    borderColor: form.iconKey === key ? form.colorKey : 'transparent',
                    transition: 'all .15s',
                    '&:hover': { borderColor: form.colorKey + '88', transform: 'scale(1.08)' },
                  }}>
                  <Icon sx={{ fontSize: 18, color: form.iconKey === key ? form.colorKey : 'text.secondary' }} />
                </Box>
              ))}
            </Stack>
          </Grid>

          {/* Преподаватель */}
          <Grid item xs={12} sm={6}>
            <TextField select label={`${t('form.teacher')} *`} fullWidth size="small"
              value={form.teacherId} onChange={set('teacherId')}
              error={!!err.teacherId} helperText={err.teacherId}>
              {teachers.length === 0
                ? <MenuItem disabled>O'qituvchilar topilmadi</MenuItem>
                : teachers.map(tp => <MenuItem key={tp._id} value={tp._id}>{tp.name}</MenuItem>)
              }
            </TextField>
          </Grid>

          {/* Длительность */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Davomiylik (oy) *" fullWidth size="small" type="number"
              inputProps={{ min: 1, max: 24 }}
              value={form.duration} onChange={set('duration')}
              helperText={`≈ ${Math.round(Number(form.duration) * 15)} ta dars (oyiga 15)`}
            />
          </Grid>

          {/* ── Тарифы ─────────────────────────────────────────── */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight={700}
              color={err.tariffs ? 'error.main' : 'text.primary'} sx={{ mb: 1 }}>
              Тарифы * &nbsp;
              <Typography component="span" variant="caption" color="text.secondary" fontWeight={400}>
                (выберите и укажите цену)
              </Typography>
            </Typography>
            {err.tariffs && (
              <Typography variant="caption" color="error" sx={{ mb: 1, display: 'block' }}>
                {err.tariffs}
              </Typography>
            )}

            {tariffPlans.map((plan) => {
              const sel = form.selectedTariffs[plan.key];
              if (!sel) return null;
              return (
                <Card key={plan.key} elevation={0} sx={{
                  mb: 1, border: '1.5px solid',
                  borderColor: sel.checked ? plan.color : 'divider',
                  borderRadius: 2,
                  transition: 'border-color .2s',
                }}>
                  <CardContent sx={{ p: '10px 14px !important' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Checkbox
                        size="small"
                        checked={sel.checked}
                        onChange={() => toggleTariff(plan.key, plan)}
                        sx={{ p: 0.5, color: plan.color, '&.Mui-checked': { color: plan.color } }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={700}>{plan.name?.ru}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {plan.name?.uz} · база: {formatPrice(plan.defaultPrice)} so'm
                        </Typography>
                      </Box>
                      {sel.checked && (
                        <TextField
                          size="small" label="Нарх" type="number"
                          sx={{ width: 160 }}
                          InputProps={{ startAdornment: <InputAdornment position="start">UZS</InputAdornment> }}
                          value={sel.price}
                          onChange={setTariffPrice(plan.key)}
                          onClick={e => e.stopPropagation()}
                        />
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Grid>

          {/* Описание UZ */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Tavsif (UZ)" fullWidth size="small" multiline rows={3}
              placeholder="Fan haqida qisqacha ma'lumot..."
              value={form.descriptionUz} onChange={set('descriptionUz')}
            />
          </Grid>

          {/* Описание RU */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Описание (RU)" fullWidth size="small" multiline rows={3}
              placeholder="Краткое описание предмета..."
              value={form.descriptionRu} onChange={set('descriptionRu')}
            />
          </Grid>

        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>{t('common.cancel')}</Button>
        <Button onClick={handleSave} variant="contained" sx={{ borderRadius: 2 }} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}>
          {isNew ? t('common.add') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─── Главный компонент ──────────────────────────────────────── */
export default function AdminCourses() {
  const { t }    = useTranslation();
  const dispatch = useDispatch();
  const courseCustoms = useSelector(selectCourseCustomizations);

  /* API */
  const { data: coursesData, isLoading: loadingCourses, refetch } = useGetCoursesQuery(
    { limit: 200, showAll: true },
    { refetchOnMountOrArgChange: true },
  );
  const courses = coursesData?.data ?? [];

  const { data: teachersData }    = useGetUsersQuery({ role: 'teacher', limit: 100 });
  const teachers = teachersData?.data ?? [];

  const { data: tariffPlansData } = useGetTariffPlansQuery();
  const tariffPlans = Array.isArray(tariffPlansData?.data) ? tariffPlansData.data : [];

  const { data: pkgsData } = useGetAllPackagesAdminQuery({ limit: 100 });
  const packages = pkgsData?.data ?? [];

  const [createCourse, { isLoading: creating, error: createErr }] = useCreateCourseMutation();
  const [updateCourse, { isLoading: updating, error: updateErr }] = useUpdateCourseMutation();
  const [deleteCourse, { isLoading: deleting }]                   = useDeleteCourseMutation();
  const [activateCourse]                                          = useActivateCourseMutation();
  const [setPackageStatus]                                        = useSetPackageStatusMutation();

  /* UI state */
  const [search,    setSearch]    = useState('');
  const [dialog,    setDialog]    = useState({ open: false, course: null });
  const [delDialog, setDelDialog] = useState({ open: false, course: null });
  const [snack,     setSnack]     = useState('');

  const apiErrMsg = (e) => e?.data?.message || e?.data?.error || '';

  /* Filter */
  const filtered = courses.filter((c) => {
    const title = c.title?.uz ?? c.title?.ru ?? '';
    const tname = c.teacher?.name ?? '';
    const q     = search.toLowerCase();
    return title.toLowerCase().includes(q) || tname.toLowerCase().includes(q);
  });

  /* Helpers */
  const buildSelectedTariffs = (courseTariffs) => {
    const sel = {
      online:             { checked: false, price: '' },
      offline:            { checked: false, price: '' },
      individual_offline: { checked: false, price: '' },
      individual_online:  { checked: false, price: '' },
    };
    courseTariffs?.forEach(t => {
      const key = t.key ?? Object.keys(sel).find(k =>
        tariffPlans.find(p => p.key === k && p.name?.ru === t.name)
      );
      if (key && sel[key] !== undefined) {
        sel[key] = { checked: true, price: String(t.price) };
      }
    });
    return sel;
  };

  const openAdd  = () => setDialog({ open: true, course: null });
  const openEdit = (c) => {
    // Priority: MongoDB field → Redux cache → default
    const custom = courseCustoms[c._id];
    setDialog({
      open: true,
      course: {
        id:              c._id,
        titleUz:         c.title?.uz ?? '',
        titleRu:         c.title?.ru ?? '',
        subject:         c.subject ?? 'other',
        colorKey:        c.color   || custom?.color   || '#1976D2',
        iconKey:         c.iconKey || custom?.iconKey || 'menuBook',
        teacherId:       c.teacher?._id ?? c.teacher ?? '',
        duration:        c.duration ?? 3,
        selectedTariffs: buildSelectedTariffs(c.tariffs),
        descriptionUz:   c.description?.uz ?? '',
        descriptionRu:   c.description?.ru ?? '',
      },
    });
  };
  const closeDialog = () => setDialog({ open: false, course: null });

  /* Save */
  const handleSave = async (form) => {
    const validTariffs = Object.entries(form.selectedTariffs)
      .filter(([_, v]) => v.checked && Number(v.price) > 0)
      .map(([key, v]) => {
        const plan = tariffPlans.find(p => p.key === key);
        return { key, name: plan?.name?.ru ?? key, price: Number(v.price), currency: 'UZS' };
      });

    const minPrice = validTariffs.length > 0
      ? Math.min(...validTariffs.map(t => t.price))
      : 0;

    const body = {
      title:       { uz: form.titleUz.trim(), ru: form.titleRu.trim() },
      subject:     form.subject || 'other',
      color:       form.colorKey || '#1976D2',
      iconKey:     form.iconKey  || 'menuBook',
      level:       'beginner',
      teacher:     form.teacherId,
      duration:    Number(form.duration) || 1,
      tariffs:     validTariffs,
      price:       { amount: minPrice, currency: 'UZS' },
      description: { uz: form.descriptionUz.trim(), ru: form.descriptionRu.trim() },
      isPublished: true,
    };

    try {
      const color   = form.colorKey || '#1976D2';
      const iconKey = form.iconKey  || 'menuBook';
      if (dialog.course?.id) {
        await updateCourse({ id: dialog.course.id, ...body }).unwrap();
        // Sync Redux cache so UI updates instantly (before refetch)
        dispatch(setCourseCustomization({ id: dialog.course.id, iconKey, color }));
        setSnack(t('courses.snackEdited'));
      } else {
        const result = await createCourse(body).unwrap();
        const newId  = result?.data?._id ?? result?._id;
        if (newId) {
          dispatch(setCourseCustomization({ id: newId, iconKey, color }));
        }
        setSnack(t('courses.snackAdded'));
      }
      closeDialog();
      refetch();
    } catch (e) { console.error('handleSave error:', e); }
  };

  /* Delete */
  const handleDelete = async () => {
    try {
      await deleteCourse(delDialog.course._id).unwrap();
      setSnack(t('courses.snackDeleted'));
      setDelDialog({ open: false, course: null });
    } catch { setDelDialog({ open: false, course: null }); }
  };

  /* Active toggle */
  const handleToggleActive = async (c) => {
    try {
      await activateCourse({ id: c._id, isActive: !c.isActive }).unwrap();
      setSnack(c.isActive ? "Fan o'chirildi" : 'Fan faollashtirildi ✓');
      refetch();
    } catch (e) { console.error(e); }
  };

  /* Stats */
  const totalStudents = courses.reduce((a, c) => a + (c.totalStudents || 0), 0);
  const activeCnt     = courses.filter(c => c.isActive).length;
  const inactiveCnt   = courses.length - activeCnt;

  return (
    <Box>
      <PageHeader
        icon={<MenuBookIcon />}
        title={t('courses.management')}
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              component={RouterLink} to="/admin/tariffs"
              variant="outlined" startIcon={<LocalOfferIcon />} sx={{ borderRadius: 2 }}
            >
              {t('admin.tariffs')}
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }} onClick={openAdd}>
              {t('courses.newCourse')}
            </Button>
          </Stack>
        }
      />

      {/* Snackbar */}
      <Snackbar open={Boolean(snack)} autoHideDuration={3500} onClose={() => setSnack('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack('')} sx={{ borderRadius: 2 }}>{snack}</Alert>
      </Snackbar>

      {/* KPI */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Jami fanlar',                value: courses.length + packages.length, color: '#1976D2' },
          { label: 'Faol fanlar',                value: activeCnt,      color: '#10B981' },
          { label: 'Noaktiv fanlar',             value: inactiveCnt,    color: '#EF4444' },
          { label: t('dashboard.totalStudents'), value: totalStudents,  color: '#F59E0B' },
        ].map((s, i) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, textAlign: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={800} color={s.color} lineHeight={1.2}>
                    {loadingCourses ? <CircularProgress size={14} /> : s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.62rem', mt: 0.15 }}>{s.label}</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Search */}
      <TextField size="small" placeholder={t('common.search', { defaultValue: 'Qidiruv...' })}
        value={search} onChange={(e) => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        sx={{ mb: 2, width: { xs: '100%', sm: 380 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
      />

      {/* Courses — card grid */}
      {loadingCourses && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!loadingCourses && filtered.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <MenuBookIcon sx={{ fontSize: 56, color: 'text.disabled', opacity: 0.3, mb: 1 }} />
          <Typography color="text.secondary">{t('common.noData')}</Typography>
        </Box>
      )}

      <Grid container spacing={2.5}>
        {filtered.map((c, idx) => {
          const color       = c.color || PALETTE[idx % PALETTE.length];
          const lang        = i18n.language === 'ru' ? 'ru' : 'uz';
          const titleText   = c.title?.[lang] ?? c.title?.uz ?? c.title?.ru ?? '—';
          const teacherName = c.teacher?.name ?? '—';
          const students    = c.totalStudents ?? 0;
          const activeTariffs = (c.tariffs ?? []).filter(t => t.price > 0);

          return (
            <Grid item xs={12} sm={6} md={4} key={c._id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.22 }}
                style={{ height: '100%' }}
              >
                <Card elevation={0} sx={{
                  height: '100%', display: 'flex', flexDirection: 'column',
                  border: '1.5px solid',
                  borderColor: c.isActive ? color + '40' : 'divider',
                  borderRadius: 3,
                  opacity: c.isActive ? 1 : 0.65,
                  transition: 'box-shadow .2s, border-color .2s',
                  '&:hover': { boxShadow: `0 4px 20px ${color}22`, borderColor: color + '80' },
                }}>
                  {/* Top colour bar */}
                  <Box sx={{ height: 5, borderRadius: '12px 12px 0 0',
                    background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)` }} />

                  <CardContent sx={{ flex: 1, p: 2.5 }}>
                    {/* Header row */}
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.5}>
                      <Avatar sx={{ width: 44, height: 44, bgcolor: color + '18', color,
                        fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>
                        {titleText[0]?.toUpperCase() ?? '?'}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography fontWeight={800} fontSize="0.9rem"
                          sx={{ lineHeight: 1.3, mb: 0.25,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {titleText}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">{teacherName}</Typography>
                      </Box>
                    </Stack>

                    {/* Students bar */}
                    <Box sx={{ mb: 1.75 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="caption" color="text.secondary">O'quvchilar</Typography>
                        <Typography variant="caption" fontWeight={700} color={color}>{students}</Typography>
                      </Stack>
                      <LinearProgress variant="determinate"
                        value={Math.min(100, Math.round((students / 100) * 100))}
                        sx={{ height: 5, borderRadius: 3,
                          bgcolor: color + '16',
                          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }}
                      />
                    </Box>

                    {/* Tariffs */}
                    {activeTariffs.length > 0 && (
                      <>
                        <Divider sx={{ mb: 1.25 }} />
                        <Stack direction="row" flexWrap="wrap" gap={0.6}>
                          {activeTariffs.map((tar) => (
                            <Chip key={tar.key ?? tar.name} label={`${tar.name} · ${formatPrice(tar.price)}`}
                              size="small" sx={{
                                bgcolor: color + '12', color,
                                fontWeight: 600, fontSize: '0.65rem', height: 20, borderRadius: 1,
                              }} />
                          ))}
                        </Stack>
                      </>
                    )}
                  </CardContent>

                  {/* Footer */}
                  <Box sx={{ px: 2.5, pb: 2, pt: 0 }}>
                    <Divider sx={{ mb: 1.5 }} />
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      {/* Status toggle */}
                      <Tooltip title={c.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}>
                        <Box onClick={() => handleToggleActive(c)} sx={{
                          display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
                        }}>
                          <Box sx={{
                            width: 34, height: 34, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: c.isActive ? '#10B981' : '#EF4444',
                            boxShadow: c.isActive
                              ? '0 0 0 4px #10B98128, 0 2px 10px #10B98150'
                              : '0 0 0 4px #EF444428, 0 2px 10px #EF444450',
                            transition: 'all .2s',
                            '&:hover': { transform: 'scale(1.08)', filter: 'brightness(1.1)' },
                          }}>
                            <PowerSettingsNewIcon sx={{ fontSize: 17, color: '#fff' }} />
                          </Box>
                          <Typography variant="caption" fontWeight={700}
                            sx={{ color: c.isActive ? '#10B981' : '#EF4444', fontSize: '0.7rem' }}>
                            {c.isActive ? 'Faol' : 'Noaktiv'}
                          </Typography>
                        </Box>
                      </Tooltip>
                      {/* Actions */}
                      <Stack direction="row" spacing={0.25}>
                        <Tooltip title={t('common.edit')}>
                          <IconButton size="small" onClick={() => openEdit(c)}
                            sx={{ color, '&:hover': { bgcolor: color + '12' } }}>
                            <EditIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('common.delete')}>
                          <IconButton size="small" color="error"
                            onClick={() => setDelDialog({ open: true, course: c })}
                            sx={{ '&:hover': { bgcolor: '#EF444420' } }}>
                            <DeleteIcon sx={{ fontSize: 17 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </Stack>
                  </Box>
                </Card>
              </motion.div>
            </Grid>
          );
        })}
      </Grid>

      {/* Individual Packages — card grid */}
      {packages.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={2.5}>
            <Box sx={{ width: 36, height: 36, borderRadius: 2,
              bgcolor: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px #7C3AED40' }}>
              <InventoryIcon sx={{ fontSize: 18, color: '#fff' }} />
            </Box>
            <Box>
              <Typography fontWeight={800} fontSize="1rem">Individual Paketlar</Typography>
              <Typography variant="caption" color="text.secondary">Nashr holati boshqaruvi</Typography>
            </Box>
            <Chip label={`${packages.length} ta`} size="small"
              sx={{ ml: 'auto !important', bgcolor: '#7C3AED20', color: '#7C3AED', fontWeight: 700 }} />
          </Stack>

          <Grid container spacing={2.5}>
            {packages.map((pkg, idx) => {
              const lang    = i18n.language === 'ru' ? 'ru' : 'uz';
              const title   = pkg.title?.[lang] ?? pkg.title?.uz ?? pkg.title?.ru ?? '—';
              const course  = pkg.course;
              const cTitle  = course ? (course.title?.[lang] ?? course.title?.uz ?? '—') : null;
              const isPub   = pkg.status === 'published';
              const isDraft = pkg.status === 'draft';

              const handleToggle = async () => {
                const next = isPub ? 'draft' : 'published';
                await setPackageStatus({ id: pkg._id, status: next }).unwrap().catch(() => {});
              };

              return (
                <Grid item xs={12} sm={6} md={4} key={pkg._id}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06, duration: 0.22 }}
                    style={{ height: '100%' }}
                  >
                    <Card elevation={0} sx={{
                      height: '100%', display: 'flex', flexDirection: 'column',
                      border: '1.5px solid',
                      borderColor: isPub ? '#DDD6FE' : 'divider',
                      borderRadius: 3,
                      transition: 'box-shadow .2s, border-color .2s',
                      '&:hover': { boxShadow: '0 4px 20px rgba(124,58,237,0.10)', borderColor: '#C4B5FD' },
                    }}>
                      <Box sx={{ height: 5, borderRadius: '12px 12px 0 0',
                        background: isPub
                          ? 'linear-gradient(90deg,#7C3AED 0%,#A855F7 100%)'
                          : 'linear-gradient(90deg,#64748B 0%,#94A3B8 100%)' }} />

                      <CardContent sx={{ flex: 1, p: 2.5 }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={1.75}>
                          <Box sx={{ width: 44, height: 44, borderRadius: 2, flexShrink: 0,
                            bgcolor: isPub ? '#7C3AED20' : 'action.hover',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <InventoryIcon sx={{ fontSize: 22, color: isPub ? '#7C3AED' : '#94A3B8' }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography fontWeight={800} fontSize="0.88rem"
                              sx={{ lineHeight: 1.3, mb: 0.4,
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {pkg.teacher?.name ?? '—'}
                            </Typography>
                          </Box>
                        </Stack>

                        {cTitle && (
                          <Chip label={cTitle} size="small" sx={{ mb: 1.75,
                            bgcolor: '#7C3AED20', color: '#7C3AED', fontWeight: 600, fontSize: '0.7rem' }} />
                        )}

                        <Stack direction="row" spacing={0} sx={{
                          bgcolor: 'action.hover', borderRadius: 2, overflow: 'hidden',
                          border: '1px solid', borderColor: 'divider' }}>
                          <Box sx={{ flex: 1, py: 1, px: 1.5, borderRight: '1px solid', borderRightColor: 'divider' }}>
                            <Typography variant="caption" color="text.secondary" display="block">Modullar</Typography>
                            <Typography fontWeight={800} fontSize="0.88rem">
                              {pkg.modules?.length ?? 0} ta
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1, py: 1, px: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" display="block">Narx</Typography>
                            <Typography fontWeight={800} fontSize="0.88rem" color="#7C3AED">
                              {(pkg.price?.amount ?? 0).toLocaleString()}
                              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.4 }}>
                                {pkg.price?.currency ?? 'UZS'}
                              </Typography>
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>

                      <Box sx={{ px: 2.5, pb: 2, pt: 0 }}>
                        <Divider sx={{ mb: 1.5 }} />
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Tooltip title={isPub ? 'Nashrdan chiqarish' : 'Nashr qilish'}>
                            <Box onClick={handleToggle} sx={{
                              display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
                            }}>
                              <Box sx={{
                                width: 34, height: 34, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                bgcolor: isPub ? '#10B981' : '#EF4444',
                                boxShadow: isPub
                                  ? '0 0 0 4px #10B98128, 0 2px 10px #10B98150'
                                  : '0 0 0 4px #EF444428, 0 2px 10px #EF444450',
                                transition: 'all .2s',
                                '&:hover': { transform: 'scale(1.08)', filter: 'brightness(1.1)' },
                                '&:active': { transform: 'scale(0.92)' },
                              }}>
                                <PowerSettingsNewIcon sx={{ fontSize: 17, color: '#fff' }} />
                              </Box>
                              <Typography variant="caption" fontWeight={700}
                                sx={{ color: isPub ? '#10B981' : '#EF4444', fontSize: '0.75rem' }}>
                                {isPub ? 'Nashr etilgan' : isDraft ? 'Qoralama' : 'Arxiv'}
                              </Typography>
                            </Box>
                          </Tooltip>

                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                            {pkg.modules?.length ?? 0} modul
                          </Typography>
                        </Stack>
                      </Box>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      )}

      {/* Form Dialog */}
      <CourseDialog
        open={dialog.open}
        initial={dialog.course}
        onClose={closeDialog}
        onSave={handleSave}
        loading={creating || updating}
        apiError={apiErrMsg(createErr) || apiErrMsg(updateErr)}
        teachers={teachers}
        tariffPlans={tariffPlans}
      />

      {/* Delete confirm */}
      <Dialog open={delDialog.open} onClose={() => setDelDialog({ open: false, course: null })} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700} color="error.main">{t('dialog.deleteTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{delDialog.course?.title?.uz ?? delDialog.course?.title}</strong> — {t('dialog.deleteText')}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDelDialog({ open: false, course: null })} sx={{ borderRadius: 2 }}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: 2 }} disabled={deleting}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
