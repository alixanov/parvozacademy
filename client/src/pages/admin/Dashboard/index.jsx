import {
  Box, Typography, Card, CardContent, Grid, Avatar, Stack,
  Chip, LinearProgress, Divider, List, ListItem, ListItemAvatar,
  ListItemText, Button, Tooltip, CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { motion }        from 'framer-motion';
import { useNavigate }   from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import DashboardIcon     from '@mui/icons-material/Dashboard';
import MenuBookIcon      from '@mui/icons-material/MenuBook';
import BarChartIcon      from '@mui/icons-material/BarChart';
import FiberNewIcon      from '@mui/icons-material/FiberNew';
import CreditCardIcon    from '@mui/icons-material/CreditCard';
import NavigateNextIcon  from '@mui/icons-material/NavigateNext';
import PeopleIcon        from '@mui/icons-material/People';
import SchoolIcon        from '@mui/icons-material/School';
import GroupsIcon        from '@mui/icons-material/Groups';
import TrendingUpIcon    from '@mui/icons-material/TrendingUp';
import WorkIcon          from '@mui/icons-material/Work';
import { formatPrice }   from '../../../data/mockData.js';
import { DateBadge }    from '../../../components/common/DateBadge/index.jsx';
import PageHeader        from '../../../components/common/PageHeader/index.jsx';
import { useGetCoursesQuery }        from '../../../features/courses/coursesApi.js';
import { useGetUsersQuery }          from '../../../features/users/usersApi.js';
import { useGetAdminDashboardQuery } from '../../../features/dashboard/dashboardApi.js';
import { useGetVacanciesQuery }      from '../../../features/vacancies/vacanciesApi.js';
import i18n from '../../../utils/i18n.js';

const COURSE_COLORS  = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B'];
const STUDENT_COLORS = ['#1976D2','#7C3AED','#10B981','#EF4444','#F59E0B'];

function SectionHeader({ icon, title, action, onAction }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Box sx={{ color: 'primary.main', display: 'flex', alignItems: 'center' }}>{icon}</Box>
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
      </Stack>
      {action && (
        <Button size="small" endIcon={<NavigateNextIcon />} onClick={onAction}
          sx={{ color: 'text.secondary', fontWeight: 600 }}>
          {action}
        </Button>
      )}
    </Stack>
  );
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t }   = useTranslation();
  const theme   = useTheme();
  const lang    = i18n.language === 'ru' ? 'ru' : 'uz';

  /* ── API data ─────────────────────────────────────────────── */
  const { data: dashRes, isLoading: loadingDash } = useGetAdminDashboardQuery();
  const { data: coursesRes }   = useGetCoursesQuery({ limit: 5 });
  const { data: studentsRes }  = useGetUsersQuery({ role: 'student', limit: 5 });
  const { data: vacanciesRes } = useGetVacanciesQuery({ activeOnly: false, limit: 50 });

  const dashData       = dashRes?.data ?? {};
  const totals         = dashData.totals    ?? {};
  const finance        = dashData.finance   ?? {};
  const recentPayments = dashData.recentPayments ?? [];
  const activeVacancies = (vacanciesRes?.data ?? []).filter((v) => v.isActive);

  const topCourses     = (coursesRes?.data  ?? []).slice(0, 5);
  const recentStudents = (studentsRes?.data ?? []).slice(0, 5);

  const maxStudents = topCourses.length
    ? Math.max(...topCourses.map((c) => c.totalStudents ?? 0), 1)
    : 1;

  /* ── KPI cards ─────────────────────────────────────────────── */
  const KPI = [
    { label: t('dashboard.totalStudents'), value: totals.students ?? 0,  color: '#1976D2', icon: <PeopleIcon /> },
    { label: t('dashboard.totalTeachers'), value: totals.teachers ?? 0,  color: '#7C3AED', icon: <SchoolIcon /> },
    { label: t('dashboard.totalCourses'),  value: totals.courses  ?? 0,  color: '#10B981', icon: <MenuBookIcon /> },
    { label: t('dashboard.totalGroups'),   value: totals.groups   ?? 0,  color: '#F59E0B', icon: <GroupsIcon /> },
    { label: t('dashboard.revenue'),
      value: finance.revenueThisMonth ? `${formatPrice(finance.revenueThisMonth)}` : '0',
      color: '#EF4444', icon: <CreditCardIcon /> },
    { label: t('dashboard.pendingPayments'), value: finance.pendingPayments ?? 0, color: '#F97316', icon: <TrendingUpIcon /> },
  ];

  return (
    <Box>
      <PageHeader icon={<DashboardIcon />} title={t('admin.dashboard')} />

      {/* KPI cards */}
      {loadingDash ? (
        <Box sx={{ py: 4, textAlign: 'center' }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {KPI.map((k, i) => (
            <Grid item xs={6} sm={4} md={2} key={k.label}>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.22 }}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, textAlign: 'center' }}>
                    <Typography variant="subtitle1" fontWeight={800} color={k.color} noWrap lineHeight={1.2}>{k.value}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.62rem', mt: 0.15 }}>{k.label}</Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      )}

      <Grid container spacing={3}>
        {/* ── Left column ──────────────────────────────────────── */}
        <Grid item xs={12} md={7}>

          {/* Top courses */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader
                icon={<MenuBookIcon />}
                title={t('dashboard.topCourses')}
                action={t('common.seeAll')}
                onAction={() => navigate('/admin/courses')}
              />
              <Stack spacing={2.5}>
                {topCourses.map((c, i) => {
                  const color   = COURSE_COLORS[i % COURSE_COLORS.length];
                  const title   = typeof c.title === 'object'
                    ? (c.title[lang] ?? c.title.uz ?? '')
                    : (c.title ?? '');
                  const studs   = c.totalStudents ?? 0;
                  const revenue = (c.price?.amount ?? 0) * studs;
                  const fill    = maxStudents > 0 ? Math.round((studs / maxStudents) * 100) : 0;
                  return (
                    <motion.div key={c._id}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.12 + i * 0.06, duration: 0.22 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                        <Stack direction="row" spacing={1.25} alignItems="center">
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, boxShadow: `0 0 0 3px ${color}22` }} />
                          <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 180 }}>{title}</Typography>
                        </Stack>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {studs} {t('dashboard.studentsCount')}
                          </Typography>
                          {revenue > 0 && (
                            <Typography variant="caption" fontWeight={700} sx={{ color }}>
                              {formatPrice(revenue)} {t('common.sum')}
                            </Typography>
                          )}
                          <Typography variant="caption" color="text.disabled" sx={{ minWidth: 32, textAlign: 'right' }}>
                            {fill}%
                          </Typography>
                        </Stack>
                      </Stack>
                      <LinearProgress variant="determinate" value={fill}
                        sx={{ height: 7, bgcolor: color + '16', '& .MuiLinearProgress-bar': { bgcolor: color } }} />
                    </motion.div>
                  );
                })}
                {topCourses.length === 0 && (
                  <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ py: 2 }}>
                    {t('admin.noCourses')}
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>

          {/* Activity summary */}
          {!loadingDash && dashData.activity && (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <SectionHeader icon={<BarChartIcon />} title={t('dashboard.activitySummary', { defaultValue: 'Faollik' })} />
                <Grid container spacing={2}>
                  {[
                    { label: t('dashboard.pendingHomework', { defaultValue: "Ko'rilmagan vazifalar" }), value: dashData.activity.pendingHomework ?? 0, color: '#F59E0B' },
                    { label: t('dashboard.newStudentsMonth', { defaultValue: "Bu oydagi yangi o'quvchilar" }), value: dashData.activity.newStudentsThisMonth ?? 0, color: '#10B981' },
                    { label: t('dashboard.avgAttendance', { defaultValue: "O'rtacha davomat" }), value: `${dashData.activity.avgAttendance ?? 0}%`, color: '#1976D2' },
                    { label: t('dashboard.revenueGrowth', { defaultValue: "Daromad o'sishi" }), value: `${finance.revenueGrowth >= 0 ? '+' : ''}${finance.revenueGrowth ?? 0}%`, color: finance.revenueGrowth >= 0 ? '#10B981' : '#EF4444' },
                  ].map((s) => (
                    <Grid item xs={6} key={s.label}>
                      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                        <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, textAlign: 'center' }}>
                          <Typography variant="subtitle1" fontWeight={800} color={s.color} lineHeight={1.2}>{s.value}</Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.62rem', mt: 0.15 }}>{s.label}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* ── Right column ─────────────────────────────────────── */}
        <Grid item xs={12} md={5}>

          {/* Recent students */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3, pb: 1 }}>
              <SectionHeader icon={<FiberNewIcon />} title={t('dashboard.newStudents')}
                action={t('common.seeAll')} onAction={() => navigate('/admin/students')} />
            </CardContent>
            <List disablePadding sx={{ pb: 1 }}>
              {recentStudents.map((s, i) => {
                const color   = STUDENT_COLORS[i % STUDENT_COLORS.length];
                const initials = (s.name?.[0] ?? '?').toUpperCase();
                const date     = s.createdAt ?? null;
                return (
                  <Box key={s._id}>
                    <ListItem sx={{ px: 3, py: 1.25 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ width: 38, height: 38, bgcolor: color + '22', color, fontSize: '0.9rem', fontWeight: 800 }}>
                          {initials}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={600}>{s.name}</Typography>}
                        secondary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.3 }}>
                            <Typography component="span" variant="caption" color="text.secondary">{s.phone ?? ''}</Typography>
                            {date && <DateBadge iso={date} />}
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'span' }}
                      />
                    </ListItem>
                    {i < recentStudents.length - 1 && <Divider component="li" sx={{ mx: 3 }} />}
                  </Box>
                );
              })}
              {recentStudents.length === 0 && (
                <ListItem sx={{ px: 3 }}>
                  <Typography variant="body2" color="text.disabled">{t('admin.noStudents')}</Typography>
                </ListItem>
              )}
            </List>
          </Card>

          {/* Recent payments */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader icon={<CreditCardIcon />} title={t('dashboard.recentPayments')}
                action={t('common.seeAll')} onAction={() => navigate('/admin/payments')} />
              <Stack spacing={0}>
                {recentPayments.length === 0 && (
                  <Typography variant="body2" color="text.disabled" textAlign="center" sx={{ py: 2 }}>
                    {t('common.noData')}
                  </Typography>
                )}
                {recentPayments.map((p, i) => {
                  const studentName = p.student?.name ?? '?';
                  const groupName   = p.group?.name ?? '—';
                  const amount      = p.paidAmount ?? p.amount ?? 0;
                  const date        = p.paidAt ?? null;
                  return (
                    <Box key={p._id ?? i}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.25 }}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{studentName}</Typography>
                          <Typography variant="caption" color="text.secondary">{groupName}</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" fontWeight={700} color="success.main">
                            +{formatPrice(amount)}
                          </Typography>
                          <DateBadge iso={date} />
                        </Box>
                      </Stack>
                      {i < recentPayments.length - 1 && <Divider />}
                    </Box>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>

          {/* Active vacancies */}
          {activeVacancies.length > 0 && (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <SectionHeader
                  icon={<WorkIcon />}
                  title="Faol vakansiyalar"
                  action="Barchasi"
                  onAction={() => navigate('/admin/vacancies')}
                />
                <Stack spacing={1.5}>
                  {activeVacancies.slice(0, 5).map((v) => {
                    const appCount = v.applications?.length ?? 0;
                    return (
                      <Stack key={v._id} direction="row" justifyContent="space-between" alignItems="center"
                        sx={{ p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>{v.title}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {v.salary?.min ? `${(v.salary.min / 1_000_000).toFixed(1)}–${(v.salary.max / 1_000_000).toFixed(1)} mln` : v.subject ?? ''}
                          </Typography>
                        </Box>
                        <Chip
                          icon={<PeopleIcon sx={{ fontSize: '12px !important' }} />}
                          label={`${appCount} ariza`}
                          size="small"
                          sx={{ fontWeight: 700, bgcolor: appCount > 0 ? '#FEF3C7' : 'action.hover', color: appCount > 0 ? '#92400E' : 'text.secondary', flexShrink: 0 }}
                        />
                      </Stack>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
