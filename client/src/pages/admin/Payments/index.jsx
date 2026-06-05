import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, TextField,
  InputAdornment, Button, IconButton, Tooltip, LinearProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Snackbar, Alert, Tabs, Tab, Badge, CircularProgress,
  Paper,
} from '@mui/material';
import { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation }         from 'react-i18next';
import { useSelector }            from 'react-redux';
import { DatePicker }             from '@mui/x-date-pickers/DatePicker';
import dayjs                      from 'dayjs';
import { selectAccessToken }      from '../../../features/auth/authSlice.js';
import SearchIcon                 from '@mui/icons-material/Search';
import { DateBadge, DueDateBadge, DateRangeBadge } from '../../../components/common/DateBadge/index.jsx';
import FileDownloadIcon           from '@mui/icons-material/FileDownload';
import CheckCircleIcon            from '@mui/icons-material/CheckCircle';
import CancelIcon                 from '@mui/icons-material/Cancel';
import PendingIcon                from '@mui/icons-material/Pending';
import PaymentsIcon               from '@mui/icons-material/Payments';
import WarningAmberIcon           from '@mui/icons-material/WarningAmber';
import CalendarMonthIcon          from '@mui/icons-material/CalendarMonth';
import AddIcon                    from '@mui/icons-material/Add';
import HowToRegIcon               from '@mui/icons-material/HowToReg';
import ReceiptLongIcon            from '@mui/icons-material/ReceiptLong';
import ReceiptIcon                from '@mui/icons-material/Receipt';
import GroupsIcon                 from '@mui/icons-material/Groups';
import ZoomInIcon                 from '@mui/icons-material/ZoomIn';
import BrokenImageIcon            from '@mui/icons-material/BrokenImage';
import { formatPrice }            from '../../../data/mockData.js';
import PageHeader                 from '../../../components/common/PageHeader/index.jsx';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import {
  useGetPaymentsQuery,
  useGetPaymentsSummaryQuery,
  useCreatePaymentMutation,
  useConfirmPaymentMutation,
  useGeneratePaymentsMutation,
} from '../../../features/payments/paymentsApi.js';
import {
  useGetEnrollmentsQuery,
  useApproveEnrollmentMutation,
  useRejectEnrollmentMutation,
} from '../../../features/enrollment/enrollmentApi.js';
import { useGetGroupsQuery }      from '../../../features/groups/groupsApi.js';
import { useGetUsersQuery }       from '../../../features/users/usersApi.js';
import i18n                       from '../../../utils/i18n.js';

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
═══════════════════════════════════════════════════════════════════ */
const API_BASE   = import.meta.env.VITE_API_URL ?? '/api/v1';
const PALETTE    = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6'];

const METHOD_OPTIONS = [
  { value: 'cash',     label: 'Naqd pul' },
  { value: 'card',     label: 'Karta' },
  { value: 'transfer', label: "O'tkazma" },
  { value: 'online',   label: 'Online' },
];
const METHOD_LABEL = Object.fromEntries(METHOD_OPTIONS.map((m) => [m.value, m.label]));

const STATUS_CFG = {
  paid:    { label: "To'langan",      color: 'success', icon: <CheckCircleIcon  sx={{ fontSize: 14 }} /> },
  partial: { label: 'Qisman',         color: 'warning', icon: <PendingIcon      sx={{ fontSize: 14 }} /> },
  debt:    { label: 'Qarzdorlik',     color: 'error',   icon: <WarningAmberIcon sx={{ fontSize: 14 }} /> },
  pending: { label: 'Tekshirilmoqda', color: 'info',    icon: <PendingIcon      sx={{ fontSize: 14 }} /> },
  refunded:{ label: 'Qaytarilgan',    color: 'default', icon: <CancelIcon       sx={{ fontSize: 14 }} /> },
};

const MONTH_NAMES_UZ = [
  'Yanvar','Fevral','Mart','Aprel','May','Iyun',
  'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr',
];

/** "2026-05" → "May 2026" */
function fmtMonth(ym) {
  if (!ym) return '—';
  const [year, mon] = ym.split('-');
  return `${MONTH_NAMES_UZ[Number(mon) - 1] ?? mon} ${year}`;
}

