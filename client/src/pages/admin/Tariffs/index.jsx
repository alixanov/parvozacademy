import {
  Box, Grid, Card, CardContent, Stack, Typography, IconButton,
  Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, InputAdornment, CircularProgress,
  Snackbar, Alert, Tooltip, MenuItem, Switch, FormControlLabel,
  Collapse,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useTranslation }  from 'react-i18next';
import AddIcon             from '@mui/icons-material/Add';
import CloseIcon           from '@mui/icons-material/Close';
import EditIcon            from '@mui/icons-material/Edit';
import DeleteIcon          from '@mui/icons-material/Delete';
import CheckIcon           from '@mui/icons-material/Check';
import OndemandVideoIcon   from '@mui/icons-material/OndemandVideo';
import SchoolIcon          from '@mui/icons-material/School';
import PersonIcon          from '@mui/icons-material/Person';
import StarIcon            from '@mui/icons-material/Star';
import InventoryIcon       from '@mui/icons-material/Inventory';
import ExpandMoreIcon      from '@mui/icons-material/ExpandMore';
import ExpandLessIcon      from '@mui/icons-material/ExpandLess';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { motion }          from 'framer-motion';
import PageHeader          from '../../../components/common/PageHeader/index.jsx';
import {
  useGetTariffPlansQuery,
  useCreateTariffPlanMutation,
  useUpdateTariffPlanMutation,
  useDeleteTariffPlanMutation,
} from '../../../features/tariffs/tariffsApi.js';
import { useGetUsersQuery } from '../../../features/users/usersApi.js';
import { formatPrice }     from '../../../data/mockData.js';

/* ── Иконки ───────────────────────────────────────────────────── */
const PLAN_ICON = {
  online:              <OndemandVideoIcon />,
  offline:             <SchoolIcon />,
  individual_offline:  <PersonIcon />,
  individual_online:   <PersonIcon />,
  default:             <StarIcon />,
};

/* ── Пресеты цветов ───────────────────────────────────────────── */
const COLOR_PRESETS = [
  '#1976D2', '#7C3AED', '#10B981', '#EF4444',
  '#F59E0B', '#06B6D4', '#EC4899', '#64748B',
];

/* ── Транслитерация кириллицы → латиница для авто-ключа ─────── */
const CYR_MAP = {
  'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo',
  'ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m',
  'н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u',
  'ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch',
  'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
  'ғ':'g','қ':'q','ҳ':'h','ў':'o','ҷ':'j',
};
function toSlug(text) {
  return text
    .toLowerCase()
    .split('')
    .map((c) => (CYR_MAP[c] !== undefined ? CYR_MAP[c] : c))
    .join('')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
}

