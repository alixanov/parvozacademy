import {
  Box, Container, Typography, Card, CardContent,
  Button, Stack, LinearProgress, Avatar, Grid, useTheme,
} from '@mui/material';
import { useState, useEffect, useRef } from 'react';
import { useTranslation }              from 'react-i18next';
import { useSelector }                 from 'react-redux';
import { motion, AnimatePresence }     from 'framer-motion';
import { useNavigate }                 from 'react-router-dom';
import TimerIcon          from '@mui/icons-material/Timer';
import CheckIcon          from '@mui/icons-material/Check';
import CloseIcon          from '@mui/icons-material/Close';
import CategoryIcon       from '@mui/icons-material/Category';
import FunctionsIcon      from '@mui/icons-material/Functions';
import TranslateIcon      from '@mui/icons-material/Translate';
import MenuBookIcon       from '@mui/icons-material/MenuBook';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ComputerIcon       from '@mui/icons-material/Computer';
import EmojiEventsIcon    from '@mui/icons-material/EmojiEvents';
import ThumbUpIcon        from '@mui/icons-material/ThumbUp';
import TrendingUpIcon     from '@mui/icons-material/TrendingUp';
import SchoolIcon         from '@mui/icons-material/School';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import ArrowForwardIcon   from '@mui/icons-material/ArrowForward';
import ArrowBackIcon      from '@mui/icons-material/ArrowBack';
import RefreshIcon        from '@mui/icons-material/Refresh';
import i18n                            from '../../../utils/i18n.js';
import { COURSES, SUBJECT_COLORS } from '../../../data/mockData.js';
import { selectTestSubjects }          from '../../../features/content/contentSlice.js';
import PageBanner                      from '../../../components/ui/PageBanner.jsx';
import { useGetPlacementTestsQuery }   from '../../../features/tests/testsApi.js';

/* ─── constants ─────────────────────────────────────────────────── */
const STEP_SELECT = 'select';
const STEP_QUIZ   = 'quiz';
const STEP_RESULT = 'result';

const EASING = [0.25, 0.46, 0.45, 0.94];

