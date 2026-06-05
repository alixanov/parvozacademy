import {
  Box, Typography, Card, CardContent, Grid, Stack, Chip, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow,
  Button, IconButton, Tooltip, Rating, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText,
  InputAdornment, Snackbar, Alert, MenuItem, Divider, CircularProgress,
} from '@mui/material';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import StarIcon           from '@mui/icons-material/Star';
import { DateBadge }     from '../../../components/common/DateBadge/index.jsx';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import CancelIcon         from '@mui/icons-material/Cancel';
import DeleteIcon         from '@mui/icons-material/Delete';
import SearchIcon         from '@mui/icons-material/Search';
import VisibilityIcon     from '@mui/icons-material/Visibility';
import ThumbUpIcon        from '@mui/icons-material/ThumbUp';
import ReviewsIcon        from '@mui/icons-material/Reviews';
import FilterListIcon     from '@mui/icons-material/FilterList';
import PageHeader         from '../../../components/common/PageHeader/index.jsx';
import { motion }         from 'framer-motion';
import {
  useGetAdminReviewsQuery,
  useSetReviewStatusMutation,
  useDeleteReviewMutation,
} from '../../../features/reviews/reviewsApi.js';

const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function courseTitle(course) {
  if (!course) return '—';
  if (typeof course === 'string') return course;
  const t = course.title;
  if (!t) return '—';
  if (typeof t === 'object') return t.ru ?? t.uz ?? '—';
  return t;
}

/* ─── View Dialog ───────────────────────────────────────────── */
function ViewDialog({ open, review, onClose }) {
  const { t } = useTranslation();
  if (!review) return null;

  const STATUS_CONFIG = {
    pending:  { label: t('status.pending'),  color: 'warning' },
    approved: { label: t('status.approved'), color: 'success' },
    rejected: { label: t('status.rejected'), color: 'error' },
  };

  const name   = review.author?.name ?? '?';
  const avatar = (review.author?.avatar || name[0] || '?').toUpperCase();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{t('dialog.viewReview')}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'primary.main', width: 44, height: 44, fontWeight: 700 }}>
              {avatar}
            </Avatar>
            <Box>
              <Typography fontWeight={700}>{name}</Typography>
              <DateBadge iso={review.createdAt} />
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Chip label={(STATUS_CONFIG[review.status] ?? STATUS_CONFIG.pending).label}
                color={(STATUS_CONFIG[review.status] ?? STATUS_CONFIG.pending).color} size="small" />
            </Box>
          </Stack>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{t('form.course').toUpperCase()}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>{courseTitle(review.course)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{t('form.rating').toUpperCase()}</Typography>
            <Rating value={review.rating} readOnly size="small" sx={{ mt: 0.5, display: 'block' }} />
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{t('form.comment').toUpperCase()}</Typography>
            <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.7 }}>{review.text}</Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─── Delete Dialog ─────────────────────────────────────────── */
