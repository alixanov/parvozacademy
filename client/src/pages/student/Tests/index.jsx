import {
  Box, Typography, Card, CardContent, Grid, Chip, Stack,
  Button, Avatar, LinearProgress, Divider, Tabs, Tab,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Radio, RadioGroup, FormControlLabel, FormControl,
  CircularProgress, Alert, IconButton, Paper,
} from '@mui/material';
import { useState }          from 'react';
import { useTranslation }    from 'react-i18next';
import QuizIcon              from '@mui/icons-material/Quiz';
import TimerIcon             from '@mui/icons-material/Timer';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import LockClockIcon         from '@mui/icons-material/LockClock';
import SchoolIcon            from '@mui/icons-material/School';
import EmojiEventsIcon       from '@mui/icons-material/EmojiEvents';
import CloseIcon             from '@mui/icons-material/Close';
import ArrowForwardIcon      from '@mui/icons-material/ArrowForward';
import ArrowBackIcon         from '@mui/icons-material/ArrowBack';
import PageHeader            from '../../../components/common/PageHeader/index.jsx';
import { useGetMyGroupsQuery }    from '../../../features/groups/groupsApi.js';
import {
  useGetTestsByGroupQuery,
  useGetMyTestResultQuery,
  useStartTestMutation,
  useSubmitTestMutation,
} from '../../../features/tests/testsApi.js';

/* ─── helpers ──────────────────────────────────────────────────────────────── */