/* map subject id → icon component */
const SUBJECT_ICON_MAP = {
  all:     CategoryIcon,
  math:    FunctionsIcon,
  english: TranslateIcon,
  uzbek:   MenuBookIcon,
  history: AccountBalanceIcon,
  it:      ComputerIcon,
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E'];

/* ─── helpers ────────────────────────────────────────────────────── */
function getQuestions(subject, count = 10, placementTests = []) {
  // Flatten all questions from backend placement tests
  const all = placementTests.flatMap((t) => t.questions ?? []);
  const pool = subject === 'all'
    ? all
    : all.filter((q) => q.subject === subject);
  if (pool.length >= count) return pool.slice(0, count);
  // Pad with questions from other subjects if not enough
  const extra = all.filter((q) => q.subject !== subject);
  return [...pool, ...extra].slice(0, count);
}

function computeResults(questions, answers) {
  const bySubject = {};
  questions.forEach((q, i) => {
    if (!bySubject[q.subject]) bySubject[q.subject] = { total: 0, correct: 0 };
    bySubject[q.subject].total++;
    if (answers[i] !== undefined && answers[i] === q.answer) bySubject[q.subject].correct++;
  });
  const total   = questions.length;
  const correct = questions.filter((q, i) => answers[i] === q.answer).length;
  return { total, correct, bySubject };
}

function getRecommended(bySubject) {
  const sorted = Object.entries(bySubject).sort(
    (a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total,
  );
  if (!sorted.length) return null;
  const weakest = sorted[0][0];
  return COURSES.find((c) => c.subject === weakest) ?? COURSES[0];
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 1 — Subject selection
   Reads from Redux (admin-managed testSubjects)
═══════════════════════════════════════════════════════════════════ */
function StepSelect({ onStart }) {
  const { t }       = useTranslation();
  const theme       = useTheme();
  const isDark      = theme.palette.mode === 'dark';
  const lang        = i18n.language === 'ru' ? 'ru' : 'uz';

  /* ← Redux: admin can add/edit test subjects in Content panel */
  const testSubjects = useSelector(selectTestSubjects);
  const [chosen, setChosen] = useState('all');

  const chosenMeta = testSubjects.find((ts) => ts.id === chosen) ?? testSubjects[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: EASING }}
    >
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.3px' }}>
          {t('page.tests.chooseSubject')}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 440, mx: 'auto', lineHeight: 1.75 }}>
          {t('page.tests.testInfo')}
        </Typography>
      </Box>

      {/* Subject cards — from Redux store */}
      <Grid container spacing={2} sx={{ mb: 5 }}>
        {testSubjects.map((ts) => {
          const Icon     = SUBJECT_ICON_MAP[ts.id] ?? CategoryIcon;
          const label    = lang === 'ru' ? ts.labelRu : ts.labelUz;
          const active   = chosen === ts.id;

          return (
            <Grid item xs={6} sm={4} md={4} key={ts.id}>
              <Card
                onClick={() => setChosen(ts.id)}
                sx={{
                  cursor: 'pointer',
                  height: '100%',
                  border: '2px solid',
                  borderColor: active ? ts.color : 'divider',
                  bgcolor: active
                    ? (isDark ? ts.color + '12' : ts.color + '08')
                    : 'background.paper',
                  boxShadow: active
                    ? `0 0 0 3px ${ts.color}22, 0 4px 20px ${ts.color}18`
                    : 'none',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  '&:hover': active ? {} : {
                    borderColor: ts.color + '55',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {/* Check mark when selected */}
                <AnimatePresence>
                  {active && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: 'absolute', top: 10, right: 10,
                        zIndex: 2,
                      }}
                    >
                      <Box sx={{
                        width: 20, height: 20, borderRadius: '50%',
                        bgcolor: ts.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <CheckIcon sx={{ fontSize: 12, color: 'white' }} />
                      </Box>
                    </motion.div>
                  )}
                </AnimatePresence>

                <CardContent sx={{ p: 2.5 }}>
                  {/* Icon box */}
                  <Box sx={{
                    width: 44, height: 44, borderRadius: '12px',
                    bgcolor: ts.color + (isDark ? '20' : '15'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mb: 1.5, color: ts.color,
                    border: active ? `1.5px solid ${ts.color}40` : '1.5px solid transparent',
                    transition: 'border-color 0.2s',
                  }}>
                    <Icon sx={{ fontSize: 22 }} />
                  </Box>

                  <Typography
                    variant="subtitle2"
                    fontWeight={700}
                    sx={{
                      mb: 0.75,
                      color: active ? ts.color : 'text.primary',
                      transition: 'color 0.2s',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {label}
                  </Typography>

                  <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <SchoolIcon sx={{ fontSize: 11 }} />
                      {ts.questions} {lang === 'ru' ? 'вопр.' : 'savol'}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                      <TimerIcon sx={{ fontSize: 11 }} />
                      {ts.minutes} {lang === 'ru' ? 'мин' : 'daq'}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Start button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="contained"
          size="large"
          endIcon={<ArrowForwardIcon />}
          onClick={() => onStart(chosen, chosenMeta)}
          sx={{
            px: 5.5, py: 1.5,
            borderRadius: 3,
            fontSize: '1rem',
            fontWeight: 700,
            background: 'linear-gradient(135deg, #5b21b6 0%, #7C3AED 100%)',
            boxShadow: '0 4px 18px rgba(124,58,237,0.35)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0, left: '-75%',
              width: '50%', height: '100%',
              background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.18), transparent)',
              transform: 'skewX(-20deg)',
              transition: 'left 0.55s',
            },
            '&:hover': {
              background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)',
              boxShadow: '0 6px 26px rgba(124,58,237,0.48)',
              transform: 'translateY(-2px)',
              '&::before': { left: '125%' },
            },
            transition: 'all 0.22s',
          }}
        >
          {t('page.tests.btnStart')}
        </Button>
      </Box>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 2 — Quiz
   x:±30 animation intentional (quiz slide between questions)
═══════════════════════════════════════════════════════════════════ */
function StepQuiz({ questions, totalTime, onFinish }) {
  const { t }                   = useTranslation();
  const theme                   = useTheme();
  const isDark                  = theme.palette.mode === 'dark';
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState({});
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const timerRef                = useRef(null);
  /* Ref keeps latest answers so the timer callback never captures stale state */
  const answersRef              = useRef({});
  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onFinish(answersRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []); // eslint-disable-line

  const q           = questions[current];
  if (!q) return null;
  const progressPct = (current / questions.length) * 100;
  const answered    = answers[current] !== undefined;
  const isLow       = timeLeft < 60;
  const isMid       = !isLow && timeLeft < 180;
  const timerColor  = isLow ? 'error.main' : isMid ? 'warning.main' : 'primary.main';

  const select = (idx) => setAnswers((a) => ({ ...a, [current]: idx }));

  const next = () => {
    if (current < questions.length - 1) setCurrent((c) => c + 1);
    else { clearInterval(timerRef.current); onFinish(answers); }
  };
  const prev = () => { if (current > 0) setCurrent((c) => c - 1); };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      {/* ── Top bar: counter + timer ─────────────────────────────── */}
      <Box sx={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2.5,
      }}>
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {t('page.tests.questionCounter', { current: current + 1, total: questions.length })}
        </Typography>

        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 0.75,
          px: 1.5, py: 0.5,
          borderRadius: 2,
          border: '1.5px solid',
          borderColor: timerColor,
          bgcolor: isLow ? 'error.main' + '0D' : 'transparent',
          transition: 'all 0.3s',
        }}>
          <TimerIcon sx={{ fontSize: 16, color: timerColor }} />
          <Typography
            variant="subtitle2"
            fontWeight={800}
            sx={{ color: timerColor, fontVariantNumeric: 'tabular-nums', minWidth: 38 }}
          >
            {formatTime(timeLeft)}
          </Typography>
        </Box>
      </Box>

      {/* ── Progress bar ─────────────────────────────────────────── */}
      <LinearProgress
        variant="determinate"
        value={progressPct}
        sx={{
          height: 4,
          borderRadius: 2,
          mb: 4,
          bgcolor: 'divider',
          '& .MuiLinearProgress-bar': { borderRadius: 2 },
        }}
      />

      {/* ── Question + Options ────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 30 }}   /* ← intentional x-slide for quiz */
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22, ease: EASING }}
        >
          {/* Question card */}
          <Card
            sx={{
              mb: 3,
              bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 'none',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              {/* Subject tag */}
              <Box sx={{ mb: 1.5 }}>
                <Typography
                  sx={{
                    display: 'inline-block',
                    fontSize: '0.67rem', fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    color: SUBJECT_COLORS[q.subject]?.text ?? '#64748B',
                    bgcolor: (SUBJECT_COLORS[q.subject]?.text ?? '#64748B') + '12',
                    px: 1, py: 0.3, borderRadius: '6px',
                  }}
                >
                  {SUBJECT_COLORS[q.subject]?.label ?? q.subject}
                </Typography>
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.55 }}>
                {q.question}
              </Typography>
            </CardContent>
          </Card>

          {/* Options */}
          <Stack spacing={1.25}>
            {q.options.map((opt, idx) => {
              const selected = answers[current] === idx;
              const sc       = SUBJECT_COLORS[q.subject] ?? { text: '#1976D2' };

              return (
                <Box
                  key={idx}
                  onClick={() => select(idx)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: '13px 16px',
                    borderRadius: 2,
                    border: '1.5px solid',
                    borderColor: selected ? sc.text : 'divider',
                    bgcolor: selected
                      ? (isDark ? sc.text + '14' : sc.text + '08')
                      : 'background.paper',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    '&:hover': selected ? {} : {
                      borderColor: sc.text + '55',
                      bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                    },
                  }}
                >
                  {/* Letter indicator */}
                  <Box sx={{
                    width: 28, height: 28,
                    borderRadius: '8px',
                    bgcolor: selected ? sc.text : (isDark ? 'rgba(255,255,255,0.07)' : '#F1F5F9'),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'background-color 0.15s',
                  }}>
                    <Typography sx={{
                      fontSize: '0.72rem', fontWeight: 800, lineHeight: 1,
                      color: selected ? 'white' : 'text.disabled',
                    }}>
                      {OPTION_LETTERS[idx]}
                    </Typography>
                  </Box>

                  <Typography
                    variant="body1"
                    sx={{
                      flex: 1,
                      fontWeight: selected ? 600 : 400,
                      color: selected ? sc.text : 'text.primary',
                      transition: 'color 0.15s',
                    }}
                  >
                    {opt}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation ───────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, gap: 1.5 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={prev}
          disabled={current === 0}
          sx={{ borderRadius: 2, px: 2.5, minWidth: 110 }}
        >
          {t('page.tests.prev')}
        </Button>

        <Button
          variant="contained"
          endIcon={current === questions.length - 1 ? <CheckIcon /> : <ArrowForwardIcon />}
          onClick={next}
          sx={{
            borderRadius: 2,
            px: 3,
            minWidth: 140,
            fontWeight: 700,
            bgcolor: answered ? 'primary.main' : 'text.disabled',
            pointerEvents: answered ? 'auto' : 'auto',
            boxShadow: answered ? '0 3px 12px rgba(25,118,210,0.28)' : 'none',
          }}
        >
          {current === questions.length - 1
            ? t('page.tests.finish')
            : t('page.tests.next')}
        </Button>
      </Box>

      {/* Dots indicator */}
      <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mt: 3 }}>
        {questions.map((_, i) => (
          <Box
            key={i}
            onClick={() => setCurrent(i)}
            sx={{
              width: i === current ? 20 : 6,
              height: 6, borderRadius: 3,
              bgcolor: answers[i] !== undefined
                ? 'primary.main'
                : (i === current ? 'primary.light' : 'divider'),
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          />
        ))}
      </Stack>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STEP 3 — Results
═══════════════════════════════════════════════════════════════════ */
function StepResult({ questions, answers, onRetry }) {
  const navigate   = useNavigate();
  const { t }      = useTranslation();
  const theme      = useTheme();
  const isDark     = theme.palette.mode === 'dark';
  const lang       = i18n.language === 'ru' ? 'ru' : 'uz';

  const { total, correct, bySubject } = computeResults(questions, answers);
  const recommended = getRecommended(bySubject);
  const pct = Math.round((correct / total) * 100);

  const grade = pct >= 80
    ? { label: t('page.tests.gradeExcellent'), color: '#10B981', Icon: EmojiEventsIcon }
    : pct >= 60
    ? { label: t('page.tests.gradeGood'),      color: '#1976D2', Icon: ThumbUpIcon     }
    : pct >= 40
    ? { label: t('page.tests.gradeFair'),      color: '#F59E0B', Icon: TrendingUpIcon  }
    : { label: t('page.tests.gradePoor'),      color: '#EF4444', Icon: SchoolIcon      };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: EASING }}
    >
      {/* ── Score card ───────────────────────────────────────────── */}
      <Card
        sx={{
          mb: 4,
          border: '2px solid',
          borderColor: grade.color + '44',
          textAlign: 'center',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Subtle gradient top strip */}
        <Box sx={{
          height: 4,
          background: `linear-gradient(90deg, ${grade.color} 0%, ${grade.color}88 100%)`,
        }} />

        <CardContent sx={{ py: 4.5 }}>
          {/* Grade icon — small clean circle */}
          <Box sx={{
            width: 56, height: 56,
            borderRadius: '18px',
            bgcolor: grade.color + '15',
            border: `1.5px solid ${grade.color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2.5, color: grade.color,
          }}>
            <grade.Icon sx={{ fontSize: 26 }} />
          </Box>

          {/* Big percentage — gradient text (Senior pattern) */}
          <Typography
            sx={{
              fontSize: { xs: '4rem', sm: '5rem' },
              fontWeight: 900,
              lineHeight: 1,
              mb: 0.5,
              background: `linear-gradient(135deg, ${grade.color} 0%, ${grade.color}99 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {pct}%
          </Typography>

          <Typography variant="h5" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.2px' }}>
            {grade.label}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {t('page.tests.scoreDetail', { correct, total })}
          </Typography>
        </CardContent>
      </Card>

      {/* ── Per-subject breakdown ─────────────────────────────────── */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        {t('page.tests.bySubjectResult')}
      </Typography>
      <Stack spacing={2.5} sx={{ mb: 4 }}>
        {Object.entries(bySubject).map(([sub, { total: tot, correct: cor }]) => {
          const sc   = SUBJECT_COLORS[sub] ?? SUBJECT_COLORS.other;
          const spct = Math.round((cor / tot) * 100);
          return (
            <Box key={sub}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" fontWeight={700} sx={{ color: sc.text }}>
                  {sc.label}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {cor}/{tot}
                  </Typography>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    sx={{
                      color: spct >= 60 ? '#10B981' : '#EF4444',
                      minWidth: 32, textAlign: 'right',
                    }}
                  >
                    {spct}%
                  </Typography>
                </Box>
              </Box>
              <LinearProgress
                variant="determinate"
                value={spct}
                sx={{
                  height: 6, borderRadius: 3,
                  bgcolor: sc.text + '14',
                  '& .MuiLinearProgress-bar': { bgcolor: sc.text, borderRadius: 3 },
                }}
              />
            </Box>
          );
        })}
      </Stack>

      {/* ── Question review ───────────────────────────────────────── */}
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
        {t('page.tests.reviewQuestions')}
      </Typography>
      <Stack spacing={1} sx={{ mb: 4 }}>
        {questions.map((q, i) => {
          const isCorrect = answers[i] === q.answer;
          return (
            <Box
              key={i}
              sx={{
                display: 'flex', gap: 1.5, alignItems: 'flex-start',
                p: 1.5, borderRadius: 2,
                border: '1px solid',
                borderColor: isCorrect ? 'success.light' + '88' : 'error.light' + '88',
                bgcolor: isCorrect
                  ? (isDark ? 'rgba(16,185,129,0.06)' : '#F0FDF4')
                  : (isDark ? 'rgba(239,68,68,0.06)'  : '#FEF2F2'),
              }}
            >
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%',
                bgcolor: isCorrect ? 'success.main' : 'error.main',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, mt: 0.2,
              }}>
                {isCorrect
                  ? <CheckIcon sx={{ fontSize: 13, color: 'white' }} />
                  : <CloseIcon sx={{ fontSize: 13, color: 'white' }} />}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.45 }}>
                  {q.question}
                </Typography>
                {!isCorrect && (
                  <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {t('page.tests.correctAnswer', { answer: q.options[q.answer] })}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {/* ── Course recommendation ─────────────────────────────────── */}
      {recommended && (
        <Card
          sx={{
            mb: 4,
            border: '1.5px solid',
            borderColor: 'primary.main' + '44',
            bgcolor: isDark ? 'rgba(25,118,210,0.06)' : '#EFF6FF',
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
              <TipsAndUpdatesIcon sx={{ fontSize: 15, color: 'primary.main' }} />
              <Typography variant="caption" color="primary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {t('page.tests.courseRecommend')}
              </Typography>
            </Stack>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              {typeof recommended.title === 'object'
                ? (recommended.title[lang === 'ru' ? 'ru' : 'uz'] ?? recommended.title.uz)
                : recommended.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {recommended.teacher.name} · {recommended.duration} {t('page.courses.duration')}
            </Typography>
            <Button
              variant="contained"
              size="small"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate(`/courses/${recommended.id}`)}
              sx={{ borderRadius: 2, fontWeight: 700 }}
            >
              {t('page.tests.viewCourse')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Action buttons ────────────────────────────────────────── */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<RefreshIcon />}
          onClick={onRetry}
          sx={{ borderRadius: 2.5, py: 1.2, fontWeight: 600 }}
        >
          {t('page.tests.retryBtn')}
        </Button>
        <Button
          variant="contained"
          fullWidth
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate('/courses')}
          sx={{ borderRadius: 2.5, py: 1.2, fontWeight: 700 }}
        >
          {t('page.tests.allCourses')}
        </Button>
      </Stack>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════ */
export default function OnlineTests() {
  const { t }                     = useTranslation();
  const theme                     = useTheme();
  const isDark                    = theme.palette.mode === 'dark';
  const lang                      = i18n.language === 'ru' ? 'ru' : 'uz';
  const [step, setStep]           = useState(STEP_SELECT);
  const [questions, setQuestions] = useState([]);
  const [totalTime, setTotalTime] = useState(10 * 60);
  const [answers, setAnswers]     = useState({});

  const { data: placementData } = useGetPlacementTestsQuery();
  const placementTests = placementData?.data ?? [];

  const handleStart = (subject, meta) => {
    const count = meta?.questions ?? 10;
    const mins  = meta?.minutes   ?? 10;
    const qs    = getQuestions(subject, count, placementTests);
    if (qs.length === 0) return; // no questions configured yet
    setQuestions(qs);
    setTotalTime(mins * 60);
    setAnswers({});
    setStep(STEP_QUIZ);
  };

  const handleFinish = (ans) => {
    setAnswers(ans);
    setStep(STEP_RESULT);
  };

  const handleRetry = () => {
    setStep(STEP_SELECT);
    setQuestions([]);
    setAnswers({});
  };

  return (
    <Box sx={{ mx: { xs: -2, sm: -3 } }}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <PageBanner
        eyebrow="Parvoz Academy"
        title={t('page.tests.title')}
        subtitle={step !== STEP_QUIZ ? t('page.tests.subtitle') : undefined}
        color="#7C3AED"
        py={step === STEP_QUIZ ? { xs: 3, md: 3.5 } : { xs: 5.5, md: 7 }}
        stats={step !== STEP_QUIZ ? [
          { value: '10',  label: lang === 'ru' ? 'минут на тест'   : 'daqiqa test' },
          { value: '10',  label: lang === 'ru' ? 'вопросов'         : 'savol' },
          { value: '100%', label: lang === 'ru' ? 'бесплатно'       : 'bepul' },
        ] : []}
        visual={step !== STEP_QUIZ ? (
          /* Stylized quiz card */
          <Box sx={{
            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'background.default',
            border: '1px solid', borderColor: 'divider',
            borderRadius: '18px',
            overflow: 'hidden',
            boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.35)' : '0 8px 32px rgba(0,0,0,0.08)',
          }}>
            {/* Card top bar */}
            <Box sx={{ height: 4, background: 'linear-gradient(90deg, #7C3AED 0%, #a78bfa 100%)' }} />
            <Box sx={{ p: 2.5 }}>
              {/* Timer + progress */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.75 }}>
                <Stack direction="row" alignItems="center" gap={0.6}>
                  <TimerIcon sx={{ fontSize: 16, color: '#7C3AED' }} />
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#7C3AED' }}>07:25</Typography>
                </Stack>
                <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }}>
                  {lang === 'ru' ? '8 из 10' : '8 / 10'}
                </Typography>
              </Stack>
              <LinearProgress variant="determinate" value={80}
                sx={{ height: 5, borderRadius: 4, bgcolor: '#7C3AED20',
                  '& .MuiLinearProgress-bar': { bgcolor: '#7C3AED', borderRadius: 4 } }}
              />
              {/* Question */}
              <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary', mt: 2, mb: 1.75, lineHeight: 1.5 }}>
                {lang === 'ru' ? 'Чему равно x² + 2x + 1 при x = 3?' : 'x = 3 bo\'lganda x² + 2x + 1 = ?'}
              </Typography>
              {/* Options */}
              {[
                { letter: 'A', text: '9',   correct: false },
                { letter: 'B', text: '12',  correct: false },
                { letter: 'C', text: '16',  correct: true  },
                { letter: 'D', text: '18',  correct: false },
              ].map(({ letter, text, correct }) => (
                <Box key={letter} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.25,
                  mb: 0.7, p: '7px 12px', borderRadius: '10px',
                  border: '1.5px solid',
                  borderColor: correct ? '#7C3AED' : 'divider',
                  bgcolor: correct ? '#7C3AED10' : 'transparent',
                }}>
                  <Box sx={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: correct ? '#7C3AED' : (isDark ? 'rgba(255,255,255,0.06)' : 'grey.100'),
                    fontSize: '0.65rem', fontWeight: 700,
                    color: correct ? 'white' : 'text.secondary',
                  }}>{letter}</Box>
                  <Typography sx={{ fontSize: '0.78rem', fontWeight: correct ? 600 : 400, color: 'text.primary' }}>
                    {text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : undefined}
      />

      {/* ── Step content ─────────────────────────────────────────── */}
      <Box
        sx={{
          py: { xs: 5, md: 7 },
          bgcolor: 'background.default',
          minHeight: 500,
        }}
      >
        <Container maxWidth={step === STEP_SELECT ? 'md' : 'sm'}>
          <AnimatePresence mode="wait">
            {step === STEP_SELECT && (
              <StepSelect key="select" onStart={handleStart} />
            )}
            {step === STEP_QUIZ && (
              <StepQuiz
                key="quiz"
                questions={questions}
                totalTime={totalTime}
                onFinish={handleFinish}
              />
            )}
            {step === STEP_RESULT && (
              <StepResult
                key="result"
                questions={questions}
                answers={answers}
                onRetry={handleRetry}
              />
            )}
          </AnimatePresence>
        </Container>
      </Box>
    </Box>
  );
}
