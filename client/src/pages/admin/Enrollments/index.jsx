import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow,
  Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  Alert, CircularProgress, Tabs, Tab, Divider,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import CancelIcon       from '@mui/icons-material/Cancel';
import VisibilityIcon   from '@mui/icons-material/Visibility';
import HowToRegIcon     from '@mui/icons-material/HowToReg';
import PendingIcon      from '@mui/icons-material/Pending';
import ReceiptIcon      from '@mui/icons-material/Receipt';
import GroupsIcon       from '@mui/icons-material/Groups';
import PageHeader       from '../../../components/common/PageHeader/index.jsx';
import {
  useGetEnrollmentsQuery,
  useApproveEnrollmentMutation,
  useRejectEnrollmentMutation,
} from '../../../features/enrollment/enrollmentApi.js';
import { useGetGroupsQuery } from '../../../features/groups/groupsApi.js';
import { formatPrice }       from '../../../data/mockData.js';
import i18n                  from '../../../utils/i18n.js';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6'];

function statusMeta(status) {
  if (status === 'approved') return { label: 'Tasdiqlangan', color: 'success' };
  if (status === 'rejected') return { label: 'Rad etilgan',  color: 'error'   };
  return                             { label: 'Kutilmoqda',  color: 'warning'  };
}

function cTitle(course) {
  if (!course) return '—';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const t = course.title;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '—';
  return t ?? '—';
}

/* ─── Approve dialog ──────────────────────────────────────────────────────── */
function ApproveDialog({ open, application, onClose }) {
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const [groupId, setGroupId] = useState('');
  const [error,   setError]   = useState('');

  const { data: groupsRes } = useGetGroupsQuery({ limit: 100 }, { skip: !open });
  const [approve, { isLoading }] = useApproveEnrollmentMutation();

  const allGroups    = groupsRes?.data ?? [];
  const matchGroups  = allGroups.filter(
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
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}

          {/* Summary */}
          <Card elevation={0} sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Grid container spacing={1.5}>
                {[
                  { label: 'Ism',     value: application.fullName },
                  { label: 'Telefon', value: application.phone },
                  { label: 'Kurs',    value: cTitle(application.course) },
                  { label: 'Tarif',   value: application.tariffKey },
                  { label: 'Summa',   value: `${formatPrice(application.amount)} so'm` },
                ].map(({ label, value }) => (
                  <Grid item xs={6} key={label}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Typography variant="body2" fontWeight={700}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Receipt preview */}
          {application.receiptUrl && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Chek</Typography>
              <Box
                component="a" href={application.receiptUrl} target="_blank" rel="noreferrer"
                sx={{ display: 'block', borderRadius: 2, overflow: 'hidden', border: '1px solid',
                  borderColor: 'divider', textDecoration: 'none' }}>
                {application.receiptUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                  <Box component="img" src={application.receiptUrl}
                    sx={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' }} />
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 2 }}>
                    <ReceiptIcon color="primary" />
                    <Typography variant="body2" color="primary">Chekni ko'rish (PDF)</Typography>
                  </Stack>
                )}
              </Box>
            </Box>
          )}

          {/* Group selector */}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Guruh tanlash
              <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                (bo'sh qoldiring — avtomatik tayinlanadi)
              </Typography>
            </Typography>
            {matchGroups.length === 0 ? (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                Bu kurs + tarif uchun aktiv guruh topilmadi. Avval guruh yarating.
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

/* ─── Reject dialog ───────────────────────────────────────────────────────── */
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
            value={reason} onChange={(e) => setReason(e.target.value)} />
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

/* ─── Main ────────────────────────────────────────────────────────────────── */
export default function AdminEnrollments() {
  const [tab, setTab]           = useState('pending');
  const [approveApp, setApproveApp] = useState(null);
  const [rejectApp,  setRejectApp]  = useState(null);

  const { data, isLoading, refetch } = useGetEnrollmentsQuery({ status: tab, limit: 50 });
  const applications = data?.data ?? [];

  const pending  = applications.filter((a) => a.status === 'pending').length;

  const STATS = [
    { label: 'Kutilmoqda', value: data?.pagination?.total ?? 0, color: '#F59E0B', icon: <PendingIcon /> },
  ];

  return (
    <Box>
      <PageHeader
        icon={<HowToRegIcon />}
        title="Qabul arizalari"
        actions={
          pending > 0
            ? <Chip label={`${pending} yangi`} color="warning" size="small" sx={{ fontWeight: 700 }} />
            : null
        }
      />

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab value="pending"  label="Kutilmoqda"   icon={<PendingIcon />}      iconPosition="start" />
        <Tab value="approved" label="Tasdiqlangan" icon={<CheckCircleIcon />}  iconPosition="start" />
        <Tab value="rejected" label="Rad etilgan"  icon={<CancelIcon />}       iconPosition="start" />
        <Tab value="all"      label="Barchasi"     icon={<GroupsIcon />}       iconPosition="start" />
      </Tabs>

      {/* Loading */}
      {isLoading && <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>}

      {/* Empty */}
      {!isLoading && applications.length === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', py: 8, textAlign: 'center' }}>
          <Typography color="text.secondary">Arizalar topilmadi</Typography>
        </Card>
      )}

      {/* Table */}
      {!isLoading && applications.length > 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ p: 0, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Ariza beruvchi</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Kurs / Tarif</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Summa</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Chek</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Sana</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                  {tab === 'approved' && <TableCell sx={{ fontWeight: 700 }}>O'quvchi / Guruh</TableCell>}
                  {tab === 'rejected' && <TableCell sx={{ fontWeight: 700 }}>Sabab</TableCell>}
                  {(tab === 'pending' || tab === 'all') && (
                    <TableCell sx={{ fontWeight: 700 }} align="right">Amal</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {applications.map((app, idx) => {
                  const color = PALETTE[idx % PALETTE.length];
                  const sm    = statusMeta(app.status);
                  return (
                    <TableRow key={app._id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ bgcolor: color + '22', color, width: 36, height: 36, fontWeight: 700, fontSize: '0.85rem' }}>
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
                          sx={{ mt: 0.4, height: 18, fontSize: '0.65rem' }} />
                      </TableCell>

                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} color="success.main">
                          {formatPrice(app.amount)} so'm
                        </Typography>
                      </TableCell>

                      <TableCell>
                        {app.receiptUrl ? (
                          <Tooltip title="Chekni ko'rish">
                            <IconButton size="small" color="primary"
                              component="a" href={app.receiptUrl} target="_blank" rel="noreferrer">
                              <ReceiptIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : '—'}
                      </TableCell>

                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(app.createdAt).toLocaleDateString('ru-RU')}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        <Chip label={sm.label} color={sm.color} size="small" />
                      </TableCell>

                      {tab === 'approved' && (
                        <TableCell>
                          <Typography variant="body2">{app.student?.name ?? '—'}</Typography>
                          <Typography variant="caption" color="text.secondary">{app.group?.name ?? '—'}</Typography>
                        </TableCell>
                      )}
                      {tab === 'rejected' && (
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {app.rejectionReason || '—'}
                          </Typography>
                        </TableCell>
                      )}

                      {(tab === 'pending' || tab === 'all') && app.status === 'pending' && (
                        <TableCell align="right">
                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
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
                        </TableCell>
                      )}
                      {(tab === 'pending' || tab === 'all') && app.status !== 'pending' && (
                        <TableCell />
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
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
