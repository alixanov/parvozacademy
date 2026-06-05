import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip, Avatar,
  Button, TextField, Stepper, Step, StepLabel, Alert,
  CircularProgress, Divider, LinearProgress, InputAdornment,
} from '@mui/material';
import { useState, useRef } from 'react';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import UploadFileIcon   from '@mui/icons-material/UploadFile';
import ContentCopyIcon  from '@mui/icons-material/ContentCopy';
import VideocamIcon     from '@mui/icons-material/Videocam';
import MeetingRoomIcon  from '@mui/icons-material/MeetingRoom';
import PersonIcon       from '@mui/icons-material/Person';
import CelebrationIcon  from '@mui/icons-material/Celebration';
import { useGetCoursesQuery }     from '../../../features/courses/coursesApi.js';
import { useGetSettingsQuery }    from '../../../features/settings/settingsApi.js';
import { useSubmitApplicationMutation } from '../../../features/enrollment/enrollmentApi.js';
import { formatPrice } from '../../../data/mockData.js';
import { baseApi }     from '../../../utils/api.js';
import i18n from '../../../utils/i18n.js';

/* ─── constants ───────────────────────────────────────────────────────────── */
const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

const TYPE_META = [
  { key: 'online',     label: 'Online',     icon: <VideocamIcon />,    color: '#10B981', desc: "Zoom orqali, istalgan joydan" },
  { key: 'offline',             label: 'Offline',              icon: <MeetingRoomIcon />, color: '#10B981', desc: "O'quv markazda, jonli" },
  { key: 'individual_offline', label: 'Individual (Offline)', icon: <PersonIcon />,      color: '#7C3AED', desc: "Yakkama-yakka, o'quv markazda" },
  { key: 'individual_online',  label: 'Individual (Online)',  icon: <PersonIcon />,      color: '#EC4899', desc: "Yakkama-yakka, Zoom orqali" },
];

const STEP_LABELS = ["Kurs tanlash", "Tarif & To'lov", "Ariza yuborish", "Tayyor!"];

function cTitle(course) {
  if (!course) return '—';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const t = course.title;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '—';
  return t ?? '—';
}

/* ─── Step 0: выбор курса ─────────────────────────────────────────────────── */
function Step0Course({ selected, onSelect }) {
  const { data: coursesRes, isLoading } = useGetCoursesQuery({ limit: 50 });
  const courses = (coursesRes?.data ?? []).filter((c) => c.isActive !== false);

  if (isLoading) return <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle2" fontWeight={700}>O'qimoqchi bo'lgan kursni tanlang *</Typography>
      <Grid container spacing={1.5}>
        {courses.map((c, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          const sel   = selected?._id === c._id;
          return (
            <Grid item xs={12} sm={6} key={c._id}>
              <Box onClick={() => onSelect(c)}
                sx={{
                  p: 2, borderRadius: 2, cursor: 'pointer', border: '1.5px solid',
                  borderColor: sel ? color : 'divider',
                  bgcolor: sel ? color + '12' : 'background.paper',
                  transition: 'all 0.18s',
                  '&:hover': { borderColor: color, bgcolor: color + '08' },
                }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar sx={{ bgcolor: color + '22', color, fontWeight: 700, width: 40, height: 40 }}>
                    {cTitle(c)[0]?.toUpperCase() ?? '?'}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={sel ? 700 : 500}
                      color={sel ? color : 'text.primary'} noWrap>
                      {cTitle(c)}
                    </Typography>
                    {c.subject && (
                      <Typography variant="caption" color="text.secondary">{c.subject}</Typography>
                    )}
                    {/* Available tariffs */}
                    {c.tariffs?.length > 0 && (
                      <Stack direction="row" spacing={0.4} flexWrap="wrap" sx={{ mt: 0.5, gap: 0.3 }}>
                        {c.tariffs.map((t) => {
                          const tm = TYPE_META.find((m) => m.key === t.key);
                          return (
                            <Chip key={t.key} label={`${t.name ?? t.key}: ${formatPrice(t.price)}`}
                              size="small"
                              sx={{ height: 18, fontSize: '0.62rem', fontWeight: 700,
                                bgcolor: (tm?.color ?? color) + '18', color: tm?.color ?? color,
                                borderRadius: 0.75 }} />
                          );
                        })}
                      </Stack>
                    )}
                  </Box>
                  {sel && <CheckCircleIcon sx={{ color, flexShrink: 0 }} />}
                </Stack>
              </Box>
            </Grid>
          );
        })}
      </Grid>
    </Stack>
  );
}

