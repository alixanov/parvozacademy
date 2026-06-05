import { useState, useEffect, Fragment } from 'react';
import { motion } from 'framer-motion';
import {
  Box, Typography, Stack, Button, IconButton, Tooltip,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
  Dialog, DialogContent, DialogActions, TextField, MenuItem,
  Select, CircularProgress, Alert, Avatar, Chip, Pagination,
  InputAdornment, Collapse, LinearProgress,
} from '@mui/material';
import AddIcon           from '@mui/icons-material/Add';
import EditIcon          from '@mui/icons-material/Edit';
import DeleteIcon        from '@mui/icons-material/Delete';
import InventoryIcon     from '@mui/icons-material/Inventory';
import PublishIcon       from '@mui/icons-material/Publish';
import UnpublishedIcon   from '@mui/icons-material/Unpublished';
import PeopleIcon        from '@mui/icons-material/People';
import SearchIcon        from '@mui/icons-material/Search';
import CloseIcon         from '@mui/icons-material/Close';
import KeyIcon            from '@mui/icons-material/Key';
import ExpandMoreIcon     from '@mui/icons-material/ExpandMore';
import ExpandLessIcon     from '@mui/icons-material/ExpandLess';
import CalendarTodayIcon  from '@mui/icons-material/CalendarToday';
import PlayCircleIcon     from '@mui/icons-material/PlayCircle';
import AttachFileIcon     from '@mui/icons-material/AttachFile';
import QuizIcon           from '@mui/icons-material/Quiz';
import ViewListIcon       from '@mui/icons-material/ViewList';
import i18n from '../../../utils/i18n.js';
import { useTranslation } from 'react-i18next';
import {
  useGetAllPackagesAdminQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useSetPackageStatusMutation,
  useDeletePackageMutation,
  useGetPackageStudentsQuery,
  useGrantPackageAccessMutation,
  useRevokePackageAccessMutation,
} from '../../../features/packages/packagesApi.js';
import { useGetUsersQuery }      from '../../../features/users/usersApi.js';
import { useGetCoursesQuery }    from '../../../features/courses/coursesApi.js';
import { useGetTariffPlansQuery } from '../../../features/tariffs/tariffsApi.js';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function pTitle(pkg) {
  if (!pkg?.title) return '—';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const t = pkg.title;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '—';
  return t ?? '—';
}

const STATUS_CFG = {
  draft:     { bg: '#9CA3AF20', color: '#9CA3AF', dot: '#9CA3AF' },
  published: { bg: '#10B98120', color: '#10B981', dot: '#10B981' },
  archived:  { bg: '#F59E0B20', color: '#F59E0B', dot: '#F59E0B' },
};
const StatusPill = ({ status }) => {
  const { t } = useTranslation();
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  const label = {
    draft:     t('status.draft'),
    published: t('status.published'),
    archived:  t('packages.archived'),
  }[status] ?? t('status.draft');
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5,
      px: 1, py: 0.3, borderRadius: 5, bgcolor: cfg.bg, color: cfg.color, fontSize: '0.7rem', fontWeight: 700 }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.dot }} />
      {label}
    </Box>
  );
};

/* ── shared input style (dark-mode safe) ─────────────────────────────────── */
const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } };
const Label = ({ children }) => (
  <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: 'text.secondary',
    textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
    {children}
  </Typography>
);

