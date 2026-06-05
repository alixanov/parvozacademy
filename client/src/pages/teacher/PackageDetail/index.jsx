import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Typography, Stack, Button, IconButton, Tooltip,
  TextField, Dialog, DialogContent, DialogActions,
  CircularProgress, Alert, Chip, MenuItem, LinearProgress,
} from '@mui/material';
import ArrowBackIcon     from '@mui/icons-material/ArrowBack';
import InventoryIcon     from '@mui/icons-material/Inventory';
import AddIcon           from '@mui/icons-material/Add';
import EditIcon          from '@mui/icons-material/Edit';
import DeleteIcon        from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import LinkIcon          from '@mui/icons-material/Link';
import AttachFileIcon    from '@mui/icons-material/AttachFile';
import DescriptionIcon   from '@mui/icons-material/Description';
import SaveIcon          from '@mui/icons-material/Save';
import CloseIcon         from '@mui/icons-material/Close';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import PlayCircleIcon    from '@mui/icons-material/PlayCircle';
import AssignmentIcon    from '@mui/icons-material/Assignment';
import i18n from '../../../utils/i18n.js';
import {
  useGetPackageByIdQuery,
  useUpdatePackageMutation,
  useAddPackageModuleMutation,
  useUpdatePackageModuleMutation,
  useDeletePackageModuleMutation,
} from '../../../features/packages/packagesApi.js';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function pTitle(pkg) {
  if (!pkg?.title) return '—';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const t = pkg.title;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '—';
  return t ?? '—';
}
function modTitle(mod) {
  if (!mod?.title) return '';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const t = mod.title;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '';
  return typeof t === 'string' ? t : '';
}

