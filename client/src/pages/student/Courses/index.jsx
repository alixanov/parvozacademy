import {
  Box, Grid, Typography, Card, CardContent, CardActions,
  Chip, Button, Stack, CircularProgress, Avatar,
} from '@mui/material';
import { useNavigate }   from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMemo }       from 'react';
import { motion }        from 'framer-motion';
import PlayCircleIcon    from '@mui/icons-material/PlayCircle';
import MenuBookIcon      from '@mui/icons-material/MenuBook';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import LockIcon          from '@mui/icons-material/Lock';
import ArrowForwardIcon  from '@mui/icons-material/ArrowForward';
import AccessTimeIcon    from '@mui/icons-material/AccessTime';
import PageHeader        from '../../../components/common/PageHeader/index.jsx';
import { useGetMyGroupsQuery }  from '../../../features/groups/groupsApi.js';
import { useGetCoursesQuery }   from '../../../features/courses/coursesApi.js';
import i18n from '../../../utils/i18n.js';

const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

export default function StudentCourses() {
  const navigate    = useNavigate();
  const { t }       = useTranslation();
  const lang        = i18n.language === 'ru' ? 'ru' : 'uz';

  /* All available courses */
  const { data: allCoursesRes, isLoading: coursesLoading } = useGetCoursesQuery({ limit: 100 });
  const allCourses = allCoursesRes?.data ?? allCoursesRes ?? [];

  /* Student's enrolled groups */
  const { data: groupsRes, isLoading: groupsLoading } = useGetMyGroupsQuery();
  const groups = groupsRes?.data ?? groupsRes ?? [];

  /* Set of enrolled course IDs */
  const enrolledCourseIds = useMemo(() => {
    const ids = new Set();
    groups.forEach((g) => {
      const cid = g.course?._id ?? g.course;
      if (cid) ids.add(String(cid));
    });
    return ids;
  }, [groups]);

  /* Map courseId → group for enrolled courses */
  const courseGroupMap = useMemo(() => {
    const map = {};
    groups.forEach((g) => {
      const cid = g.course?._id ?? g.course;
      if (cid) map[String(cid)] = g;
    });
    return map;
  }, [groups]);

  const isLoading = coursesLoading || groupsLoading;

  const getTitle = (c) => {
    const raw = c?.title;
    if (!raw) return '—';
    if (typeof raw === 'object') return raw[lang] ?? raw.uz ?? raw.ru ?? '—';
    return raw;
  };

  const getDesc = (c) => {
    const raw = c?.description;
    if (!raw) return '';
    if (typeof raw === 'object') return raw[lang] ?? raw.uz ?? raw.ru ?? '';
    return raw;
  };

  return (
    <Box>
      <PageHeader
        icon={<MenuBookIcon />}
        title={t('student.myCourses')}
        actions={
          <Chip
            label={`${enrolledCourseIds.size} ${lang === 'ru' ? 'записан' : 'ta yozilgan'}`}
            color="primary" variant="outlined" size="small"
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
          />
        }
      />

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!isLoading && allCourses.length === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', py: 8, textAlign: 'center' }}>
          <MenuBookIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">{t('student.notInGroup')}</Typography>
        </Card>
      )}

      {!isLoading && allCourses.length > 0 && (
        <Grid container spacing={3}>
          {allCourses.map((c, idx) => {
            const color      = PALETTE[idx % PALETTE.length];
            const title      = getTitle(c);
            const desc       = getDesc(c);
            const isEnrolled = enrolledCourseIds.has(String(c._id));
            const group      = courseGroupMap[String(c._id)];
            const teacherName = (isEnrolled ? group?.teacher?.name : c.teacher?.name) ?? '—';

            return (
              <Grid item xs={12} sm={6} md={4} key={c._id ?? idx}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                  style={{ height: '100%' }}
                >
                  <Card sx={{
                    height: '100%', display: 'flex', flexDirection: 'column',
                    overflow: 'hidden', position: 'relative',
                    border: isEnrolled ? `2px solid ${color}` : '1px solid',
                    borderColor: isEnrolled ? color : 'divider',
                    transition: 'box-shadow 0.18s, transform 0.18s',
                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                  }}>
                    {/* Color top bar */}
                    <Box sx={{ height: 6, background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)` }} />

                    {/* Enrollment badge */}
                    {isEnrolled && (
                      <Box sx={{
                        position: 'absolute', top: 16, right: 12,
                        bgcolor: color, color: 'white',
                        borderRadius: 4, px: 1.25, py: 0.4,
                        display: 'flex', alignItems: 'center', gap: 0.5,
                        fontSize: '0.68rem', fontWeight: 700,
                      }}>
                        <CheckCircleIcon sx={{ fontSize: 12 }} />
                        {lang === 'ru' ? 'Записан' : 'Yozilgan'}
                      </Box>
                    )}

                    <CardContent sx={{ flex: 1, p: 2.5 }}>
                      {/* Icon + title */}
                      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5, pr: isEnrolled ? 7 : 0 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: color + '18', color, flexShrink: 0, borderRadius: 2 }}>
                          <MenuBookIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                            {title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {teacherName}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Description */}
                      {desc && (
                        <Typography variant="body2" color="text.secondary"
                          sx={{ mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.8rem' }}>
                          {desc}
                        </Typography>
                      )}

                      {/* Tags */}
                      <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.5 }}>
                        {c.subject && (
                          <Chip label={c.subject} size="small"
                            sx={{ bgcolor: color + '14', color, fontWeight: 600, fontSize: '0.68rem', height: 22 }} />
                        )}
                        {c.level && (
                          <Chip label={c.level} size="small" variant="outlined"
                            sx={{ fontSize: '0.68rem', height: 22 }} />
                        )}
                        {c.duration != null && (
                          <Chip
                            icon={<AccessTimeIcon sx={{ fontSize: '12px !important' }} />}
                            label={`${c.duration} ${t('common.month')}`}
                            size="small" variant="outlined"
                            sx={{ fontSize: '0.68rem', height: 22 }}
                          />
                        )}
                      </Stack>

                      {/* Enrolled group info */}
                      {isEnrolled && group && (
                        <Box sx={{ mt: 1.5, p: 1.25, bgcolor: color + '0A', borderRadius: 1.5, border: `1px solid ${color}20` }}>
                          <Typography variant="caption" color={color} fontWeight={700}>
                            {lang === 'ru' ? 'Группа:' : 'Guruh:'} {group.name}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>

                    <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
                      {isEnrolled ? (
                        <Button
                          variant="contained" fullWidth
                          startIcon={<PlayCircleIcon />}
                          endIcon={<ArrowForwardIcon />}
                          sx={{
                            borderRadius: 2, py: 1,
                            bgcolor: color, fontWeight: 700,
                            '&:hover': { bgcolor: color, filter: 'brightness(0.9)' },
                            boxShadow: `0 4px 12px ${color}40`,
                          }}
                          onClick={() =>
                            group?.type === 'individual_package'
                              ? navigate('/student/video-lessons')
                              : navigate('/student/homework')
                          }
                        >
                          {group?.type === 'individual_package'
                            ? (lang === 'ru' ? 'Смотреть модули' : 'Modullarni ko\'rish')
                            : t('student.enterLesson')}
                        </Button>
                      ) : (
                        <Button
                          variant="outlined" fullWidth
                          startIcon={<LockIcon />}
                          sx={{ borderRadius: 2, py: 1, borderColor: 'divider', color: 'text.secondary' }}
                          disabled
                        >
                          {lang === 'ru' ? 'Нет доступа' : 'Kirish yo\'q'}
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
