import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box, Typography, Stack, Button, IconButton, Tooltip,
  TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Alert, Chip, MenuItem, LinearProgress, Divider,
  ToggleButton, ToggleButtonGroup,
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
import UploadFileIcon    from '@mui/icons-material/UploadFile';
import AssignmentIcon    from '@mui/icons-material/Assignment';
import VisibilityIcon    from '@mui/icons-material/Visibility';
import i18n from '../../../utils/i18n.js';
import { openPrivateFile } from '../../../utils/openPrivateFile.js';
import LMSVideoPlayer from '../../../components/ui/LMSVideoPlayer.jsx';
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
  const blank = {
    titleUz: '', titleRu: '', descriptionUz: '', descriptionRu: '',
    fileUrl: '', fileName: '', fileType: 'pdf', fileUploading: false,
    linkUrl: '',
    videoLinkUrl: '',   // YouTube URL
    videoFileUrl: '',   // uploaded video file URL
    videoUploading: false,
    quiz: [],
  };

  const [form, setForm] = useState(blank);
  const [err, setErr]   = useState('');

  useEffect(() => {
    if (!open) return;
    if (isEdit && existingModule) {
      setForm({
        titleUz:       existingModule.title?.uz  ?? (typeof existingModule.title === 'string' ? existingModule.title : ''),
        titleRu:       existingModule.title?.ru  ?? '',
        descriptionUz: existingModule.description?.uz ?? (typeof existingModule.description === 'string' ? existingModule.description : ''),
        descriptionRu: existingModule.description?.ru ?? '',
        fileUrl:       existingModule.file?.url  ?? '',
        fileName:      existingModule.file?.name ?? '',
        fileType:      existingModule.file?.type ?? 'pdf',
        fileUploading: false,
        linkUrl:       existingModule.link ?? '',
        videoLinkUrl:  existingModule.videoUrl  ?? '',
        videoFileUrl:  existingModule.videoFile ?? '',
        videoUploading: false,
        quiz: (existingModule.quiz ?? []).map(q => ({
          question: q.question ?? '',
          options:  q.options?.length === 4 ? [...q.options] : ['', '', '', ''],
          correct:  q.correct ?? 0,
        })),
      });
    } else {
      setForm(blank);
    }
    setErr('');
  }, [open, existingModule]); // eslint-disable-line react-hooks/exhaustive-deps

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
      description: { uz: form.descriptionUz.trim(), ru: form.descriptionRu.trim() },
      file: {
        url:  form.fileUrl.trim(),
        name: form.fileName.trim() || form.fileUrl.trim().split('/').pop() || 'fayl',
        type: form.fileType,
      },
      link:      form.linkUrl.trim(),
      videoUrl:  form.videoLinkUrl.trim(),
      videoFile: form.videoFileUrl.trim(),
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

  /* ── Section card wrapper ── */
  const SectionCard = ({ icon, title, color = '#7C3AED', filled, children }) => (
    <Box sx={{
      mb: 2, border: '1.5px solid', borderRadius: 2.5,
      borderColor: filled ? color + '50' : '#E8EDF5',
      bgcolor: filled ? color + '04' : '#FAFBFD',
      overflow: 'hidden',
      transition: 'border-color 0.2s, background-color 0.2s',
    }}>
      <Box sx={{
        px: 2, py: 1.25,
        borderBottom: '1px solid',
        borderColor: filled ? color + '30' : '#E8EDF5',
        bgcolor: filled ? color + '08' : 'transparent',
        display: 'flex', alignItems: 'center', gap: 1,
      }}>
        <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: filled ? color : '#475569', flex: 1 }}>
          {title}
        </Typography>
        {filled && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5,
            px: 0.9, py: 0.2, borderRadius: 1, bgcolor: color + '15' }}>
            <CheckCircleIcon sx={{ fontSize: 12, color }} />
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color }}>Qo'shildi</Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '94vh', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' } }}>

      {/* Header */}
      <Box sx={{
        px: 3, pt: 2.5, pb: 2,
        background: 'linear-gradient(135deg, #7C3AED08 0%, #F3E8FF20 100%)',
        borderBottom: '1px solid #F1F5F9',
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}>
        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#7C3AED',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <InventoryIcon sx={{ fontSize: 18, color: '#fff' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={800} sx={{ fontSize: '1rem', lineHeight: 1.2 }}>
            {isEdit ? 'Modulni tahrirlash' : 'Yangi modul'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isEdit ? 'Modul ma\'lumotlarini yangilang' : 'Kurs modulini to\'ldiring'}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}
          sx={{ bgcolor: '#F1F5F9', '&:hover': { bgcolor: '#E2E8F0' } }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 2.5, overflowY: 'auto', bgcolor: '#F8FAFD' }}>
        {err && <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}>{err}</Alert>}

        {/* ── 1. Nomi ── */}
        <SectionCard
          icon={<DescriptionIcon sx={{ fontSize: 16 }} />}
          title="Modul nomi"
          color="#7C3AED"
          filled={!!(form.titleUz || form.titleRu)}
        >
          <Stack spacing={1.25}>
            <TextField size="small" label="Nomi (O'zbek) *" fullWidth value={form.titleUz} onChange={handle('titleUz')}
              sx={inputSx} />
            <TextField size="small" label="Nomi (Ruscha)" fullWidth value={form.titleRu} onChange={handle('titleRu')}
              sx={inputSx} />
          </Stack>
        </SectionCard>

        {/* ── 2. Tavsif ── */}
        <SectionCard
          icon={<DescriptionIcon sx={{ fontSize: 16 }} />}
          title="Tavsif / Описание"
          color="#0EA5E9"
          filled={!!(form.descriptionUz || form.descriptionRu)}
        >
          <Stack spacing={1.25}>
            <TextField size="small" label="Tavsif (O'zbek)" fullWidth multiline rows={2}
              value={form.descriptionUz} onChange={handle('descriptionUz')} sx={inputSx} />
            <TextField size="small" label="Описание (Русский)" fullWidth multiline rows={2}
              value={form.descriptionRu} onChange={handle('descriptionRu')} sx={inputSx} />
          </Stack>
        </SectionCard>

        {/* ── 3. Video ── */}
        <SectionCard
          icon={<PlayCircleIcon sx={{ fontSize: 16 }} />}
          title="Video dars"
          color="#EF4444"
          filled={!!(form.videoLinkUrl || form.videoFileUrl)}
        >
          <Stack spacing={1.75}>

            {/* YouTube URL */}
            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
                <LinkIcon sx={{ fontSize: 13, color: '#EF4444' }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#EF4444' }}>YouTube havola</Typography>
              </Stack>
              <TextField size="small" fullWidth value={form.videoLinkUrl}
                onChange={handle('videoLinkUrl')}
                placeholder="https://youtube.com/watch?v=..."
                sx={inputSx}
                InputProps={{ startAdornment: <LinkIcon sx={{ mr: 0.5, fontSize: 14, color: '#CBD5E1' }} /> }}
              />
              {/* YouTube mini-preview */}
              {form.videoLinkUrl && (() => {
                const m = form.videoLinkUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
                return m ? (
                  <Box sx={{ mt: 1, borderRadius: 1.5, overflow: 'hidden', position: 'relative', paddingTop: '40%', bgcolor: '#000' }}>
                    <Box component="iframe"
                      src={`https://www.youtube.com/embed/${m[1]}`}
                      title="preview" allowFullScreen
                      sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                    />
                  </Box>
                ) : null;
              })()}
            </Box>

            <Divider sx={{ borderStyle: 'dashed' }} />

            {/* Video file upload */}
            <Box>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.75 }}>
                <UploadFileIcon sx={{ fontSize: 13, color: '#EF4444' }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#EF4444' }}>Video fayl (MP4 · WEBM · OGG)</Typography>
              </Stack>
              {form.videoFileUrl ? (
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{
                    p: 1.25, borderRadius: 1.5, bgcolor: '#F0FDF4', border: '1px solid #86EFAC', mb: 1,
                  }}>
                    <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981', flexShrink: 0 }} />
                    <Typography variant="caption" fontWeight={700} color="success.main" noWrap sx={{ flex: 1 }}>
                      {form.videoFileUrl.split('/').pop()}
                    </Typography>
                    <IconButton size="small" onClick={() => setForm(p => ({ ...p, videoFileUrl: '' }))}
                      sx={{ p: 0.3, color: '#94A3B8', '&:hover': { color: '#EF4444' } }}>
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Stack>
                  {/* native video mini-preview */}
                  <SimpleVideoPreview url={form.videoFileUrl} />
                </Box>
              ) : (
                <Button size="small" variant="outlined" component="label" fullWidth
                  startIcon={form.videoUploading ? <CircularProgress size={13} /> : <UploadFileIcon sx={{ fontSize: 14 }} />}
                  disabled={form.videoUploading}
                  sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.8rem', height: 40,
                    borderColor: '#EF4444', color: '#EF4444', borderStyle: 'dashed',
                    '&:hover': { borderColor: '#DC2626', bgcolor: '#FEF2F2', borderStyle: 'dashed' } }}
                >
                  {form.videoUploading ? 'Yuklanmoqda...' : 'Video yuklash'}
                  <input type="file" hidden accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setForm(p => ({ ...p, videoUploading: true }));
                      try {
                        const token = (await import('../../../app/store.js')).store.getState().auth?.accessToken;
                        const fd = new FormData();
                        fd.append('file', file);
                        const res = await fetch('/api/v1/uploads/video?type=lesson', {
                          method: 'POST', body: fd,
                          headers: token ? { Authorization: `Bearer ${token}` } : {},
                        });
                        const json = await res.json();
                        if (json.success) {
                          setForm(p => ({ ...p, videoFileUrl: json.data.url, videoUploading: false }));
                        } else throw new Error(json.message);
                      } catch (uploadErr) {
                        setErr(uploadErr.message ?? 'Video yuklanmadi');
                        setForm(p => ({ ...p, videoUploading: false }));
                      }
                    }}
                  />
                </Button>
              )}
            </Box>
          </Stack>
        </SectionCard>

        {/* ── 4. Fayl ── */}
        <SectionCard
          icon={<AttachFileIcon sx={{ fontSize: 16 }} />}
          title="Fayl biriktirish (PDF / Word / PPTX)"
          color="#10B981"
          filled={!!form.fileUrl}
        >
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              <Button size="small" variant="outlined" component="label"
                startIcon={form.fileUploading ? <CircularProgress size={13} /> : <AttachFileIcon sx={{ fontSize: 14 }} />}
                disabled={form.fileUploading}
                sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.78rem', height: 36, flexShrink: 0,
                  borderColor: '#10B981', color: '#10B981', '&:hover': { borderColor: '#059669', bgcolor: '#F0FDF4' } }}
              >
                {form.fileUploading ? 'Yuklanmoqda...' : 'Fayl yuklash'}
                <input type="file" hidden accept=".pdf,.doc,.docx,.pptx,.xlsx,.zip"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setForm((p) => ({ ...p, fileUploading: true }));
                    try {
                      const fd = new FormData();
                      fd.append('file', file);
                      const res = await fetch('/api/v1/uploads/receipt', { method: 'POST', body: fd });
                      const json = await res.json();
                      if (json.success) {
                        setForm((p) => ({ ...p, fileUrl: json.data.url, fileName: file.name, fileUploading: false }));
                      } else throw new Error(json.message);
                    } catch (uploadErr) {
                      setErr(uploadErr.message ?? 'Fayl yuklanmadi');
                      setForm((p) => ({ ...p, fileUploading: false }));
                    }
                  }}
                />
              </Button>
              {form.fileUrl ? (
                <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                  <CheckCircleIcon sx={{ fontSize: 15, color: '#10B981', flexShrink: 0 }} />
                  <Typography variant="caption" color="success.main" noWrap sx={{ flex: 1 }}>
                    {form.fileName || form.fileUrl.split('/').pop()}
                  </Typography>
                  <IconButton size="small" onClick={() => setForm(p => ({ ...p, fileUrl: '', fileName: '' }))}
                    sx={{ p: 0.25, color: '#94A3B8' }}>
                    <CloseIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Stack>
              ) : (
                <Typography variant="caption" color="text.disabled">PDF · DOC · PPTX · XLSX — yuklanadi</Typography>
              )}
              <TextField select size="small" label="Tur" sx={{ minWidth: 90, ...inputSx }}
                value={form.fileType} onChange={handle('fileType')}>
                {FILE_TYPES.map((f) => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
              </TextField>
            </Stack>
          </Stack>
        </SectionCard>

        {/* ── 5. Havola ── */}
        <SectionCard
          icon={<LinkIcon sx={{ fontSize: 16 }} />}
          title="Tashqi havola (Google Drive, Notion, ...)"
          color="#3B82F6"
          filled={!!form.linkUrl}
        >
          <TextField size="small" label="URL manzil" fullWidth
            value={form.linkUrl} onChange={handle('linkUrl')}
            placeholder="https://drive.google.com/..."
            sx={inputSx}
            InputProps={{ startAdornment: <LinkIcon sx={{ mr: 0.5, fontSize: 14, color: '#CBD5E1' }} /> }}
          />
          {form.linkUrl && (
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.75 }}>
              <CheckCircleIcon sx={{ fontSize: 13, color: '#3B82F6' }} />
              <Typography variant="caption" color="#3B82F6" noWrap>{form.linkUrl}</Typography>
            </Stack>
          )}
        </SectionCard>

        {/* ── 6. Test ── */}
        <SectionCard
          icon={<AssignmentIcon sx={{ fontSize: 16 }} />}
          title={`Yakuniy test — ${form.quiz.length}/10 savol`}
          color="#F59E0B"
          filled={form.quiz.length > 0}
        >
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: form.quiz.length ? 1.5 : 0 }}>
            <Button size="small" variant="outlined"
              disabled={form.quiz.length >= 10}
              onClick={addQuestion}
              sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.72rem',
                py: 0.4, px: 1.5, borderColor: '#F59E0B', color: '#F59E0B',
                '&:hover': { bgcolor: '#FFFBEB', borderColor: '#F59E0B' },
                '&.Mui-disabled': { opacity: 0.4 } }}>
              + Savol qo'shish
            </Button>
          </Stack>

          {form.quiz.length === 0 ? (
            <Box sx={{ py: 2, textAlign: 'center', borderRadius: 2,
              bgcolor: '#FFFBEB', border: '1.5px dashed #FDE68A' }}>
              <AssignmentIcon sx={{ fontSize: 26, color: '#FDE68A', mb: 0.5 }} />
              <Typography sx={{ fontSize: '0.78rem', color: '#92400E', fontWeight: 600 }}>
                Hali savol yo'q
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#D97706' }}>
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
        </SectionCard>
      </DialogContent>

      <Box sx={{
        px: 2.5, pb: 2.5, pt: 1.5,
        borderTop: '1px solid #F1F5F9',
        bgcolor: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5,
      }}>
        {/* Status summary */}
        <Stack direction="row" spacing={0.75} flexWrap="wrap">
          {(form.videoLinkUrl || form.videoFileUrl) && (
            <Box sx={{ px: 0.9, py: 0.3, borderRadius: 1, bgcolor: '#FEF2F2', display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <PlayCircleIcon sx={{ fontSize: 11, color: '#EF4444' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#EF4444' }}>Video</Typography>
            </Box>
          )}
          {form.fileUrl && (
            <Box sx={{ px: 0.9, py: 0.3, borderRadius: 1, bgcolor: '#F0FDF4', display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <AttachFileIcon sx={{ fontSize: 11, color: '#10B981' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#10B981' }}>Fayl</Typography>
            </Box>
          )}
          {form.linkUrl && (
            <Box sx={{ px: 0.9, py: 0.3, borderRadius: 1, bgcolor: '#EFF6FF', display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <LinkIcon sx={{ fontSize: 11, color: '#3B82F6' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#3B82F6' }}>Havola</Typography>
            </Box>
          )}
          {form.quiz.length > 0 && (
            <Box sx={{ px: 0.9, py: 0.3, borderRadius: 1, bgcolor: '#FFFBEB', display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <AssignmentIcon sx={{ fontSize: 11, color: '#F59E0B' }} />
              <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: '#F59E0B' }}>{form.quiz.length} savol</Typography>
            </Box>
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: 'none', color: '#94A3B8', fontWeight: 600 }}>
            Bekor
          </Button>
          <Button variant="contained"
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2.5,
              bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, boxShadow: '0 4px 14px #7C3AED35' }}
            startIcon={isLoading ? <CircularProgress size={13} color="inherit" /> : <SaveIcon />}
            disabled={isLoading} onClick={handleSave}>
            {isEdit ? 'Saqlash' : 'Modulni qo\'shish'}
          </Button>
        </Stack>
      </Box>
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

/* Лёгкий нативный плеер для превью в диалоге */
function SimpleVideoPreview({ url }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    if (!url) return;
    const isT3 = url.includes('t3.storage.dev') || url.includes('tigris');
    if (!isT3) { setSrc(url); return; }
    import('../../../app/store.js').then(({ store }) => {
      const token = store.getState().auth?.accessToken;
      fetch(`/api/v1/uploads/presign?key=${encodeURIComponent(url)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }).then(r => r.json()).then(j => setSrc(j?.data?.url ?? url)).catch(() => setSrc(url));
    });
  }, [url]);
  if (!src) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, bgcolor: '#000', borderRadius: 2 }}>
      <CircularProgress size={24} sx={{ color: '#fff' }} />
    </Box>
  );
  return (
    <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#000' }}>
      <Box component="video" src={src} controls sx={{ width: '100%', display: 'block', maxHeight: 280 }} />
    </Box>
  );
}

/* ── Module Preview Dialog ───────────────────────────────────────────────── */
function ModulePreviewDialog({ open, mod, onClose }) {
  if (!mod) return null;
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';

  const titleUz = mod.title?.uz || '';
  const titleRu = mod.title?.ru || '';
  const descUz  = mod.description?.uz || (typeof mod.description === 'string' ? mod.description : '');
  const descRu  = mod.description?.ru || '';

  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  };
  const embedUrl = getYoutubeEmbed(mod.videoUrl);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: '#F3E8FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VisibilityIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
          </Box>
          <Typography fontWeight={800} fontSize="1rem">
            {lang === 'ru' ? 'Просмотр модуля' : "Modulni ko'rish"}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 2.5 }}>
          {/* Title */}
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            {titleUz && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>UZ</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.3 }}>{titleUz}</Typography>
              </Box>
            )}
            {titleRu && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>RU</Typography>
                <Typography variant="subtitle1" fontWeight={700} color="text.secondary">{titleRu}</Typography>
              </Box>
            )}
          </Stack>

          {/* Description */}
          {(descUz || descRu) && (
            <>
              <Divider sx={{ mb: 1.5 }} />
              <Stack spacing={1} sx={{ mb: 2 }}>
                {descUz && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Tavsif (UZ)</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>{descUz}</Typography>
                  </Box>
                )}
                {descRu && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Описание (RU)</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>{descRu}</Typography>
                  </Box>
                )}
              </Stack>
            </>
          )}

          {/* YouTube Video */}
          {mod.videoUrl && (
            <>
              <Divider sx={{ mb: 1.5 }} />
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                <LinkIcon sx={{ fontSize: 13, color: '#EF4444' }} />
                <Typography variant="caption" color="#EF4444" fontWeight={700}>
                  {lang === 'ru' ? 'YouTube видео' : 'YouTube video'}
                </Typography>
              </Stack>
              {embedUrl ? (
                <Box sx={{ borderRadius: 2, overflow: 'hidden', aspectRatio: '16/9', bgcolor: '#000' }}>
                  <Box component="iframe"
                    src={embedUrl}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sx={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                  />
                </Box>
              ) : /\.(mp4|webm|ogg|mov)(\?|$)/i.test(mod.videoUrl) || mod.videoUrl.includes('t3.storage') || mod.videoUrl.includes('tigris') ? (
                <SimpleVideoPreview url={mod.videoUrl} />
              ) : (
                <Button variant="outlined" size="small" startIcon={<PlayCircleIcon />}
                  onClick={() => window.open(mod.videoUrl, '_blank', 'noopener,noreferrer')}
                  sx={{ borderRadius: 2 }}>
                  {lang === 'ru' ? 'Открыть видео' : "Videoni ochish"}
                </Button>
              )}
            </>
          )}

          {/* Uploaded Video File */}
          {mod.videoFile && (
            <>
              <Divider sx={{ mb: 1.5, mt: mod.videoUrl ? 1.5 : 0 }} />
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
                <PlayCircleIcon sx={{ fontSize: 13, color: '#EF4444' }} />
                <Typography variant="caption" color="#EF4444" fontWeight={700}>
                  {lang === 'ru' ? 'Видео файл' : 'Video fayl'}
                </Typography>
              </Stack>
              <SimpleVideoPreview url={mod.videoFile} />
            </>
          )}

          {/* File */}
          {mod.file?.url && (
            <>
              <Divider sx={{ mb: 1.5, mt: mod.videoUrl ? 1.5 : 0 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                {lang === 'ru' ? 'Файл' : 'Fayl'}
              </Typography>
              <Button variant="outlined" size="small" startIcon={<AttachFileIcon />}
                onClick={() => openPrivateFile(mod.file.url)}
                sx={{ borderRadius: 2 }}>
                {mod.file.name || `${mod.file.type?.toUpperCase() ?? 'FAYL'}`}
              </Button>
            </>
          )}

          {/* External link */}
          {mod.link && (
            <>
              <Divider sx={{ mb: 1.5, mt: 1.5 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                {lang === 'ru' ? 'Ссылка' : 'Havola'}
              </Typography>
              <Button variant="outlined" size="small" startIcon={<LinkIcon />}
                onClick={() => window.open(mod.link, '_blank', 'noopener,noreferrer')}
                sx={{ borderRadius: 2 }}>
                {mod.link.length > 50 ? mod.link.slice(0, 50) + '…' : mod.link}
              </Button>
            </>
          )}

          {/* Quiz */}
          {mod.quiz?.length > 0 && (
            <>
              <Divider sx={{ mb: 1.5, mt: 1.5 }} />
              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                {lang === 'ru' ? `Тест (${mod.quiz.length} вопр.)` : `Test (${mod.quiz.length} savol)`}
              </Typography>
              <Stack spacing={1.5}>
                {mod.quiz.map((q, qi) => (
                  <Box key={qi} sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.75 }}>
                      {qi + 1}. {q.question}
                    </Typography>
                    <Stack spacing={0.4}>
                      {q.options?.map((opt, oi) => (
                        <Box key={oi} sx={{
                          display: 'flex', alignItems: 'center', gap: 0.75,
                          px: 1, py: 0.4, borderRadius: 1.5,
                          bgcolor: oi === q.correct ? '#F0FDF4' : 'transparent',
                          border: oi === q.correct ? '1px solid #BBF7D0' : '1px solid transparent',
                        }}>
                          <Box sx={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                            bgcolor: oi === q.correct ? '#10B981' : '#E2E8F0',
                            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: oi === q.correct ? '#fff' : '#94A3B8' }}>
                              {String.fromCharCode(65 + oi)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ color: oi === q.correct ? '#065F46' : 'text.primary' }}>
                            {opt}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>
          {lang === 'ru' ? 'Закрыть' : 'Yopish'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Module Card ─────────────────────────────────────────────────────────── */
function ModuleCard({ mod, idx, total, onEdit, onDelete, onPreview }) {
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
      <Box onClick={onPreview} sx={{
        display: 'flex', gap: 1.5,
        p: 2, borderRadius: 2.5,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px #F1F5F9',
        bgcolor: '#fff',
        cursor: 'pointer',
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
              {typeof mod.description === 'object'
                ? (mod.description.uz || mod.description.ru || '')
                : mod.description}
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
            {mod.link && (
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4,
                px: 0.9, py: 0.3, borderRadius: 1.5,
                bgcolor: '#EFF6FF', color: '#3B82F6', fontSize: '0.68rem', fontWeight: 700 }}>
                <LinkIcon sx={{ fontSize: 11 }} />
                Havola
              </Box>
            )}
            {!hasFile && !hasVideo && !mod.quiz?.length && !mod.link && (
              <Box sx={{ fontSize: '0.7rem', color: '#CBD5E1', fontStyle: 'italic' }}>
                Material qo'shilmagan
              </Box>
            )}
          </Stack>
        </Box>

        {/* Actions */}
        <Stack spacing={0.5} sx={{ flexShrink: 0 }}>
          <Tooltip title="Tahrirlash">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(); }}
              sx={{ width: 28, height: 28, borderRadius: 1.5,
                bgcolor: '#F3E8FF', color: '#7C3AED',
                '&:hover': { bgcolor: '#EDE9FE' } }}>
              <EditIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="O'chirish">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDelete(); }}
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
  const [previewMod, setPreviewMod] = useState(null);

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
                    onPreview={() => setPreviewMod(mod)}
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

      {/* Module preview dialog */}
      <ModulePreviewDialog
        open={Boolean(previewMod)}
        mod={previewMod}
        onClose={() => setPreviewMod(null)}
      />

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