const STATUS_CFG = {
  draft:     { label: 'Qoralama',  bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' },
  published: { label: 'Nashr',     bg: '#F0FDF4', color: '#15803D', dot: '#10B981' },
  archived:  { label: 'Arxiv',     bg: '#FFF7ED', color: '#C2410C', dot: '#F59E0B' },
};

const FILE_TYPES = [
  { value: 'pdf',   label: 'PDF' },
  { value: 'doc',   label: 'DOC' },
  { value: 'docx',  label: 'DOCX' },
  { value: 'pptx',  label: 'PPTX' },
  { value: 'other', label: 'Boshqa' },
];

/* ── Quiz Question Card ──────────────────────────────────────────────────── */
const OPT_LABELS = ['A', 'B', 'C', 'D'];

function QuizQuestionCard({ qi, q, onUpdate, onRemove }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#F8FAFF', border: '1px solid #E2E8F0' }}>
      <Stack direction="row" spacing={1} alignItems="flex-start" mb={1}>
        <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: '#7C3AED',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.5 }}>
          <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#fff' }}>{qi + 1}</Typography>
        </Box>
        <TextField size="small" fullWidth
          placeholder={`Savol ${qi + 1} matni`}
          value={q.question}
          onChange={(e) => onUpdate(qi, 'question', e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff', fontSize: '0.82rem' } }}
        />
        <IconButton size="small" onClick={onRemove}
          sx={{ width: 26, height: 26, color: '#EF4444', bgcolor: '#FEF2F2', borderRadius: 1.5, flexShrink: 0, mt: 0.25 }}>
          <CloseIcon sx={{ fontSize: 13 }} />
        </IconButton>
      </Stack>

      <Stack spacing={0.6} ml={4}>
        {q.options.map((opt, oi) => (
          <Stack key={oi} direction="row" spacing={0.75} alignItems="center">
            <Box
              onClick={() => onUpdate(qi, 'correct', oi)}
              sx={{
                width: 20, height: 20, borderRadius: '50%',
                border: '2px solid',
                borderColor: q.correct === oi ? '#10B981' : '#CBD5E1',
                bgcolor: q.correct === oi ? '#10B981' : 'transparent',
                cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
              {q.correct === oi && (
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#fff' }} />
              )}
            </Box>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B', width: 13, flexShrink: 0 }}>
              {OPT_LABELS[oi]}
            </Typography>
            <TextField size="small" fullWidth
              placeholder={`Variant ${OPT_LABELS[oi]}`}
              value={opt}
              onChange={(e) => onUpdate(qi, 'option', { idx: oi, text: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5, bgcolor: '#fff', fontSize: '0.78rem', height: 32 } }}
            />
          </Stack>
        ))}
        <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', mt: 0.25 }}>
          ● to'g'ri javobni belgilash uchun doirachani bosing
        </Typography>
      </Stack>
    </Box>
  );
}

/* ── Module Form Dialog ──────────────────────────────────────────────────── */
function ModuleDialog({ open, onClose, pkgId, existingModule, moduleIdx, onSaved }) {
  const isEdit = existingModule != null;

  const blankQuiz = () => ({ question: '', options: ['', '', '', ''], correct: 0 });
  const blank = { titleUz: '', titleRu: '', description: '',
    fileUrl: '', fileName: '', fileType: 'pdf', videoUrl: '', quiz: [] };

  const [form, setForm] = useState(blank);
  const [err, setErr]   = useState('');

  useEffect(() => {
    if (open) {
      if (isEdit && existingModule) {
        setForm({
          titleUz:     existingModule.title?.uz  ?? (typeof existingModule.title === 'string' ? existingModule.title : ''),
          titleRu:     existingModule.title?.ru  ?? '',
          description: existingModule.description ?? '',
          fileUrl:     existingModule.file?.url  ?? '',
          fileName:    existingModule.file?.name ?? '',
          fileType:    existingModule.file?.type ?? 'pdf',
          videoUrl:    existingModule.videoUrl ?? '',
          quiz:        (existingModule.quiz ?? []).map(q => ({
            question: q.question ?? '',
            options:  q.options?.length === 4 ? [...q.options] : ['', '', '', ''],
            correct:  q.correct ?? 0,
          })),
        });
      } else {
        setForm(blank);
      }
      setErr('');
    }
  }, [open, isEdit]);

  const [addModule,    { isLoading: adding  }] = useAddPackageModuleMutation();
  const [updateModule, { isLoading: updating }] = useUpdatePackageModuleMutation();

  const isLoading = adding || updating;

  const handle = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  /* ── quiz helpers ── */
  const addQuestion = () => {
    if (form.quiz.length >= 10) return;
    setForm(p => ({ ...p, quiz: [...p.quiz, blankQuiz()] }));
  };
  const removeQuestion = (qi) => {
    setForm(p => ({ ...p, quiz: p.quiz.filter((_, i) => i !== qi) }));
  };
  const updateQuestion = (qi, field, val) => {
    setForm(p => {
      const quiz = p.quiz.map((q, i) => {
        if (i !== qi) return q;
        if (field === 'option') {
          const options = [...q.options];
          options[val.idx] = val.text;
          return { ...q, options };
        }
        return { ...q, [field]: val };
      });
      return { ...p, quiz };
    });
  };

  const handleSave = async () => {
    setErr('');
    if (!form.titleUz.trim()) { setErr('Modul nomi (O\'zbek) majburiy'); return; }
    const payload = {
      title:       { uz: form.titleUz.trim(), ru: form.titleRu.trim() },
      description: form.description.trim(),
      file: {
        url:  form.fileUrl.trim(),
        name: form.fileName.trim() || form.fileUrl.trim().split('/').pop() || 'fayl',
        type: form.fileType,
      },
      videoUrl: form.videoUrl.trim(),
      quiz: form.quiz
        .filter(q => q.question.trim())
        .map(q => ({
          question: q.question.trim(),
          options:  q.options.map(o => o.trim()),
          correct:  q.correct,
        })),
    };
    try {
      if (isEdit) {
        await updateModule({ id: pkgId, idx: moduleIdx, ...payload }).unwrap();
      } else {
        await addModule({ id: pkgId, ...payload }).unwrap();
      }
      onSaved?.();
      onClose();
    } catch (e) { setErr(e?.data?.message ?? 'Xatolik'); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}>
      <Box sx={{ px: 3, pt: 2.5, pb: 1.5, borderBottom: '1px solid #F1F5F9',
        display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#F3E8FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <InventoryIcon sx={{ fontSize: 17, color: '#7C3AED' }} />
        </Box>
        <Typography fontWeight={800} sx={{ flex: 1, fontSize: '0.95rem' }}>
          {isEdit ? 'Modulni tahrirlash' : 'Yangi modul'}
        </Typography>
        <IconButton size="small" onClick={onClose}><CloseIcon sx={{ fontSize: 18 }} /></IconButton>
      </Box>

      <DialogContent sx={{ p: 2.5, overflowY: 'auto' }}>
        {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}>{err}</Alert>}

        {/* Title */}
        <Label>Nomi</Label>
        <Stack spacing={1.25} mb={2.25}>
          <TextField size="small" label="Nomi (O'zbek) *" fullWidth value={form.titleUz} onChange={handle('titleUz')}
            sx={inputSx} />
          <TextField size="small" label="Nomi (Ruscha)" fullWidth value={form.titleRu} onChange={handle('titleRu')}
            sx={inputSx} />
        </Stack>

        {/* Description */}
        <Label>Tavsif</Label>
        <TextField size="small" label="Modul haqida" fullWidth multiline rows={3} value={form.description} onChange={handle('description')}
          sx={{ ...inputSx, mb: 2.25 }} />

        {/* File */}
        <Label icon={<AttachFileIcon sx={{ fontSize: 14 }} />}>Fayl (PDF / Word / PPTX)</Label>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} mb={2.25}>
          <TextField size="small" label="Fayl URL" fullWidth value={form.fileUrl} onChange={handle('fileUrl')}
            placeholder="https://drive.google.com/... yoki https://..."
            sx={inputSx}
            InputProps={{ startAdornment: <AttachFileIcon sx={{ mr: 0.5, fontSize: 14, color: '#CBD5E1' }} /> }}
          />
          <TextField select size="small" label="Tur" sx={{ minWidth: 100, ...inputSx }}
            value={form.fileType} onChange={handle('fileType')}>
            {FILE_TYPES.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
          </TextField>
        </Stack>

        {/* Video */}
        <Label icon={<PlayCircleIcon sx={{ fontSize: 14 }} />}>YouTube havolasi</Label>
        <TextField size="small" label="YouTube URL" fullWidth value={form.videoUrl} onChange={handle('videoUrl')}
          placeholder="https://youtube.com/watch?v=... yoki https://youtu.be/..."
          sx={{ ...inputSx, mb: 2.25 }}
          InputProps={{ startAdornment: <LinkIcon sx={{ mr: 0.5, fontSize: 14, color: '#CBD5E1' }} /> }}
        />

        {/* ── Quiz Section ── */}
        <Box sx={{ borderTop: '1px solid #F1F5F9', pt: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <AssignmentIcon sx={{ fontSize: 15, color: '#7C3AED' }} />
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#7C3AED',
                textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Yakuniy test — {form.quiz.length}/10 savol
              </Typography>
            </Stack>
            <Button size="small" variant="outlined"
              disabled={form.quiz.length >= 10}
              onClick={addQuestion}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.72rem',
                py: 0.3, px: 1.25, borderColor: '#7C3AED', color: '#7C3AED',
                '&:hover': { bgcolor: '#F3E8FF', borderColor: '#7C3AED' },
                '&.Mui-disabled': { opacity: 0.4 } }}>
              + Savol qo'shish
            </Button>
          </Stack>

          {form.quiz.length === 0 ? (
            <Box sx={{ py: 2.5, textAlign: 'center', borderRadius: 2,
              bgcolor: '#FAFBFF', border: '1.5px dashed #E2E8F0' }}>
              <AssignmentIcon sx={{ fontSize: 28, color: '#E2E8F0', mb: 0.5 }} />
              <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600 }}>
                Hali savol yo'q
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#CBD5E1' }}>
                «+ Savol qo'shish» tugmasini bosing (max 10 ta)
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.25}>
              {form.quiz.map((q, qi) => (
                <QuizQuestionCard
                  key={qi} qi={qi} q={q}
                  onUpdate={updateQuestion}
                  onRemove={() => removeQuestion(qi)}
                />
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
        <Button onClick={onClose} size="small" sx={{ borderRadius: 2, textTransform: 'none', color: '#94A3B8' }}>Bekor</Button>
        <Button variant="contained" size="small"
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700,
            bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, boxShadow: '0 4px 12px #7C3AED30' }}
          startIcon={isLoading ? <CircularProgress size={13} color="inherit" /> : <SaveIcon />}
          disabled={isLoading} onClick={handleSave}>
          {isEdit ? 'Saqlash' : 'Qo\'shish'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#FAFAFA', fontSize: '0.85rem' } };
const Label = ({ children, icon }) => (
  <Stack direction="row" spacing={0.5} alignItems="center" mb={0.75}>
    {icon && <Box sx={{ color: '#94A3B8' }}>{icon}</Box>}
    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8',
      textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </Typography>
  </Stack>
);

/* ── Module Card ─────────────────────────────────────────────────────────── */
function ModuleCard({ mod, idx, total, onEdit, onDelete }) {
  const title = modTitle(mod);
  const hasFile  = !!mod.file?.url;
  const hasVideo = !!mod.videoUrl;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.2 }}
      layout>
      <Box sx={{
        display: 'flex', gap: 1.5,
        p: 2, borderRadius: 2.5,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px #F1F5F9',
        bgcolor: '#fff',
        transition: 'box-shadow 0.15s',
        '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.09), 0 0 0 1px #EDE9FE' },
      }}>
        {/* Order badge */}
        <Box sx={{ flexShrink: 0 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2,
            bgcolor: '#F3E8FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#7C3AED' }}>
              {idx + 1}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', mb: 0.3 }}>{title || `Modul ${idx + 1}`}</Typography>
          {mod.description && (
            <Typography sx={{ fontSize: '0.78rem', color: '#64748B', mb: 0.75,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {mod.description}
            </Typography>
          )}

          {/* Attachments */}
          <Stack direction="row" spacing={0.75} flexWrap="wrap">
            {hasFile && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4,
                px: 0.9, py: 0.3, borderRadius: 1.5,
                bgcolor: '#EDE9FE', color: '#7C3AED', fontSize: '0.68rem', fontWeight: 700 }}>
                <AttachFileIcon sx={{ fontSize: 11 }} />
                {mod.file.type?.toUpperCase() ?? 'FAYL'}
              </Box>
            )}
            {hasVideo && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4,
                px: 0.9, py: 0.3, borderRadius: 1.5,
                bgcolor: '#FEF2F2', color: '#EF4444', fontSize: '0.68rem', fontWeight: 700 }}>
                <PlayCircleIcon sx={{ fontSize: 11 }} />
                YouTube
              </Box>
            )}
            {mod.quiz?.length > 0 && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4,
                px: 0.9, py: 0.3, borderRadius: 1.5,
                bgcolor: '#F0FDF4', color: '#10B981', fontSize: '0.68rem', fontWeight: 700 }}>
                <AssignmentIcon sx={{ fontSize: 11 }} />
                {mod.quiz.length} savol
              </Box>
            )}
            {!hasFile && !hasVideo && !mod.quiz?.length && (
              <Box sx={{ fontSize: '0.7rem', color: '#CBD5E1', fontStyle: 'italic' }}>
                Material qo'shilmagan
              </Box>
            )}
          </Stack>
        </Box>

        {/* Actions */}
        <Stack spacing={0.5} sx={{ flexShrink: 0 }}>
          <Tooltip title="Tahrirlash">
            <IconButton size="small" onClick={onEdit}
              sx={{ width: 28, height: 28, borderRadius: 1.5,
                bgcolor: '#F3E8FF', color: '#7C3AED',
                '&:hover': { bgcolor: '#EDE9FE' } }}>
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="O'chirish">
            <IconButton size="small" onClick={onDelete}
              sx={{ width: 28, height: 28, borderRadius: 1.5,
                bgcolor: '#FEF2F2', color: '#EF4444',
                '&:hover': { bgcolor: '#FEE2E2' } }}>
              <DeleteIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </motion.div>
  );
}

