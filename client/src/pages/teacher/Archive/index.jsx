import {
  Box, Typography, Stack, Chip, Avatar, CircularProgress,
  useTheme, Grid,
} from '@mui/material';
import { motion }             from 'framer-motion';
import { useTranslation }     from 'react-i18next';
import CheckCircleIcon        from '@mui/icons-material/CheckCircle';
import ArchiveIcon            from '@mui/icons-material/Archive';
import GroupsIcon             from '@mui/icons-material/Groups';
import AccessTimeIcon         from '@mui/icons-material/AccessTime';
import PersonIcon             from '@mui/icons-material/Person';
import CalendarTodayIcon      from '@mui/icons-material/CalendarToday';
import PageHeader             from '../../../components/common/PageHeader/index.jsx';
import { useGetTeacherGroupsQuery } from '../../../features/teacher/teacherApi.js';
import i18n from '../../../utils/i18n.js';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const PALETTE = ['#6366F1', '#7C3AED', '#10B981', '#1976D2', '#EC4899', '#F59E0B', '#0891B2'];
const DAYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function gName(g) {
  if (!g) return '';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const n = g.name;
  if (typeof n === 'object') return n[lang] ?? n.uz ?? n.ru ?? '';
  return n ?? '';
}

function cTitle(course) {
  if (!course) return '';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const t = typeof course === 'object' ? course.title : course;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '';
  return t ?? '';
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export default function TeacherArchive() {
  const { t }  = useTranslation();
  const theme  = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const { data: groupsData, isLoading } = useGetTeacherGroupsQuery();
  const allGroups = groupsData?.data ?? groupsData ?? [];

  /* только завершённые */
  const completed = allGroups.filter((g) => g.status === 'completed');

  /* ══════════════════════════════════════════════════════════════════════════ */

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', py: { xs: 2, md: 3 }, px: { xs: 1.5, md: 0 } }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Box sx={{
          mb: 3, px: 3, py: 2.5, borderRadius: 3,
          bgcolor: 'background.paper',
          border: '1px solid', borderColor: 'divider',
          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(99,102,241,0.08)',
          position: 'relative', overflow: 'hidden',
        }}>
          <Box sx={{
            position: 'absolute', top: -40, right: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }}
            justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box sx={{
                width: 46, height: 46, borderRadius: '14px', flexShrink: 0,
                background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 18px rgba(99,102,241,0.35)',
              }}>
                <ArchiveIcon sx={{ fontSize: 22, color: '#fff' }} />
              </Box>
              <Box>
                <Typography fontWeight={800} fontSize="1.22rem" lineHeight={1.2}>
                  Arxiv — yakunlangan kurslar
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Barcha darslar o'tkazilgan va yakunlangan guruhlar
                </Typography>
              </Box>
            </Stack>

            {!isLoading && (
              <Box sx={{
                px: 1.75, py: 0.75, borderRadius: 2,
                bgcolor: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                textAlign: 'center',
              }}>
                <Typography fontSize="1.2rem" fontWeight={800} color="#6366F1" lineHeight={1.1}>
                  {completed.length}
                </Typography>
                <Typography variant="caption" color="#6366F1" sx={{ opacity: 0.8 }}>
                  yakunlangan
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </motion.div>

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {isLoading && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress size={28} sx={{ color: '#6366F1' }} />
          <Typography variant="caption" color="text.disabled" display="block" mt={1.5}>
            Yuklanmoqda…
          </Typography>
        </Box>
      )}

      {/* ── Empty ────────────────────────────────────────────────────────── */}
      {!isLoading && completed.length === 0 && (
        <Box sx={{
          py: 10, textAlign: 'center',
          bgcolor: 'background.paper', borderRadius: 3,
          border: '1px solid', borderColor: 'divider',
        }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '20px', mx: 'auto', mb: 2,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.12) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ArchiveIcon sx={{ fontSize: 30, color: '#6366F1' }} />
          </Box>
          <Typography variant="h6" fontWeight={700} color="text.secondary" gutterBottom>
            Arxiv bo'sh
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ maxWidth: 320, mx: 'auto' }}>
            Barcha darslar o'tkazilgan guruhlar yakunlanganidan so'ng bu yerda ko'rinadi
          </Typography>
        </Box>
      )}

      {/* ── Cards grid ───────────────────────────────────────────────────── */}
      {!isLoading && completed.length > 0 && (
        <Grid container spacing={2.5}>
          {completed.map((g, gi) => {
            const color = PALETTE[gi % PALETTE.length];

            return (
              <Grid item xs={12} sm={6} md={4} key={String(g._id)}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: gi * 0.06 }}
                  style={{ height: '100%' }}
                >
                  <Box sx={{
                    height: '100%',
                    borderRadius: 3, overflow: 'hidden',
                    bgcolor: 'background.paper',
                    border: '1px solid', borderColor: 'divider',
                    boxShadow: isDark
                      ? '0 2px 12px rgba(0,0,0,0.3)'
                      : '0 2px 12px rgba(0,0,0,0.06)',
                    display: 'flex', flexDirection: 'column',
                    transition: 'box-shadow .2s, border-color .2s',
                    '&:hover': {
                      borderColor: `${color}40`,
                      boxShadow: `0 8px 28px ${color}18`,
                    },
                  }}>

                    {/* ── Card header ── */}
                    <Box sx={{
                      px: 2.5, pt: 2.25, pb: 1.75,
                      background: isDark
                        ? `linear-gradient(135deg, ${color}12 0%, transparent 100%)`
                        : `linear-gradient(135deg, ${color}08 0%, transparent 100%)`,
                      borderBottom: '1px solid', borderColor: 'divider',
                      position: 'relative',
                    }}>
                      {/* Цветная полоска */}
                      <Box sx={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: 3,
                        background: `linear-gradient(90deg, ${color} 0%, ${color}88 100%)`,
                      }} />

                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography fontWeight={800} fontSize="1rem" lineHeight={1.25} color="text.primary">
                            {gName(g)}
                          </Typography>
                          {cTitle(g.course) && (
                            <Typography variant="caption" color="text.secondary" mt={0.25} display="block">
                              {cTitle(g.course)}
                            </Typography>
                          )}
                        </Box>
                        <Chip
                          size="small"
                          icon={<CheckCircleIcon sx={{ fontSize: '12px !important', color: '#6366F1 !important' }} />}
                          label="Yakunlangan"
                          sx={{
                            height: 22, fontSize: '0.62rem', fontWeight: 700, ml: 1,
                            bgcolor: 'rgba(99,102,241,0.12)',
                            color: '#6366F1',
                            border: '1px solid rgba(99,102,241,0.2)',
                          }}
                        />
                      </Stack>
                    </Box>

                    {/* ── Card body ── */}
                    <Box sx={{ px: 2.5, py: 2, flex: 1 }}>
                      <Stack spacing={1.25}>

                        {/* Студенты */}
                        {g.memberCount != null && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{
                              width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                              bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <GroupsIcon sx={{ fontSize: 14, color }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.disabled" display="block" lineHeight={1.2}>
                                O'quvchilar
                              </Typography>
                              <Typography variant="body2" fontWeight={700} color="text.primary">
                                {g.memberCount} ta
                              </Typography>
                            </Box>
                          </Stack>
                        )}

                        {/* Расписание */}
                        {(g.schedule ?? []).length > 0 && (
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <Box sx={{
                              width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                              bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <AccessTimeIcon sx={{ fontSize: 14, color }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.disabled" display="block" lineHeight={1.2}>
                                Jadval
                              </Typography>
                              <Typography variant="body2" fontWeight={600} color="text.secondary" fontSize="0.78rem">
                                {g.schedule.map((s) => DAYS_RU[s.dayOfWeek ?? s.day] ?? '?').join(', ')}
                                {g.schedule[0]?.startTime ? ` · ${g.schedule[0].startTime}` : ''}
                              </Typography>
                            </Box>
                          </Stack>
                        )}

                        {/* Дата начала */}
                        {g.startDate && (
                          <Stack direction="row" spacing={1} alignItems="flex-start">
                            <Box sx={{
                              width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                              bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <CalendarTodayIcon sx={{ fontSize: 14, color }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.disabled" display="block" lineHeight={1.2}>
                                Davr
                              </Typography>
                              <Typography variant="body2" fontWeight={600} color="text.secondary" fontSize="0.78rem">
                                {fmtDate(g.startDate)}
                                {g.endDate ? ` → ${fmtDate(g.endDate)}` : ''}
                              </Typography>
                            </Box>
                          </Stack>
                        )}

                        {/* Тип */}
                        {g.type && (
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{
                              width: 28, height: 28, borderRadius: '8px', flexShrink: 0,
                              bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <PersonIcon sx={{ fontSize: 14, color }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" color="text.disabled" display="block" lineHeight={1.2}>
                                Tur
                              </Typography>
                              <Typography variant="body2" fontWeight={600} color="text.secondary" fontSize="0.78rem" sx={{ textTransform: 'capitalize' }}>
                                {g.type}
                              </Typography>
                            </Box>
                          </Stack>
                        )}
                      </Stack>
                    </Box>

                    {/* ── Footer ── */}
                    <Box sx={{
                      px: 2.5, py: 1.25,
                      borderTop: '1px solid', borderColor: 'divider',
                      bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)',
                    }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar sx={{ width: 20, height: 20, bgcolor: `${color}22`, color, fontSize: '0.65rem', fontWeight: 700 }}>
                          {gName(g)[0]?.toUpperCase() ?? '?'}
                        </Avatar>
                        <Typography variant="caption" color="text.disabled">
                          Kurs muvaffaqiyatli yakunlandi
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
