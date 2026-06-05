import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, Stack, Stepper, Step, StepLabel,
  Alert, Chip, Divider, IconButton, Paper, CircularProgress,
} from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { useSelector }                 from 'react-redux';
import { useTranslation }              from 'react-i18next';
import { useNavigate }                 from 'react-router-dom';
import ContentCopyIcon                 from '@mui/icons-material/ContentCopy';
import CreditCardIcon                  from '@mui/icons-material/CreditCard';
import CheckCircleOutlinedIcon         from '@mui/icons-material/CheckCircleOutlined';
import CheckCircleIcon                 from '@mui/icons-material/CheckCircle';
import AccessTimeIcon                  from '@mui/icons-material/AccessTime';
import LaptopIcon                      from '@mui/icons-material/Laptop';
import SchoolIcon                      from '@mui/icons-material/School';
import PersonIcon                      from '@mui/icons-material/Person';
import UploadFileIcon                  from '@mui/icons-material/UploadFile';
import { formatPrice }                 from '../../../data/mockData.js';
import { selectUser }                  from '../../../features/auth/authSlice.js';
import { useGetSettingsQuery }         from '../../../features/settings/settingsApi.js';
import { useSubmitApplicationMutation } from '../../../features/enrollment/enrollmentApi.js';
import i18n                            from '../../../utils/i18n.js';

/* ── Тарифы (fallback, если на курсе не настроены) ──────────── */
const FALLBACK_PLANS = [
  {
    id:    'online',
    icon:  <LaptopIcon sx={{ fontSize: 28 }} />,
    color: '#1976D2',
    price: 600000,
    label: 'Online',
    desc:  'Zoom orqali, istalgan joydan',
    popular: false,
  },
  {
    id:    'offline',
    icon:  <SchoolIcon sx={{ fontSize: 28 }} />,
    color: '#10B981',
    price: 800000,
    label: 'Offline',
    desc:  "O'quv markazda, jonli",
    popular: true,
  },
  {
    id:    'individual_offline',
    icon:  <PersonIcon sx={{ fontSize: 28 }} />,
    color: '#7C3AED',
    price: 1500000,
    label: 'Individual Offline',
    desc:  "Yakkama-yakka, o'quv markazda",
  },
  {
    id:    'individual_online',
    icon:  <PersonIcon sx={{ fontSize: 28 }} />,
    color: '#EC4899',
    price: 1200000,
    label: 'Individual Online',
    desc:  "Yakkama-yakka, Zoom orqali",
  },
];

function getTitle(t) { return typeof t === 'object' ? (t[i18n.language] ?? t.uz ?? t.ru) : (t ?? '—'); }

