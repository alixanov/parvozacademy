import {
  Box, Typography, Card, CardContent, Stack, Chip, Button,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Switch, FormControlLabel,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar,
  InputAdornment, Snackbar, Alert, CircularProgress, Collapse,
  Divider,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddIcon           from '@mui/icons-material/Add';
import EditIcon          from '@mui/icons-material/Edit';
import DeleteIcon        from '@mui/icons-material/Delete';
import WorkIcon          from '@mui/icons-material/Work';
import PeopleIcon        from '@mui/icons-material/People';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import CancelIcon        from '@mui/icons-material/Cancel';
import ExpandMoreIcon    from '@mui/icons-material/ExpandMore';
import ExpandLessIcon    from '@mui/icons-material/ExpandLess';
import ToggleOnIcon      from '@mui/icons-material/ToggleOn';
import ToggleOffIcon     from '@mui/icons-material/ToggleOff';
import AttachMoneyIcon   from '@mui/icons-material/AttachMoney';
import PageHeader        from '../../../components/common/PageHeader/index.jsx';
import {
  useGetVacanciesQuery,
  useCreateVacancyMutation,
  useUpdateVacancyMutation,
  useDeleteVacancyMutation,
  useGetVacancyApplicationsQuery,
  useUpdateApplicationStatusMutation,
} from '../../../features/vacancies/vacanciesApi.js';

const STATUS_COLOR = {
  pending:  { bg: '#FEF3C7', color: '#92400E', label: 'Kutilmoqda' },
  reviewed: { bg: '#DBEAFE', color: '#1E40AF', label: "Ko'rib chiqildi" },
  accepted: { bg: '#D1FAE5', color: '#065F46', label: 'Qabul qilindi' },
  rejected: { bg: '#FEE2E2', color: '#991B1B', label: 'Rad etildi' },
};

const TYPE_LABEL = {
  'full-time':  "To'liq stavka",
  'part-time':  'Qisman stavka',
  'internship': 'Amaliyot',
};

const emptyForm = {
  title: '', description: '', subject: '', type: 'full-time',
  salaryMin: '', salaryMax: '', requirements: '', isActive: true,
};

/* ── Inline applications list ──────────────────────────────── */
function ApplicationsList({ vacancyId }) {
  const { data, isLoading } = useGetVacancyApplicationsQuery(vacancyId);
  const [updateStatus] = useUpdateApplicationStatusMutation();
  const apps = data?.data ?? [];

  if (isLoading) {
    return <Box sx={{ py: 3, textAlign: 'center' }}><CircularProgress size={24} /></Box>;
  }

  if (apps.length === 0) {
    return (
      <Box sx={{ py: 3, textAlign: 'center' }}>
        <PeopleIcon sx={{ fontSize: 32, opacity: 0.2, mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary">Arizalar yo'q</Typography>
      </Box>
    );
  }

  return (
    <Table size="small">
      <TableHead>
        <TableRow sx={{ bgcolor: 'action.hover' }}>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Nomzod</TableCell>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Kontakt</TableCell>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Rezyume</TableCell>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Holat</TableCell>
          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Amallar</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {apps.map((app) => {
          const sc = STATUS_COLOR[app.status] ?? STATUS_COLOR.pending;
          return (
            <TableRow key={app._id} hover>
              <TableCell>
                <Stack direction="row" alignItems="center" gap={1.2}>
                  <Avatar sx={{ width: 30, height: 30, fontSize: 13, bgcolor: 'primary.main' }}>
                    {app.name?.[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.8rem' }}>{app.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(app.appliedAt).toLocaleDateString('ru-RU')}
                    </Typography>
                  </Box>
                </Stack>
              </TableCell>
              <TableCell>
                <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{app.email}</Typography>
                {app.phone && <Typography variant="caption" color="text.secondary">{app.phone}</Typography>}
              </TableCell>
              <TableCell>
                {app.resumeUrl ? (
                  <Button size="small" variant="outlined" href={app.resumeUrl} target="_blank" rel="noopener"
                    sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.72rem', py: 0.25, px: 1 }}>
                    Yuklab olish
                  </Button>
                ) : '—'}
              </TableCell>
              <TableCell>
                <Chip label={sc.label} size="small"
                  sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.7rem' }} />
              </TableCell>
              <TableCell>
                <Stack direction="row" gap={0.5}>
                  {['reviewed', 'accepted', 'rejected'].map((s) => (
                    <Tooltip key={s} title={STATUS_COLOR[s].label}>
                      <IconButton size="small" disabled={app.status === s}
                        onClick={() => updateStatus({ vacancyId, appId: app._id, status: s })}
                        sx={{
                          color: STATUS_COLOR[s].color,
                          bgcolor: STATUS_COLOR[s].bg + '80',
                          '&:hover': { bgcolor: STATUS_COLOR[s].bg },
                          '&.Mui-disabled': { opacity: 0.3 },
                          width: 26, height: 26,
                        }}>
                        {s === 'accepted'
                          ? <CheckCircleIcon sx={{ fontSize: 14 }} />
                          : <CancelIcon sx={{ fontSize: 14 }} />}
                      </IconButton>
                    </Tooltip>
                  ))}
                </Stack>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/* ── Vacancy card ──────────────────────────────────────────── */
function VacancyCard({ v, lang, onEdit, onDelete, onToggleActive }) {
  const [open, setOpen] = useState(false);
  const appCount = v.applications?.length ?? 0;

  return (
    <Card elevation={0} sx={{
      border: '1.5px solid',
      borderColor: v.isActive ? 'divider' : '#FEE2E2',
      borderRadius: 3,
      overflow: 'hidden',
      opacity: v.isActive ? 1 : 0.75,
    }}>
      {/* Card header */}
      <CardContent sx={{ pb: 1.5 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap" sx={{ mb: 0.75 }}>
              <Typography variant="subtitle1" fontWeight={800} noWrap>{v.title}</Typography>
              <Chip label={TYPE_LABEL[v.type] ?? v.type} size="small"
                sx={{
                  bgcolor: v.type === 'full-time' ? '#DBEAFE' : v.type === 'internship' ? '#D1FAE5' : '#F3E8FF',
                  color:   v.type === 'full-time' ? '#1E40AF' : v.type === 'internship' ? '#065F46' : '#6D28D9',
                  fontWeight: 700, fontSize: '0.7rem',
                }} />
              {v.subject && (
                <Typography variant="caption" color="text.secondary">{v.subject}</Typography>
              )}
            </Stack>

            <Stack direction="row" gap={2} flexWrap="wrap">
              {v.salary?.min > 0 && (
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  💰 {(v.salary.min / 1_000_000).toFixed(1)} – {(v.salary.max / 1_000_000).toFixed(1)} mln UZS
                </Typography>
              )}
              <Chip
                icon={<PeopleIcon sx={{ fontSize: '13px !important' }} />}
                label={`${appCount} ariza`}
                size="small"
                sx={{ fontWeight: 700, bgcolor: appCount > 0 ? '#FEF3C7' : 'action.hover', color: appCount > 0 ? '#92400E' : 'text.secondary' }}
              />
            </Stack>
          </Box>

          {/* Actions */}
          <Stack direction="row" alignItems="center" gap={0.5} flexShrink={0}>
            {/* Activate/Deactivate toggle */}
            <Tooltip title={v.isActive ? "O'chirish (saytdan yashirish)" : "Faollashtirish (saytda ko'rsatish)"}>
              <IconButton
                size="small"
                onClick={() => onToggleActive(v)}
                sx={{ color: v.isActive ? '#10B981' : '#9CA3AF' }}
              >
                {v.isActive
                  ? <ToggleOnIcon sx={{ fontSize: 28 }} />
                  : <ToggleOffIcon sx={{ fontSize: 28 }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Tahrirlash">
              <IconButton size="small" onClick={() => onEdit(v)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="O'chirish">
              <IconButton size="small" onClick={() => onDelete(v)} color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Expand/collapse applications */}
        <Button
          size="small"
          startIcon={<PeopleIcon sx={{ fontSize: '15px !important' }} />}
          endIcon={open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          onClick={() => setOpen((s) => !s)}
          sx={{
            mt: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600,
            fontSize: '0.78rem', color: open ? 'primary.main' : 'text.secondary',
            bgcolor: open ? 'primary.50' : 'action.hover',
            px: 1.5, py: 0.5,
            '&:hover': { bgcolor: 'primary.50', color: 'primary.main' },
          }}
        >
          {open ? "Arizalarni yopish" : `Arizalarni ko'rish (${appCount})`}
        </Button>
      </CardContent>

      {/* Inline applications */}
      <Collapse in={open} unmountOnExit>
        <Divider />
        <Box sx={{ overflowX: 'auto' }}>
          <ApplicationsList vacancyId={v._id} />
        </Box>
      </Collapse>
    </Card>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function AdminVacancies() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';

  const { data, isLoading } = useGetVacanciesQuery({ limit: 200, activeOnly: false });
  const vacancies = data?.data ?? [];

  const [createVacancy, { isLoading: creating }] = useCreateVacancyMutation();
  const [updateVacancy, { isLoading: updating }] = useUpdateVacancyMutation();
  const [deleteVacancy] = useDeleteVacancyMutation();

  const [formOpen, setFormOpen]      = useState(false);
  const [editing, setEditing]        = useState(null);
  const [form, setForm]              = useState(emptyForm);
  const [deleteTarget, setDelTarget] = useState(null);
  const [snack, setSnack]            = useState({ open: false, msg: '', severity: 'success' });

  const showSnack = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  const openCreate = () => { setEditing(null); setForm(emptyForm); setFormOpen(true); };
  const openEdit   = (v) => {
    setEditing(v);
    setForm({
      title:        v.title ?? '',
      description:  v.description ?? '',
      subject:      v.subject ?? '',
      type:         v.type ?? 'full-time',
      salaryMin:    v.salary?.min ?? '',
      salaryMax:    v.salary?.max ?? '',
      requirements: Array.isArray(v.requirements) ? v.requirements.join('\n') : '',
      isActive:     v.isActive ?? true,
    });
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    const payload = {
      title:        form.title.trim(),
      description:  form.description.trim(),
      subject:      form.subject.trim() || undefined,
      type:         form.type,
      salary:       { min: Number(form.salaryMin) || 0, max: Number(form.salaryMax) || 0, currency: 'UZS' },
      requirements: form.requirements.split('\n').map((s) => s.trim()).filter(Boolean),
      isActive:     form.isActive,
    };
    try {
      if (editing) {
        await updateVacancy({ id: editing._id, ...payload }).unwrap();
        showSnack('Vakansiya yangilandi');
      } else {
        await createVacancy(payload).unwrap();
        showSnack('Vakansiya yaratildi');
      }
      setFormOpen(false);
    } catch (err) {
      showSnack(err?.data?.message ?? 'Xato yuz berdi', 'error');
    }
  };

  const handleToggleActive = async (v) => {
    try {
      await updateVacancy({ id: v._id, isActive: !v.isActive }).unwrap();
      showSnack(v.isActive ? "Vakansiya o'chirildi (saytdan yashirildi)" : 'Vakansiya faollashtirildi (saytda ko\'rinadi)');
    } catch {
      showSnack('Xato yuz berdi', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteVacancy(deleteTarget._id).unwrap();
      showSnack("Vakansiya o'chirildi");
    } catch {
      showSnack("O'chirishda xato", 'error');
    }
    setDelTarget(null);
  };

  return (
    <Box>
      <PageHeader
        title="Vakansiyalar"
        subtitle={`Jami ${vacancies.length} ta vakansiya`}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
            sx={{ borderRadius: 2.5, fontWeight: 700, textTransform: 'none' }}>
            Vakansiya qo'shish
          </Button>
        }
      />

      {/* Stats */}
      <Stack direction="row" gap={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Jami',     value: vacancies.length,                              color: '#1976D2' },
          { label: 'Faol',     value: vacancies.filter((v) => v.isActive).length,    color: '#10B981' },
          { label: 'Yopiq',    value: vacancies.filter((v) => !v.isActive).length,   color: '#EF4444' },
          { label: 'Arizalar', value: vacancies.reduce((s, v) => s + (v.applications?.length ?? 0), 0), color: '#F59E0B' },
        ].map(({ label, value, color }) => (
          <Card key={label} elevation={0} sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: 3, minWidth: 120 }}>
            <CardContent sx={{ py: 1.5, px: 2.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="h5" fontWeight={800} sx={{ color }}>{value}</Typography>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Vacancy cards */}
      {isLoading ? (
        <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>
      ) : vacancies.length === 0 ? (
        <Card elevation={0} sx={{ border: '1.5px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <WorkIcon sx={{ fontSize: 48, opacity: 0.2, mb: 2 }} />
            <Typography color="text.secondary">Vakansiyalar yo'q</Typography>
            <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ mt: 2, borderRadius: 2.5 }}>
              Birinchi vakansiyani qo'shing
            </Button>
          </Box>
        </Card>
      ) : (
        <Stack spacing={2}>
          {vacancies.map((v) => (
            <VacancyCard
              key={v._id}
              v={v}
              lang={lang}
              onEdit={openEdit}
              onDelete={setDelTarget}
              onToggleActive={handleToggleActive}
            />
          ))}
        </Stack>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={800}>
            {editing ? 'Vakansiyani tahrirlash' : 'Yangi vakansiya'}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 2.5 }}>
            <TextField label="Vakansiya nomi *" fullWidth value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              error={!form.title.trim() && formOpen}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <TextField label="Tavsif *" fullWidth multiline rows={3} value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <Stack direction="row" gap={2}>
              <TextField label="Fan / Yo'nalish" fullWidth value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <TextField select label="Ish turi *" fullWidth value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                <MenuItem value="full-time">To'liq stavka</MenuItem>
                <MenuItem value="part-time">Qisman stavka</MenuItem>
                <MenuItem value="internship">Amaliyot</MenuItem>
              </TextField>
            </Stack>
            <Stack direction="row" gap={2}>
              <TextField label="Min maosh (UZS)" fullWidth type="number" value={form.salaryMin}
                onChange={(e) => setForm((f) => ({ ...f, salaryMin: e.target.value }))}
                InputProps={{ startAdornment: <InputAdornment position="start">UZS</InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <TextField label="Max maosh (UZS)" fullWidth type="number" value={form.salaryMax}
                onChange={(e) => setForm((f) => ({ ...f, salaryMax: e.target.value }))}
                InputProps={{ startAdornment: <InputAdornment position="start">UZS</InputAdornment> }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </Stack>
            <TextField
              label="Talablar (har bir qator — alohida talab)" fullWidth multiline rows={4}
              placeholder={"Tajriba 2+ yil\nO'zbek va rus tillarini bilish\nJavobgarlik"}
              value={form.requirements}
              onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <FormControlLabel
              control={
                <Switch checked={form.isActive} color="success"
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} />
              }
              label={form.isActive ? "Faol (saytda ko'rinadi)" : "Yopiq (saytda ko'rinmaydi)"}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2.5, borderTop: '1px solid', borderColor: 'divider', gap: 1 }}>
          <Button onClick={() => setFormOpen(false)} sx={{ borderRadius: 2, color: 'text.secondary' }}>
            Bekor qilish
          </Button>
          <Button variant="contained" onClick={handleSave}
            disabled={creating || updating || !form.title.trim() || !form.description.trim()}
            startIcon={(creating || updating) ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ borderRadius: 2.5, fontWeight: 700 }}>
            {editing ? 'Saqlash' : 'Yaratish'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDelTarget(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight={800}>Vakansiyani o'chirish</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>"{deleteTarget?.title}"</strong> vakansiyasini o'chirishni tasdiqlaysizmi?
            Barcha arizalar ham o'chib ketadi.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setDelTarget(null)} sx={{ borderRadius: 2 }}>Bekor qilish</Button>
          <Button variant="contained" color="error" onClick={handleDelete} sx={{ borderRadius: 2, fontWeight: 700 }}>
            O'chirish
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snack */}
      <Snackbar open={snack.open} autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
