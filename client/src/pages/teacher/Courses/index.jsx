import {
  Box, Typography, Card, CardContent, Grid, Chip, Stack,
  Button, Avatar, LinearProgress, CircularProgress,
  IconButton, Tooltip,
} from '@mui/material';
import { useTranslation }          from 'react-i18next';
import { useNavigate }             from 'react-router-dom';
import AssignmentIcon  from '@mui/icons-material/Assignment';
import PeopleIcon      from '@mui/icons-material/People';
import PlayCircleIcon  from '@mui/icons-material/PlayCircle';
import StarIcon        from '@mui/icons-material/Star';
import MenuBookIcon    from '@mui/icons-material/MenuBook';
import VisibilityIcon  from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { motion }      from 'framer-motion';
import PageHeader      from '../../../components/common/PageHeader/index.jsx';
import { useGetTeacherCoursesQuery } from '../../../features/courses/coursesApi.js';
import i18n from '../../../utils/i18n.js';

const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

export default function TeacherCourses() {
  const { t }    = useTranslation();
  const navigate = useNavigate();
  const lang     = i18n.language === 'ru' ? 'ru' : 'uz';

  const { data: res, isLoading } = useGetTeacherCoursesQuery();
  const courses = res?.data ?? [];

  const totalStudents = courses.reduce((s, c) => s + (c.totalStudents ?? 0), 0);
  const avgRating     = courses.length
    ? (courses.reduce((s, c) => s + (c.rating?.average ?? 0), 0) / courses.length).toFixed(1)
    : '—';

  const STATS = [
    { label: t('teacher.totalStudents'), value: totalStudents,    icon: <PeopleIcon />,     color: '#1976D2' },
    { label: t('teacher.coursesCount'),  value: courses.length,   icon: <AssignmentIcon />, color: '#7C3AED' },
    { label: t('teacher.avgRating'),     value: avgRating,        icon: <StarIcon />,       color: '#F59E0B' },
  ];

  return (
    <Box>
      <PageHeader
        icon={<MenuBookIcon />}
        title={t('teacher.myCourses')}
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {STATS.map((s, i) => (
          <Grid item xs={12} sm={4} key={s.label}>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Avatar sx={{ mx: 'auto', mb: 1, bgcolor: s.color + '18', color: s.color }}>
                    {s.icon}
                  </Avatar>
                  <Typography variant="h5" fontWeight={800} color={s.color}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Empty state */}
      {!isLoading && courses.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <MenuBookIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">{t('teacher.noCoursesYet')}</Typography>
        </Box>
      )}

      {/* Course cards */}
      {courses.map((c, idx) => {
        const color    = PALETTE[idx % PALETTE.length];
        const title    = typeof c.title === 'object'
          ? (c.title[lang] ?? c.title.uz ?? '')
          : (c.title ?? '');
        const rating   = c.rating?.average ?? 0;
        const students = c.totalStudents ?? 0;

        return (
          <motion.div
            key={c._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Card sx={{ mb: 3, border: '1px solid', borderColor: color + '33' }}>
              <Box sx={{ height: 5, bgcolor: color }} />
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', gap: 0.5 }}>
                      <Typography variant="h6" fontWeight={700}>{title}</Typography>
                      <Chip
                        icon={<StarIcon sx={{ fontSize: '14px !important', color: '#92400E !important' }} />}
                        label={rating}
                        size="small"
                        sx={{ bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 700 }}
                      />
                      <Chip
                        label={c.isPublished ? t('admin.published') : t('admin.draft')}
                        size="small"
                        color={c.isPublished ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                      {c.subject && (
                        <Chip label={c.subject} size="small" variant="outlined" sx={{ borderColor: color, color }} />
                      )}
                      {c.level && (
                        <Chip label={c.level} size="small" variant="outlined" />
                      )}
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title={c.isPublished ? t('admin.published') : t('admin.draft')}>
                      <IconButton size="small" sx={{ color }}>
                        {c.isPublished ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Stack>

                {/* Stats row */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {[
                    { label: t('teacher.students'), value: students, icon: <PeopleIcon sx={{ fontSize: 16 }} /> },
                    { label: t('page.courses.duration'), value: `${c.duration ?? 0} oy`, icon: <PlayCircleIcon sx={{ fontSize: 16 }} /> },
                    { label: t('admin.rating'), value: rating, icon: <StarIcon sx={{ fontSize: 16 }} /> },
                  ].map((st) => (
                    <Grid item xs={4} key={st.label}>
                      <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                        <Box sx={{ color: 'text.secondary', display: 'flex', justifyContent: 'center', mb: 0.5 }}>{st.icon}</Box>
                        <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>{st.value}</Typography>
                        <Typography variant="caption" color="text.secondary">{st.label}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {/* Course progress bar (totalStudents as fill indicator) */}
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{t('teacher.totalStudents')}</Typography>
                    <Typography variant="body2" color="text.secondary">{students}</Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(students, 100)}
                    sx={{
                      height: 8, borderRadius: 4,
                      bgcolor: color + '18',
                      '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                    }}
                  />
                </Box>

                {/* Price info */}
                {c.price?.amount != null && (
                  <Chip
                    label={`${c.price.amount.toLocaleString()} ${c.price.currency ?? 'UZS'}`}
                    size="small"
                    sx={{ bgcolor: color + '12', color, fontWeight: 700, border: `1px solid ${color}30` }}
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </Box>
  );
}