/* ── Create Package Dialog ───────────────────────────────────────────────── */
function CreatePackageDialog({ open, onClose }) {
  const { t } = useTranslation();
  const EMPTY = { course: '', descUz: '', descRu: '', priceAmount: '', currency: 'UZS', tariffPlan: '', teacher: '' };
  const [form, setForm] = useState(EMPTY);
  const [err,  setErr]  = useState('');

  const { data: teachersRes } = useGetUsersQuery({ role: 'teacher', limit: 100 }, { skip: !open });
  const { data: coursesRes }  = useGetCoursesQuery({ limit: 100 },                 { skip: !open });
  const { data: tariffsRes }  = useGetTariffPlansQuery(undefined,                  { skip: !open });

  const teachers   = teachersRes?.data ?? [];
  const courses    = (coursesRes?.data ?? coursesRes ?? []).filter((c) => c.isActive !== false);
  const allTariffs = tariffsRes?.data ?? tariffsRes ?? [];
  const indTariffs = Array.isArray(allTariffs)
    ? allTariffs.filter((t) => t.type === 'individual_package' && t.isActive !== false)
    : [];

  const [createPackage, { isLoading }] = useCreatePackageMutation();
  const handle = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  /* Helper: display course label */
  const courseLabel = (c) => {
    const t = c?.title;
    if (!t) return '—';
    if (typeof t === 'object') {
      const lang = i18n.language;
      return (lang === 'ru' ? t.ru : t.uz) ?? t.uz ?? t.ru ?? '—';
    }
    return t;
  };

  const tName = (tr) => {
    const lang = i18n.language;
    if (lang === 'ru' && tr.nameRu) return tr.nameRu;
    return tr.nameUz || tr.name || '?';
  };

  const tariffLabel = (tp) => {
    const n = tp.name;
    const lang = i18n.language;
    if (typeof n === 'object') return (lang === 'ru' ? n.ru : n.uz) ?? n.ru ?? n.uz ?? tp.key ?? '?';
    return n ?? tp.key ?? '?';
  };

  const handleSubmit = async () => {
    setErr('');
    if (!form.course)      { setErr(t('packages.courseRequired'));  return; }
    if (!form.teacher)     { setErr(t('packages.teacherRequired')); return; }
    if (!form.tariffPlan)  { setErr(t('packages.tariffRequired'));  return; }
    if (!form.priceAmount || isNaN(+form.priceAmount)) { setErr(t('packages.priceRequired')); return; }

    /* Derive package title from selected course */
    const selectedCourse = courses.find((c) => c._id === form.course);
    const ct = selectedCourse?.title ?? {};
    const titleUz = typeof ct === 'object' ? (ct.uz || ct.ru || '') : String(ct);
    const titleRu = typeof ct === 'object' ? (ct.ru || ct.uz || '') : String(ct);

    try {
      await createPackage({
        title:       { uz: titleUz, ru: titleRu },
        description: { uz: form.descUz.trim(), ru: form.descRu.trim() },
        price:       { amount: +form.priceAmount, currency: form.currency },
        teacher:     form.teacher,
        course:      form.course,
        tariffPlan:  form.tariffPlan,
      }).unwrap();
      setForm(EMPTY);
      onClose();
    } catch (e) { setErr(e?.data?.message ?? t('common.error')); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <Box sx={{ px: 3, pt: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <InventoryIcon sx={{ color: '#7C3AED' }} />
        <Typography fontWeight={800} sx={{ flex: 1 }}>{t('packages.createPackage')}</Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </Box>

      <DialogContent sx={{ p: 2.5 }}>
        {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}>{err}</Alert>}

        {/* Course — required */}
        <Label>{t('packages.courseFieldLabel')}</Label>
        <TextField select size="small" fullWidth value={form.course} onChange={handle('course')}
          sx={{ ...inputSx, mb: 2 }}
          error={!form.course}
          helperText={!form.course ? t('packages.courseRequired') : ''}>
          <MenuItem value="" disabled>{t('packages.selectCourse')}</MenuItem>
          {courses.map((c) => (
            <MenuItem key={c._id} value={c._id}>{courseLabel(c)}</MenuItem>
          ))}
        </TextField>

        {/* Teacher */}
        <Label>{t('packages.teacherFieldLabel')} *</Label>
        <TextField select size="small" fullWidth value={form.teacher} onChange={handle('teacher')}
          sx={{ ...inputSx, mb: 2 }}>
          <MenuItem value="">{t('packages.selectTeacher')}</MenuItem>
          {teachers.map((tr) => (
            <MenuItem key={tr._id} value={tr._id}>{tName(tr)}</MenuItem>
          ))}
        </TextField>

        {/* Description (optional) */}
        <Label>{t('form.description')} ({t('form.optional')})</Label>
        <Stack spacing={1.25} mb={2}>
          <TextField size="small" label={t('packages.descUz')} fullWidth multiline rows={2}
            value={form.descUz} onChange={handle('descUz')} sx={inputSx} />
          <TextField size="small" label={t('packages.descRu')} fullWidth multiline rows={2}
            value={form.descRu} onChange={handle('descRu')} sx={inputSx} />
        </Stack>

        {/* Price */}
        <Stack direction="row" spacing={1.25} mb={2}>
          <TextField size="small" label={`${t('form.price')} *`} type="number" sx={{ flex: 2, ...inputSx }}
            value={form.priceAmount} onChange={handle('priceAmount')} />
          <TextField select size="small" label={t('packages.currencyLabel')} sx={{ flex: 1, ...inputSx }}
            value={form.currency} onChange={handle('currency')}>
            {['UZS', 'USD'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Stack>

        {/* Individual-package tariff plan — required */}
        <Label>{t('packages.tariffLabel')}</Label>
        <TextField select size="small" fullWidth value={form.tariffPlan} onChange={handle('tariffPlan')}
          sx={{ ...inputSx, mb: 0.5 }}
          error={!form.tariffPlan}
          helperText={
            indTariffs.length === 0
              ? t('packages.noIndTariffs')
              : !form.tariffPlan
                ? t('packages.tariffRequired')
                : ''
          }>
          <MenuItem value="" disabled>{t('packages.selectTariff')}</MenuItem>
          {indTariffs.map((tp) => (
            <MenuItem key={tp._id} value={tp._id}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tp.color ?? '#7C3AED', flexShrink: 0 }} />
                {tariffLabel(tp)}
                {tp.defaultPrice > 0 && (
                  <Typography component="span" sx={{ fontSize: '0.72rem', color: 'text.disabled', ml: 0.5 }}>
                    — {tp.defaultPrice.toLocaleString()} UZS
                  </Typography>
                )}
              </Stack>
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
        <Button onClick={onClose} size="small"
          sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}>{t('common.cancel')}</Button>
        <Button variant="contained" size="small"
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700,
            bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, boxShadow: '0 4px 12px #7C3AED40' }}
          startIcon={isLoading ? <CircularProgress size={13} color="inherit" /> : <AddIcon />}
          disabled={isLoading} onClick={handleSubmit}>
          {t('packages.createPackage')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Edit Package Dialog ─────────────────────────────────────────────────── */
function EditPackageDialog({ pkg, open, onClose }) {
  const { t } = useTranslation();
  const origTeacherId = typeof pkg?.teacher === 'object' ? pkg?.teacher?._id ?? '' : pkg?.teacher ?? '';

  const [form, setForm] = useState({
    course: '', descUz: '', descRu: '',
    priceAmount: '', currency: 'UZS',
    tariffPlan: '', teacher: '',
  });
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: teachersRes } = useGetUsersQuery({ role: 'teacher', limit: 100 }, { skip: !open });
  const { data: coursesRes }  = useGetCoursesQuery({ limit: 100 },                 { skip: !open });
  const { data: tariffsRes }  = useGetTariffPlansQuery(undefined,                  { skip: !open });

  const teachers   = teachersRes?.data ?? [];
  const courses    = (coursesRes?.data ?? coursesRes ?? []).filter((c) => c.isActive !== false);
  const allTariffs = tariffsRes?.data ?? tariffsRes ?? [];
  const indTariffs = Array.isArray(allTariffs)
    ? allTariffs.filter((t) => t.type === 'individual_package' && t.isActive !== false)
    : [];

  const [updatePackage, { isLoading }] = useUpdatePackageMutation();

  useEffect(() => {
    if (pkg && open) {
      const courseId  = typeof pkg.course     === 'object' ? pkg.course?._id     ?? '' : pkg.course     ?? '';
      const tariffId  = typeof pkg.tariffPlan === 'object' ? pkg.tariffPlan?._id ?? '' : pkg.tariffPlan ?? '';
      const teacherId = typeof pkg.teacher    === 'object' ? pkg.teacher?._id    ?? '' : pkg.teacher    ?? '';
      setForm({
        course:      courseId,
        descUz:      pkg.description?.uz ?? '',
        descRu:      pkg.description?.ru ?? '',
        priceAmount: String(pkg.price?.amount ?? 0),
        currency:    pkg.price?.currency ?? 'UZS',
        tariffPlan:  tariffId,
        teacher:     teacherId,
      });
      setErr(''); setSaved(false);
    }
  }, [pkg, open]);

  const handle = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const teacherChanged = form.teacher && form.teacher !== String(origTeacherId);
  const hasModules = (pkg?.modules?.length ?? 0) > 0;

  const courseLabel = (c) => {
    const t = c?.title;
    if (!t) return '—';
    if (typeof t === 'object') {
      const lang = i18n.language;
      return (lang === 'ru' ? t.ru : t.uz) ?? t.uz ?? t.ru ?? '—';
    }
    return t;
  };

  const tariffLabel = (tp) => {
    const n = tp.name;
    const lang = i18n.language;
    if (typeof n === 'object') return (lang === 'ru' ? n.ru : n.uz) ?? n.ru ?? n.uz ?? tp.key ?? '?';
    return n ?? tp.key ?? '?';
  };

  const handleSave = async () => {
    setErr(''); setSaved(false);
    if (!form.course)     { setErr(t('packages.courseRequired'));  return; }
    if (!form.teacher)    { setErr(t('packages.teacherRequired')); return; }
    if (!form.priceAmount || isNaN(+form.priceAmount)) { setErr(t('packages.priceRequired')); return; }

    /* Derive title from selected course */
    const selectedCourse = courses.find((c) => c._id === form.course);
    const ct = selectedCourse?.title ?? pkg?.title ?? {};
    const titleUz = typeof ct === 'object' ? (ct.uz || ct.ru || '') : String(ct);
    const titleRu = typeof ct === 'object' ? (ct.ru || ct.uz || '') : String(ct);

    try {
      await updatePackage({
        id:          pkg._id,
        title:       { uz: titleUz, ru: titleRu },
        description: { uz: form.descUz.trim(), ru: form.descRu.trim() },
        price:       { amount: +form.priceAmount, currency: form.currency },
        course:      form.course,
        tariffPlan:  form.tariffPlan || undefined,
        teacher:     form.teacher || undefined,
      }).unwrap();
      setSaved(true);
    } catch (e) { setErr(e?.data?.message ?? t('common.error')); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <Box sx={{ px: 3, pt: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <EditIcon sx={{ color: '#7C3AED' }} />
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={800}>{t('packages.editPackage')}</Typography>
          <Typography variant="caption" color="text.secondary">{pTitle(pkg)}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </Box>

      <DialogContent sx={{ p: 2.5 }}>
        {err   && <Alert severity="error"   sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}>{err}</Alert>}
        {saved && <Alert severity="success" sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}>{t('common.saved')}</Alert>}

        {/* Course */}
        <Label>{t('packages.courseFieldLabel')}</Label>
        <TextField select size="small" fullWidth value={form.course} onChange={handle('course')}
          sx={{ ...inputSx, mb: 2 }}
          error={!form.course}
          helperText={!form.course ? t('packages.courseRequired') : ''}>
          <MenuItem value="" disabled>{t('packages.selectCourse')}</MenuItem>
          {courses.map((c) => (
            <MenuItem key={c._id} value={c._id}>{courseLabel(c)}</MenuItem>
          ))}
        </TextField>

        {/* Teacher */}
        <Label>{t('packages.teacherFieldLabel')}</Label>
        <TextField select size="small" fullWidth value={form.teacher} onChange={handle('teacher')}
          sx={{ ...inputSx, mb: teacherChanged && hasModules ? 1 : 2 }}>
          <MenuItem value="">{t('packages.selectTeacher')}</MenuItem>
          {teachers.map((tr) => (
            <MenuItem key={tr._id} value={tr._id}>{tr.nameRu || tr.nameUz || tr.name}</MenuItem>
          ))}
        </TextField>

        {teacherChanged && hasModules && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem', py: 0.5 }}>
            {t('packages.teacherModuleWarning', { count: pkg.modules.length })}
          </Alert>
        )}

        {/* Description */}
        <Label>{t('form.description')}</Label>
        <Stack spacing={1.25} mb={2}>
          <TextField size="small" label={t('packages.descUz')} fullWidth multiline rows={2}
            value={form.descUz} onChange={handle('descUz')} sx={inputSx} />
          <TextField size="small" label={t('packages.descRu')} fullWidth multiline rows={2}
            value={form.descRu} onChange={handle('descRu')} sx={inputSx} />
        </Stack>

        {/* Price */}
        <Stack direction="row" spacing={1.25} mb={2}>
          <TextField size="small" label={`${t('form.price')} *`} type="number" sx={{ flex: 2, ...inputSx }}
            value={form.priceAmount} onChange={handle('priceAmount')} />
          <TextField select size="small" label={t('packages.currencyLabel')} sx={{ flex: 1, ...inputSx }}
            value={form.currency} onChange={handle('currency')}>
            {['UZS', 'USD'].map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Stack>

        {/* Individual-package tariff plan */}
        <Label>{t('packages.tariffOptionalLabel')}</Label>
        <TextField select size="small" fullWidth value={form.tariffPlan} onChange={handle('tariffPlan')}
          sx={{ ...inputSx, mb: 0.5 }}
          helperText={indTariffs.length === 0 ? t('packages.noIndTariffsShort') : ''}>
          <MenuItem value="">{t('packages.selectOptional')}</MenuItem>
          {indTariffs.map((tp) => (
            <MenuItem key={tp._id} value={tp._id}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tp.color ?? '#7C3AED', flexShrink: 0 }} />
                {tariffLabel(tp)}
                {tp.defaultPrice > 0 && (
                  <Typography component="span" sx={{ fontSize: '0.72rem', color: 'text.disabled', ml: 0.5 }}>
                    — {tp.defaultPrice.toLocaleString()} UZS
                  </Typography>
                )}
              </Stack>
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
        <Button onClick={onClose} size="small" sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}>
          {saved ? t('common.close') : t('common.cancel')}
        </Button>
        <Button variant="contained" size="small"
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700,
            bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, boxShadow: '0 4px 12px #7C3AED40' }}
          startIcon={isLoading ? <CircularProgress size={13} color="inherit" /> : <EditIcon />}
          disabled={isLoading} onClick={handleSave}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Grant Access Dialog ─────────────────────────────────────────────────── */
function GrantAccessDialog({ pkg, open, onClose }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const { data: studentsRes } = useGetUsersQuery({ role: 'student', limit: 100 }, { skip: !open });
  const { data: pkgStudentsRes, refetch } = useGetPackageStudentsQuery({ id: pkg?._id }, { skip: !pkg?._id });
  const [grantAccess, { isLoading: granting }] = useGrantPackageAccessMutation();

  const students = studentsRes?.data ?? [];
  const pkgStudents = pkgStudentsRes?.data ?? [];
  const accessStudentIds = new Set(pkgStudents.filter((a) => a.status === 'active').map((a) => String(a.student?._id)));

  const filtered = search
    ? students.filter((s) => s.name?.toLowerCase().includes(search.toLowerCase()) || s.phone?.includes(search))
    : students;

  const handleGrant = async () => {
    setErr('');
    if (!selected) { setErr(t('packages.studentRequired')); return; }
    try {
      await grantAccess({ id: pkg._id, studentId: selected, paymentAmount: +amount || 0, note }).unwrap();
      setSelected(''); setAmount(''); setNote('');
      refetch();
    } catch (e) { setErr(e?.data?.message ?? t('common.error')); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <Box sx={{ px: 3, pt: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <KeyIcon sx={{ color: '#1976D2' }} />
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={800} fontSize="0.95rem">{t('packages.grantAccessTitle')}</Typography>
          <Typography variant="caption" color="text.secondary">{pTitle(pkg)}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </Box>

      <DialogContent sx={{ p: 2.5 }}>
        {/* Current access list */}
        {pkgStudents.length > 0 && (
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary',
              textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
              {t('packages.buyersLabel')} ({pkgStudents.filter((a) => a.status === 'active').length})
            </Typography>
            <Stack spacing={0.75}>
              {pkgStudents.filter((a) => a.status === 'active').map((a) => {
                const paid = a.paymentAmount ?? 0;
                const date = a.createdAt ? new Date(a.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
                return (
                  <Box key={a._id} sx={{
                    px: 1.5, py: 1, borderRadius: 2,
                    bgcolor: '#10B98108', border: '1px solid #10B98130',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, fontSize: '0.72rem', bgcolor: '#10B98120', color: '#10B981', fontWeight: 700 }}>
                        {a.student?.name?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.83rem', fontWeight: 700, lineHeight: 1.3 }}>
                          {a.student?.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                          {a.student?.phone}
                          {a.student?.studentId ? ` · ID: ${a.student.studentId}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                    {/* Payment details row */}
                    <Box sx={{ display: 'flex', gap: 1.5, mt: 0.75, pl: '36px', flexWrap: 'wrap' }}>
                      <Chip
                        label={paid > 0 ? `${paid.toLocaleString()} UZS` : t('packages.free')}
                        size="small"
                        sx={{
                          height: 20, fontSize: '0.68rem', fontWeight: 700,
                          bgcolor: paid > 0 ? '#10B98120' : '#9CA3AF20',
                          color:   paid > 0 ? '#10B981'   : '#9CA3AF',
                          border: 'none',
                        }}
                      />
                      <Typography sx={{ fontSize: '0.7rem', color: 'text.disabled', display: 'flex', alignItems: 'center' }}>
                        {date}
                      </Typography>
                      {a.note && (
                        <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', fontStyle: 'italic' }}>
                          {a.note}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Grant new access */}
        <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: 'text.secondary',
          textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
          {t('packages.newGrantAccess')}
        </Typography>
        {err && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2, fontSize: '0.8rem' }}>{err}</Alert>}

        <TextField size="small" fullWidth placeholder={t('groups.searchByNamePhone')}
          value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 1.25, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
        />

        <TextField select size="small" fullWidth label={`${t('form.student')} *`}
          value={selected} onChange={(e) => setSelected(e.target.value)}
          sx={{ mb: 1.25, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
          <MenuItem value="">—</MenuItem>
          {filtered.filter((s) => !accessStudentIds.has(String(s._id))).map((s) => (
            <MenuItem key={s._id} value={s._id}>
              {s.name} · {s.phone}
            </MenuItem>
          ))}
        </TextField>

        <Stack direction="row" spacing={1.25}>
          <TextField size="small" label={t('packages.paymentAmountLabel')} type="number"
            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            value={amount} onChange={(e) => setAmount(e.target.value)} />
          <TextField size="small" label={t('form.comment')}
            sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            value={note} onChange={(e) => setNote(e.target.value)} />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
        <Button onClick={onClose} size="small" sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}>
          {t('common.close')}
        </Button>
        <Button variant="contained" size="small"
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
          startIcon={granting ? <CircularProgress size={13} color="inherit" /> : <KeyIcon />}
          disabled={granting || !selected} onClick={handleGrant}>
          {t('packages.grantAccessBtn')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Single module detail card ───────────────────────────────────────────── */
function ModuleCard({ m, idx, lang }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const title = (() => {
    const titleVal = m?.title;
    const fallback = `${t('packages.modulesTitle')} ${idx + 1}`;
    if (!titleVal) return fallback;
    if (typeof titleVal === 'object') return titleVal[lang] ?? titleVal.uz ?? titleVal.ru ?? fallback;
    return titleVal;
  })();

  const hasVideo = !!m.videoUrl;
  const hasFile  = !!(m.file?.url);
  const hasQuiz  = (m.quiz?.length ?? 0) > 0;
  const hasDesc  = !!(m.description?.trim?.());

  const fileSize = m.file?.size
    ? m.file.size > 1024 * 1024
      ? `${(m.file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(m.file.size / 1024)} KB`
    : null;

  return (
    <Box sx={{
      borderRadius: 2, bgcolor: 'background.paper',
      border: '1px solid', borderColor: open ? '#7C3AED40' : 'divider',
      overflow: 'hidden',
      opacity: m.isPublished === false ? 0.65 : 1,
      transition: 'border-color 0.15s',
    }}>
      {/* ── Header row (always visible) ── */}
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.5, py: 1,
          cursor: 'pointer', userSelect: 'none',
          '&:hover': { bgcolor: 'action.hover' } }}>

        {/* Order badge */}
        <Box sx={{
          width: 24, height: 24, borderRadius: 1.25, flexShrink: 0,
          bgcolor: '#7C3AED18', color: '#7C3AED',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.7rem', fontWeight: 800,
        }}>
          {m.order ?? idx + 1}
        </Box>

        {/* Title */}
        <Typography sx={{ flex: 1, fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.3 }}>
          {title}
        </Typography>

        {/* Content chips */}
        <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
          {hasVideo && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, px: 0.75, py: 0.2,
              borderRadius: 1, bgcolor: '#EF444415', fontSize: '0.65rem', fontWeight: 700, color: '#EF4444' }}>
              <PlayCircleIcon sx={{ fontSize: 11 }} /> Video
            </Box>
          )}
          {hasFile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, px: 0.75, py: 0.2,
              borderRadius: 1, bgcolor: '#1976D215', fontSize: '0.65rem', fontWeight: 700, color: '#1976D2' }}>
              <AttachFileIcon sx={{ fontSize: 11 }} /> {m.file?.type?.toUpperCase() ?? 'Fayl'}
            </Box>
          )}
          {hasQuiz && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, px: 0.75, py: 0.2,
              borderRadius: 1, bgcolor: '#F59E0B15', fontSize: '0.65rem', fontWeight: 700, color: '#F59E0B' }}>
              <QuizIcon sx={{ fontSize: 11 }} /> {t('packages.quizCountChip', { count: m.quiz.length })}
            </Box>
          )}
          {m.isPublished === false && (
            <Box sx={{ px: 0.75, py: 0.2, borderRadius: 1, bgcolor: '#9CA3AF15',
              fontSize: '0.62rem', fontWeight: 700, color: '#9CA3AF' }}>{t('packages.modulesDraftLabel')}</Box>
          )}
        </Stack>

        {/* Expand arrow */}
        {open ? <ExpandLessIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />
               : <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.disabled', flexShrink: 0 }} />}
      </Box>

      {/* ── Expanded detail ── */}
      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 2, pb: 1.5, pt: 0.25, borderTop: '1px solid', borderColor: 'divider' }}>

          {/* Description */}
          {hasDesc && (
            <Box sx={{ mb: 1.25, mt: 1 }}>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.disabled',
                textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>{t('form.description')}</Typography>
              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.5,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {m.description}
              </Typography>
            </Box>
          )}

          {/* Video */}
          {hasVideo && (
            <Box sx={{ mb: 1.25, mt: hasDesc ? 0 : 1 }}>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.disabled',
                textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>Video</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1,
                px: 1.25, py: 0.75, borderRadius: 1.5, bgcolor: '#EF444408',
                border: '1px solid #EF444420' }}>
                <PlayCircleIcon sx={{ fontSize: 16, color: '#EF4444', flexShrink: 0 }} />
                <Typography
                  component="a" href={m.videoUrl} target="_blank" rel="noopener noreferrer"
                  sx={{ fontSize: '0.78rem', color: '#EF4444', textDecoration: 'none',
                    flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    '&:hover': { textDecoration: 'underline' } }}>
                  {m.videoUrl}
                </Typography>
              </Box>
            </Box>
          )}

          {/* File */}
          {hasFile && (
            <Box sx={{ mb: 1.25, mt: (hasDesc || hasVideo) ? 0 : 1 }}>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.disabled',
                textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>{t('common.file')}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1,
                px: 1.25, py: 0.75, borderRadius: 1.5, bgcolor: '#1976D208',
                border: '1px solid #1976D220' }}>
                <AttachFileIcon sx={{ fontSize: 16, color: '#1976D2', flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    component="a" href={m.file.url} target="_blank" rel="noopener noreferrer"
                    sx={{ fontSize: '0.8rem', color: '#1976D2', fontWeight: 600,
                      textDecoration: 'none', display: 'block', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      '&:hover': { textDecoration: 'underline' } }}>
                    {m.file.name || t('packages.downloadFile')}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled' }}>
                    {m.file.type?.toUpperCase()}{fileSize ? ` · ${fileSize}` : ''}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}

          {/* Quiz */}
          {hasQuiz && (
            <Box sx={{ mt: (hasDesc || hasVideo || hasFile) ? 0 : 1 }}>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.disabled',
                textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.75 }}>
                {t('packages.quizCount', { count: m.quiz.length })}
              </Typography>
              <Stack spacing={0.5}>
                {m.quiz.map((q, qi) => (
                  <Box key={qi} sx={{ px: 1.25, py: 0.75, borderRadius: 1.5,
                    bgcolor: '#F59E0B08', border: '1px solid #F59E0B20' }}>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, mb: 0.4 }}>
                      {qi + 1}. {q.question || '—'}
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.4 }}>
                      {(q.options ?? []).map((opt, oi) => (
                        <Box key={oi} sx={{
                          px: 0.75, py: 0.15, borderRadius: 1,
                          fontSize: '0.68rem', fontWeight: oi === q.correct ? 700 : 400,
                          bgcolor: oi === q.correct ? '#10B98120' : '#F1F5F9',
                          color:   oi === q.correct ? '#10B981'   : 'text.secondary',
                          border: oi === q.correct ? '1px solid #10B98140' : '1px solid transparent',
                        }}>
                          {String.fromCharCode(65 + oi)}) {opt}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {!hasDesc && !hasVideo && !hasFile && !hasQuiz && (
            <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled', fontStyle: 'italic', mt: 1 }}>
              {t('packages.moduleNoContent')}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

/* ── Package detail panel (inline expandable) ────────────────────────────── */
function BuyersPanel({ pkg }) {
  const { t } = useTranslation();
  const pkgId  = pkg?._id;
  const modules = pkg?.modules ?? [];
  const lang   = i18n.language === 'ru' ? 'ru' : 'uz';

  const { data, isLoading } = useGetPackageStudentsQuery({ id: pkgId }, { skip: !pkgId });
  const buyers = (data?.data ?? []).filter((a) => a.status === 'active');

  const sorted = [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <Box sx={{ bgcolor: 'action.hover' }}>

      {/* ── Modules section ── */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
          <ViewListIcon sx={{ fontSize: 13, color: '#7C3AED' }} />
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#7C3AED',
            textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {t('packages.modulesTitle')} — {modules.length}
          </Typography>
        </Stack>

        {modules.length === 0 ? (
          <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', fontStyle: 'italic' }}>
            {t('packages.noModules')}
          </Typography>
        ) : (
          <Stack spacing={0.75}>
            {sorted.map((m, i) => (
              <ModuleCard key={m._id ?? i} m={m} idx={i} lang={lang} />
            ))}
          </Stack>
        )}
      </Box>

      {/* ── Buyers section ── */}
      <Box sx={{ px: 2, py: 1.5 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: buyers.length ? 1 : 0 }}>
          <PeopleIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: 'text.disabled',
            textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {t('packages.buyersLabel')} — {isLoading ? '…' : buyers.length}
          </Typography>
        </Stack>

        {isLoading && <LinearProgress sx={{ my: 0.5 }} />}

        {!isLoading && buyers.length === 0 && (
          <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled', fontStyle: 'italic' }}>
            {t('packages.noBuyers')}
          </Typography>
        )}

        {!isLoading && buyers.length > 0 && (
          <Stack spacing={0.6}>
            {buyers.map((a) => {
              const paid = a.paymentAmount ?? 0;
              const date = a.createdAt
                ? new Date(a.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
                : '—';
              return (
                <Box key={a._id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 1.5, py: 0.85, borderRadius: 2,
                  bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                }}>
                  <Avatar sx={{ width: 26, height: 26, fontSize: '0.68rem', fontWeight: 800,
                    bgcolor: '#7C3AED20', color: '#7C3AED', flexShrink: 0 }}>
                    {a.student?.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.25 }} noWrap>
                      {a.student?.name ?? '—'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                      {a.student?.phone ?? ''}
                      {a.student?.studentId ? ` · ${a.student.studentId}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{ px: 1, py: 0.25, borderRadius: 1.5, flexShrink: 0,
                    bgcolor: paid > 0 ? '#10B98118' : '#9CA3AF15',
                    color:   paid > 0 ? '#10B981'   : '#9CA3AF',
                    fontSize: '0.72rem', fontWeight: 700 }}>
                    {paid > 0 ? `${paid.toLocaleString()} UZS` : t('packages.free')}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4,
                    color: 'text.disabled', fontSize: '0.7rem', flexShrink: 0 }}>
                    <CalendarTodayIcon sx={{ fontSize: 11 }} />
                    {date}
                  </Box>
                  {a.note && (
                    <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary',
                      fontStyle: 'italic', maxWidth: 120 }} noWrap>
                      {a.note}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function AdminPackages() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [accessPkg, setAccessPkg] = useState(null);
  const [editPkg,   setEditPkg]   = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedPkg, setExpandedPkg] = useState(null);

  const { data: res, isLoading, isError } = useGetAllPackagesAdminQuery({ page, limit: 20, status: statusFilter || undefined });
  const [setStatus, { isLoading: changingStatus }] = useSetPackageStatusMutation();
  const [deletePkg] = useDeletePackageMutation();

  const packages = res?.data ?? [];
  const totalPages = res?.pagination?.pages ?? 1;

  const filtered = search
    ? packages.filter((p) => pTitle(p).toLowerCase().includes(search.toLowerCase()))
    : packages;

  const handleStatusToggle = async (pkg) => {
    const next = pkg.status === 'published' ? 'draft' : 'published';
    await setStatus({ id: pkg._id, status: next }).unwrap().catch(() => {});
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('packages.deleteConfirm'))) return;
    await deletePkg(id).unwrap().catch(() => {});
  };

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', py: { xs: 2, md: 3 }, px: { xs: 2, md: 0 } }}>

      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2,
          bgcolor: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px #7C3AED40' }}>
          <InventoryIcon sx={{ fontSize: 21, color: '#fff' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={800} fontSize="1.2rem">{t('packages.headerTitle')}</Typography>
          <Typography variant="caption" color="text.secondary">{t('packages.subtitle')}</Typography>
        </Box>
        <Box sx={{ px: 1.5, py: 0.5, borderRadius: 2, bgcolor: 'action.hover',
          fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary' }}>
          {res?.pagination?.total ?? packages.length} ta
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap',
            bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, boxShadow: '0 4px 12px #7C3AED40' }}>
          {t('packages.newPackage')}
        </Button>
      </Stack>

      {/* Filters */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} mb={3}
        sx={{ p: 1.5, borderRadius: 2.5, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
        <TextField size="small" placeholder={t('packages.searchPlaceholder')}
          value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1,
            '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: '0.85rem' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
        />
        <Select size="small" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          displayEmpty
          sx={{ minWidth: 145, '& .MuiOutlinedInput-notchedOutline': { borderRadius: 2 } }}>
          <MenuItem value="" sx={{ fontSize: '0.85rem' }}>{t('packages.allStatuses')}</MenuItem>
          {Object.entries(STATUS_CFG).map(([val, cfg]) => {
            const sLabel = { draft: t('status.draft'), published: t('status.published'), archived: t('packages.archived') }[val] ?? val;
            return (
              <MenuItem key={val} value={val} sx={{ fontSize: '0.85rem' }}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.dot }} />
                  {sLabel}
                </Stack>
              </MenuItem>
            );
          })}
        </Select>
      </Stack>

      {/* Table */}
      {isLoading ? (
        <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: 'text.disabled' }} /></Box>
      ) : isError ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{t('common.error')}</Alert>
      ) : filtered.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <InventoryIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.disabled">{t('packages.notFound')}</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ borderRadius: 2.5, overflow: 'hidden',
            border: '1px solid', borderColor: 'divider' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {[
                      t('packages.tableName'),
                      t('form.teacher'),
                      t('packages.modulesTitle'),
                      t('form.price'),
                      t('form.status'),
                      t('common.actions'),
                    ].map((h) => (
                      <TableCell key={h} sx={{ py: 1, px: 1.75, fontSize: '0.66rem', fontWeight: 600, color: 'text.disabled',
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                        borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'transparent', whiteSpace: 'nowrap' }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((pkg, i) => {
                    const isExpanded = expandedPkg === pkg._id;
                    return (
                      <Fragment key={pkg._id}>
                        <TableRow
                          component={motion.tr}
                          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: i * 0.04 }}
                          sx={{ '&:hover td': { bgcolor: 'action.hover' }, transition: 'background 0.1s' }}>
                          <TableCell sx={{ py: 1.25, px: 1.75, borderColor: 'divider', borderBottom: isExpanded ? 0 : undefined }}>
                            <Stack direction="row" spacing={1.25} alignItems="center">
                              <Box sx={{ width: 36, height: 36, borderRadius: 2, flexShrink: 0,
                                bgcolor: '#7C3AED20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <InventoryIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                              </Box>
                              <Box>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.3 }}>
                                  {pTitle(pkg)}
                                </Typography>
                                {pkg.tariffPlan && (
                                  <Typography sx={{ fontSize: '0.7rem', color: '#7C3AED', fontWeight: 600 }}>
                                    {(() => {
                                      const n = pkg.tariffPlan?.name;
                                      if (!n) return '';
                                      const lang = i18n.language;
                                      if (typeof n === 'object') return (lang === 'ru' ? n.ru : n.uz) ?? n.ru ?? n.uz ?? '';
                                      return n;
                                    })()}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 1.25, px: 1.75, borderColor: 'divider', borderBottom: isExpanded ? 0 : undefined }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: '#7C3AED', flexShrink: 0 }} />
                              <Typography sx={{ fontSize: '0.82rem' }}>{pkg.teacher?.name ?? '—'}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell sx={{ py: 1.25, px: 1.75, borderColor: 'divider', borderBottom: isExpanded ? 0 : undefined }}>
                            <Box sx={{ px: 1, py: 0.3, borderRadius: 1.5, bgcolor: 'action.hover',
                              fontSize: '0.75rem', fontWeight: 700, color: 'text.secondary', display: 'inline-block' }}>
                              {t('packages.moduleCount', { count: pkg.modules?.length ?? 0 })}
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 1.25, px: 1.75, borderColor: 'divider', borderBottom: isExpanded ? 0 : undefined }}>
                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#1976D2' }}>
                              {(pkg.price?.amount ?? 0).toLocaleString()} {pkg.price?.currency ?? 'UZS'}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1.25, px: 1.75, borderColor: 'divider', borderBottom: isExpanded ? 0 : undefined }}>
                            <StatusPill status={pkg.status} />
                          </TableCell>
                          <TableCell sx={{ py: 1.25, px: 1.75, borderColor: 'divider', borderBottom: isExpanded ? 0 : undefined }}>
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title={isExpanded ? t('packages.collapseTooltip') : t('packages.expandTooltip')}>
                                <IconButton size="small"
                                  onClick={() => setExpandedPkg(isExpanded ? null : pkg._id)}
                                  sx={{ borderRadius: 1.5, bgcolor: isExpanded ? '#1976D215' : 'transparent',
                                    '&:hover': { bgcolor: '#1976D220' } }}>
                                  {isExpanded
                                    ? <ExpandLessIcon sx={{ fontSize: 16, color: '#1976D2' }} />
                                    : <ExpandMoreIcon sx={{ fontSize: 16, color: '#1976D2' }} />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('common.edit')}>
                                <IconButton size="small" onClick={() => setEditPkg(pkg)}
                                  sx={{ borderRadius: 1.5, '&:hover': { bgcolor: '#7C3AED20' } }}>
                                  <EditIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={pkg.status === 'published' ? t('packages.archiveTooltip') : t('packages.publishTooltip')}>
                                <IconButton size="small" onClick={() => handleStatusToggle(pkg)} disabled={changingStatus}
                                  sx={{ borderRadius: 1.5, '&:hover': { bgcolor: pkg.status === 'published' ? '#F59E0B20' : '#10B98120' } }}>
                                  {pkg.status === 'published'
                                    ? <UnpublishedIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                                    : <PublishIcon     sx={{ fontSize: 16, color: '#10B981' }} />}
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('packages.accessTooltip')}>
                                <IconButton size="small" onClick={() => setAccessPkg(pkg)}
                                  sx={{ borderRadius: 1.5, '&:hover': { bgcolor: '#1976D220' } }}>
                                  <PeopleIcon sx={{ fontSize: 16, color: '#1976D2' }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={t('common.delete')}>
                                <IconButton size="small" onClick={() => handleDelete(pkg._id)}
                                  sx={{ borderRadius: 1.5, '&:hover': { bgcolor: '#EF444420' } }}>
                                  <DeleteIcon sx={{ fontSize: 16, color: '#EF4444' }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                            <Collapse in={isExpanded} unmountOnExit>
                              <BuyersPanel pkg={pkg} />
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Pagination count={totalPages} page={page} size="small" onChange={(_, v) => setPage(v)} />
            </Box>
          )}
        </>
      )}

      {/* Create Package Dialog */}
      <CreatePackageDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Edit Package Dialog */}
      {editPkg && (
        <EditPackageDialog pkg={editPkg} open={!!editPkg} onClose={() => setEditPkg(null)} />
      )}

      {/* Access Dialog */}
      {accessPkg && (
        <GrantAccessDialog pkg={accessPkg} open={!!accessPkg} onClose={() => setAccessPkg(null)} />
      )}
    </Box>
  );
}
