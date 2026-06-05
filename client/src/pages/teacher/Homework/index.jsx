import {
  Box, Typography, Card, CardContent, Stack, Chip, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogActions, Button, TextField, Rating, FormControl,
  InputLabel, Select, MenuItem, CircularProgress,
} from '@mui/material';
import { useState }          from 'react';
import { useTranslation }    from 'react-i18next';
import GradeIcon             from '@mui/icons-material/Grade';
import DownloadIcon          from '@mui/icons-material/Download';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import HourglassIcon         from '@mui/icons-material/HourglassEmpty';
import AssignmentIcon        from '@mui/icons-material/Assignment';
import ListAltIcon           from '@mui/icons-material/ListAlt';
import CloseIcon             from '@mui/icons-material/Close';
import AccessTimeIcon        from '@mui/icons-material/AccessTime';
import PageHeader            from '../../../components/common/PageHeader/index.jsx';
import { useGetGroupsQuery } from '../../../features/groups/groupsApi.js';
import {
  useGetHomeworkByGroupQuery,
  useGetHomeworkSubmissionsQuery,
  useGradeSubmissionMutation,
} from '../../../features/homework/homeworkApi.js';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(d) {
  return d && new Date(d) < new Date();
}

function statusColor(s) {
  if (s === 'graded')    return 'success';
  if (s === 'late')      return 'warning';
  if (s === 'submitted') return 'info';
  return 'default';
}

/* ─── component ───────────────────────────────────────────────────────────── */