/* ── Step 0: выбор тарифа ────────────────────────────────────── */
function PlanStep({ plans, selectedId, onSelect }) {
  return (
    <Stack spacing={2}>
      {plans.map((plan) => {
        const isSelected = selectedId === plan.id;
        return (
          <Paper
            key={plan.id}
            variant="outlined"
            onClick={() => onSelect(plan.id)}
            sx={{
              p: 2, borderRadius: 2, cursor: 'pointer',
              border: '2px solid',
              borderColor: isSelected ? plan.color : 'divider',
              bgcolor: isSelected ? plan.color + '0D' : 'transparent',
              transition: 'all 0.15s',
              '&:hover': { borderColor: plan.color, bgcolor: plan.color + '0A' },
              position: 'relative',
            }}
          >
            {plan.popular && (
              <Chip label="Mashhur" size="small" sx={{
                position: 'absolute', top: -10, right: 12,
                bgcolor: plan.color, color: '#fff', fontWeight: 700, fontSize: '0.7rem',
              }} />
            )}
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{
                width: 48, height: 48, borderRadius: 2, flexShrink: 0,
                bgcolor: plan.color + '18', color: plan.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {plan.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={700}>{plan.label}</Typography>
                <Typography variant="caption" color="text.secondary">{plan.desc}</Typography>
              </Box>
              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                <Typography variant="subtitle1" fontWeight={800} color={plan.color}>
                  {formatPrice(plan.price)}
                </Typography>
                <Typography variant="caption" color="text.secondary">so'm/oy</Typography>
                {isSelected && <CheckCircleIcon sx={{ fontSize: 20, color: plan.color, display: 'block', mt: 0.5 }} />}
              </Box>
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
}

/* ── Step 2: реквизиты ───────────────────────────────────────── */
function PaymentInfoStep({ plan, paymentCards }) {
  const [copied, setCopied] = useState('');

  const copyCard = (num) => {
    navigator.clipboard.writeText(num.replace(/\s/g, '')).catch(() => {});
    setCopied(num);
    setTimeout(() => setCopied(''), 2500);
  };

  return (
    <Stack spacing={2.5}>
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        To'lovni amalga oshiring va chek rasmini keyingi qadamda yuklang.
      </Alert>

      {paymentCards?.length > 0 ? (
        paymentCards.map((card, i) => (
          <Paper key={i} variant="outlined" sx={{
            p: 2.5, borderRadius: 2,
            border: '2px solid', borderColor: 'primary.main',
            bgcolor: 'primary.main' + '08',
          }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
              {card.bank}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <CreditCardIcon color="primary" />
              <Typography variant="h6" fontWeight={800} letterSpacing={2} color="primary" sx={{ flex: 1 }}>
                {card.cardNumber}
              </Typography>
              <IconButton size="small" onClick={() => copyCard(card.cardNumber)}
                color={copied === card.cardNumber ? 'success' : 'primary'}>
                {copied === card.cardNumber
                  ? <CheckCircleOutlinedIcon fontSize="small" />
                  : <ContentCopyIcon fontSize="small" />}
              </IconButton>
            </Stack>
            {card.cardHolder && (
              <Typography variant="caption" color="text.secondary">{card.cardHolder}</Typography>
            )}
          </Paper>
        ))
      ) : (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          To'lov rekvizitlari admin tomonidan o'rnatilmagan. Iltimos, admin bilan bog'laning.
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center"
        sx={{ px: 2, py: 1.5, borderRadius: 2, bgcolor: 'success.main' + '10', border: '1px solid', borderColor: 'success.main' + '40' }}>
        <Typography variant="body2" fontWeight={600}>To'lov miqdori:</Typography>
        <Typography variant="h6" fontWeight={800} color="success.main">
          {formatPrice(plan.price)} so'm
        </Typography>
      </Stack>
    </Stack>
  );
}

/* ── Step 3: загрузка чека ───────────────────────────────────── */
function ReceiptUploadStep({ receiptUrl, onUploaded }) {
  const fileInputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const [preview,   setPreview]   = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);

    setUploadErr('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const apiBase = import.meta.env.VITE_API_URL ?? '/api/v1';
      const res  = await fetch(`${apiBase}/uploads/receipt`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? 'Upload failed');
      onUploaded({ url: json.data.url, key: json.data.key });
    } catch (err) {
      setUploadErr(err.message ?? "Chekni yuklashda xatolik");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const isImg = receiptUrl && /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(receiptUrl);

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        To'lov cheki rasmini (PNG, JPG, PDF) yuklang. Administrator tekshirib tasdiqlanishini kutadi.
      </Typography>

      <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }}
        onChange={handleFile} />

      <Box
        onClick={() => !uploading && fileInputRef.current?.click()}
        sx={{
          p: 3, borderRadius: 2.5, border: '2px dashed',
          borderColor: receiptUrl ? 'success.main' : 'divider',
          bgcolor: receiptUrl ? 'success.main' + '08' : 'action.hover',
          cursor: uploading ? 'wait' : 'pointer', textAlign: 'center',
          transition: 'all 0.18s',
          '&:hover': { borderColor: receiptUrl ? 'success.main' : 'primary.main' },
          overflow: 'hidden',
        }}
      >
        {uploading ? (
          <Stack alignItems="center" spacing={1}>
            <CircularProgress size={32} />
            <Typography variant="caption" color="text.secondary">Yuklanmoqda…</Typography>
          </Stack>
        ) : receiptUrl ? (
          <Stack alignItems="center" spacing={1}>
            {isImg && preview ? (
              <Box component="img" src={preview ?? receiptUrl} alt="chek"
                sx={{ maxHeight: 180, maxWidth: '100%', borderRadius: 1.5, objectFit: 'contain' }} />
            ) : (
              <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
            )}
            <Typography variant="body2" color="success.main" fontWeight={700}>
              Chek yuklandi ✓
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Boshqa rasm tanlash uchun bosing
            </Typography>
          </Stack>
        ) : (
          <Stack alignItems="center" spacing={1}>
            <UploadFileIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
            <Typography variant="body2" fontWeight={600}>
              Chek rasmini shu yerga yuklang
            </Typography>
            <Typography variant="caption" color="text.secondary">
              JPG, PNG yoki PDF • Maks 20 MB
            </Typography>
          </Stack>
        )}
      </Box>

      {uploadErr && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>{uploadErr}</Alert>
      )}
    </Stack>
  );
}

/* ── Главный компонент ───────────────────────────────────────── */
/**
 * PaymentModal supports two modes:
 *   - Course mode: pass `course` prop (with optional `initialPlanId`)
 *   - Package mode: pass `pkg` prop (no tariff selection needed)
 */
export default function PaymentModal({ open, onClose, course, initialPlanId, pkg }) {
  const { t }  = useTranslation();
  const navigate = useNavigate();
  const user   = useSelector(selectUser);

  const { data: settingsRes, refetch: refetchSettings } = useGetSettingsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const paymentCards = settingsRes?.data?.paymentCards ?? [];

  // Re-fetch every time modal opens (bypasses stale RTK Query cache)
  useEffect(() => {
    if (open) refetchSettings();
  }, [open]); // eslint-disable-line

  const [submitApplication, { isLoading: submitting }] = useSubmitApplicationMutation();

  /* ── Package mode: single fixed plan ── */
  const isPackageMode = Boolean(pkg && !course);
  const packagePlan = isPackageMode ? {
    id:    'individual_package',
    icon:  <PersonIcon sx={{ fontSize: 28 }} />,
    color: '#7C3AED',
    price: pkg?.price?.amount ?? 0,
    label: getTitle(pkg?.title) ?? 'Individual paket',
    desc:  'Mustaqil o\'rganish, istalgan vaqtda',
  } : null;

  /* ── Course mode: build plans from tariffs ── */
  const courseTariffs = course?.tariffs ?? [];
  const plans = isPackageMode
    ? [packagePlan]
    : (courseTariffs.length > 0
        ? courseTariffs.map((t) => {
            const fb = FALLBACK_PLANS.find((p) => p.id === t.key) ?? FALLBACK_PLANS[2];
            return { id: t.key, icon: fb.icon, color: fb.color, price: t.price, label: t.name ?? fb.label, desc: fb.desc };
          })
        : FALLBACK_PLANS);

  // Package mode always starts at step 1 (skip plan selection)
  const initialStep = (isPackageMode || initialPlanId) ? 1 : 0;
  const initialPlan = isPackageMode ? 'individual_package' : (initialPlanId ?? (plans[0]?.id ?? 'offline'));

  const [step,       setStep]      = useState(initialStep);
  const [planId,     setPlanId]    = useState(initialPlan);
  const [receiptUrl, setReceiptUrl] = useState('');
  const [receiptKey, setReceiptKey] = useState('');
  const [submitErr,  setSubmitErr]  = useState('');

  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setPlanId(initialPlan);
      setReceiptUrl('');
      setReceiptKey('');
      setSubmitErr('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialPlanId, isPackageMode]);

  const selectedPlan = plans.find((p) => p.id === planId) ?? plans[0] ?? FALLBACK_PLANS[2];

  const resetAndClose = () => {
    setStep(initialStep);
    setPlanId(initialPlan);
    setReceiptUrl('');
    setReceiptKey('');
    setSubmitErr('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!receiptUrl) { setSubmitErr("Iltimos, to'lov chekini yuklang"); return; }
    setSubmitErr('');
    try {
      const payload = {
        fullName:   user?.name ?? '',
        phone:      user?.phone ?? '',
        amount:     selectedPlan.price,
        receiptUrl,
        receiptKey,
        student:    user?._id,
      };
      if (isPackageMode) {
        payload.packageId = pkg._id ?? pkg.id;
        payload.tariffKey = 'individual_package';
      } else {
        payload.course    = course?._id ?? course?.id;
        payload.tariffKey = selectedPlan.id;
      }
      await submitApplication(payload).unwrap();
      setStep(4);
    } catch (e) {
      setSubmitErr(e?.data?.message ?? "Arizani yuborishda xatolik");
    }
  };

  if (!course && !pkg) return null;
  const courseTitle = isPackageMode ? getTitle(pkg.title) : getTitle(course.title);
  const STEP_LABELS = isPackageMode
    ? ["Paket", "To'lov", "Chek"]
    : ["O'quv kursi", "To'lov", "Chek"];

  return (
    <Dialog
      open={open}
      onClose={step < 4 ? resetAndClose : undefined}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
        {step === 0
          ? "Tarif tanlash"
          : step < 4
            ? (isPackageMode ? "Paket sotib olish" : t('payment.title'))
            : t('payment.submitted')}
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2.5 }}>
        {/* Stepper */}
        {step >= 1 && step < 4 && (
          <Stepper activeStep={step - 1} sx={{ mb: 3 }} alternativeLabel>
            {STEP_LABELS.map((s) => <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
          </Stepper>
        )}

        {/* ── Step 0: выбор тарифа ── */}
        {step === 0 && (
          <PlanStep plans={plans} selectedId={planId} onSelect={setPlanId} />
        )}

        {/* ── Step 1: Курс + тариф ── */}
        {step === 1 && (
          <Stack spacing={2.5}>
            <Typography variant="subtitle1" fontWeight={700} color="primary">
              {courseTitle}
            </Typography>

            <Paper variant="outlined" sx={{
              p: 2, borderRadius: 2,
              bgcolor: selectedPlan.color + '0A',
              borderColor: selectedPlan.color,
            }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ color: selectedPlan.color }}>{selectedPlan.icon}</Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="subtitle2" fontWeight={700}>{selectedPlan.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{selectedPlan.desc}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight={800} color={selectedPlan.color}>
                    {formatPrice(selectedPlan.price)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isPackageMode ? "so'm" : "so'm/oy"}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            <Divider />
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              {t('payment.enrollInfo')}
            </Alert>
          </Stack>
        )}

        {/* ── Step 2: Реквизиты ── */}
        {step === 2 && (
          <PaymentInfoStep plan={selectedPlan} paymentCards={paymentCards} />
        )}

        {/* ── Step 3: Загрузка чека ── */}
        {step === 3 && (
          <>
            <ReceiptUploadStep
              receiptUrl={receiptUrl}
              onUploaded={({ url, key }) => { setReceiptUrl(url); setReceiptKey(key); }}
            />
            {submitErr && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>{submitErr}</Alert>
            )}
          </>
        )}

        {/* ── Step 4: Успех ── */}
        {step === 4 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <AccessTimeIcon sx={{ fontSize: 72, color: 'warning.main', mb: 2 }} />
            <Typography variant="h6" fontWeight={800} gutterBottom>
              {t('payment.submittedTitle')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: 'auto' }}>
              Administrator chekni tekshirib tasdiqlanganidan so'ng siz bilan bog'lanadi.
            </Typography>
            <Chip label="Tekshirilmoqda…" color="warning" sx={{ fontWeight: 700, fontSize: '0.85rem', px: 1 }} />
          </Box>
        )}
      </DialogContent>

      {/* ── Кнопки ── */}
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {step === 0 && (
          <>
            <Button onClick={resetAndClose} variant="outlined" sx={{ borderRadius: 2 }}>{t('common.cancel')}</Button>
            <Button onClick={() => setStep(1)} variant="contained" sx={{ borderRadius: 2 }}>{t('common.next')}</Button>
          </>
        )}
        {step === 1 && (
          <>
            <Button onClick={initialPlanId ? resetAndClose : () => setStep(0)} variant="outlined" sx={{ borderRadius: 2 }}>
              {t('common.back')}
            </Button>
            <Button onClick={() => setStep(2)} variant="contained" sx={{ borderRadius: 2 }}>{t('payment.proceed')}</Button>
          </>
        )}
        {step === 2 && (
          <>
            <Button onClick={() => setStep(1)} variant="outlined" sx={{ borderRadius: 2 }}>{t('common.back')}</Button>
            <Button onClick={() => setStep(3)} variant="contained" sx={{ borderRadius: 2 }}>{t('payment.iPaid')}</Button>
          </>
        )}
        {step === 3 && (
          <>
            <Button onClick={() => setStep(2)} variant="outlined" sx={{ borderRadius: 2 }}>{t('common.back')}</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="success"
              sx={{ borderRadius: 2 }}
              disabled={!receiptUrl || submitting}
              startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
            >
              Arizani yuborish
            </Button>
          </>
        )}
        {step === 4 && (
          <>
            <Button onClick={() => { resetAndClose(); navigate('/student'); }} variant="outlined" sx={{ borderRadius: 2 }}>
              {t('payment.goCabinet')}
            </Button>
            <Button onClick={resetAndClose} variant="contained" sx={{ borderRadius: 2 }}>{t('common.close')}</Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