function courseLabel(c, lang) {
  if (!c?.title) return null;
  const raw = c.title;
  if (typeof raw === 'object') return raw[lang] ?? raw.uz ?? raw.ru ?? '';
  return raw;
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function gradeColor(pct) {
  if (pct >= 90) return '#10B981';
  if (pct >= 70) return '#3B82F6';
  if (pct >= 50) return '#F59E0B';
  return '#EF4444';
}

function gradeLabel(pct, t) {
  if (pct >= 90) return t('grade.excellent');
  if (pct >= 70) return t('grade.good');
  if (pct >= 50) return t('grade.satisfactory');
  return t('grade.unsatisfactory');
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
function groupColor(idx) { return COLORS[idx % COLORS.length]; }

/* ─── TestModal — take a test ──────────────────────────────────────────────── */

function TestModal({ test, open, onClose, onDone }) {
  const { t } = useTranslation();
  const [answers, setAnswers]   = useState({});   // { [qId]: optionIndex }
  const [step, setStep]         = useState(0);    // current question index
  const [phase, setPhase]       = useState('take'); // 'take' | 'done'

  const [startTest, { isLoading: starting }] = useStartTestMutation();
  const [submitTest, { isLoading: submitting }] = useSubmitTestMutation();

  const questions = test?.questions ?? [];
  const q = questions[step];

  const handleSelect = (qId, idx) => {
    setAnswers((a) => ({ ...a, [qId]: idx }));
  };

  const handleStart = async () => {
    try {
      await startTest(test._id).unwrap();
    } catch {/* already started is fine */}
  };

  const handleSubmit = async () => {
    const answersArr = Object.entries(answers).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption: Number(selectedOption),
    }));
    try {
      await submitTest({ testId: test._id, answers: answersArr }).unwrap();
      setPhase('done');
      onDone?.();
    } catch {/* handled */}
  };

  const handleClose = () => {
    setAnswers({});
    setStep(0);
    setPhase('take');
    onClose();
  };

  const answered = Object.keys(answers).length;
  const total    = questions.length;
  const progress = total ? Math.round((answered / total) * 100) : 0;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#6366F118', color: '#6366F1' }}>
            <QuizIcon sx={{ fontSize: 17 }} />
          </Avatar>
          <Box>
            <Typography fontWeight={700} variant="subtitle1" sx={{ lineHeight: 1.2 }}>{test?.title}</Typography>
            {phase === 'take' && total > 0 && (
              <Typography variant="caption" color="text.secondary">
                {step + 1} / {total} {t('student.testQCount', { count: total, defaultValue: `${total} savol` })}  ·  {answered} / {total}
              </Typography>
            )}
          </Box>
        </Stack>
        <IconButton size="small" onClick={handleClose}><CloseIcon /></IconButton>
      </DialogTitle>

      {phase === 'take' && total > 0 && (
        <LinearProgress
          variant="determinate" value={progress}
          sx={{ mx: 3, mb: 1, height: 5, borderRadius: 3, bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { bgcolor: '#6366F1', borderRadius: 3 } }}
        />
      )}

      <DialogContent dividers sx={{ minHeight: 300 }}>
        {phase === 'done' ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#10B981', mb: 2 }} />
            <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>{t('student.testSubmitted')}</Typography>
            <Typography variant="body1" color="text.secondary">
              {t('student.testSubmittedHint')}
            </Typography>
          </Box>
        ) : !questions.length ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="info">{t('student.testNoGroups', { defaultValue: "Bu testda savollar hali yo'q" })}</Alert>
          </Box>
        ) : (
          <Box>
            {/* Question */}
            <Paper elevation={0} sx={{ p: 3, bgcolor: 'action.hover', borderRadius: 2, mb: 3 }}>
              <Typography variant="body1" fontWeight={700} sx={{ lineHeight: 1.5 }}>
                {step + 1}. {q?.text}
              </Typography>
            </Paper>

            {/* Options */}
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={answers[q?._id] !== undefined ? String(answers[q._id]) : ''}
                onChange={(e) => q && handleSelect(q._id, e.target.value)}
              >
                {(q?.options ?? []).map((opt, i) => (
                  <Paper
                    key={i}
                    elevation={0}
                    onClick={() => q && handleSelect(q._id, i)}
                    sx={{
                      mb: 1.5, px: 2, py: 1, borderRadius: 2, cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor: answers[q?._id] === String(i) ? '#6366F1' : 'divider',
                      bgcolor: answers[q?._id] === String(i) ? '#6366F108' : 'background.paper',
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: '#6366F166', bgcolor: '#6366F106' },
                    }}
                  >
                    <FormControlLabel
                      value={String(i)}
                      control={<Radio size="small" sx={{ color: '#6366F1', '&.Mui-checked': { color: '#6366F1' } }} />}
                      label={<Typography variant="body2">{opt.text ?? opt}</Typography>}
                      sx={{ m: 0, width: '100%' }}
                    />
                  </Paper>
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {phase === 'take' && !questions.length ? (
          <Button onClick={handleClose} sx={{ borderRadius: 2 }}>{t('student.testCloseBtn')}</Button>
        ) : phase === 'done' ? (
          <Button variant="contained" onClick={handleClose} sx={{ borderRadius: 2 }}>
            {t('student.testCloseBtn')}
          </Button>
        ) : (
          <>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 0}
              sx={{ borderRadius: 2 }}
            >
              {t('student.testPrevBtn')}
            </Button>
            <Box sx={{ flex: 1 }} />
            {step < total - 1 ? (
              <Button
                variant="contained" endIcon={<ArrowForwardIcon />}
                onClick={() => setStep((s) => s + 1)}
                sx={{ borderRadius: 2 }}
              >
                {t('student.testNextBtn')}
              </Button>
            ) : (
              <Button
                variant="contained" color="success"
                onClick={handleSubmit}
                disabled={submitting || answered === 0}
                sx={{ borderRadius: 2 }}
              >
                {submitting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : `${t('student.testSubmitBtn')} →`}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

/* ─── TestCard — one test with its result ──────────────────────────────────── */

function TestCard({ test, color }) {
  const { t } = useTranslation();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: resultRes, isLoading: resultLoading, refetch } = useGetMyTestResultQuery(test._id);
  const result = resultRes?.data ?? resultRes ?? null;

  const hasResult  = result && (result.score !== undefined || result.status === 'completed');
  const score      = result?.score ?? 0;
  const maxScore   = result?.maxScore ?? test.questions?.length ?? 10;
  const pct        = maxScore ? Math.round((score / maxScore) * 100) : 0;

  const handleDone = () => {
    refetch();
    setModalOpen(false);
  };

  return (
    <>
      <Card
        elevation={0}
        sx={{
          border: '1.5px solid',
          borderColor: hasResult ? color + '44' : 'divider',
          borderRadius: 3,
          transition: 'box-shadow 0.2s',
          '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          {/* Header */}
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
            <Avatar sx={{ width: 38, height: 38, bgcolor: color + '18', color }}>
              <QuizIcon sx={{ fontSize: 20 }} />
            </Avatar>
            {hasResult ? (
              <Chip
                label={gradeLabel(pct, t)}
                size="small"
                sx={{ fontWeight: 700, bgcolor: gradeColor(pct) + '18', color: gradeColor(pct) }}
                icon={<CheckCircleIcon sx={{ fontSize: '13px !important', color: `${gradeColor(pct)} !important` }} />}
              />
            ) : (
              <Chip
                label={test.isPublished ? t('status.active') : t('status.pending')}
                size="small"
                color={test.isPublished ? 'success' : 'default'}
              />
            )}
          </Stack>

          {/* Title */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5, lineHeight: 1.3 }}>
            {test.title}
          </Typography>
          {test.description && (
            <Typography variant="caption" color="text.secondary"
              sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 1.5 }}>
              {test.description}
            </Typography>
          )}

          {/* Meta */}
          <Stack spacing={0.6} sx={{ mb: 2 }}>
            {(test.questions?.length > 0 || test.questionCount > 0) && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <QuizIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {t('student.testQCount', { count: test.questions?.length ?? test.questionCount ?? 0 })}
                </Typography>
              </Stack>
            )}
            {test.timeLimit > 0 && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <TimerIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {t('student.testMinutes', { count: test.timeLimit })}
                </Typography>
              </Stack>
            )}
            {test.dueDate && (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <LockClockIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  {t('student.testUntil', { date: fmtDate(test.dueDate) })}
                </Typography>
              </Stack>
            )}
          </Stack>

          {/* Result or start */}
          {resultLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
              <CircularProgress size={22} />
            </Box>
          ) : hasResult ? (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="caption" color="text.secondary">{t('student.testResults')}</Typography>
                <Typography variant="subtitle2" fontWeight={800} color={gradeColor(pct)}>
                  {score} / {maxScore}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate" value={pct}
                sx={{
                  height: 8, borderRadius: 4, bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': { bgcolor: gradeColor(pct), borderRadius: 4 },
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
                {pct}%
              </Typography>
            </Box>
          ) : test.isPublished ? (
            <Button
              variant="contained" fullWidth
              sx={{ borderRadius: 2, py: 1.1, bgcolor: color, '&:hover': { bgcolor: color, filter: 'brightness(0.9)' } }}
              onClick={() => setModalOpen(true)}
            >
              {t('student.startTest')} →
            </Button>
          ) : (
            <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">{t('student.testNotPublished')}</Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <TestModal
        test={test}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onDone={handleDone}
      />
    </>
  );
}

/* ─── GroupTests — one group's tests ──────────────────────────────────────── */

function GroupTests({ groupId, color }) {
  const { t } = useTranslation();
  const { data: testsRes, isLoading } = useGetTestsByGroupQuery(groupId, { skip: !groupId });
  const tests = testsRes?.data ?? testsRes ?? [];

  // Separate published (available) vs unpublished
  const available  = tests.filter((t) => t.isPublished);
  const unpublished = tests.filter((t) => !t.isPublished);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!tests.length) {
    return (
      <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
        <QuizIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
        <Typography variant="body1">{t('student.testNoGroups')}</Typography>
        <Typography variant="caption">{t('student.testNoGroupsHint')}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {available.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('student.testAvailable')} ({available.length})
          </Typography>
          <Grid container spacing={2.5}>
            {available.map((test) => (
              <Grid item xs={12} sm={6} md={4} key={test._id}>
                <TestCard test={test} color={color} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {unpublished.length > 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {t('student.testUpcoming')} ({unpublished.length})
          </Typography>
          <Grid container spacing={2.5}>
            {unpublished.map((test) => (
              <Grid item xs={12} sm={6} md={4} key={test._id}>
                <TestCard test={test} color={color} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

/* ─── Main page ────────────────────────────────────────────────────────────── */

export default function StudentTests() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const [groupIdx, setGroupIdx] = useState(0);

  const { data: groupsRes, isLoading: groupsLoading } = useGetMyGroupsQuery();
  const myGroups = groupsRes?.data ?? groupsRes ?? [];

  const selectedGroup = myGroups[groupIdx];

  return (
    <Box>
      <PageHeader
        icon={<QuizIcon />}
        title={t('student.tests')}
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
            <QuizIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">{t('student.testNoGroups')}</Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
              {t('student.testNoGroupsHint')}
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
                  <EmojiEventsIcon sx={{ fontSize: 18 }} />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>{selectedGroup.name}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
                    {courseLabel(selectedGroup.course, lang) && (
                      <Chip label={courseLabel(selectedGroup.course, lang)} size="small"
                        sx={{ height: 18, fontSize: '0.68rem', bgcolor: groupColor(groupIdx) + '18', color: groupColor(groupIdx) }} />
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

          {/* Tests grid */}
          <Box sx={{ p: 3 }}>
            {selectedGroup && (
              <GroupTests
                groupId={selectedGroup._id}
                color={groupColor(groupIdx)}
              />
            )}
          </Box>
        </Card>
      )}
    </Box>
  );
}