function DeleteDialog({ open, onClose, onConfirm, loading }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, color: 'error.main' }}>{t('dialog.deleteTitle')}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t('dialog.deleteText')}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>{t('common.cancel')}</Button>
        <Button onClick={onConfirm} variant="contained" color="error" sx={{ borderRadius: 2 }}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}>
          {t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ─── Main Component ─────────────────────────────────────────── */
export default function AdminReviews() {
  const { t } = useTranslation();
  const [search, setSearch]   = useState('');
  const [filter, setFilter]   = useState('all');
  const [viewDlg, setViewDlg] = useState(null);
  const [delDlg,  setDelDlg]  = useState(null);
  const [snack, setSnack]     = useState('');

  const { data: res, isLoading } = useGetAdminReviewsQuery({ limit: 100 });
  const reviews = res?.data ?? [];

  const [setReviewStatus, { isLoading: settingStatus }] = useSetReviewStatusMutation();
  const [deleteReview,    { isLoading: deleting }]      = useDeleteReviewMutation();

  const STATUS_CONFIG = {
    pending:  { label: t('status.pending'),  color: 'warning' },
    approved: { label: t('status.approved'), color: 'success' },
    rejected: { label: t('status.rejected'), color: 'error' },
  };

  const filtered = useMemo(() =>
    reviews.filter((r) => {
      const matchStatus = filter === 'all' || r.status === filter;
      const q = search.toLowerCase();
      const name   = r.author?.name ?? '';
      const cTitle = courseTitle(r.course);
      const matchSearch = !q
        || name.toLowerCase().includes(q)
        || cTitle.toLowerCase().includes(q)
        || (r.text ?? '').toLowerCase().includes(q);
      return matchStatus && matchSearch;
    }),
  [reviews, search, filter]);

  const handleSetStatus = async (id, status) => {
    try {
      await setReviewStatus({ id, status }).unwrap();
      setSnack(status === 'approved' ? t('reviews.snackApproved') : t('reviews.snackRejected'));
    } catch (err) {
      setSnack(err?.data?.message ?? t('common.error'));
    }
  };

  const handleDelete = async () => {
    if (!delDlg) return;
    try {
      await deleteReview(delDlg).unwrap();
      setDelDlg(null);
      setSnack(t('reviews.snackDeleted'));
    } catch (err) {
      setDelDlg(null);
      setSnack(err?.data?.message ?? t('common.error'));
    }
  };

  /* Stats */
  const total    = reviews.length;
  const pending  = reviews.filter((r) => r.status === 'pending').length;
  const approved = reviews.filter((r) => r.status === 'approved').length;
  const rejected = reviews.filter((r) => r.status === 'rejected').length;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <Box>
      <PageHeader icon={<ReviewsIcon />} title={t('reviews.management')} />

      {/* Snackbar */}
      <Snackbar open={Boolean(snack)} autoHideDuration={3500} onClose={() => setSnack('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" onClose={() => setSnack('')} sx={{ borderRadius: 2 }}>{snack}</Alert>
      </Snackbar>

      {/* KPI cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: t('reviews.totalReviews'), value: total,    color: '#1976D2' },
          { label: t('status.pending'),       value: pending,  color: '#F59E0B' },
          { label: t('status.approved'),      value: approved, color: '#10B981' },
          { label: t('status.rejected'),      value: rejected, color: '#EF4444' },
          { label: t('reviews.avgRating'),    value: avgRating, color: '#F59E0B' },
        ].map((s, i) => (
          <Grid item xs={6} sm key={s.label}>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, textAlign: 'center' }}>
                  <Typography variant="subtitle1" fontWeight={800} color={s.color} lineHeight={1.2}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.62rem', mt: 0.15 }}>{s.label}</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Filters bar */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ sm: 'center' }}>
        <TextField
          size="small" placeholder={t('common.search') + '...'}
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ width: { xs: '100%', sm: 340 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <TextField
          select size="small" label={t('reviews.statusFilter')} value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{ width: { xs: '100%', sm: 180 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><FilterListIcon fontSize="small" /></InputAdornment> }}
        >
          <MenuItem value="all">{t('common.all')} ({total})</MenuItem>
          <MenuItem value="pending">{t('status.pending')} ({pending})</MenuItem>
          <MenuItem value="approved">{t('status.approved')} ({approved})</MenuItem>
          <MenuItem value="rejected">{t('status.rejected')} ({rejected})</MenuItem>
        </TextField>
        {pending > 0 && (
          <Button size="small" variant="contained" color="warning" sx={{ borderRadius: 2, ml: 'auto' }}
            onClick={() => setFilter('pending')}>
            {pending} {t('reviews.pendingReviews')}
          </Button>
        )}
      </Stack>

      {/* Table */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 0, overflowX: 'auto' }}>
          {isLoading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>{t('form.student')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('form.course')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">{t('form.rating')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('form.comment')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">{t('form.date')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">{t('form.status')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      {t('common.noData')}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((r, idx) => {
                  const cfg   = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
                  const color = PALETTE[idx % PALETTE.length];
                  const name  = r.author?.name ?? '?';
                  const initials = name[0]?.toUpperCase() ?? '?';
                  return (
                    <TableRow key={r._id} hover>
                      {/* Author */}
                      <TableCell>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 32, height: 32, bgcolor: color, fontSize: '0.8rem', fontWeight: 700 }}>
                            {initials}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600} noWrap>{name}</Typography>
                        </Stack>
                      </TableCell>

                      {/* Course */}
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>{courseTitle(r.course)}</Typography>
                      </TableCell>

                      {/* Rating */}
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                          <StarIcon sx={{ fontSize: 14, color: '#F59E0B' }} />
                          <Typography variant="body2" fontWeight={700}>{r.rating}</Typography>
                        </Stack>
                      </TableCell>

                      {/* Review text (truncated) */}
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="body2" color="text.secondary"
                          sx={{ overflow: 'hidden', display: '-webkit-box',
                            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {r.text}
                        </Typography>
                      </TableCell>

                      {/* Date */}
                      <TableCell align="center">
                        <DateBadge iso={r.createdAt} />
                      </TableCell>

                      {/* Status */}
                      <TableCell align="center">
                        <Chip label={cfg.label} color={cfg.color} size="small" sx={{ fontWeight: 600 }} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="center">
                        <Stack direction="row" justifyContent="center" spacing={0.5}>
                          <Tooltip title={t('common.view')}>
                            <IconButton size="small" onClick={() => setViewDlg(r)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {r.status !== 'approved' && (
                            <Tooltip title={t('common.approve')}>
                              <IconButton size="small" color="success"
                                disabled={settingStatus}
                                onClick={() => handleSetStatus(r._id, 'approved')}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {r.status !== 'rejected' && (
                            <Tooltip title={t('common.reject')}>
                              <IconButton size="small" color="warning"
                                disabled={settingStatus}
                                onClick={() => handleSetStatus(r._id, 'rejected')}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title={t('common.delete')}>
                            <IconButton size="small" color="error" onClick={() => setDelDlg(r._id)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <ViewDialog open={Boolean(viewDlg)} review={viewDlg} onClose={() => setViewDlg(null)} />

      {/* Delete Dialog */}
      <DeleteDialog
        open={Boolean(delDlg)}
        onClose={() => setDelDlg(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </Box>
  );
}