/* ─────────────────────────────────────────────────────────────── */
/* ── Форма плана (создание и редактирование) ─────────────────── */
/* ─────────────────────────────────────────────────────────────── */
function PlanForm({ plan, isNew, onSave, onClose, loading }) {
  const { t } = useTranslation();
  const [nameRu,        setNameRu]        = useState('');
  const [nameUz,        setNameUz]        = useState('');
  const [key,           setKey]           = useState('');
  const [keyTouched,    setKeyTouched]    = useState(false);
  const [price,         setPrice]         = useState('');
  const [color,         setColor]         = useState(COLOR_PRESETS[0]);
  const [features,      setFeatures]      = useState([]);
  const [featuresUz,    setFeaturesUz]    = useState([]);
  const [descRu,        setDescRu]        = useState('');
  const [descUz,        setDescUz]        = useState('');
  const [type,          setType]          = useState('regular');
  const [teacher,       setTeacher]       = useState('');
  const [popular,       setPopular]       = useState(false);
  const [isActive,      setIsActive]      = useState(true);
  const [showUzFeat,    setShowUzFeat]    = useState(false);

  /* Загрузить список учителей только для individual_package */
  const { data: teachersData } = useGetUsersQuery(
    { role: 'teacher' },
    { skip: type !== 'individual_package' },
  );
  const teachers = teachersData?.data ?? [];

  useEffect(() => {
    if (!plan) return;
    setNameRu(plan.name?.ru ?? '');
    setNameUz(plan.name?.uz ?? '');
    setKey(plan.key ?? '');
    setPrice(String(plan.defaultPrice ?? ''));
    setColor(plan.color ?? COLOR_PRESETS[0]);
    setFeatures([...(plan.features ?? [])]);
    setFeaturesUz([...(plan.featuresUz ?? [])]);
    setDescRu(plan.description?.ru ?? '');
    setDescUz(plan.description?.uz ?? '');
    setType(plan.type ?? 'regular');
    setTeacher(plan.teacher?._id ?? plan.teacher ?? '');
    setPopular(plan.popular ?? false);
    setIsActive(plan.isActive !== undefined ? plan.isActive : true);
    setKeyTouched(false);
    setShowUzFeat((plan.featuresUz ?? []).length > 0);
  }, [plan]);

  /* Авто-генерация ключа только при создании и пока не тронут */
  useEffect(() => {
    if (!isNew || keyTouched) return;
    setKey(toSlug(nameRu));
  }, [nameRu, isNew, keyTouched]);

  const addFeature    = (uz) => uz ? setFeaturesUz((f) => [...f, '']) : setFeatures((f) => [...f, '']);
  const removeFeature = (i, uz) => uz ? setFeaturesUz((f) => f.filter((_, idx) => idx !== i)) : setFeatures((f) => f.filter((_, idx) => idx !== i));
  const editFeature   = (i, v, uz) => uz ? setFeaturesUz((f) => f.map((x, idx) => idx === i ? v : x)) : setFeatures((f) => f.map((x, idx) => idx === i ? v : x));

  const isValid = nameRu.trim() && key.trim() && /^[a-z0-9_-]+$/.test(key.trim());

  const handleSave = () => {
    const payload = {
      key:          key.trim(),
      name:         { ru: nameRu.trim(), uz: nameUz.trim() },
      description:  { ru: descRu.trim(), uz: descUz.trim() },
      defaultPrice: Number(price) || 0,
      color,
      features:     features.map((f) => f.trim()).filter(Boolean),
      featuresUz:   featuresUz.map((f) => f.trim()).filter(Boolean),
      popular,
      isActive,
      type,
      teacher:      type === 'individual_package' && teacher ? teacher : undefined,
    };
    onSave(payload);
  };

  const FeatureList = ({ uz }) => {
    const list = uz ? featuresUz : features;
    return (
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} color={uz ? 'text.secondary' : 'text.primary'}>
            {uz ? t('admin.tariffs_features_uz') : t('admin.tariffs_features_ru')}
          </Typography>
          <Button size="small" startIcon={<AddIcon />} onClick={() => addFeature(uz)} sx={{ borderRadius: 2 }}>
            {t('admin.tariffs_add_feature')}
          </Button>
        </Stack>
        {list.length === 0 && (
          <Typography variant="body2" color="text.disabled" sx={{ py: 1, textAlign: 'center' }}>
            {t('admin.tariffs_no_features_hint')}
          </Typography>
        )}
        {list.map((f, i) => (
          <Stack key={i} direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center">
            <CheckIcon sx={{ fontSize: 16, color, flexShrink: 0 }} />
            <TextField
              size="small" fullWidth placeholder={t('admin.tariffs_feature_placeholder')}
              value={f} onChange={(e) => editFeature(i, e.target.value, uz)}
            />
            <IconButton size="small" color="error" onClick={() => removeFeature(i, uz)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
      </Box>
    );
  };

  return (
    <>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>

          {/* ── Тип тарифа ─────────────────────────────────── */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{t('admin.tariffs_type')}</Typography>
            <Stack direction="row" spacing={1}>
              <Chip
                label={t('admin.tariffs_regular')}
                icon={<OndemandVideoIcon sx={{ fontSize: 16 }} />}
                clickable
                variant={type === 'regular' ? 'filled' : 'outlined'}
                color={type === 'regular' ? 'primary' : 'default'}
                onClick={() => setType('regular')}
              />
              <Chip
                label={t('admin.tariffs_individual')}
                icon={<InventoryIcon sx={{ fontSize: 16 }} />}
                clickable
                variant={type === 'individual_package' ? 'filled' : 'outlined'}
                color={type === 'individual_package' ? 'secondary' : 'default'}
                onClick={() => setType('individual_package')}
              />
            </Stack>
            {type === 'individual_package' && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.75, display: 'block' }}>
                {t('admin.tariffs_ind_desc')}
              </Typography>
            )}
          </Box>

          {/* ── Названия ────────────────────────────────────── */}
          <Stack direction="row" spacing={1.5}>
            <TextField size="small" label={t('admin.tariffs_name_ru')} fullWidth
              value={nameRu} onChange={(e) => setNameRu(e.target.value)} />
            <TextField size="small" label={t('admin.tariffs_name_uz')} fullWidth
              value={nameUz} onChange={(e) => setNameUz(e.target.value)} />
          </Stack>

          {/* ── Ключ ────────────────────────────────────────── */}
          {isNew ? (
            <TextField
              size="small" label={t('admin.tariffs_key')} fullWidth
              value={key}
              onChange={(e) => { setKey(e.target.value); setKeyTouched(true); }}
              error={(!!nameRu.trim() && !key.trim()) || (!!key && !/^[a-z0-9_-]+$/.test(key))}
              helperText={
                !!nameRu.trim() && !key.trim()
                  ? t('admin.tariffs_key_manual')
                  : !!key && !/^[a-z0-9_-]+$/.test(key)
                    ? t('admin.tariffs_key_format')
                    : t('admin.tariffs_key_auto')
              }
              InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }}
            />
          ) : (
            <TextField size="small" label={t('admin.tariffs_key_view')} fullWidth disabled value={key}
              InputProps={{ startAdornment: <InputAdornment position="start">#</InputAdornment> }}
              helperText={t('admin.tariffs_key_edit')}
            />
          )}

          {/* ── Описание ────────────────────────────────────── */}
          <Stack direction="row" spacing={1.5}>
            <TextField size="small" label={t('admin.tariffs_desc_ru')} fullWidth multiline rows={2}
              value={descRu} onChange={(e) => setDescRu(e.target.value)} />
            <TextField size="small" label={t('admin.tariffs_desc_uz')} fullWidth multiline rows={2}
              value={descUz} onChange={(e) => setDescUz(e.target.value)} />
          </Stack>

          {/* ── Цена ────────────────────────────────────────── */}
          <TextField
            size="small" label={t('admin.tariffs_base_price')} type="number" fullWidth
            InputProps={{ startAdornment: <InputAdornment position="start">UZS</InputAdornment> }}
            value={price} onChange={(e) => setPrice(e.target.value)}
          />

          {/* ── Цвет ────────────────────────────────────────── */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>{t('admin.tariffs_card_color')}</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {COLOR_PRESETS.map((c) => (
                <Box key={c} onClick={() => setColor(c)}
                  sx={{
                    width: 32, height: 32, borderRadius: '50%', bgcolor: c, cursor: 'pointer',
                    border: color === c ? '3px solid' : '2px solid transparent',
                    borderColor: color === c ? 'text.primary' : 'transparent',
                    transition: 'transform 0.15s',
                    '&:hover': { transform: 'scale(1.18)' },
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  {color === c && <CheckIcon sx={{ fontSize: 16, color: '#fff' }} />}
                </Box>
              ))}
            </Stack>
          </Box>

          {/* ── Флаги ───────────────────────────────────────── */}
          <Stack direction="row" spacing={3} alignItems="center">
            <FormControlLabel
              control={<Switch checked={popular} onChange={(e) => setPopular(e.target.checked)} color="warning" size="small" />}
              label={<Typography variant="body2" fontWeight={600}>{t('admin.tariffs_popular')}</Typography>}
            />
            <FormControlLabel
              control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} color="success" size="small" />}
              label={<Typography variant="body2" fontWeight={600} color={isActive ? 'success.main' : 'text.disabled'}>
                {isActive ? t('admin.tariffs_status_active') : t('admin.tariffs_status_hidden')}
              </Typography>}
            />
          </Stack>

          {/* ── Что включено (RU) ───────────────────────────── */}
          <FeatureList uz={false} />

          {/* ── Что включено (UZ) ───────────────────────────── */}
          <Box>
            <Button
              size="small" variant="text"
              endIcon={showUzFeat ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowUzFeat(!showUzFeat)}
              sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary' }}
            >
              {showUzFeat ? t('admin.tariffs_hide_uz') : t('admin.tariffs_show_uz')}
            </Button>
            <Collapse in={showUzFeat}>
              <Box sx={{ mt: 1.5 }}>
                <FeatureList uz={true} />
              </Box>
            </Collapse>
          </Box>

        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>{t('common.cancel')}</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!isValid || loading}
          sx={{ borderRadius: 2, bgcolor: color, '&:hover': { bgcolor: color, filter: 'brightness(0.9)' } }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isNew ? t('admin.tariffs_create_btn') : t('admin.tariffs_save_btn')}
        </Button>
      </DialogActions>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* ── Карточка тарифного плана ────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────── */
function PlanCard({ plan, idx, onEdit, onDelete, onToggleActive }) {
  const { t } = useTranslation();
  const icon = PLAN_ICON[plan.key] ?? (plan.type === 'individual_package' ? <InventoryIcon /> : PLAN_ICON.default);
  const teacherName = plan.teacher ? (plan.teacher.name ?? '') : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.08 }}
    >
      <Card elevation={0} sx={{
        border: '2px solid', borderColor: plan.isActive ? plan.color + '40' : 'divider',
        borderRadius: 3, height: '100%', position: 'relative', overflow: 'visible',
        opacity: plan.isActive ? 1 : 0.65,
        transition: 'opacity 0.2s',
      }}>
        {/* Заголовок */}
        <Box sx={{ bgcolor: plan.color, borderRadius: '10px 10px 0 0', p: 2.5, color: '#fff', position: 'relative' }}>
          {/* Активность и type бейджи */}
          <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 10, right: 10 }}>
            {plan.type === 'individual_package' && (
              <Chip size="small" icon={<InventoryIcon sx={{ fontSize: 12, color: '#fff !important' }} />}
                label={t('admin.tariffs_ind_package')}
                sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700, fontSize: '0.62rem', height: 20 }} />
            )}
            {plan.popular && (
              <Chip size="small" icon={<StarIcon sx={{ fontSize: 12, color: '#fff !important' }} />}
                label={t('admin.tariffs_top')}
                sx={{ bgcolor: 'rgba(255,200,0,0.35)', color: '#fff', fontWeight: 700, fontSize: '0.62rem', height: 20 }} />
            )}
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ opacity: 0.9, display: 'flex' }}>{icon}</Box>
                <Typography variant="h6" fontWeight={800}>{plan.name?.ru}</Typography>
              </Stack>
              {plan.name?.uz && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>{plan.name.uz}</Typography>
              )}
              <Chip label={`#${plan.key}`} size="small"
                sx={{ mt: 0.5, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, height: 20, fontSize: '0.65rem', width: 'fit-content' }} />
            </Stack>
            <Stack direction="row" spacing={0.5} sx={{ mt: 3.5 }}>
              <Tooltip title={plan.isActive ? t('admin.tariffs_deactivate') : t('admin.tariffs_activate')}>
                <IconButton size="small" onClick={() => onToggleActive(plan)}
                  sx={{ color: '#fff', bgcolor: plan.isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,0,0,0.25)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                  <PowerSettingsNewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('common.edit')}>
                <IconButton size="small" onClick={() => onEdit(plan)}
                  sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title={t('common.delete')}>
                <IconButton size="small" onClick={() => onDelete(plan)}
                  sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(220,38,38,0.5)' } }}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {/* Цена */}
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" alignItems="baseline" spacing={0.5}>
              <Typography variant="h4" fontWeight={900}>{formatPrice(plan.defaultPrice)}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.85 }}>{t('admin.tariffs_price_suffix')}</Typography>
            </Stack>
          </Box>
        </Box>

        {/* Тело карточки */}
        <CardContent sx={{ p: 2.5 }}>
          {/* Описание */}
          {plan.description?.ru && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontStyle: 'italic' }}>
              {plan.description.ru}
            </Typography>
          )}

          {/* Учитель (для individual_package) */}
          {plan.type === 'individual_package' && teacherName && (
            <Box sx={{
              mb: 1.5, px: 1.25, py: 0.75, borderRadius: '8px',
              bgcolor: plan.color + '10', border: `1px solid ${plan.color}30`,
              display: 'flex', alignItems: 'center', gap: 1,
            }}>
              <PersonIcon sx={{ fontSize: 14, color: plan.color }} />
              <Typography variant="caption" fontWeight={700} color={plan.color}>
                {teacherName}
              </Typography>
            </Box>
          )}

          {/* Статус */}
          <Box sx={{ mb: 1.5 }}>
            <Chip
              size="small"
              label={plan.isActive ? t('admin.tariffs_status_active') : t('admin.tariffs_status_hidden')}
              color={plan.isActive ? 'success' : 'default'}
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Box>

          {/* Возможности */}
          {(!plan.features || plan.features.length === 0) ? (
            <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ py: 1 }}>
              {t('admin.tariffs_no_features')}
            </Typography>
          ) : (
            <Stack spacing={1}>
              {plan.features.map((f, i) => (
                <Stack key={i} direction="row" spacing={1} alignItems="flex-start">
                  <CheckIcon sx={{ fontSize: 16, color: plan.color, mt: 0.15, flexShrink: 0 }} />
                  <Typography variant="body2" color="text.secondary">{f}</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* ── Главный компонент ───────────────────────────────────────── */
/* ─────────────────────────────────────────────────────────────── */
export default function AdminTariffs() {
  const { t } = useTranslation();
  const { data: plansData, isLoading } = useGetTariffPlansQuery();
  const plans = Array.isArray(plansData?.data) ? plansData.data : [];

  const [createPlan, { isLoading: creating }] = useCreateTariffPlanMutation();
  const [updatePlan, { isLoading: updating }] = useUpdateTariffPlanMutation();
  const [deletePlan, { isLoading: deleting }] = useDeleteTariffPlanMutation();

  /* Диалоги */
  const [addOpen,       setAddOpen]       = useState(false);
  const [editDialog,    setEditDialog]    = useState({ open: false, plan: null });
  const [deleteDialog,  setDeleteDialog]  = useState({ open: false, plan: null });
  const [snack,         setSnack]         = useState({ open: false, msg: '', severity: 'success' });

  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  /* Создание */
  const handleCreate = async (data) => {
    try {
      await createPlan(data).unwrap();
      showSnack(t('admin.tariffs_created'));
      setAddOpen(false);
    } catch (e) {
      showSnack(e?.data?.message ?? t('common.error'), 'error');
    }
  };

  /* Редактирование */
  const handleEdit = async (data) => {
    try {
      await updatePlan({ key: editDialog.plan.key, ...data }).unwrap();
      showSnack(t('admin.tariffs_updated'));
      setEditDialog({ open: false, plan: null });
    } catch (e) {
      showSnack(e?.data?.message ?? t('common.error'), 'error');
    }
  };

  /* Удаление */
  const handleDelete = async () => {
    try {
      await deletePlan(deleteDialog.plan.key).unwrap();
      showSnack(t('admin.tariffs_deleted'));
      setDeleteDialog({ open: false, plan: null });
    } catch (e) {
      showSnack(e?.data?.message ?? t('common.error'), 'error');
    }
  };

  /* Переключение активности */
  const handleToggleActive = async (plan) => {
    try {
      await updatePlan({ key: plan.key, isActive: !plan.isActive }).unwrap();
      showSnack(!plan.isActive ? t('admin.tariffs_activated') : t('admin.tariffs_hidden_snack'));
    } catch (e) {
      showSnack(e?.data?.message ?? t('common.error'), 'error');
    }
  };

  const EMPTY_PLAN = { name: { ru: '', uz: '' }, description: { ru: '', uz: '' }, key: '', defaultPrice: '', color: COLOR_PRESETS[0], features: [], featuresUz: [], popular: false, isActive: true, type: 'regular', teacher: '' };

  return (
    <Box>
      <PageHeader
        icon={<OndemandVideoIcon />}
        title={t('admin.tariffs_management')}
        subtitle={t('admin.tariffs_subtitle')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />}
            onClick={() => setAddOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 700 }}>
            {t('admin.tariffs_add')}
          </Button>
        }
      />

      {/* Уведомление */}
      <Snackbar
        open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>

      {/* Загрузка */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {plans.length === 0 && (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', py: 8 }}>
              <Stack alignItems="center" spacing={2}>
                <OndemandVideoIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
                <Typography variant="h6" color="text.secondary">{t('admin.tariffs_empty')}</Typography>
                <Typography variant="body2" color="text.disabled">
                  {t('admin.tariffs_empty_hint')}
                </Typography>
                <Button variant="contained" startIcon={<AddIcon />}
                  onClick={() => setAddOpen(true)} sx={{ borderRadius: 2, mt: 1 }}>
                  {t('admin.tariffs_add')}
                </Button>
              </Stack>
            </Card>
          )}

          <Grid container spacing={3}>
            {plans.map((plan, idx) => (
              <Grid item xs={12} sm={6} md={4} key={plan.key}>
                <PlanCard
                  plan={plan} idx={idx}
                  onEdit={(p) => setEditDialog({ open: true, plan: p })}
                  onDelete={(p) => setDeleteDialog({ open: true, plan: p })}
                  onToggleActive={handleToggleActive}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* ── Диалог создания ─────────────────────────────────────── */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth
        disableEscapeKeyDown
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          {t('admin.tariffs_new')}
          <IconButton size="small" onClick={() => setAddOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <PlanForm
          plan={EMPTY_PLAN}
          isNew
          onSave={handleCreate}
          onClose={() => setAddOpen(false)}
          loading={creating}
        />
      </Dialog>

      {/* ── Диалог редактирования ───────────────────────────────── */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, plan: null })} maxWidth="sm" fullWidth
        disableEscapeKeyDown
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700 }}>
          {t('admin.tariffs_edit_prefix')} {editDialog.plan?.name?.ru}
          <IconButton size="small" onClick={() => setEditDialog({ open: false, plan: null })}><CloseIcon /></IconButton>
        </DialogTitle>
        {editDialog.plan && (
          <PlanForm
            plan={editDialog.plan}
            isNew={false}
            onSave={handleEdit}
            onClose={() => setEditDialog({ open: false, plan: null })}
            loading={updating}
          />
        )}
      </Dialog>

      {/* ── Диалог подтверждения удаления ───────────────────────── */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, plan: null })} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{t('admin.tariffs_delete_title')}</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {t('admin.tariffs_delete_about')}{' '}
              <Box component="span" fontWeight={700} color="text.primary">
                «{deleteDialog.plan?.name?.ru}»
              </Box>.
            </Typography>
            <Typography variant="body2" color="error.main">
              {t('admin.tariffs_cannot_undo')}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialog({ open: false, plan: null })} sx={{ borderRadius: 2 }}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained" color="error" onClick={handleDelete}
            disabled={deleting} sx={{ borderRadius: 2 }}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
