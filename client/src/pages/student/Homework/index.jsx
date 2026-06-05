import {
  Box, Typography, Card, CardContent, Chip, Stack, Button,
  Table, TableBody, TableCell, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Avatar, IconButton, Tabs, Tab,
  CircularProgress, Alert, Tooltip,
} from '@mui/material';
import { useState }          from 'react';
import { useTranslation }    from 'react-i18next';
import AssignmentIcon        from '@mui/icons-material/Assignment';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import UploadFileIcon        from '@mui/icons-material/UploadFile';
import CloseIcon             from '@mui/icons-material/Close';
import AccessTimeIcon        from '@mui/icons-material/AccessTime';
import HourglassEmptyIcon    from '@mui/icons-material/HourglassEmpty';
import GradeIcon             from '@mui/icons-material/Grade';
import SchoolIcon            from '@mui/icons-material/School';
import PageHeader            from '../../../components/common/PageHeader/index.jsx';
import { useGetMyGroupsQuery }       from '../../../features/groups/groupsApi.js';
import { useGetHomeworkByGroupQuery, useGetMySubmissionQuery, useSubmitHomeworkMutation } from '../../../features/homework/homeworkApi.js';

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysLeftInfo(dateStr, lang = 'uz') {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  if (diff < 0) return {
    text: lang === 'ru' ? `Просрочено на ${Math.abs(diff)} дн.` : `${Math.abs(diff)} kun kechikdi`,
    color: 'error.main', urgent: true,
  };
  if (diff === 0) return {
    text: lang === 'ru' ? 'Сегодня последний день' : 'Bugun tugaydi',
    color: 'error.main', urgent: true,
  };
  if (diff <= 2)  return {
    text: lang === 'ru' ? `Осталось ${diff} дн.` : `${diff} kun qoldi`,
    color: 'warning.main', urgent: true,
  };
  return {
    text: lang === 'ru' ? `Осталось ${diff} дн.` : `${diff} kun qoldi`,
    color: 'text.secondary', urgent: false,
  };
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
function groupColor(idx) { return COLORS[idx % COLORS.length]; }

/* ─── HomeworkRow — fetches own submission ─────────────────────────────────── */

function HomeworkRow({ hw, groupId, color }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const [dialog, setDialog]   = useState(false);
  const [answer, setAnswer]   = useState('');

  const { data: sub, isLoading: subLoading } = useGetMySubmissionQuery(hw._id);
  const [submitHw, { isLoading: submitting }] = useSubmitHomeworkMutation();

  const submission = sub?.data ?? sub ?? null;
  const dl = daysLeftInfo(hw.dueDate, lang);

  const handleSubmit = async () => {
    if (!answer.trim()) return;
    try {
      await submitHw({ id: hw._id, groupId, answer }).unwrap();
      setDialog(false);
      setAnswer('');
    } catch {/* handled by RTK */ }
  };

  /* status chip */
  let statusLabel, statusColor;
  if (submission?.score !== undefined) {
    statusLabel = t('status.graded');
    statusColor = 'success';
  } else if (submission) {
    statusLabel = t('status.submitted');
    statusColor = 'info';
  } else {
    statusLabel = t('status.pending');
    statusColor = 'warning';
  }

  return (
    <>
      <TableRow hover>
        {/* Title */}
        <TableCell>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 34, height: 34, bgcolor: color + '18', color }}>
              <AssignmentIcon sx={{ fontSize: 17 }} />
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                {hw.title}
              </Typography>
              {hw.description && (
                <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {hw.description}
                </Typography>
              )}
            </Box>
          </Stack>
        </TableCell>

        {/* Deadline */}
        <TableCell>
          {dl ? (
            <Stack direction="row" spacing={0.5} alignItems="center">
              <AccessTimeIcon sx={{ fontSize: 14, color: dl.color }} />
              <Typography variant="caption" color={dl.color} fontWeight={dl.urgent ? 700 : 400}>
                {dl.text}
              </Typography>
            </Stack>
          ) : (
            <Typography variant="caption" color="text.secondary">{fmtDate(hw.dueDate)}</Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
            {fmtDate(hw.dueDate)}
          </Typography>
        </TableCell>

        {/* Max score */}
        <TableCell>
          <Typography variant="body2" fontWeight={600}>
            {submission?.score !== undefined
              ? <Box component="span" sx={{ color: 'success.main', fontWeight: 800 }}>{submission.score}</Box>
              : '—'
            }
            <Box component="span" color="text.secondary"> / {hw.maxScore ?? 10}</Box>
          </Typography>
        </TableCell>

        {/* Status */}
        <TableCell>
          {subLoading ? (
            <CircularProgress size={16} />
          ) : (
            <Chip
              label={statusLabel}
              color={statusColor}
              size="small"
              icon={submission?.score !== undefined ? <CheckCircleIcon sx={{ fontSize: '13px !important' }} /> : undefined}
            />
          )}
        </TableCell>

        {/* Action */}
        <TableCell>
          {!submission && !subLoading && (
            <Button
              size="small" variant="contained"
              sx={{ borderRadius: 1.5, fontSize: '0.72rem', px: 1.5, bgcolor: color, '&:hover': { bgcolor: color, filter: 'brightness(0.9)' } }}
              onClick={() => setDialog(true)}
            >
              {t('student.submitTask')}
            </Button>
          )}
          {submission?.feedback && (
            <Tooltip title={submission.feedback}>
              <Typography
                variant="caption" color="text.secondary"
                sx={{ fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: 160 }}
              >
                "{submission.feedback}"
              </Typography>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>

      {/* Submit dialog */}
      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ width: 32, height: 32, bgcolor: color + '18', color }}>
              <AssignmentIcon sx={{ fontSize: 16 }} />
            </Avatar>
            <Typography fontWeight={700} variant="subtitle1">{hw.title}</Typography>
          </Stack>
          <IconButton size="small" onClick={() => setDialog(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {hw.description && (
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>{hw.description}</Alert>
          )}
          <TextField
            label={t('student.yourAnswer')}
            multiline rows={5} fullWidth
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            sx={{ mb: 2 }}
            placeholder={t('student.hwAnswerPlaceholder')}
          />
          <Stack direction="row" spacing={1} alignItems="center">
            <AccessTimeIcon sx={{ fontSize: 15, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {t('student.hwDueDate')} {fmtDate(hw.dueDate)}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialog(false)} sx={{ borderRadius: 2 }}>{t('common.cancel')}</Button>
          <Button
            variant="contained" sx={{ borderRadius: 2, bgcolor: color, '&:hover': { bgcolor: color, filter: 'brightness(0.9)' } }}
            onClick={handleSubmit}
            disabled={!answer.trim() || submitting}
          >
            {submitting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : `${t('student.submitTask')} →`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

/* ─── HomeworkTable — one group's homework ─────────────────────────────────── */

function HomeworkTable({ groupId, color }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState(0); // 0 = pending, 1 = submitted/graded

  const { data: hwRes, isLoading } = useGetHomeworkByGroupQuery(groupId, { skip: !groupId });
  const allHw = hwRes?.data ?? hwRes ?? [];

  /* We can't easily split "pending vs submitted" without knowing submission per HW.
     Instead we show all homework, split by due date: upcoming vs past */
  const now = new Date();
  const upcoming = allHw.filter(h => !h.dueDate || new Date(h.dueDate) >= now);
  const past     = allHw.filter(h =>  h.dueDate  && new Date(h.dueDate) <  now);
  const list     = tab === 0 ? upcoming : past;

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!allHw.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <AssignmentIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
        <Typography variant="body1">{t('student.hwNoTasks')}</Typography>
        <Typography variant="caption">{t('student.hwNoTasksHint')}</Typography>
      </Box>
    );
  }

  return (
    <>
      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label={`${t('student.hwTabActive')} (${upcoming.length})`} />
          <Tab label={`${t('student.hwTabPast')} (${past.length})`} />
        </Tabs>
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 700 }}>{t('table.task')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('table.deadline')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('table.score')}</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>{t('table.status')}</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <HourglassEmptyIcon sx={{ fontSize: 28, mb: 0.5, opacity: 0.4, display: 'block', mx: 'auto' }} />
                  <Typography variant="body2">{t('common.noData')}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              list.map((hw) => (
                <HomeworkRow key={hw._id} hw={hw} groupId={groupId} color={color} />
              ))
            )}
          </TableBody>
        </Table>
      </Box>
    </>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────────── */

function courseTitle(c, lang) {
  if (!c?.title) return null;
  const raw = c.title;
  if (typeof raw === 'object') return raw[lang] ?? raw.uz ?? raw.ru ?? '';
  return raw;
}

export default function StudentHomework() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const [groupIdx, setGroupIdx] = useState(0);

  const { data: groupsRes, isLoading: groupsLoading } = useGetMyGroupsQuery();
  const myGroups = groupsRes?.data ?? groupsRes ?? [];

  const selectedGroup = myGroups[groupIdx];

  return (
    <Box>
      <PageHeader
        icon={<AssignmentIcon />}
        title={t('student.homework')}
        actions={
          <Chip
            label={t('student.hwGroupsCount', { count: myGroups.length })}
            size="small"
            icon={<SchoolIcon sx={{ fontSize: '14px !important' }} />}
            sx={{ fontWeight: 600 }}
          />
        }
      />

      {groupsLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !myGroups.length ? (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <AssignmentIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">{t('student.hwNoGroups')}</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              {t('student.hwNoGroupsHint')}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          {/* Group tabs */}
          <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
            <Tabs
              value={groupIdx}
              onChange={(_, v) => setGroupIdx(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ px: 2 }}
            >
              {myGroups.map((g, i) => (
                <Tab
                  key={g._id}
                  label={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: groupColor(i) }} />
                      <span>{g.name}</span>
                    </Stack>
                  }
                />
              ))}
            </Tabs>
          </Box>

          {/* Group header */}
          {selectedGroup && (
            <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: groupColor(groupIdx) + '08' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 36, height: 36, bgcolor: groupColor(groupIdx) + '22', color: groupColor(groupIdx) }}>
                  <SchoolIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{selectedGroup.name}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                    {courseTitle(selectedGroup.course, lang) && (
                      <Chip label={courseTitle(selectedGroup.course, lang)} size="small" sx={{ height: 18, fontSize: '0.68rem', bgcolor: groupColor(groupIdx) + '18', color: groupColor(groupIdx) }} />
                    )}
                    <Chip
                      label={selectedGroup.isActive ? t('status.active') : t('status.pending')}
                      size="small"
                      color={selectedGroup.isActive ? 'success' : 'warning'}
                      sx={{ height: 18, fontSize: '0.68rem' }}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Homework table */}
          {selectedGroup && (
            <HomeworkTable
              groupId={selectedGroup._id}
              color={groupColor(groupIdx)}
            />
          )}
        </Card>
      )}
    </Box>
  );
}