/* ── Package info panel (read-only for teacher) ──────────────────────────── */
function PackageSettingsPanel({ pkg }) {
  const courseTitle = (() => {
    const c = pkg?.course;
    if (!c) return null;
    if (typeof c === 'object') {
      const t = c.title;
      if (typeof t === 'object') return t.uz ?? t.ru ?? null;
      return t ?? null;
    }
    return null;
  })();

  const rows = [
    { label: 'Nomi (O\'zbek)', value: pkg?.title?.uz ?? '—' },
    { label: 'Nomi (Ruscha)',  value: pkg?.title?.ru || '—' },
    { label: 'Narx',          value: `${(pkg?.price?.amount ?? 0).toLocaleString()} ${pkg?.price?.currency ?? 'UZS'}` },
    { label: 'Fan / Kurs',    value: courseTitle ?? '—' },
    { label: 'O\'quvchilar',  value: `${pkg?.purchaseCount ?? 0} ta` },
  ];

  return (
    <Box sx={{ p: 2.5, borderRadius: 2.5,
      boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px #F1F5F9', bgcolor: '#fff' }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', mb: 1.5 }}>Paket ma'lumotlari</Typography>

      <Stack spacing={1.25} mb={2}>
        {rows.map(({ label, value }) => (
          <Box key={label} sx={{ px: 1.5, py: 1, borderRadius: 2, bgcolor: '#F8FAFF',
            border: '1px solid #EEF2FF' }}>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#94A3B8',
              textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.25 }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, color: '#1E293B' }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Stack>

      <Box sx={{ px: 1.5, py: 1, borderRadius: 2, bgcolor: '#FFF7ED', border: '1px solid #FDE68A' }}>
        <Typography sx={{ fontSize: '0.72rem', color: '#92400E', lineHeight: 1.5 }}>
          🔒 Paket sozlamalarini faqat admin o'zgartira oladi.
          O'zgartirish kerak bo'lsa, admin bilan bog'laning.
        </Typography>
      </Box>
    </Box>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function TeacherPackageDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [moduleDialog, setModuleDialog] = useState({ open: false, mod: null, idx: null });
  const closeDialog = () => setModuleDialog({ open: false, mod: null, idx: null });

  const { data: res, isLoading, refetch } = useGetPackageByIdQuery(id);
  const [deleteModule, { isLoading: deletingMod   }]  = useDeletePackageModuleMutation();

  const pkg = res?.data;

  const handleDeleteModule = async (idx) => {
    if (!window.confirm('Modulni o\'chirishni tasdiqlaysizmi?')) return;
    await deleteModule({ id: pkg._id, idx }).unwrap().catch(() => {});
  };

  if (isLoading) return (
    <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress sx={{ color: '#CBD5E1' }} /></Box>
  );
  if (!pkg) return (
    <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary">Paket topilmadi</Typography></Box>
  );

  const st = STATUS_CFG[pkg.status] ?? STATUS_CFG.draft;
  const modules = pkg.modules ?? [];

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', py: { xs: 2, md: 3.5 }, px: { xs: 2, md: 0 } }}>

      {/* Back */}
      <Button startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />} onClick={() => navigate('/teacher/packages')}
        size="small" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', color: 'text.secondary',
          '&:hover': { bgcolor: '#F8FAFF' }, borderRadius: 2, px: 1.25, mb: 2.5 }}>
        Barcha paketlar
      </Button>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        <Box sx={{ borderRadius: 3, overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 0 0 1px #F1F5F9',
          bgcolor: '#fff', mb: 3 }}>
          <Box sx={{ height: 4, bgcolor: '#7C3AED' }} />
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={1.5} alignItems="flex-start">
              <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: '#F3E8FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <InventoryIcon sx={{ fontSize: 22, color: '#7C3AED' }} />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" mb={0.25}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>{pTitle(pkg)}</Typography>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5,
                    px: 1, py: 0.3, borderRadius: 5, bgcolor: st.bg, color: st.color, fontSize: '0.7rem', fontWeight: 700 }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: st.dot }} />
                    {st.label}
                  </Box>
                </Stack>
                <Stack direction="row" spacing={2}>
                  <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    {modules.length} modul
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    {(pkg.price?.amount ?? 0).toLocaleString()} {pkg.price?.currency ?? 'UZS'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                    {pkg.purchaseCount ?? 0} o'quvchi
                  </Typography>
                </Stack>
              </Box>

            </Stack>

            {/* Admin publishes notice */}
            <Box sx={{ mt: 1.5, px: 1.5, py: 1, borderRadius: 2,
              bgcolor: pkg.status === 'published' ? '#F0FDF4' : '#EFF6FF',
              border: `1px solid ${pkg.status === 'published' ? '#BBF7D0' : '#BFDBFE'}` }}>
              <Typography sx={{ fontSize: '0.78rem',
                color: pkg.status === 'published' ? '#15803D' : '#1D4ED8' }}>
                {pkg.status === 'published'
                  ? '✅ Paket nashr etilgan. O\'quvchilar ko\'ra oladi.'
                  : '📋 Modullarni qo\'shib bo\'lgach, admin paketni ko\'rib chiqib nashr qiladi.'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </motion.div>

      {/* Two-column layout */}
      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>

        {/* LEFT: Modules */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography fontWeight={800} fontSize="0.95rem">Modullar</Typography>
              <Typography variant="caption" color="text.secondary">{modules.length} ta modul</Typography>
            </Box>
            <Button variant="contained" size="small" startIcon={<AddIcon />}
              onClick={() => setModuleDialog({ open: true, mod: null, idx: null })}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700,
                bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, boxShadow: '0 4px 12px #7C3AED30' }}>
              Modul qo'shish
            </Button>
          </Stack>

          {modules.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center', borderRadius: 2.5,
              border: '2px dashed #E5E7EB', bgcolor: '#FAFAFA' }}>
              <InventoryIcon sx={{ fontSize: 36, color: '#E5E7EB', mb: 1 }} />
              <Typography fontWeight={600} color="text.secondary" mb={0.5}>Hali modul yo'q</Typography>
              <Typography variant="caption" color="text.disabled">
                Birinchi modulni qo'shing — tavsif, fayl va YouTube havolasi
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.25}>
              <AnimatePresence>
                {modules.map((mod, i) => (
                  <ModuleCard
                    key={String(mod._id ?? i)}
                    mod={mod} idx={i} total={modules.length}
                    onEdit={() => setModuleDialog({ open: true, mod, idx: i })}
                    onDelete={() => handleDeleteModule(i)}
                  />
                ))}
              </AnimatePresence>
            </Stack>
          )}
        </Box>

        {/* RIGHT: Settings */}
        <Box sx={{ width: { xs: '100%', md: 300 }, flexShrink: 0 }}>
          <PackageSettingsPanel pkg={pkg} />
        </Box>
      </Box>

      {/* Module dialog */}
      <ModuleDialog
        open={moduleDialog.open}
        onClose={closeDialog}
        pkgId={id}
        existingModule={moduleDialog.mod}
        moduleIdx={moduleDialog.idx}
        onSaved={refetch}
      />
    </Box>
  );
}
