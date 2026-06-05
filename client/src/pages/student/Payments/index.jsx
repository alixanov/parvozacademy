import {
  Box, Typography, Card, CardContent, Chip, Stack,
  Table, TableBody, TableCell, TableHead, TableRow, Avatar, Button,
  CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Divider, IconButton, Tooltip,
} from '@mui/material';
import { useState, useRef } from 'react';
import { useTranslation }   from 'react-i18next';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import ReceiptLongIcon    from '@mui/icons-material/ReceiptLong';
import CalendarMonthIcon  from '@mui/icons-material/CalendarMonth';
import CreditCardIcon     from '@mui/icons-material/CreditCard';
import WarningAmberIcon   from '@mui/icons-material/WarningAmber';
import UploadFileIcon     from '@mui/icons-material/UploadFile';
import ContentCopyIcon    from '@mui/icons-material/ContentCopy';
import CloseIcon          from '@mui/icons-material/Close';
import HourglassTopIcon   from '@mui/icons-material/HourglassTop';
import AlarmIcon          from '@mui/icons-material/Alarm';
import PendingIcon        from '@mui/icons-material/Pending';
import PageHeader         from '../../../components/common/PageHeader/index.jsx';
import {
  useGetMyPaymentsQuery,
  useUploadPaymentReceiptMutation,
} from '../../../features/payments/paymentsApi.js';
import { useGetSettingsQuery } from '../../../features/settings/settingsApi.js';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const COURSE_COLORS = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