export default function TeacherHomework() {
  const { t }                         = useTranslation();
  const [groupId,    setGroupId]       = useState('');
  const [selectedHw, setSelectedHw]   = useState(null);   // for submissions dialog
  const [gradeDialog, setGD]          = useState(null);   // for grade dialog
  const [ratingVal,  setRV]           = useState(0);
  const [comment,    setComment]      = useState('');

  /* ── groups ─────────────────────────────────────────────────────────────── */
  const { data: groupsRes } = useGetGroupsQuery({ limit: 100 });
  const myGroups = groupsRes?.data ?? [];

  /* ── homework list ───────────────────────────────────────────────────────── */
  const {
    data: hwRes,
    isLoading: hwLoading,
  } = useGetHomeworkByGroupQuery(groupId, { skip: !groupId });

  /* backend returns array directly OR { data: [...] } */
  const hwList = Array.isArray(hwRes?.data) ? hwRes.data
               : Array.isArray(hwRes)       ? hwRes
               : [];

  /* ── submissions for selected homework ────────────────────────────────────── */
  const {
    data: subsRes,
    isLoading: subsLoading,
  } = useGetHomeworkSubmissionsQuery(selectedHw?._id, { skip: !selectedHw });

  const submissions = Array.isArray(subsRes?.data) ? subsRes.data
                    : Array.isArray(subsRes)        ? subsRes
                    : [];

  const pendingCount = submissions.filter((s) => s.status !== 'graded').length;
  const gradedCount  = submissions.filter((s) => s.status === 'graded').length;

  /* ── grade mutation ──────────────────────────────────────────────────────── */
  const [gradeSubm, { isLoading: grading }] = useGradeSubmissionMutation();

  const handleGrade = async () => {
    if (!gradeDialog || !ratingVal) return;
    await gradeSubm({ subId: gradeDialog._id, score: ratingVal, feedback: comment });
    setGD(null);
    setRV(0);
    setComment('');
  };

  /* ── group name helper ───────────────────────────────────────────────────── */
  const gName = (g) => {
    if (!g) return '';
    const n = g.name;
    if (typeof n === 'object') return n.ru ?? n.uz ?? '';
    return n ?? '';
  };

  /* ══════════════════════════════════════════════════════════════════════════ */

  return (
    <Box>
      <PageHeader
        icon={<AssignmentIcon />}
        title={t('teacher.homeworkManagement')}
        actions={
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>{t('teacher.group')}</InputLabel>
            <Select
              value={groupId}
              label={t('teacher.group')}
              onChange={(e) => { setGroupId(e.target.value); setSelectedHw(null); }}
            >
              <MenuItem value="">— {t('common.all')} —</MenuItem>
              {myGroups.map((g) => (
                <MenuItem key={String(g._id)} value={String(g._id)}>
                  {gName(g)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />

      {/* ── No group selected ─────────────────────────────────────────────── */}
      {!groupId && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', py: 8 }}>
          <Stack alignItems="center" spacing={2}>
            <AssignmentIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
            <Typography variant="h6" color="text.secondary">
              {t('teacher.selectGroupFirst')}
            </Typography>
          </Stack>
        </Card>
      )}

      {/* ── Homework list ─────────────────────────────────────────────────── */}
      {groupId && (
        hwLoading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
        ) : hwList.length === 0 ? (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', py: 8 }}>
            <Stack alignItems="center" spacing={2}>
              <AssignmentIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
              <Typography variant="h6" color="text.secondary">
                {t('teacher.noHomework')}
              </Typography>
            </Stack>
          </Card>
        ) : (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 0 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>{t('teacher.homework')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('common.lesson')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{t('table.deadline')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">{t('teacher.submissions')}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">{t('teacher.action')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hwList.map((hw) => (
                    <TableRow key={String(hw._id)} hover>

                      {/* title */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{hw.title}</Typography>
                        {hw.description && (
                          <Typography
                            variant="caption" color="text.secondary"
                            sx={{ display: 'block', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {hw.description}
                          </Typography>
                        )}
                      </TableCell>

                      {/* lesson */}
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {hw.lesson?.title ?? '—'}
                        </Typography>
                      </TableCell>

                      {/* due date */}
                      <TableCell>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          {isOverdue(hw.dueDate) && (
                            <AccessTimeIcon sx={{ fontSize: 14, color: 'error.main' }} />
                          )}
                          <Typography
                            variant="body2"
                            color={isOverdue(hw.dueDate) ? 'error.main' : 'text.secondary'}
                          >
                            {fmtDate(hw.dueDate)}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* submission count (field name may vary) */}
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                          {hw.submissionCount ?? hw.submissionsCount ?? '—'}
                        </Typography>
                      </TableCell>

                      {/* actions */}
                      <TableCell align="right">
                        <Tooltip title={t('teacher.viewSubmissions')}>
                          <IconButton
                            size="small" color="primary"
                            onClick={() => setSelectedHw(hw)}
                          >
                            <ListAltIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      )}

      {/* ══ Submissions dialog ══════════════════════════════════════════════ */}
      <Dialog
        open={!!selectedHw}
        onClose={() => setSelectedHw(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1 }}>
          <Box>
            <Typography variant="h6" fontWeight={700}>{selectedHw?.title}</Typography>
            <Typography variant="caption" color="text.secondary">
              {t('table.deadline')}: {fmtDate(selectedHw?.dueDate)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, ml: 2 }}>
            <Chip
              icon={<HourglassIcon sx={{ fontSize: '14px !important' }} />}
              label={`${t('status.pending')}: ${pendingCount}`}
              color="warning" variant="outlined" size="small"
            />
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
              label={`${t('status.graded')}: ${gradedCount}`}
              color="success" variant="outlined" size="small"
            />
            <IconButton size="small" onClick={() => setSelectedHw(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0 }}>
          {subsLoading ? (
            <Box sx={{ py: 5, textAlign: 'center' }}><CircularProgress /></Box>
          ) : submissions.length === 0 ? (
            <Box sx={{ py: 5, textAlign: 'center' }}>
              <HourglassIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">{t('teacher.noSubmissionsYet')}</Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{t('teacher.studentLabel')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('table.date')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">{t('table.status')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">{t('table.score')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">{t('teacher.action')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {submissions.map((s) => (
                  <TableRow key={String(s._id)} hover>

                    {/* student */}
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={s.student?.avatar || undefined}
                          sx={{ width: 32, height: 32, fontSize: '0.8rem', fontWeight: 700, bgcolor: 'primary.main' }}>
                          {(s.student?.name?.[0] ?? '?').toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>{s.student?.name ?? '—'}</Typography>
                      </Stack>
                    </TableCell>

                    {/* submitted at */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {fmtDate(s.submittedAt)}
                      </Typography>
                    </TableCell>

                    {/* status */}
                    <TableCell align="center">
                      <Chip
                        label={t(`status.${s.status}`) ?? s.status}
                        size="small"
                        color={statusColor(s.status)}
                      />
                    </TableCell>

                    {/* score */}
                    <TableCell align="center">
                      {s.score != null ? (
                        <Chip
                          label={`${s.score}/5`}
                          size="small"
                          color={s.score >= 4 ? 'success' : s.score >= 3 ? 'warning' : 'error'}
                        />
                      ) : (
                        <Typography variant="body2" color="text.disabled">—</Typography>
                      )}
                    </TableCell>

                    {/* actions */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {s.files?.length > 0 && (
                          <Tooltip title={t('common.download')}>
                            <IconButton
                              size="small"
                              component="a"
                              href={s.files[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <DownloadIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {s.status !== 'graded' && (
                          <Tooltip title={t('teacher.gradeTooltip')}>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setGD(s);
                                setRV(s.score ?? 0);
                                setComment(s.feedback ?? '');
                              }}
                            >
                              <GradeIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setSelectedHw(null)} sx={{ borderRadius: 2 }}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ══ Grade dialog ════════════════════════════════════════════════════ */}
      <Dialog
        open={!!gradeDialog}
        onClose={() => setGD(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle fontWeight={700}>{t('teacher.gradeHomework')}</DialogTitle>
        <DialogContent>
          {gradeDialog && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                <b>{gradeDialog.student?.name}</b>
              </Typography>
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                  {t('teacher.scoreLabel')}:
                </Typography>
                <Rating
                  value={ratingVal}
                  max={5}
                  onChange={(_, v) => setRV(v)}
                  size="large"
                />
              </Box>
              <TextField
                label={t('teacher.commentOptional')}
                multiline
                rows={3}
                fullWidth
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button sx={{ borderRadius: 2 }} onClick={() => setGD(null)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            sx={{ borderRadius: 2 }}
            disabled={!ratingVal || grading}
            onClick={handleGrade}
          >
            {grading
              ? <CircularProgress size={18} color="inherit" />
              : t('teacher.saveGrade')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