/** Past `past` months + current month, newest first (for filters) */
function generatePastMonths(past = 5) {
  const now = new Date();
  return Array.from({ length: past + 1 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

const RECENT_MONTHS = generatePastMonths(5);  // last 6 months (filter)
const CURRENT_MONTH = RECENT_MONTHS[0];

function cTitle(course) {
  if (!course) return '—';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const t = course.title;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '—';
  return t ?? '—';
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU',
    { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function enrollStatusMeta(status) {
  if (status === 'approved') return { label: 'Tasdiqlangan', color: 'success' };
  if (status === 'rejected') return { label: 'Rad etilgan',  color: 'error'   };
  return                             { label: 'Kutilmoqda',  color: 'warning'  };
}

/* ═══════════════════════════════════════════════════════════════════
   RECEIPT IMAGE — fetches via auth proxy, shows thumbnail + lightbox
═══════════════════════════════════════════════════════════════════ */
/**
 * Props:
 *  receiptKey  — "receipts/abc.png"   (preferred)
 *  receiptUrl  — full T3 URL          (fallback key extraction)
 *  size        — thumbnail size in px (default 56)
 *  inline      — true → show full-width image without lightbox (inside a dialog)
 */
function ReceiptImage({ receiptKey, receiptUrl, size = 56, inline = false }) {
  const token  = useSelector(selectAccessToken);
  const [src,      setSrc]      = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [err,      setErr]      = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const objRef = useRef(null);

  const key = receiptKey || receiptUrl || '';
  const isPdf = key.toLowerCase().endsWith('.pdf');

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    setSrc(null); setErr(false); setLoading(true);

    fetch(`${API_BASE}/uploads/view?key=${encodeURIComponent(key)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.blob(); })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        objRef.current = url;
        setSrc(url);
      })
      .catch(() => { if (!cancelled) setErr(true); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
      if (objRef.current) { URL.revokeObjectURL(objRef.current); objRef.current = null; }
    };
  }, [key, token]); // eslint-disable-line

  /* ── no key ── */
  if (!key) return <Typography variant="caption" color="text.disabled">—</Typography>;

  /* ── loading ── */
  if (loading) return (
    <Box sx={{
      width: inline ? '100%' : size, height: inline ? 160 : size,
      borderRadius: 1.5, bgcolor: 'action.hover',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <CircularProgress size={20} thickness={4} />
    </Box>
  );

  /* ── error ── */
  if (err) return (
    <Box sx={{
      width: inline ? '100%' : size, height: inline ? 80 : size,
      borderRadius: 1.5, bgcolor: 'action.hover', border: '1px dashed',
      borderColor: 'divider', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 0.5,
    }}>
      <BrokenImageIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
      {inline && <Typography variant="caption" color="text.disabled">Yuklab bo'lmadi</Typography>}
    </Box>
  );

  /* ── PDF ── */
  if (isPdf) return (
    <Chip
      icon={<ReceiptLongIcon />}
      label="PDF chek"
      size="small"
      color="primary"
      variant="outlined"
      onClick={inline ? undefined : () => setLightbox(true)}
      sx={{ fontWeight: 600, cursor: inline ? 'default' : 'pointer' }}
    />
  );

  /* ── inline (inside a dialog, no lightbox) ── */
  if (inline) return (
    <Box
      component="img"
      src={src}
      alt="chek"
      sx={{
        width: '100%', maxHeight: 340,
        objectFit: 'contain', display: 'block',
        borderRadius: 1.5, bgcolor: '#f5f5f5',
      }}
    />
  );

  /* ── thumbnail + lightbox ── */
  return (
    <>
      <Tooltip title="Chekni kattalashtirish" placement="top">
        <Box
          onClick={() => setLightbox(true)}
          sx={{
            position: 'relative', width: size, height: size,
            borderRadius: 1.5, overflow: 'hidden',
            border: '2px solid', borderColor: 'divider',
            cursor: 'zoom-in', flexShrink: 0,
            '&:hover .overlay': { opacity: 1 },
            '&:hover': { borderColor: 'primary.main' },
            transition: 'border-color 0.15s',
          }}
        >
          <Box
            component="img"
            src={src}
            alt="chek"
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* hover overlay */}
          <Box className="overlay" sx={{
            position: 'absolute', inset: 0,
            bgcolor: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.15s',
          }}>
            <ZoomInIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
        </Box>
      </Tooltip>

      {/* Lightbox */}
      <Dialog
        open={lightbox}
        onClose={() => setLightbox(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', bgcolor: '#0d0d0d' } }}
      >
        <DialogContent sx={{
          p: 0, bgcolor: '#0d0d0d',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: 320,
        }}>
          <Box
            component="img"
            src={src}
            alt="chek"
            sx={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', display: 'block' }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1a1a1a', py: 1.5, justifyContent: 'center', gap: 1.5 }}>
          <Typography variant="caption" color="grey.500">
            <ReceiptIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
            To'lov cheki
          </Typography>
          <Button
            onClick={() => setLightbox(false)}
            size="small"
            variant="outlined"
            sx={{ color: '#ccc', borderColor: '#444', borderRadius: 2, minWidth: 80 }}
          >
            Yopish
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ENROLLMENT DIALOGS
═══════════════════════════════════════════════════════════════════ */
function ApproveDialog({ open, application, onClose }) {
  const [groupId, setGroupId] = useState('');
  const [error,   setError]   = useState('');

  const { data: groupsRes } = useGetGroupsQuery({ limit: 100 }, { skip: !open });
  const [approve, { isLoading }] = useApproveEnrollmentMutation();

  const allGroups   = groupsRes?.data ?? [];
  const matchGroups = allGroups.filter(
    (g) => g.course?._id === application?.course?._id
      && g.type === application?.tariffKey
      && g.isActive,
  );

  const handleApprove = async () => {
    setError('');
    try {
      await approve({ id: application._id, groupId: groupId || undefined }).unwrap();
      onClose(true);
    } catch (e) {
      setError(e?.data?.message ?? 'Xatolik yuz berdi');
    }
  };

  if (!application) return null;
  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckCircleIcon color="success" /> Arizani tasdiqlash
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

          {/* Summary */}
          <Grid container spacing={1.5}>
            {[
              { label: 'Ism',     value: application.fullName },
              { label: 'Telefon', value: application.phone },
              { label: 'Kurs',    value: cTitle(application.course) },
              { label: 'Tarif',   value: application.tariffKey },
              { label: 'Summa',   value: `${formatPrice(application.amount)} so'm` },
              { label: 'Sana',    value: fmtDate(application.createdAt) },
            ].map(({ label, value }) => (
              <Grid item xs={6} key={label}>
                <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                <Typography variant="body2" fontWeight={700}>{value}</Typography>
              </Grid>
            ))}
          </Grid>

          {/* Receipt */}
          {(application.receiptUrl || application.receiptKey) && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                <ReceiptIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle', color: 'primary.main' }} />
                To'lov cheki
              </Typography>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', p: 1, bgcolor: 'action.hover' }}>
                <ReceiptImage
                  receiptKey={application.receiptKey}
                  receiptUrl={application.receiptUrl}
                  inline
                />
              </Paper>
            </Box>
          )}

          {/* Group selector */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Guruh tanlash
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (bo'sh qoldiring — avtomatik)
              </Typography>
            </Typography>
            {matchGroups.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Bu kurs + tarif uchun aktiv guruh topilmadi.
              </Alert>
            ) : (
              <FormControl fullWidth size="small">
                <InputLabel>Guruh</InputLabel>
                <Select value={groupId} label="Guruh" onChange={(e) => setGroupId(e.target.value)}>
                  <MenuItem value="">Avtomatik (birinchi topilgan)</MenuItem>
                  {matchGroups.map((g) => (
                    <MenuItem key={g._id} value={g._id}>
                      {g.name} — {g.teacher?.name ?? '?'} ({g.maxStudents} o'rin)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={() => onClose(false)} sx={{ borderRadius: 2 }}>Bekor qilish</Button>
        <Button variant="contained" color="success" sx={{ borderRadius: 2 }}
          onClick={handleApprove} disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <CheckCircleIcon />}>
          Tasdiqlash
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RejectDialog({ open, application, onClose }) {
  const [reason, setReason] = useState('');
  const [reject, { isLoading }] = useRejectEnrollmentMutation();

  const handleReject = async () => {
    try {
      await reject({ id: application._id, reason }).unwrap();
      onClose(true);
    } catch { /* ignore */ }
  };

  if (!application) return null;
  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
        <CancelIcon /> Rad etish
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2">
            <strong>{application.fullName}</strong> arizasi rad etiladi.
          </Typography>
          <TextField fullWidth multiline rows={3} label="Sabab (ixtiyoriy)"
            placeholder="Masalan: Noto'g'ri chek, guruh to'liq..."
            value={reason} onChange={(e) => setReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={() => onClose(false)} sx={{ borderRadius: 2 }}>Bekor qilish</Button>
        <Button variant="contained" color="error" sx={{ borderRadius: 2 }}
          onClick={handleReject} disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <CancelIcon />}>
          Rad etish
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ENROLLMENTS PANEL
═══════════════════════════════════════════════════════════════════ */
function EnrollmentsPanel() {
  const [subTab,     setSubTab]     = useState('pending');
  const [approveApp, setApproveApp] = useState(null);
  const [rejectApp,  setRejectApp]  = useState(null);

  const { data, isLoading, refetch } = useGetEnrollmentsQuery({ status: subTab, limit: 50 });
  const applications = data?.data ?? [];
  const total = data?.pagination?.total ?? 0;

  return (
    <Box>
      {/* Sub-tabs */}
      <Tabs value={subTab} onChange={(_, v) => setSubTab(v)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="pending"  label="Kutilmoqda"   icon={<PendingIcon />}     iconPosition="start" />
        <Tab value="approved" label="Tasdiqlangan" icon={<CheckCircleIcon />} iconPosition="start" />
        <Tab value="rejected" label="Rad etilgan"  icon={<CancelIcon />}      iconPosition="start" />
        <Tab value="all"      label="Barchasi"     icon={<GroupsIcon />}      iconPosition="start" />
      </Tabs>

      {isLoading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {!isLoading && applications.length === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3,
          py: 8, textAlign: 'center' }}>
          <HowToRegIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">Arizalar topilmadi</Typography>
        </Card>
      )}

      {!isLoading && applications.length > 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          {/* table header bar */}
          <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Jami: <strong>{total}</strong> ta ariza
            </Typography>
            <Chip label={`${subTab === 'all' ? 'Hammasi' : enrollStatusMeta(subTab).label}`}
              size="small" color={enrollStatusMeta(subTab).color} variant="outlined" />
          </Box>

          <CardContent sx={{ p: 0, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 860 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Ariza beruvchi</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Kurs / Tarif</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Summa</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Chek</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Sana</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                  {subTab === 'approved' && <TableCell sx={{ fontWeight: 700 }}>Guruh</TableCell>}
                  {subTab === 'rejected' && <TableCell sx={{ fontWeight: 700 }}>Sabab</TableCell>}
                  {(subTab === 'pending' || subTab === 'all') && (
                    <TableCell sx={{ fontWeight: 700 }} align="center">Amal</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((app, idx) => {
                  const color = PALETTE[idx % PALETTE.length];
                  const sm    = enrollStatusMeta(app.status);
                  return (
                    <TableRow key={app._id} hover
                      sx={app.status === 'pending'
                        ? { bgcolor: 'warning.main' + '05' }
                        : {}}>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{
                            bgcolor: color + '20', color,
                            width: 38, height: 38, fontWeight: 800, fontSize: '0.9rem',
                          }}>
                            {app.fullName?.[0]?.toUpperCase() ?? '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{app.fullName}</Typography>
                            <Typography variant="caption" color="text.secondary">{app.phone}</Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{cTitle(app.course)}</Typography>
                        <Chip label={app.tariffKey} size="small" variant="outlined"
                          sx={{ mt: 0.5, height: 18, fontSize: '0.65rem' }} />
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={800} color="success.main">
                          {formatPrice(app.amount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">so'm</Typography>
                      </TableCell>

                      <TableCell>
                        <ReceiptImage
                          receiptKey={app.receiptKey}
                          receiptUrl={app.receiptUrl}
                          size={52}
                        />
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {fmtDate(app.createdAt)}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip label={sm.label} color={sm.color} size="small"
                          sx={{ fontWeight: 600 }} />
                      </TableCell>

                      {subTab === 'approved' && (
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {app.student?.name ?? '—'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {app.group?.name ?? '—'}
                          </Typography>
                        </TableCell>
                      )}
                      {subTab === 'rejected' && (
                        <TableCell sx={{ maxWidth: 180 }}>
                          <Typography variant="caption" color="text.secondary"
                            sx={{ display: '-webkit-box', WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {app.rejectionReason || '—'}
                          </Typography>
                        </TableCell>
                      )}

                      {(subTab === 'pending' || subTab === 'all') && (
                        <TableCell align="center">
                          {app.status === 'pending' ? (
                            <Stack direction="row" spacing={0.5} justifyContent="center">
                              <Tooltip title="Tasdiqlash">
                                <IconButton size="small" color="success"
                                  onClick={() => setApproveApp(app)}>
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Rad etish">
                                <IconButton size="small" color="error"
                                  onClick={() => setRejectApp(app)}>
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          ) : (
                            <Chip label={sm.label} color={sm.color} size="small"
                              variant="outlined" sx={{ fontSize: '0.65rem' }} />
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <ApproveDialog
        open={Boolean(approveApp)}
        application={approveApp}
        onClose={(ok) => { setApproveApp(null); if (ok) refetch(); }}
      />
      <RejectDialog
        open={Boolean(rejectApp)}
        application={rejectApp}
        onClose={(ok) => { setRejectApp(null); if (ok) refetch(); }}
      />
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAYMENT DIALOGS
═══════════════════════════════════════════════════════════════════ */
function ConfirmPaymentDialog({ open, payment, onClose, onConfirm, loading }) {
  const { t } = useTranslation();
  const [method, setMethod] = useState('cash');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <HowToRegIcon color="success" />
        {payment?.status === 'pending' ? 'Chekni tasdiqlash' : "To'lovni tasdiqlash"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          {/* Info row */}
          <Card elevation={0} sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={1.5}>
                {[
                  { label: "O'quvchi", value: payment?.student?.name ?? '—' },
                  { label: 'Guruh',    value: payment?.group?.name   ?? '—' },
                  { label: 'Oy',       value: fmtMonth(payment?.month) },
                  { label: 'Summa',    value: `${formatPrice(payment?.amount ?? 0)} so'm` },
                ].map(({ label, value }) => (
                  <Grid item xs={6} key={label}>
                    <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
                    <Typography variant="body2" fontWeight={700}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Receipt */}
          {payment?.receiptUrl && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}
                sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ReceiptIcon sx={{ fontSize: 15 }} /> O'quvchi yuborgan chek
              </Typography>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', p: 1, bgcolor: 'action.hover' }}>
                <ReceiptImage receiptUrl={payment.receiptUrl} inline />
              </Paper>
            </Box>
          )}

          <TextField select label={t('form.method')} fullWidth size="small"
            value={method} onChange={(e) => setMethod(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
            {METHOD_OPTIONS.map((m) => (
              <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={() => onConfirm(method)} variant="contained" color="success"
          sx={{ borderRadius: 2 }} disabled={loading}
          startIcon={loading
            ? <CircularProgress size={14} color="inherit" />
            : <CheckCircleIcon />}>
          Tasdiqlash
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AddPaymentDialog({ open, onClose, onSave, loading }) {
  const { t } = useTranslation();
  const BLANK = { studentId: '', groupId: '', amount: '', periodStart: null, periodEnd: null };
  const [form, setForm] = useState(BLANK);
  const [err,  setErr]  = useState({});

  const { data: groupsRes }   = useGetGroupsQuery({ limit: 100 });
  const { data: studentsRes } = useGetUsersQuery({ role: 'student', limit: 200 });
  const groups   = groupsRes?.data  ?? [];
  const students = studentsRes?.data ?? [];

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  /* Auto-derive month label from periodStart */
  const derivedMonth = form.periodStart ? form.periodStart.format('YYYY-MM') : null;

  const validate = () => {
    const e = {};
    if (!form.studentId)                          e.studentId  = 'Majburiy';
    if (!form.groupId)                            e.groupId    = 'Majburiy';
    if (!form.amount || Number(form.amount) <= 0) e.amount     = "Noto'g'ri summa";
    if (!form.periodStart)                        e.periodStart = 'Boshlanish sanasini tanlang';
    if (!form.periodEnd)                          e.periodEnd   = 'Tugash sanasini tanlang';
    if (form.periodStart && form.periodEnd && !form.periodEnd.isAfter(form.periodStart)) {
      e.periodEnd = 'Tugash sanasi boshlanishdan keyin bo\'lishi kerak';
    }
    setErr(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    onSave({
      student:     form.studentId,
      group:       form.groupId,
      amount:      Number(form.amount),
      month:       derivedMonth,
      dueDate:     form.periodEnd.toISOString(),
      periodStart: form.periodStart.toISOString(),
      periodEnd:   form.periodEnd.toISOString(),
    });
  };

  const handleClose = () => { setForm(BLANK); setErr({}); onClose(); };

  const pickerSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        <AddIcon sx={{ mr: 1, verticalAlign: 'middle', color: 'primary.main' }} />
        {t('dialog.addPayment')}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>

          {/* Student + Group */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField select label={`${t('form.student')} *`} fullWidth size="small"
                value={form.studentId} onChange={set('studentId')}
                error={!!err.studentId} helperText={err.studentId}
                sx={pickerSx}>
                {students.map((s) => <MenuItem key={s._id} value={s._id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label={`${t('form.group')} *`} fullWidth size="small"
                value={form.groupId} onChange={set('groupId')}
                error={!!err.groupId} helperText={err.groupId}
                sx={pickerSx}>
                {groups.map((g) => <MenuItem key={g._id} value={g._id}>{g.name}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          {/* Amount */}
          <TextField label="Summa *" fullWidth size="small" type="number"
            value={form.amount} onChange={set('amount')}
            error={!!err.amount} helperText={err.amount}
            InputProps={{ startAdornment: <InputAdornment position="start">UZS</InputAdornment> }}
            sx={pickerSx} />

          {/* Period */}
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}
              sx={{ mb: 1, display: 'block' }}>
              To'lov davri *
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Boshlanish sanasi"
                  value={form.periodStart}
                  onChange={(val) => {
                    setForm((p) => ({ ...p, periodStart: val }));
                    setErr((e) => ({ ...e, periodStart: undefined }));
                  }}
                  slotProps={{
                    textField: {
                      size: 'small', fullWidth: true,
                      error: !!err.periodStart, helperText: err.periodStart,
                      sx: pickerSx,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="Tugash sanasi"
                  value={form.periodEnd}
                  minDate={form.periodStart ?? undefined}
                  onChange={(val) => {
                    setForm((p) => ({ ...p, periodEnd: val }));
                    setErr((e) => ({ ...e, periodEnd: undefined }));
                  }}
                  slotProps={{
                    textField: {
                      size: 'small', fullWidth: true,
                      error: !!err.periodEnd, helperText: err.periodEnd,
                      sx: pickerSx,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Derived month chip */}
          {derivedMonth && (
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 2, py: 1, borderRadius: 2,
              bgcolor: 'primary.main' + '10', border: '1px solid',
              borderColor: 'primary.main' + '30',
            }}>
              <CalendarMonthIcon sx={{ fontSize: 16, color: 'primary.main' }} />
              <Typography variant="caption" color="primary.main" fontWeight={700}>
                To'lov oyi: {fmtMonth(derivedMonth)}
              </Typography>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} variant="contained" sx={{ borderRadius: 2 }}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <AddIcon />}>
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   GENERATE PAYMENTS DIALOG
   Lets admin auto-create monthly debt records for any student/group.
═══════════════════════════════════════════════════════════════════ */
function GeneratePaymentsDialog({ open, onClose }) {
  const [form, setForm] = useState({ studentId: '', groupId: '' });
  const [result, setResult] = useState(null);
  const [err, setErr]       = useState('');

  const { data: groupsRes }   = useGetGroupsQuery({ limit: 100 }, { skip: !open });
  const { data: studentsRes } = useGetUsersQuery({ role: 'student', limit: 200 }, { skip: !open });
  const groups   = groupsRes?.data  ?? [];
  const students = studentsRes?.data ?? [];

  const [generate, { isLoading }] = useGeneratePaymentsMutation();

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleGenerate = async () => {
    setErr('');
    if (!form.studentId || !form.groupId) {
      setErr("O'quvchi va guruhni tanlang"); return;
    }
    try {
      const res = await generate({ studentId: form.studentId, groupId: form.groupId }).unwrap();
      setResult(res.data ?? []);
    } catch (e) {
      setErr(e?.data?.message ?? 'Xatolik yuz berdi');
    }
  };

  const handleClose = () => {
    setForm({ studentId: '', groupId: '' });
    setResult(null);
    setErr('');
    onClose(Boolean(result?.length));
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
        <AutorenewIcon color="primary" /> Oylik to'lovlarni yaratish
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Alert severity="info" sx={{ borderRadius: 2, fontSize: '0.82rem' }}>
            Guruhning <strong>startDate</strong> va kursning <strong>duration</strong> asosida
            har oyga bir to'lov yozuvi (status: <em>debt</em>) yaratiladi.
            Mavjud yozuvlar o'tkazib yuboriladi.
          </Alert>

          {err && <Alert severity="error" sx={{ borderRadius: 2 }}>{err}</Alert>}

          {result ? (
            <Alert severity="success" sx={{ borderRadius: 2 }}>
              <strong>{result.length} ta</strong> to'lov yozuvi tayyor.
              {result.length > 0 && (
                <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                  {result.slice(0, 6).map((p) => (
                    <li key={p._id}>
                      <Typography variant="caption">
                        {fmtMonth(p.month)} — {p.status}
                      </Typography>
                    </li>
                  ))}
                  {result.length > 6 && (
                    <li><Typography variant="caption">...va yana {result.length - 6} ta</Typography></li>
                  )}
                </Box>
              )}
            </Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField select label="O'quvchi *" fullWidth size="small"
                  value={form.studentId} onChange={set('studentId')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                  {students.map((s) => (
                    <MenuItem key={s._id} value={s._id}>
                      {s.name}
                      {s.studentId ? ` (${s.studentId})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Guruh *" fullWidth size="small"
                  value={form.groupId} onChange={set('groupId')}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
                  {groups.map((g) => (
                    <MenuItem key={g._id} value={g._id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={handleClose} sx={{ borderRadius: 2 }}>
          {result ? 'Yopish' : 'Bekor qilish'}
        </Button>
        {!result && (
          <Button variant="contained" sx={{ borderRadius: 2 }}
            onClick={handleGenerate} disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={14} color="inherit" /> : <AutorenewIcon />}>
            Yaratish
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAYMENTS PANEL
═══════════════════════════════════════════════════════════════════ */
function PaymentsPanel() {
  const { t } = useTranslation();

  const [search,     setSearch]     = useState('');
  const [month,      setMonth]      = useState('all');
  const [status,     setStatus]     = useState('all');
  const [confirmDlg, setConfirmDlg] = useState(null);
  const [addDlg,     setAddDlg]     = useState(false);
  const [genDlg,     setGenDlg]     = useState(false);
  const [snack,      setSnack]      = useState({ open: false, msg: '', severity: 'success' });

  const queryParams = {};
  if (month  !== 'all') queryParams.month  = month;
  if (status !== 'all') queryParams.status = status;

  const { data: paymentsRes, isLoading } = useGetPaymentsQuery({ ...queryParams, limit: 100 });
  const { data: summaryRes }             = useGetPaymentsSummaryQuery({
    month: month !== 'all' ? month : CURRENT_MONTH,
  });

  const [createPayment,  { isLoading: creating }]  = useCreatePaymentMutation();
  const [confirmPayment, { isLoading: confirming }] = useConfirmPaymentMutation();

  const allPayments = paymentsRes?.data ?? [];
  const summary     = summaryRes?.data  ?? {};

  const filtered = useMemo(() =>
    allPayments.filter((p) => {
      const q = search.toLowerCase();
      return (p.student?.name ?? '').toLowerCase().includes(q) ||
             (p.group?.name   ?? '').toLowerCase().includes(q);
    }),
  [allPayments, search]);

  const notify = (msg, severity = 'success') =>
    setSnack({ open: true, msg, severity });

  const handleConfirm = async (paymentMethod) => {
    if (!confirmDlg) return;
    try {
      await confirmPayment({
        id: confirmDlg._id, paidAmount: confirmDlg.amount, paymentMethod,
      }).unwrap();
      notify("To'lov muvaffaqiyatli tasdiqlandi!");
    } catch (err) {
      notify(err?.data?.message ?? t('common.error'), 'error');
    }
    setConfirmDlg(null);
  };

  const handleAdd = async (payload) => {
    try {
      await createPayment(payload).unwrap();
      notify("To'lov qo'shildi!");
      setAddDlg(false);
    } catch (err) {
      notify(err?.data?.message ?? t('common.error'), 'error');
    }
  };


  const STATUS_DOT = {
    paid:     { dot: '#10B981', label: "To'langan",      bg: '#10B98110' },
    partial:  { dot: '#F59E0B', label: 'Qisman',         bg: '#F59E0B10' },
    debt:     { dot: '#EF4444', label: 'Qarzdorlik',     bg: '#EF444410' },
    pending:  { dot: '#6366F1', label: 'Tekshirilmoqda', bg: '#6366F110' },
    refunded: { dot: '#94A3B8', label: 'Qaytarilgan',    bg: '#94A3B810' },
  };
  const METHOD_LABEL_SHORT = { cash: 'Naqd', card: 'Karta', transfer: "O'tkazma", online: 'Online' };

  /* ── metric items ── */
  const metrics = [
    { label: "Oylik tushum", value: formatPrice(summary.revenue ?? 0), sub: "so'm", color: '#10B981' },
    { label: "To'langan",    value: summary.paidCount   ?? 0,          sub: "ta",   color: '#1976D2' },
    { label: 'Qarzdorlik',   value: summary.debtCount   ?? 0,          sub: "ta",   color: '#EF4444' },
    { label: "Qisman",       value: summary.partialCount ?? 0,         sub: "ta",   color: '#F59E0B' },
  ];

  return (
    <Box>
      <Snackbar open={snack.open} autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>

      {/* ── Metrics strip ── */}
      <Box sx={{
        display: 'flex', flexWrap: { xs: 'wrap', sm: 'nowrap' }, mb: 3,
        border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden',
      }}>
        {metrics.map((k, i) => (
          <Box key={k.label} sx={{
            flex: '1 1 120px', px: 2.5, py: 1.75,
            borderRight: { xs: i % 2 === 0 ? '1px solid' : 'none', sm: i < metrics.length - 1 ? '1px solid' : 'none' },
            borderBottom: { xs: i < 2 ? '1px solid' : 'none', sm: 'none' },
            borderColor: 'divider',
          }}>
            <Typography sx={{ fontSize: '0.66rem', letterSpacing: '0.06em', textTransform: 'uppercase',
              color: 'text.disabled', display: 'block', mb: 0.6 }}>
              {k.label}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="baseline">
              <Typography variant="h6" fontWeight={700} color={k.color} lineHeight={1}>
                {k.value}
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: 'text.disabled', lineHeight: 1 }}>
                {k.sub}
              </Typography>
            </Stack>
          </Box>
        ))}
      </Box>

      {/* ── Toolbar ── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        <TextField size="small" placeholder="O'quvchi yoki guruh…"
          value={search} onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 1.5, fontSize: '0.84rem' } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
        />

        <Select size="small" value={month} onChange={(e) => setMonth(e.target.value)}
          displayEmpty sx={{ minWidth: 120, borderRadius: 1.5, fontSize: '0.84rem' }}>
          <MenuItem value="all"><em style={{ fontStyle: 'normal', color: 'inherit' }}>Barcha oylar</em></MenuItem>
          {RECENT_MONTHS.map((m) => <MenuItem key={m} value={m} sx={{ fontSize: '0.84rem' }}>{fmtMonth(m)}</MenuItem>)}
        </Select>

        <Select size="small" value={status} onChange={(e) => setStatus(e.target.value)}
          displayEmpty sx={{ minWidth: 140, borderRadius: 1.5, fontSize: '0.84rem' }}
          renderValue={(v) => {
            if (v === 'all') return <span style={{ color: 'inherit' }}>Barcha statuslar</span>;
            const c = STATUS_DOT[v];
            return (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c?.dot, flexShrink: 0 }} />
                <span style={{ fontSize: '0.84rem' }}>{c?.label}</span>
              </Stack>
            );
          }}>
          <MenuItem value="all" sx={{ fontSize: '0.84rem' }}>Barcha statuslar</MenuItem>
          {Object.entries(STATUS_DOT).map(([v, c]) => (
            <MenuItem key={v} value={v} sx={{ fontSize: '0.84rem' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.dot, flexShrink: 0 }} />
                <span>{c.label}</span>
              </Stack>
            </MenuItem>
          ))}
        </Select>

        <Stack direction="row" spacing={0.75} flexShrink={0} sx={{ ml: { sm: 'auto' } }}>
          <Tooltip title="Excel export">
            <IconButton size="small" onClick={() => notify("Tez orada", 'info')}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, p: 0.75 }}>
              <FileDownloadIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          <Button size="small" variant="outlined" onClick={() => setGenDlg(true)}
            startIcon={<AutorenewIcon sx={{ fontSize: 14 }} />}
            sx={{ borderRadius: 1.5, fontSize: '0.75rem', px: 1.5, py: 0.6, textTransform: 'none', fontWeight: 600 }}>
            Yaratish
          </Button>
          <Button size="small" variant="contained" onClick={() => setAddDlg(true)}
            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
            sx={{ borderRadius: 1.5, fontSize: '0.75rem', px: 1.5, py: 0.6, textTransform: 'none', fontWeight: 600 }}>
            To'lov
          </Button>
        </Stack>
      </Stack>

      {/* ── Table ── */}
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {isLoading && <LinearProgress />}

        {/* count row */}
        <Box sx={{ px: 2, py: 0.85, borderBottom: '1px solid', borderColor: 'divider',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          bgcolor: 'action.hover' }}>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>
            {filtered.length} ta to'lov
          </Typography>
          {(search || status !== 'all' || month !== 'all') && (
            <Button size="small"
              sx={{ fontSize: '0.7rem', color: 'text.disabled', borderRadius: 1, px: 0.75, minWidth: 0, py: 0 }}
              onClick={() => { setSearch(''); setStatus('all'); setMonth('all'); }}>
              Tozalash ×
            </Button>
          )}
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 680 }}>
            <TableHead>
              <TableRow>
                {["O'quvchi", 'Guruh', 'Oy', 'Summa', 'Usul', 'Sana', 'Chek', 'Status', ''].map((h, i) => (
                  <TableCell key={i} align={i === 3 ? 'right' : 'left'}
                    sx={{
                      py: 1, px: 1.75,
                      fontSize: '0.66rem', fontWeight: 600, color: 'text.disabled',
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                      borderBottom: '1px solid', borderColor: 'divider',
                      bgcolor: 'transparent', whiteSpace: 'nowrap',
                    }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 8, textAlign: 'center', border: 0 }}>
                    <PaymentsIcon sx={{ fontSize: 32, color: 'text.disabled', display: 'block', mx: 'auto', mb: 1 }} />
                    <Typography variant="body2" color="text.disabled">To'lovlar topilmadi</Typography>
                  </TableCell>
                </TableRow>
              )}

              {filtered.map((p, idx) => {
                const st    = STATUS_DOT[p.status] ?? STATUS_DOT.debt;
                const sName = p.student?.name ?? '?';
                const isPend = p.status === 'pending';
                const dot   = PALETTE[idx % PALETTE.length];

                return (
                  <TableRow key={p._id} sx={{
                    '&:hover td': { bgcolor: 'action.hover' },
                    '&:last-child td': { border: 0 },
                    transition: 'background 0.1s',
                  }}>

                    {/* Student — no Avatar, colored dot only */}
                    <TableCell sx={{ py: 1.25, px: 1.75 }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: dot, flexShrink: 0, mt: '1px' }} />
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
                          {sName}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Group */}
                    <TableCell sx={{ py: 1.25, px: 1.75 }}>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 120 }}>
                        {p.group?.name ?? '—'}
                      </Typography>
                    </TableCell>

                    {/* Month */}
                    <TableCell sx={{ py: 1.25, px: 1.75 }}>
                      <Typography variant="body2" fontWeight={500} sx={{ lineHeight: 1.3 }}>
                        {fmtMonth(p.month)}
                      </Typography>
                      <Box sx={{ mt: 0.2 }}>
                        <DateRangeBadge from={p.periodStart} to={p.periodEnd} />
                      </Box>
                    </TableCell>

                    {/* Amount */}
                    <TableCell align="right" sx={{ py: 1.25, px: 1.75 }}>
                      <Typography variant="body2" fontWeight={700}
                        sx={{ color: p.status === 'paid' ? '#10B981' : 'text.primary', lineHeight: 1 }}>
                        {formatPrice(p.amount)}
                      </Typography>
                      <Typography sx={{ fontSize: '0.6rem', color: 'text.disabled', lineHeight: 1, mt: 0.2 }}>UZS</Typography>
                    </TableCell>

                    {/* Method */}
                    <TableCell sx={{ py: 1.25, px: 1.75 }}>
                      <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                        {METHOD_LABEL_SHORT[p.paymentMethod] ?? '—'}
                      </Typography>
                    </TableCell>

                    {/* Date */}
                    <TableCell sx={{ py: 1.25, px: 1.75 }}>
                      <DateBadge iso={p.paidAt} />
                    </TableCell>

                    {/* Receipt */}
                    <TableCell sx={{ py: 1.25, px: 1.75 }}>
                      <ReceiptImage receiptUrl={p.receiptUrl} size={34} />
                    </TableCell>

                    {/* Status pill */}
                    <TableCell sx={{ py: 1.25, px: 1.75 }}>
                      <Box sx={{
                        display: 'inline-flex', alignItems: 'center', gap: 0.6,
                        px: 0.9, py: 0.3, borderRadius: 5, bgcolor: st.bg,
                      }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: st.dot, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: st.dot, lineHeight: 1 }}>
                          {st.label}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Action */}
                    <TableCell sx={{ py: 1.25, px: 1.75, pr: 2 }}>
                      {p.status !== 'paid' && p.status !== 'refunded' ? (
                        <Button size="small"
                          variant={isPend ? 'contained' : 'text'}
                          color={isPend ? 'primary' : 'inherit'}
                          onClick={() => setConfirmDlg(p)}
                          sx={{
                            borderRadius: 4, fontSize: '0.7rem', px: 1.25, py: 0.3,
                            minWidth: 0, fontWeight: 600, whiteSpace: 'nowrap', textTransform: 'none',
                            ...(!isPend && { color: 'text.disabled', '&:hover': { color: 'success.main', bgcolor: 'transparent' } }),
                          }}>
                          {isPend ? 'Tasdiqlash' : "To'langan"}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <ConfirmPaymentDialog open={Boolean(confirmDlg)} payment={confirmDlg}
        onClose={() => setConfirmDlg(null)} onConfirm={handleConfirm} loading={confirming} />
      <AddPaymentDialog open={addDlg} onClose={() => setAddDlg(false)} onSave={handleAdd} loading={creating} />
      <GeneratePaymentsDialog open={genDlg} onClose={(r) => { setGenDlg(false); if (r) notify("To'lovlar yaratildi!"); }} />
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN — AdminFinance (combined Enrollments + Payments)
═══════════════════════════════════════════════════════════════════ */
export default function AdminFinance() {
  const [mainTab, setMainTab] = useState(0);

  /* Pending enrollment applications — badge on tab */
  const { data: enrollPendingRes } = useGetEnrollmentsQuery(
    { status: 'pending', limit: 1 },
    { pollingInterval: 60_000 },
  );
  const enrollPending = enrollPendingRes?.pagination?.total ?? 0;

  return (
    <Box>
      <PageHeader
        icon={<PaymentsIcon />}
        title="Moliya"
        actions={
          enrollPending > 0 ? (
            <Chip label={`${enrollPending} ariza kutilmoqda`}
              color="warning" size="small" sx={{ fontWeight: 700 }} />
          ) : null
        }
      />

      {/* Main tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={mainTab} onChange={(_, v) => setMainTab(v)}>
          <Tab
            icon={
              <Badge badgeContent={enrollPending} color="warning" max={99}
                invisible={enrollPending === 0}>
                <HowToRegIcon sx={{ fontSize: 18 }} />
              </Badge>
            }
            iconPosition="start"
            label="Qabul arizalari"
            sx={{ gap: 0.5 }}
          />
          <Tab
            icon={<PaymentsIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Oylik to'lovlar"
            sx={{ gap: 0.5 }}
          />
        </Tabs>
      </Box>

      {mainTab === 0 && <EnrollmentsPanel />}
      {mainTab === 1 && <PaymentsPanel />}
    </Box>
  );
}