function formatPrice(n) {
  return new Intl.NumberFormat('ru-RU').format(n ?? 0);
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function fmtMonth(ym, lang = 'uz') {
  if (!ym) return '—';
  const [y, m] = ym.split('-');
  if (!y || !m) return ym;
  const locale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
  const monthName = new Date(+y, +m - 1, 1).toLocaleDateString(locale, { month: 'long' });
  return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${y}`;
}

function monthEnd(ym) {
  if (!ym) return null;
  const [y, m] = ym.split('-');
  return new Date(+y, +m, 0);
}

function daysFrom(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - new Date()) / 86400000);
}

/* ─── UploadReceiptDialog ───────────────────────────────────────────────────── */
function UploadReceiptDialog({ open, payment, settings, onClose }) {
  const { t, i18n } = useTranslation();
  const lang    = i18n.language === 'ru' ? 'ru' : 'uz';
  const fileRef = useRef();
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading,  setUploading]  = useState(false);
  const [uploadErr,  setUploadErr]  = useState('');
  const [copied,     setCopied]     = useState('');
  const [submitErr,  setSubmitErr]  = useState('');
  const [done,       setDone]       = useState(false);

  const [uploadReceipt, { isLoading: submitting }] = useUploadPaymentReceiptMutation();

  const apiUrl = import.meta.env.VITE_API_URL ?? '/api/v1';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch(`${apiUrl}/uploads/receipt`, { method: 'POST', body: fd });
      const json = await res.json();
      if (!json.success) throw new Error(json.message ?? t('payment.uploading'));
      setReceiptUrl(json.data.url);
    } catch (err) {
      setUploadErr(err.message ?? t('payment.uploading'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitErr('');
    try {
      await uploadReceipt({ id: payment._id, receiptUrl }).unwrap();
      setDone(true);
    } catch (e) {
      setSubmitErr(e?.data?.message ?? t('common.error'));
    }
  };

  const copyCard = (num) => {
    navigator.clipboard.writeText(num.replace(/\s/g, ''));
    setCopied(num);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleClose = () => {
    setReceiptUrl('');
    setUploadErr('');
    setSubmitErr('');
    setDone(false);
    onClose(done);
  };

  if (!payment) return null;

  const groupName = payment.group?.name ?? '—';
  const amount    = payment.amount ?? 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <CreditCardIcon color="primary" />
          <Typography fontWeight={800}>{t('payment.sendPaymentTitle')}</Typography>
        </Stack>
        <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {done ? (
          <Stack alignItems="center" spacing={2.5} sx={{ py: 3, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main' }} />
            <Box>
              <Typography variant="h6" fontWeight={800} gutterBottom>{t('payment.receiptSentTitle')}</Typography>
              <Typography color="text.secondary">{t('payment.receiptSentDesc')}</Typography>
            </Box>
            <Alert severity="info" sx={{ borderRadius: 2, textAlign: 'left' }}>
              {t('payment.receiptCheckTime')}
            </Alert>
          </Stack>
        ) : (
          <Stack spacing={2.5}>
            {/* Payment info */}
            <Card elevation={0} sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Box sx={{ flex: 1, minWidth: 120 }}>
                    <Typography variant="caption" color="text.secondary">{t('form.group')}</Typography>
                    <Typography variant="body2" fontWeight={700}>{groupName}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 120 }}>
                    <Typography variant="caption" color="text.secondary">{t('payment.colMonth')}</Typography>
                    <Typography variant="body2" fontWeight={700}>{fmtMonth(payment.month, lang)}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 120 }}>
                    <Typography variant="caption" color="text.secondary">{t('payment.amountLabel')}</Typography>
                    <Typography variant="h6" fontWeight={900} color="success.main">
                      {formatPrice(amount)} {t('payment.currency')}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Payment cards */}
            {settings?.paymentCards?.length > 0 ? (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  {t('payment.transferToCard')}
                </Typography>
                <Stack spacing={1}>
                  {settings.paymentCards.map((card, i) => (
                    <Card key={i} elevation={0} sx={{
                      border: '1.5px solid', borderColor: 'primary.light',
                      bgcolor: 'primary.main' + '06', borderRadius: 2,
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="caption" color="text.secondary">{card.bank}</Typography>
                            <Typography variant="h6" fontWeight={800}
                              sx={{ letterSpacing: 2.5, fontFamily: 'monospace', fontSize: '1.1rem' }}>
                              {card.cardNumber}
                            </Typography>
                            {card.cardHolder && (
                              <Typography variant="caption" color="text.secondary">{card.cardHolder}</Typography>
                            )}
                          </Box>
                          <Button size="small" variant="outlined"
                            startIcon={<ContentCopyIcon fontSize="small" />}
                            onClick={() => copyCard(card.cardNumber)}
                            sx={{ borderRadius: 2, minWidth: 110 }}>
                            {copied === card.cardNumber ? `✓ ${t('payment.copied')}` : t('payment.copy').split(' ')[0]}
                          </Button>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            ) : (
              <Alert severity="info">{t('payment.noCardInfo')}</Alert>
            )}

            {settings?.paymentInstruction && (
              <Alert severity="success" icon={false} sx={{ borderRadius: 2, fontSize: '0.82rem' }}>
                {settings.paymentInstruction}
              </Alert>
            )}

            <Divider />

            {/* Receipt upload */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                {t('payment.uploadReceiptLabel')}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                {t('payment.uploadReceiptHint')}
              </Typography>

              <input ref={fileRef} type="file" accept="image/*,.pdf"
                style={{ display: 'none' }} onChange={handleFile} />

              <Box
                onClick={() => !uploading && fileRef.current.click()}
                sx={{
                  p: 3, borderRadius: 2.5, border: '2px dashed',
                  borderColor: receiptUrl ? 'success.main' : 'divider',
                  bgcolor: receiptUrl ? 'success.main' + '08' : 'action.hover',
                  cursor: uploading ? 'wait' : 'pointer', textAlign: 'center',
                  transition: 'all 0.18s',
                  '&:hover': { borderColor: receiptUrl ? 'success.main' : 'primary.main',
                    bgcolor: receiptUrl ? 'success.main' + '10' : 'primary.main' + '06' },
                }}>
                {uploading ? (
                  <Stack alignItems="center" spacing={1}>
                    <CircularProgress size={32} />
                    <Typography variant="body2" color="text.secondary">{t('payment.uploading')}</Typography>
                  </Stack>
                ) : receiptUrl ? (
                  <Stack alignItems="center" spacing={1}>
                    <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                    <Typography variant="body2" fontWeight={700} color="success.main">
                      {t('payment.uploadSuccessMsg')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('payment.uploadChangeHint')}
                    </Typography>
                  </Stack>
                ) : (
                  <Stack alignItems="center" spacing={1}>
                    <UploadFileIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                    <Typography variant="body2" fontWeight={600}>
                      {t('payment.uploadPrompt')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PNG · JPG · JPEG · PDF — max 20 MB
                    </Typography>
                  </Stack>
                )}
              </Box>

              {uploadErr && (
                <Alert severity="error" sx={{ mt: 1, borderRadius: 2 }}>{uploadErr}</Alert>
              )}
            </Box>

            {submitErr && <Alert severity="error" sx={{ borderRadius: 2 }}>{submitErr}</Alert>}
          </Stack>
        )}
      </DialogContent>

      {!done && (
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={handleClose} sx={{ borderRadius: 2 }}>{t('common.cancel')}</Button>
          <Button
            variant="contained" color="success" sx={{ borderRadius: 2, px: 3 }}
            disabled={!receiptUrl || submitting}
            startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}
            onClick={handleSubmit}>
            {t('payment.sendReceiptBtn')}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

/* ─── цвет карточки по статусу ─────────────────────────────────────────────── */
/*
 *  🔴 RED    — не оплачено (долг / просрочено)
 *  🟡 YELLOW — следующий платёж (ближайший не просроченный)
 *             или квитанция на проверке
 *  🟢 GREEN  — оплачено и подтверждено
 */
function payColor(p, nextDebtId) {
  if (p.status === 'paid') {
    return { main: '#10B981', bg: '#10B98110', border: '#10B98138', chipColor: 'success' };
  }
  if (p.status === 'pending') {
    // квитанция отправлена, ждём подтверждения — жёлтый
    return { main: '#F59E0B', bg: '#F59E0B10', border: '#F59E0B38', chipColor: 'warning' };
  }
  // debt / partial
  const isNext = p._id === nextDebtId;
  const days   = daysFrom(p.dueDate);
  // если это ближайший платёж И он ещё не просрочен → жёлтый
  if (isNext && days !== null && days >= 0) {
    return { main: '#F59E0B', bg: '#F59E0B10', border: '#F59E0B38', chipColor: 'warning' };
  }
  // всё остальное (просрочено или более поздние долги) → красный
  return { main: '#EF4444', bg: '#EF444410', border: '#EF444438', chipColor: 'error' };
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function StudentPayments() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';

  const { data: res, isLoading, refetch } = useGetMyPaymentsQuery({ limit: 100 });
  const { data: settingsRes } = useGetSettingsQuery();

  const payments = res?.data ?? [];
  const settings = settingsRes?.data ?? null;

  const [payDialog, setPayDialog] = useState(null);

  /* ── Derived ── */
  const paidList    = payments.filter((p) => p.status === 'paid');
  const debtList    = payments
    .filter((p) => p.status === 'debt' || p.status === 'partial')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const pendingList = payments.filter((p) => p.status === 'pending');

  const totalPaid    = paidList.reduce((s, p) => s + (p.paidAmount ?? p.amount ?? 0), 0);
  const nextDebt     = debtList[0] ?? null;
  const daysUntilDue = daysFrom(nextDebt?.dueDate);
  const isOverdue    = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon    = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 7;
  const allClear     = debtList.length === 0 && pendingList.length === 0;

  /* сортировка: долги вперёд (просроченные → предстоящие → pending → оплаченные) */
  const sorted = [...payments].sort((a, b) => {
    const order = { debt: 0, partial: 1, pending: 2, paid: 3 };
    const ao = order[a.status] ?? 2;
    const bo = order[b.status] ?? 2;
    if (ao !== bo) return ao - bo;
    return new Date(a.dueDate ?? a.month) - new Date(b.dueDate ?? b.month);
  });

  return (
    <Box>
      <PageHeader icon={<CreditCardIcon />} title={t('student.payments')} />

      {/* ── Легенда цветов ── */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
        {[
          { color: '#EF4444', label: lang === 'ru' ? '🔴 Не оплачено' : '🔴 To\'lanmagan' },
          { color: '#F59E0B', label: lang === 'ru' ? '🟡 Следующий / На проверке' : '🟡 Keyingi / Tekshirilmoqda' },
          { color: '#10B981', label: lang === 'ru' ? '🟢 Оплачено' : '🟢 To\'langan' },
        ].map(({ color, label }) => (
          <Chip key={color} size="small" label={label}
            sx={{ bgcolor: color + '18', color, fontWeight: 700, border: `1px solid ${color}40`, fontSize: '0.75rem' }} />
        ))}
      </Stack>

      {/* ── Summary strip ── */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 2.5 }}>
        <CardContent sx={{ py: 2, px: { xs: 2, sm: 3 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}
            divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}>

            {/* Paid total */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#10B98118',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  {t('payment.paidMonthsLabel')}
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="#10B981">
                  {paidList.length} {lang === 'ru' ? 'мес.' : 'oy'} · {formatPrice(totalPaid)} {t('payment.currency')}
                </Typography>
              </Box>
            </Stack>

            {/* Next due */}
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{
                width: 40, height: 40, borderRadius: 2, flexShrink: 0,
                bgcolor: allClear ? '#10B98118' : isOverdue ? '#EF444418' : '#F59E0B18',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {allClear
                  ? <CheckCircleIcon sx={{ color: '#10B981', fontSize: 22 }} />
                  : <AlarmIcon sx={{ color: isOverdue ? '#EF4444' : '#F59E0B', fontSize: 22 }} />
                }
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" display="block">
                  {allClear ? t('payment.allClearLabel') : t('payment.nextDueLabel')}
                </Typography>
                {allClear ? (
                  <Typography variant="subtitle1" fontWeight={700} color="#10B981">
                    {t('payment.noNextPayment')}
                  </Typography>
                ) : (
                  <Typography variant="subtitle1" fontWeight={800}
                    color={isOverdue ? '#EF4444' : isDueSoon ? '#F59E0B' : 'text.primary'}>
                    {fmtMonth(nextDebt?.month, lang)}
                    {nextDebt?.dueDate ? ` · ${fmtDate(nextDebt.dueDate)}` : ''}
                  </Typography>
                )}
              </Box>
            </Stack>

            {/* Pending */}
            {pendingList.length > 0 && (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#F59E0B18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <HourglassTopIcon sx={{ color: '#F59E0B', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {lang === 'ru' ? 'На проверке' : 'Tekshirilmoqda'}
                  </Typography>
                  <Typography variant="subtitle1" fontWeight={800} color="#F59E0B">
                    {pendingList.length} {lang === 'ru' ? 'платёж' : "ta to'lov"}
                  </Typography>
                </Box>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* ── Алерт (просрочено / скоро) ── */}
      {isOverdue && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} icon={<AlarmIcon />}>
          <strong>{fmtMonth(nextDebt.month, lang)}</strong>{' '}
          {lang === 'ru'
            ? `— оплата просрочена на ${Math.abs(daysUntilDue)} дн.! Оплатите как можно скорее.`
            : `— to'lov ${Math.abs(daysUntilDue)} kun kechikdi! Tezroq to'lov qiling.`}
        </Alert>
      )}
      {!isOverdue && isDueSoon && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} icon={<AlarmIcon />}>
          <strong>{fmtMonth(nextDebt.month, lang)}</strong>{' '}
          {lang === 'ru'
            ? `— оплата ${daysUntilDue === 0 ? 'сегодня!' : `через ${daysUntilDue} дн.`}`
            : `— to'lov muddati ${daysUntilDue === 0 ? 'bugun!' : `${daysUntilDue} kundan so'ng.`}`}
        </Alert>
      )}

      {/* ── Заголовок списка ── */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="h6" fontWeight={700}>{t('payment.history')}</Typography>
        <Chip label={payments.length} size="small" variant="outlined" />
      </Stack>

      {/* ── Карточки платежей ── */}
      {isLoading ? (
        <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>
      ) : payments.length === 0 ? (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <CreditCardIcon sx={{ fontSize: 56, opacity: 0.18, mb: 1 }} />
            <Typography color="text.secondary">{t('payment.noPaymentsEmpty')}</Typography>
          </Box>
        </Card>
      ) : (
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 2,
        }}>
          {sorted.map((p) => {
            const col       = payColor(p, nextDebt?._id);
            const groupName = p.group?.name ?? '—';
            const amount    = p.status === 'paid' ? (p.paidAmount ?? p.amount ?? 0) : (p.amount ?? 0);
            const days      = daysFrom(p.dueDate);
            const isDebt    = p.status === 'debt' || p.status === 'partial';

            /* текст под месяцем */
            let daysLabel = null;
            if (p.status === 'paid') {
              daysLabel = { text: lang === 'ru' ? 'Подтверждено' : 'Tasdiqlangan', color: col.main };
            } else if (p.status === 'pending') {
              daysLabel = { text: lang === 'ru' ? 'Квитанция на проверке' : 'Kvitansiya tekshirilmoqda', color: col.main };
            } else if (days !== null) {
              if (days < 0)      daysLabel = { text: lang === 'ru' ? `Просрочено на ${Math.abs(days)} дн.` : `${Math.abs(days)} kun kechikdi`, color: '#EF4444' };
              else if (days === 0) daysLabel = { text: lang === 'ru' ? 'Срок сегодня!' : 'Bugun muddati!', color: '#F59E0B' };
              else                 daysLabel = { text: lang === 'ru' ? `Через ${days} дн.` : `${days} kundan so'ng`, color: col.main };
            }

            return (
              <Card key={p._id} elevation={0} sx={{
                border: `1.5px solid ${col.border}`,
                borderLeft: `5px solid ${col.main}`,
                borderRadius: 2.5,
                bgcolor: col.bg,
                display: 'flex', flexDirection: 'column',
                transition: 'box-shadow 0.18s',
                '&:hover': { boxShadow: `0 4px 20px ${col.main}22` },
              }}>
                <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

                  {/* Верхняя строка: месяц + статус-чип */}
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="subtitle1" fontWeight={900} color={col.main} sx={{ lineHeight: 1.2 }}>
                        {fmtMonth(p.month, lang)}
                      </Typography>
                      {daysLabel && (
                        <Typography variant="caption" sx={{ color: daysLabel.color, fontWeight: 600, fontSize: '0.7rem' }}>
                          {daysLabel.text}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      size="small"
                      label={
                        p.status === 'paid'    ? (lang === 'ru' ? 'Оплачено'     : "To'langan")     :
                        p.status === 'pending' ? (lang === 'ru' ? 'На проверке'  : 'Tekshirilmoqda') :
                        p.status === 'partial' ? (lang === 'ru' ? 'Частично'     : 'Qisman')         :
                                                  (lang === 'ru' ? 'Не оплачено'  : "To'lanmagan")
                      }
                      sx={{
                        bgcolor: col.main + '20', color: col.main,
                        fontWeight: 700, border: `1px solid ${col.border}`,
                        fontSize: '0.68rem',
                      }}
                    />
                  </Stack>

                  {/* Группа */}
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{
                      width: 28, height: 28,
                      bgcolor: col.main + '20', color: col.main,
                      fontSize: '0.68rem', fontWeight: 800,
                    }}>
                      {(groupName[0] ?? '?').toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">
                      {groupName}
                    </Typography>
                  </Stack>

                  {/* Сумма */}
                  <Box>
                    <Typography variant="caption" color="text.disabled">
                      {t('payment.amountLabel')}
                    </Typography>
                    <Typography variant="h5" fontWeight={900} color={col.main} sx={{ lineHeight: 1.1 }}>
                      {formatPrice(amount)}
                      <Typography component="span" variant="body2" fontWeight={500} color="text.secondary" sx={{ ml: 0.75 }}>
                        {t('payment.currency')}
                      </Typography>
                    </Typography>
                  </Box>

                  {/* Срок оплаты */}
                  {p.dueDate && (
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <CalendarMonthIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.secondary">
                        {lang === 'ru' ? 'Срок:' : 'Muddati:'} {fmtDate(p.dueDate)}
                      </Typography>
                    </Stack>
                  )}

                  {/* Spacer */}
                  <Box sx={{ flex: 1 }} />

                  {/* Кнопка действия */}
                  {p.status === 'paid' ? (
                    p.receiptUrl ? (
                      <Button
                        fullWidth variant="outlined" size="small"
                        startIcon={<ReceiptLongIcon sx={{ fontSize: '15px !important' }} />}
                        component="a" href={p.receiptUrl} target="_blank" rel="noreferrer"
                        sx={{ borderRadius: 2, borderColor: col.border, color: col.main,
                          fontWeight: 600, '&:hover': { bgcolor: col.main + '10', borderColor: col.main } }}>
                        {lang === 'ru' ? 'Квитанция' : 'Kvitansiya'}
                      </Button>
                    ) : (
                      <Box sx={{
                        py: 0.75, borderRadius: 2, bgcolor: col.main + '14',
                        textAlign: 'center',
                      }}>
                        <Typography variant="caption" fontWeight={700} color={col.main}>
                          ✓ {lang === 'ru' ? 'Платёж подтверждён' : "To'lov tasdiqlangan"}
                        </Typography>
                      </Box>
                    )
                  ) : p.status === 'pending' ? (
                    <Box sx={{
                      py: 0.75, borderRadius: 2, bgcolor: col.main + '14', textAlign: 'center',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                    }}>
                      <HourglassTopIcon sx={{ fontSize: 14, color: col.main }} />
                      <Typography variant="caption" fontWeight={700} color={col.main}>
                        {lang === 'ru' ? 'Ожидает проверки' : 'Tekshirilmoqda'}
                      </Typography>
                    </Box>
                  ) : (
                    <Button
                      fullWidth variant="contained" size="small"
                      startIcon={<UploadFileIcon sx={{ fontSize: '15px !important' }} />}
                      onClick={() => setPayDialog(p)}
                      sx={{
                        borderRadius: 2, fontWeight: 700,
                        bgcolor: col.main, '&:hover': { bgcolor: col.main, filter: 'brightness(1.08)' },
                      }}>
                      {t('payment.sendReceipt')}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Upload receipt dialog */}
      <UploadReceiptDialog
        open={Boolean(payDialog)}
        payment={payDialog}
        settings={settings}
        onClose={(refreshed) => {
          setPayDialog(null);
          if (refreshed) refetch();
        }}
      />
    </Box>
  );
}