/* ─── Step 1: тариф + реквизиты ──────────────────────────────────────────── */
function Step1Tariff({ course, selectedTariff, onSelect, settings }) {
  const [copied, setCopied] = useState('');

  const copyCard = (num) => {
    navigator.clipboard.writeText(num.replace(/\s/g, ''));
    setCopied(num);
    setTimeout(() => setCopied(''), 2000);
  };

  const tariffs = course?.tariffs ?? [];

  return (
    <Stack spacing={3}>
      {/* Tariff cards */}
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Tarif tanlang *</Typography>
        {tariffs.length === 0 && (
          <Alert severity="info">Bu kurs uchun tarif hali o'rnatilmagan. Admin bilan bog'laning.</Alert>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          {tariffs.map((t) => {
            const meta = TYPE_META.find((m) => m.key === t.key);
            const color = meta?.color ?? '#64748B';
            const sel   = selectedTariff?.key === t.key;
            return (
              <Box key={t.key} onClick={() => onSelect(t)} sx={{
                flex: 1, p: 2.5, borderRadius: 2.5, cursor: 'pointer', border: '2px solid',
                borderColor: sel ? color : 'divider',
                bgcolor: sel ? color + '12' : 'background.paper',
                transition: 'all 0.18s', textAlign: 'center',
                '&:hover': { borderColor: color, bgcolor: color + '08', transform: 'translateY(-2px)' },
              }}>
                <Box sx={{ color: sel ? color : 'text.secondary', mb: 0.75, display: 'flex', justifyContent: 'center' }}>
                  {meta?.icon}
                </Box>
                <Typography variant="body2" fontWeight={sel ? 800 : 600} color={sel ? color : 'text.primary'}>
                  {t.name ?? meta?.label ?? t.key}
                </Typography>
                {meta?.desc && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                    {meta.desc}
                  </Typography>
                )}
                <Typography variant="h6" fontWeight={800} color={sel ? color : 'text.primary'}>
                  {formatPrice(t.price)} so'm
                </Typography>
                <Typography variant="caption" color="text.secondary">/ oy</Typography>
                {sel && <CheckCircleIcon sx={{ color, display: 'block', mx: 'auto', mt: 0.75, fontSize: 18 }} />}
              </Box>
            );
          })}
        </Stack>
      </Box>

      {/* Payment details (shown only after tariff is selected) */}
      {selectedTariff && (
        <Box>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            To'lov rekvizitlari
          </Typography>

          {settings?.paymentCards?.length > 0 ? (
            <Stack spacing={1.5}>
              {settings.paymentCards.map((card, i) => (
                <Card key={i} elevation={0} sx={{
                  border: '1.5px solid', borderColor: 'primary.main' + '40',
                  bgcolor: 'primary.main' + '06', borderRadius: 2,
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="caption" color="text.secondary">{card.bank}</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: 2, fontFamily: 'monospace' }}>
                          {card.cardNumber}
                        </Typography>
                        {card.cardHolder && (
                          <Typography variant="caption" color="text.secondary">{card.cardHolder}</Typography>
                        )}
                      </Box>
                      <Button size="small" variant="outlined" startIcon={<ContentCopyIcon fontSize="small" />}
                        onClick={() => copyCard(card.cardNumber)}
                        sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}>
                        {copied === card.cardNumber ? 'Nusxalandi!' : 'Nusxalash'}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Alert severity="info">To'lov rekvizitlari admin tomonidan o'rnatilmagan.</Alert>
          )}

          {settings?.paymentInstruction && (
            <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2 }}>
              {settings.paymentInstruction}
            </Alert>
          )}

          <Card elevation={0} sx={{ mt: 2, bgcolor: 'warning.main' + '12', border: '1px solid', borderColor: 'warning.main' + '40', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" fontWeight={800} color="warning.dark">
                To'lash kerak: {formatPrice(selectedTariff.price)} so'm
              </Typography>
              <Typography variant="caption" color="text.secondary">
                To'lov amalga oshirgach, quyida chekni yuklang va arizani yuboring.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </Stack>
  );
}

/* ─── Step 2: загрузка чека + анкета ──────────────────────────────────────── */
function Step2Upload({ form, setForm, uploading, setUploading }) {
  const fileInputRef = useRef();
  const [uploadErr, setUploadErr] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      // Public endpoint — no auth header needed
      const res = await fetch('/api/v1/uploads/receipt', { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? 'Upload failed');
      setForm((p) => ({ ...p, receiptUrl: json.data.url, receiptKey: json.data.key }));
    } catch (err) {
      setUploadErr(err.message ?? "Chekni yuklashda xatolik");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Ism va Familiya *" value={form.fullName}
            onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Telefon raqami *"
            placeholder="90 123 45 67"
            value={form.phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
              setForm((p) => ({ ...p, phone: digits }));
            }}
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
          />
        </Grid>
      </Grid>

      {/* Receipt upload */}
      <Box>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          To'lov cheki *
        </Typography>
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
          onChange={handleFile} />
        <Box
          onClick={() => !uploading && fileInputRef.current.click()}
          sx={{
            p: 3, borderRadius: 2.5, border: '2px dashed',
            borderColor: form.receiptUrl ? 'success.main' : 'divider',
            bgcolor: form.receiptUrl ? 'success.main' + '08' : 'action.hover',
            cursor: uploading ? 'wait' : 'pointer', textAlign: 'center',
            transition: 'all 0.18s',
            '&:hover': { borderColor: form.receiptUrl ? 'success.main' : 'primary.main' },
          }}>
          {uploading ? (
            <CircularProgress size={28} />
          ) : form.receiptUrl ? (
            <Stack alignItems="center" spacing={1}>
              <CheckCircleIcon color="success" sx={{ fontSize: 36 }} />
              <Typography variant="body2" color="success.main" fontWeight={700}>
                Chek yuklandi ✓
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Boshqa faylni tanlash uchun bosing
              </Typography>
            </Stack>
          ) : (
            <Stack alignItems="center" spacing={1}>
              <UploadFileIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
              <Typography variant="body2" fontWeight={600}>
                Chek rasmini yoki PDF ni yuklang
              </Typography>
              <Typography variant="caption" color="text.secondary">
                JPG, PNG yoki PDF • Max 20MB
              </Typography>
            </Stack>
          )}
        </Box>
        {uploadErr && <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>{uploadErr}</Alert>}
      </Box>
    </Stack>
  );
}

/* ─── Step 3: Success ────────────────────────────────────────────────────────*/
function Step3Success({ application }) {
  return (
    <Stack alignItems="center" spacing={3} sx={{ py: 4, textAlign: 'center' }}>
      <Box sx={{ fontSize: 72 }}>🎉</Box>
      <Box>
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Arizangiz qabul qilindi!
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 420 }}>
          Ariza raqami: <strong>#{String(application?._id).slice(-6).toUpperCase()}</strong>
          <br />
          Administrator tez orada arizangizni ko'rib chiqadi va <strong>{application?.phone}</strong> raqamiga xabar beradi.
        </Typography>
      </Box>
      <Alert severity="info" sx={{ borderRadius: 2, textAlign: 'left', maxWidth: 420 }}>
        <Typography variant="body2">
          <strong>Keyingi qadam:</strong><br />
          Ariza tasdiqlanganidan so'ng, sizga login va vaqtinchalik parol yuboriladi.
          Telefon raqamingizning oxirgi 6 raqami dastlabki parol bo'ladi.
        </Typography>
      </Alert>
    </Stack>
  );
}

/* ─── Main Enroll Page ────────────────────────────────────────────────────── */
export default function EnrollPage() {
  const [step, setStep]       = useState(0);
  const [course, setCourse]   = useState(null);
  const [tariff, setTariff]   = useState(null);
  const [form, setForm]       = useState({ fullName: '', phone: '', receiptUrl: '', receiptKey: '' });
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState('');
  const [createdApp, setCreatedApp] = useState(null);

  const { data: settingsRes } = useGetSettingsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const settings = settingsRes?.data ?? null;

  const [submitApplication, { isLoading: submitting }] = useSubmitApplicationMutation();

  const validate = () => {
    if (step === 0 && !course)   return "Iltimos, kurs tanlang";
    if (step === 1 && !tariff)   return "Iltimos, tarif tanlang";
    if (step === 2) {
      if (!form.fullName.trim()) return "Ism va familiya kiritilmagan";
      if (form.phone.length !== 9) return "Telefon raqam 9 ta raqamdan iborat bo'lishi kerak";
      if (!form.receiptUrl)      return "Iltimos, to'lov chekini yuklang";
    }
    return '';
  };

  const handleNext = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  };

  const handleBack = () => { setError(''); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    try {
      const res = await submitApplication({
        fullName:   form.fullName,
        phone:      `+998${form.phone}`,
        course:     course._id,
        tariffKey:  tariff.key,
        amount:     tariff.price,
        receiptUrl: form.receiptUrl,
        receiptKey: form.receiptKey,
      }).unwrap();
      setCreatedApp(res.data);
      setStep(3);
    } catch (e) {
      setError(e?.data?.message ?? "Arizani yuborishda xatolik");
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6, px: 2 }}>
      <Box sx={{ maxWidth: 760, mx: 'auto' }}>
        {/* Header */}
        <Stack alignItems="center" sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={900} gutterBottom>
            O'qishga yozilish
          </Typography>
          <Typography color="text.secondary">
            {settings?.academyName ?? 'PARVOZ ACADEMY'} — hoziroq boshlang
          </Typography>
        </Stack>

        {/* Stepper */}
        {step < 3 && (
          <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
            {STEP_LABELS.slice(0, 3).map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>
        )}

        {/* Step content */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {step === 0 && (
              <Step0Course selected={course} onSelect={(c) => { setCourse(c); setTariff(null); }} />
            )}
            {step === 1 && (
              <Step1Tariff course={course} selectedTariff={tariff} onSelect={setTariff} settings={settings} />
            )}
            {step === 2 && (
              <Step2Upload form={form} setForm={setForm} uploading={uploading} setUploading={setUploading} />
            )}
            {step === 3 && <Step3Success application={createdApp} />}
          </CardContent>
        </Card>

        {/* Actions */}
        {step < 3 && (
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
            <Button onClick={handleBack} disabled={step === 0} sx={{ borderRadius: 2 }}>
              ← Orqaga
            </Button>
            {step < 2 ? (
              <Button variant="contained" onClick={handleNext} sx={{ borderRadius: 2, px: 3 }}>
                Keyingi →
              </Button>
            ) : (
              <Button variant="contained" color="success" sx={{ borderRadius: 2, px: 3 }}
                disabled={submitting || uploading}
                startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
                onClick={handleSubmit}>
                Arizani yuborish
              </Button>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
