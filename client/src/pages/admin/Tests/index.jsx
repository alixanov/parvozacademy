import {
  Box, Typography, Card, CardContent, Stack, Chip, Button,
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Table, TableBody, TableCell, TableHead, TableRow,
  Collapse, LinearProgress, Switch, FormControlLabel, RadioGroup,
  FormControl, FormLabel, Radio, Alert, CircularProgress, Divider,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddIcon            from '@mui/icons-material/Add';
import EditIcon           from '@mui/icons-material/Edit';
import DeleteIcon         from '@mui/icons-material/Delete';
import ExpandMoreIcon     from '@mui/icons-material/ExpandMore';
import ExpandLessIcon     from '@mui/icons-material/ExpandLess';
import QuizIcon           from '@mui/icons-material/Quiz';
import PublicIcon         from '@mui/icons-material/Public';
import PublicOffIcon      from '@mui/icons-material/PublicOff';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';
import PageHeader         from '../../../components/common/PageHeader/index.jsx';
import { useGetCoursesQuery } from '../../../features/courses/coursesApi.js';
import {
  useGetTestsQuery,
  useCreateTestMutation,
  useUpdateTestMutation,
  useDeleteTestMutation,
  usePublishTestMutation,
  useGetQuestionsQuery,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} from '../../../features/tests/testsApi.js';

/* ─── Subject colour map ────────────────────────────────────────── */
const SUBJ_COLOR = {
  math:    '#1976D2',
  english: '#10B981',
  uzbek:   '#F59E0B',
  history: '#7C3AED',
  it:      '#EC4899',
  other:   '#64748B',
};

const BLANK_TEST = { title: '', courseId: '', duration: 10, passingScore: 60 };
const BLANK_Q    = { question: '', options: ['', '', '', ''], correctIndex: 0 };

/* ─── Question row ──────────────────────────────────────────────── */
function QuestionRow({ q, idx, testId, onEdit }) {
  const { t }            = useTranslation();
  const [delQ]           = useDeleteQuestionMutation();
  const correctOpt       = q.options?.[q.options?.findIndex((o) => o.isCorrect)];

  return (
    <TableRow hover>
      <TableCell sx={{ color: 'text.secondary', width: 36 }}>{idx + 1}</TableCell>
      <TableCell sx={{ maxWidth: 320 }}>
        <Typography variant="body2" fontWeight={500}>{q.question}</Typography>
        {q.options?.length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
            {q.options.map((o, i) => (
              <Chip
                key={i}
                label={o.text}
                size="small"
                variant={o.isCorrect ? 'filled' : 'outlined'}
                color={o.isCorrect ? 'success' : 'default'}
                icon={o.isCorrect ? <CheckCircleIcon /> : undefined}
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
          </Stack>
        )}
      </TableCell>
      <TableCell align="center">{q.score ?? 1}</TableCell>
      <TableCell align="right">
        <Tooltip title={t('common.edit')}>
          <IconButton size="small" onClick={() => onEdit(q)}><EditIcon fontSize="small" /></IconButton>
        </Tooltip>
        <Tooltip title={t('common.delete')}>
          <IconButton size="small" color="error" onClick={() => delQ({ testId, qId: q._id })}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

/* ─── Questions panel ───────────────────────────────────────────── */
function QuestionsPanel({ testId }) {
  const { t }                          = useTranslation();
  const { data, isLoading }            = useGetQuestionsQuery(testId);
  const questions                      = data?.data ?? [];
  const [openQ, setOpenQ]              = useState(false);
  const [editQ, setEditQ]              = useState(null); // null = new
  const [form, setForm]                = useState(BLANK_Q);
  const [addQ]                         = useAddQuestionMutation();
  const [updQ]                         = useUpdateQuestionMutation();

  const openNew  = () => { setEditQ(null); setForm(BLANK_Q); setOpenQ(true); };
  const openEdit = (q) => {
    setEditQ(q);
    setForm({
      question: q.question,
      options:  q.options?.map((o) => o.text) ?? ['', '', '', ''],
      correctIndex: q.options?.findIndex((o) => o.isCorrect) ?? 0,
    });
    setOpenQ(true);
  };

  const handleSave = async () => {
    const payload = {
      question: form.question,
      type: 'single',
      options: form.options.filter((o) => o.trim()).map((text, i) => ({
        text,
        isCorrect: i === Number(form.correctIndex),
      })),
    };
    if (editQ) {
      await updQ({ testId, qId: editQ._id, ...payload });
    } else {
      await addQ({ testId, ...payload });
    }
    setOpenQ(false);
  };

  if (isLoading) return <LinearProgress />;

  return (
    <Box sx={{ p: 2, bgcolor: 'action.hover', borderTop: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2" fontWeight={700}>
          {t('admin.testsQuestions')} ({questions.length})
        </Typography>
        <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={openNew}>
          {t('admin.testsAddQuestion')}
        </Button>
      </Stack>

      {questions.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>{t('admin.testsNoQuestions')}</Alert>
      ) : (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>{t('admin.testsQuestion')}</TableCell>
                <TableCell align="center">{t('admin.testsScore')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.map((q, i) => (
                <QuestionRow key={q._id} q={q} idx={i} testId={testId} onEdit={openEdit} />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Question dialog */}
      <Dialog open={openQ} onClose={() => setOpenQ(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editQ ? t('admin.testsEditQuestion') : t('admin.testsAddQuestion')}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Stack spacing={2.5}>
            <TextField
              label={t('admin.testsQuestion')}
              value={form.question}
              onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
            <Typography variant="subtitle2" fontWeight={700}>{t('admin.testsOptions')}</Typography>
            {form.options.map((opt, i) => (
              <TextField
                key={i}
                label={`${t('admin.testsOption')} ${String.fromCharCode(65 + i)}`}
                value={opt}
                onChange={(e) => {
                  const opts = [...form.options];
                  opts[i] = e.target.value;
                  setForm((f) => ({ ...f, options: opts }));
                }}
                fullWidth
                size="small"
              />
            ))}
            <FormControl>
              <FormLabel sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {t('admin.testsCorrectAnswer')}
              </FormLabel>
              <RadioGroup
                row
                value={String(form.correctIndex)}
                onChange={(e) => setForm((f) => ({ ...f, correctIndex: Number(e.target.value) }))}
              >
                {form.options.map((opt, i) => (
                  <FormControlLabel
                    key={i}
                    value={String(i)}
                    control={<Radio size="small" />}
                    label={String.fromCharCode(65 + i)}
                    disabled={!opt.trim()}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenQ(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.question.trim() || form.options.filter((o) => o.trim()).length < 2}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

/* ─── Test card ─────────────────────────────────────────────────── */
function TestCard({ test, courses, onEdit }) {
  const { t }           = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [publishTest]   = usePublishTestMutation();
  const [deleteTest]    = useDeleteTestMutation();

  const course = courses.find((c) => c._id === (test.course?._id ?? test.course));
  const subject = course?.subject ?? 'other';
  const subjectColor = SUBJ_COLOR[subject] ?? '#64748B';

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${subjectColor}`,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
      }}
    >
      <CardContent sx={{ p: '12px 16px !important' }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {/* Title + meta */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>{test.title}</Typography>
              <Chip
                label={test.isPublished ? t('admin.testsPublished') : t('admin.testsDraft')}
                size="small"
                color={test.isPublished ? 'success' : 'default'}
                sx={{ fontSize: '0.68rem' }}
              />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                {course
                  ? `${course.title?.ru ?? course.title?.uz ?? ''} · ${t(`subjects.${subject}`)}`
                  : t('admin.testsNoCourse')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {test.duration} {t('admin.testsDuration')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {test.totalQuestions} {t('admin.testsQCount')}
              </Typography>
            </Stack>
          </Box>

          {/* Actions */}
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <Tooltip title={test.isPublished ? t('admin.testsUnpublish') : t('admin.testsPublish')}>
              <IconButton
                size="small"
                color={test.isPublished ? 'success' : 'default'}
                onClick={() => publishTest({ id: test._id, isPublished: !test.isPublished })}
              >
                {test.isPublished ? <PublicIcon /> : <PublicOffIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title={t('common.edit')}>
              <IconButton size="small" onClick={() => onEdit(test)}><EditIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title={t('common.delete')}>
              <IconButton size="small" color="error" onClick={() => deleteTest(test._id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t('admin.testsManageQuestions')}>
              <IconButton size="small" onClick={() => setExpanded((e) => !e)}>
                {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </CardContent>

      <Collapse in={expanded} unmountOnExit>
        <QuestionsPanel testId={test._id} />
      </Collapse>
    </Card>
  );
}

/* ─── Main page ─────────────────────────────────────────────────── */
export default function AdminTests() {
  const { t }                               = useTranslation();
  const { data: testsData, isLoading }      = useGetTestsQuery({ type: 'placement' });
  const { data: coursesData }               = useGetCoursesQuery({});
  const [createTest]                        = useCreateTestMutation();
  const [updateTest]                        = useUpdateTestMutation();

  const tests   = testsData?.data ?? testsData?.tests ?? [];
  const courses = coursesData?.data ?? coursesData?.courses ?? [];

  const [openDlg, setOpenDlg] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [form, setForm]       = useState(BLANK_TEST);

  const openNew  = () => { setEditRow(null); setForm(BLANK_TEST); setOpenDlg(true); };
  const openEdit = (t) => {
    setEditRow(t);
    setForm({
      title:        t.title,
      courseId:     t.course?._id ?? t.course ?? '',
      duration:     t.duration,
      passingScore: t.passingScore ?? 60,
    });
    setOpenDlg(true);
  };

  const handleSave = async () => {
    const payload = {
      title:        form.title,
      course:       form.courseId || undefined,
      duration:     Number(form.duration),
      passingScore: Number(form.passingScore),
      type:         'placement',
    };
    if (editRow) {
      await updateTest({ id: editRow._id, ...payload });
    } else {
      await createTest(payload);
    }
    setOpenDlg(false);
  };

  return (
    <Box>
      <PageHeader
        icon={<QuizIcon />}
        title={t('admin.tests')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }} onClick={openNew}>
            {t('admin.testsCreate')}
          </Button>
        }
      />

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {!isLoading && tests.length === 0 && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          {t('admin.testsEmpty')}
        </Alert>
      )}

      <Stack spacing={1.5}>
        {tests.map((test) => (
          <TestCard key={test._id} test={test} courses={courses} onEdit={openEdit} />
        ))}
      </Stack>

      {/* Create / edit test dialog */}
      <Dialog open={openDlg} onClose={() => setOpenDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {editRow ? t('admin.testsEditTest') : t('admin.testsCreateTest')}
        </DialogTitle>
        <DialogContent sx={{ pt: '16px !important' }}>
          <Stack spacing={2.5}>
            <TextField
              label={t('admin.testsTitle')}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              fullWidth
            />
            <TextField
              select
              label={t('admin.testsCourse')}
              value={form.courseId}
              onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}
              fullWidth
              helperText={t('admin.testsCourseHint')}
            >
              <MenuItem value="">{t('admin.testsNoCourse')}</MenuItem>
              {courses.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  {c.title?.ru ?? c.title?.uz ?? c.title ?? c._id}
                  {c.subject ? ` · ${t(`subjects.${c.subject}`)}` : ''}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label={t('admin.testsDurationLabel')}
              type="number"
              value={form.duration}
              onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
              inputProps={{ min: 1 }}
              fullWidth
            />
            <TextField
              label={t('admin.testsPassingScore')}
              type="number"
              value={form.passingScore}
              onChange={(e) => setForm((f) => ({ ...f, passingScore: e.target.value }))}
              inputProps={{ min: 1, max: 100 }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDlg(false)}>{t('common.cancel')}</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.title.trim() || !form.duration}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
