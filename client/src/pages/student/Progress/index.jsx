import {
  Box, Typography, Card, CardContent, Grid, LinearProgress,
  Stack, Chip, Avatar, Table, TableBody, TableCell,
  TableHead, TableRow, Divider, Button,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TrendingUpIcon   from '@mui/icons-material/TrendingUp';
import SchoolIcon       from '@mui/icons-material/School';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import StarIcon         from '@mui/icons-material/Star';
import BarChartIcon     from '@mui/icons-material/BarChart';
import PlayCircleIcon   from '@mui/icons-material/PlayCircle';
import QuizIcon         from '@mui/icons-material/Quiz';
import AssignmentIcon   from '@mui/icons-material/Assignment';
import PageHeader       from '../../../components/common/PageHeader/index.jsx';

const SUBJECT_STATS = [];

const OVERALL = {
  avgGrade: 0,
  attendance: 0,
  homeworkDone: 0,
  homeworkTotal: 0,
  testsScore: 0,
};

function gradeColor(g) {
  if (!g) return 'text.disabled';
  if (g >= 4.5) return 'success.main';
  if (g >= 3.5) return 'primary.main';
  if (g >= 2.5) return 'warning.main';
  return 'error.main';
}

export default function StudentProgress() {
  const navigate = useNavigate();
  const { t }   = useTranslation();

  const SUMMARY_CARDS = [
    { label: t('student.avgGrade'),       value: OVERALL.avgGrade,   unit: '/ 5.0', icon: <StarIcon />,             color: '#F59E0B' },
    { label: t('student.attendanceLabel'), value: OVERALL.attendance + '%', unit: '', icon: <EventAvailableIcon />,  color: '#10B981' },
    { label: t('student.doneHomework'),   value: `${OVERALL.homeworkDone}/${OVERALL.homeworkTotal}`, unit: '', icon: <SchoolIcon />, color: '#1976D2' },
    { label: t('student.testResults'),    value: OVERALL.testsScore + '%', unit: '', icon: <TrendingUpIcon />,       color: '#7C3AED' },
  ];

  return (
    <Box>
      <PageHeader icon={<BarChartIcon />} title={t('student.progressAndStats')} />

      {/* Summary cards */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {SUMMARY_CARDS.map((s, i) => (
          <Grid item xs={6} sm={3} key={s.label}>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Avatar sx={{ mx: 'auto', mb: 1.5, bgcolor: s.color + '18', color: s.color }}>
                    {s.icon}
                  </Avatar>
                  <Typography variant="h5" fontWeight={800} color={s.color} sx={{ lineHeight: 1 }}>
                    {s.value}
                  </Typography>
                  {s.unit && <Typography variant="caption" color="text.secondary">{s.unit}</Typography>}
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    {s.label}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Quick actions */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider', p: 0 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>{t('student.quickActions')}</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              fullWidth variant="contained" startIcon={<PlayCircleIcon />}
              sx={{ borderRadius: 2, py: 1.2 }}
              onClick={() => navigate('/student/videos')}
            >
              {t('student.continueLesson')}
            </Button>
            <Button
              fullWidth variant="outlined" startIcon={<AssignmentIcon />}
              sx={{ borderRadius: 2, py: 1.2 }}
              onClick={() => navigate('/student/homework')}
            >
              {t('student.homework')}
            </Button>
            <Button
              fullWidth variant="outlined" startIcon={<QuizIcon />}
              sx={{ borderRadius: 2, py: 1.2 }}
              onClick={() => navigate('/student/tests')}
            >
              {t('student.tests')}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Per subject */}
      {SUBJECT_STATS.map((sub) => (
        <Card key={sub.subject} sx={{ mb: 3, border: '1px solid', borderColor: sub.color + '33' }}>
          <Box sx={{ height: 5, bgcolor: sub.color }} />
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>{sub.subject}</Typography>
                <Typography variant="body2" color="text.secondary">{sub.teacher}</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <Chip label={`${t('table.score')}: ${sub.averageGrade}`} size="small" sx={{ bgcolor: sub.color + '18', color: sub.color, fontWeight: 700 }} />
                <Chip label={`${t('student.attendanceLabel')}: ${sub.attendance}%`} size="small" color="success" variant="outlined" />
              </Stack>
            </Stack>

            {/* Lesson progress */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                <Typography variant="body2" fontWeight={600}>{t('student.lessonProgress')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {sub.completedLessons}/{sub.totalLessons}
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={Math.round((sub.completedLessons / sub.totalLessons) * 100)}
                sx={{
                  height: 8, borderRadius: 4,
                  bgcolor: sub.color + '18',
                  '& .MuiLinearProgress-bar': { bgcolor: sub.color, borderRadius: 4 },
                }}
              />
            </Box>

            {/* Module grades */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              {t('student.moduleGrades')}
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, pl: 0 }}>{t('table.module')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">{t('table.score')}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">{t('table.status')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sub.modules.map((mod) => (
                  <TableRow key={mod.name}>
                    <TableCell sx={{ pl: 0 }}>
                      <Typography variant="body2">{mod.name}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight={700} color={gradeColor(mod.grade)}>
                        {mod.grade ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={mod.done ? t('status.done') : t('status.ongoing')}
                        size="small"
                        color={mod.done ? 'success' : 'default'}
                        variant={mod.done ? 'filled' : 'outlined'}
                        sx={{ fontSize: '0.65rem' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
