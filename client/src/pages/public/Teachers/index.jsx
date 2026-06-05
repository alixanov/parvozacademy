import { useState, useMemo } from 'react';
import {
  Box, Container, Grid, Typography, Card, CardContent,
  Chip, Stack, Button, Rating, useTheme, Avatar, Tooltip,
  CircularProgress,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import SchoolIcon      from '@mui/icons-material/School';
import GroupsIcon      from '@mui/icons-material/Groups';
import WorkIcon        from '@mui/icons-material/Work';
import StarIcon        from '@mui/icons-material/Star';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n            from '../../../utils/i18n.js';
import PageBanner      from '../../../components/ui/PageBanner.jsx';
import { useGetPublicTeachersQuery } from '../../../features/users/usersApi.js';

const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

/* ── Animation presets ─────────────────────────────────────────── */
const fadeUp = {
  initial:     { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, margin: '-40px' },
  transition:  { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

const cardVariants = {
  hidden:  { opacity: 0, y: 24, scale: 0.97 },
  visible: { opacity: 1, y: 0,  scale: 1,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -12, scale: 0.97,
    transition: { duration: 0.2 } },
};

/* ── TeacherCard ───────────────────────────────────────────────── */
function TeacherCard({ teacher, idx, t, navigate }) {
  const color       = teacher.color || PALETTE[idx % PALETTE.length];
  const initials    = (teacher.name?.[0] ?? '?').toUpperCase();
  const rating      = teacher.rating ?? 5;
  const experience  = teacher.experience ?? 0;
  const subject     = teacher.subject ?? '—';
  const bio         = teacher.bio ?? '';
  const achievements = teacher.achievements ?? [];
  const visibleTags  = achievements.slice(0, 2);
  const overflow     = achievements.length - 2;

  return (
    <Card sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', transition: 'all 0.25s',
      border: '1px solid', borderColor: 'divider',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: `0 16px 40px ${color}22`,
        borderColor: color + '44',
      },
    }}>
      {/* Top accent bar */}
      <Box sx={{
        height: 5, flexShrink: 0,
        background: `linear-gradient(90deg, ${color} 0%, ${color}66 100%)`,
      }} />

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 3, pt: 2.5 }}>
        {/* Header: avatar + name + rating */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
          {teacher.avatar?.url ? (
            <Avatar src={teacher.avatar.url} sx={{ width: 56, height: 56, flexShrink: 0 }} />
          ) : (
            <Box sx={{
              width: 56, height: 56, flexShrink: 0,
              borderRadius: '14px',
              background: `linear-gradient(135deg, ${color}22 0%, ${color}0A 100%)`,
              border: `1.5px solid ${color}35`,
              color, fontWeight: 900, fontSize: '1.4rem',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {initials}
            </Box>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ lineHeight: 1.25, mb: 0.4 }}>
              {teacher.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
              <Rating value={rating} precision={0.5} size="small" readOnly
                sx={{ '& .MuiRating-iconFilled': { color } }} />
              <Typography variant="caption" fontWeight={700} sx={{ color }}>
                {Number(rating).toFixed(1)}
              </Typography>
            </Box>
            <Chip label={subject} size="small"
              sx={{ bgcolor: color + '12', color, fontWeight: 700, fontSize: '0.68rem', height: 20, borderRadius: '6px' }} />
          </Box>
        </Box>

        {/* Key metrics */}
        <Box sx={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 0, mb: 2.5, p: 1.75, borderRadius: '10px',
          bgcolor: color + '07', border: `1px solid ${color}18`,
        }}>
          {[
            { val: experience,  sub: t('page.teachers.yearsExp') },
            { val: `${rating.toFixed(1)}★`, sub: t('page.teachers.avgRating', { defaultValue: 'Reyting' }) },
          ].map(({ val, sub }, i) => (
            <Box key={i} sx={{ textAlign: 'center', borderRight: i === 0 ? `1px solid ${color}20` : 'none' }}>
              <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1.1 }}>
                {val}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', lineHeight: 1.3, mt: 0.25 }}>
                {sub}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Bio */}
        {bio && (
          <Typography variant="body2" color="text.secondary" sx={{
            lineHeight: 1.75, mb: 2, flex: 1,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
          }}>
            {bio}
          </Typography>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <Stack direction="row" flexWrap="wrap" gap={0.6} sx={{ mb: 2.5, minHeight: 26 }}>
            {visibleTags.map((a) => (
              <Chip key={a} label={a} size="small" variant="outlined"
                sx={{
                  fontSize: '0.66rem', height: 22, borderRadius: '6px',
                  borderColor: color + '30', color: 'text.secondary',
                  maxWidth: 160,
                  '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                }}
              />
            ))}
            {overflow > 0 && (
              <Chip label={`+${overflow}`} size="small"
                sx={{ fontSize: '0.66rem', height: 22, borderRadius: '6px', bgcolor: color + '12', color, fontWeight: 700 }} />
            )}
          </Stack>
        )}

        {/* CTA */}
        <Button fullWidth variant="outlined" onClick={() => navigate('/courses')}
          sx={{
            mt: 'auto', borderRadius: 2.5,
            borderColor: color + '55', color, fontWeight: 600, py: 1,
            '&:hover': { borderColor: color, bgcolor: color + '08' },
          }}>
          {t('page.pricing.btnChoose')}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ── Page ──────────────────────────────────────────────────────── */
export default function Teachers() {
  const theme          = useTheme();
  const navigate       = useNavigate();
  const { t }          = useTranslation();
  const lang           = i18n.language;
  const isDark         = theme.palette.mode === 'dark';

  const [activeFilter, setActiveFilter] = useState('all');
  const { data, isLoading } = useGetPublicTeachersQuery();
  const teachers = data?.data ?? [];

  /* Build unique subject filter list */
  const filters = useMemo(() => {
    const seen  = new Set();
    const items = [{ id: 'all', label: t('page.teachers.allSubjects') }];
    teachers.forEach((tr, idx) => {
      const key = tr.subject || 'other';
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ id: key, label: key, color: PALETTE[idx % PALETTE.length] });
      }
    });
    return items;
  }, [teachers, t]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return teachers;
    return teachers.filter((tr) => tr.subject === activeFilter);
  }, [teachers, activeFilter]);

  return (
    <Box sx={{ mx: { xs: -2, sm: -3 } }}>
      <PageBanner
        eyebrow="Parvoz Academy"
        title={t('page.teachers.title')}
        subtitle={t('page.teachers.subtitle')}
        color="#7C3AED"
        stats={[
          { value: `${teachers.length}+`, label: lang === 'ru' ? 'преподавателей' : "o'qituvchi" },
          { value: '5 000+', label: lang === 'ru' ? 'студентов' : "o'quvchi" },
          { value: '95%',    label: lang === 'ru' ? 'успех'     : 'muvaffaqiyat' },
        ]}
        visual={
          <Box>
            <Stack spacing={1.5}>
              {teachers.slice(0, 3).map((tr, idx) => (
                <Box key={tr._id} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2, py: 1.5,
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'background.default',
                  border: '1px solid', borderColor: 'divider',
                  borderRadius: '14px',
                  boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                  <Box sx={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    bgcolor: PALETTE[idx % PALETTE.length] + '20',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${PALETTE[idx % PALETTE.length]}40`,
                    fontSize: '1rem', fontWeight: 700, color: PALETTE[idx % PALETTE.length],
                  }}>
                    {tr.name?.charAt(0) ?? '?'}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.3 }} noWrap>
                      {tr.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.70rem', color: 'text.secondary' }} noWrap>
                      {tr.subject || '—'}
                    </Typography>
                  </Box>
                  <Stack direction="row" alignItems="center" gap={0.35} sx={{ flexShrink: 0 }}>
                    <StarIcon sx={{ fontSize: 13, color: '#F59E0B' }} />
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 700 }}>
                      {(tr.rating ?? 5).toFixed(1)}
                    </Typography>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        }
      />

      {/* Stats bento */}
      <Box sx={{ py: { xs: 5, md: 7 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <motion.div {...fadeUp}>
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.35fr 1fr 1fr' },
              gap: 2,
            }}>
              {/* Teachers count card */}
              <Box sx={{
                gridRow: { md: 'span 2' },
                bgcolor: 'background.paper', borderRadius: 3,
                border: '1px solid', borderColor: 'divider',
                p: { xs: 3, md: 3.5 },
                display: 'flex', flexDirection: 'column', gap: 2.5,
                position: 'relative', overflow: 'hidden',
              }}>
                <Box>
                  <Typography sx={{
                    fontSize: { xs: '3rem', md: '3.8rem' }, fontWeight: 800, lineHeight: 1,
                    background: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  }}>
                    {isLoading ? '...' : `${teachers.length}+`}
                  </Typography>
                  <Typography sx={{ fontSize: '0.88rem', color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
                    {lang === 'ru' ? 'Преподавателей' : "O'qituvchilar"}
                  </Typography>
                </Box>

                {/* Avatar bubbles */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flex: 1, alignContent: 'flex-start' }}>
                  {teachers.map((tr, idx) => (
                    <Tooltip key={tr._id} title={`${tr.name} — ${tr.subject ?? ''}`} placement="top" arrow>
                      <Avatar sx={{
                        width: 44, height: 44,
                        bgcolor: PALETTE[idx % PALETTE.length],
                        fontSize: '0.88rem', fontWeight: 800,
                        boxShadow: `0 0 0 2.5px ${PALETTE[idx % PALETTE.length]}35`,
                        cursor: 'default', transition: 'transform 0.18s, box-shadow 0.18s',
                        '&:hover': { transform: 'scale(1.18) translateY(-2px)', boxShadow: `0 6px 18px ${PALETTE[idx % PALETTE.length]}55`, zIndex: 2 },
                      }}>
                        {tr.name?.[0] ?? '?'}
                      </Avatar>
                    </Tooltip>
                  ))}
                </Box>

                <Chip
                  label={lang === 'ru' ? '✓ Сертифицированные специалисты' : '✓ Sertifikatlangan mutaxassislar'}
                  size="small"
                  sx={{
                    width: 'fit-content',
                    bgcolor: isDark ? 'rgba(25,118,210,0.14)' : 'rgba(25,118,210,0.08)',
                    color: '#1976D2', fontWeight: 600, fontSize: '0.72rem',
                    border: '1px solid rgba(25,118,210,0.2)',
                  }}
                />
              </Box>

              {/* Students card */}
              <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', p: { xs: 3, md: 3.5 } }}>
                <Typography sx={{
                  fontSize: { xs: '2.4rem', md: '2.9rem' }, fontWeight: 800, lineHeight: 1,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  5 000+
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
                  {lang === 'ru' ? 'Студентов обучилось' : "O'quvchi o'qidi"}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.6, height: 44, mt: 3 }}>
                  {[22, 38, 32, 52, 65, 80, 100].map((h, i) => (
                    <Box key={i} sx={{
                      flex: 1, height: `${h}%`, borderRadius: '3px 3px 0 0',
                      background: i === 6 ? 'linear-gradient(180deg, #7C3AED, #A78BFA)' : isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.13)',
                    }} />
                  ))}
                </Box>
              </Box>

              {/* Experience card */}
              <Box sx={{ bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider', p: { xs: 3, md: 3.5 } }}>
                <Typography sx={{
                  fontSize: { xs: '2.4rem', md: '2.9rem' }, fontWeight: 800, lineHeight: 1,
                  background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  8+
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', fontWeight: 500, mt: 0.5 }}>
                  {lang === 'ru' ? 'Лет среднего опыта' : "Yillik o'rtacha tajriba"}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 3 }}>
                  {[1,2,3,4,5].map((i) => (
                    <StarIcon key={i} sx={{ fontSize: 22, color: i <= 4 ? '#F59E0B' : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }} />
                  ))}
                </Box>
              </Box>

              {/* Success rate card */}
              <Box sx={{
                gridColumn: { sm: 'span 2', md: 'span 2' },
                bgcolor: 'background.paper', borderRadius: 3, border: '1px solid', borderColor: 'divider',
                p: { xs: 3, md: 3.5 },
                display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 3 },
              }}>
                <Typography sx={{
                  fontSize: { xs: '3rem', md: '4.2rem' }, fontWeight: 800, lineHeight: 1, flexShrink: 0,
                  background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  95%
                </Typography>
                <Box sx={{ flex: 1, width: '100%' }}>
                  <Typography fontWeight={700} sx={{ mb: 1, fontSize: '0.95rem' }}>
                    {lang === 'ru' ? 'Успеваемость наших учеников' : "O'quvchilarimiz muvaffaqiyati"}
                  </Typography>
                  <Box sx={{ height: 8, borderRadius: 4, bgcolor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: '95%', borderRadius: 4, background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)' }} />
                  </Box>
                </Box>
              </Box>
            </Box>
          </motion.div>
        </Container>
      </Box>

      {/* Teachers section */}
      <Box sx={{ py: { xs: 5, md: 8 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          <motion.div {...fadeUp}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="overline" color="primary" fontWeight={700} sx={{ letterSpacing: 2, display: 'block', mb: 0.5 }}>
                {lang === 'ru' ? 'НАША КОМАНДА' : 'BIZNING JAMOA'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: '-0.5px' }}>
                  {t('page.teachers.title')}
                </Typography>
                <Typography variant="h5" fontWeight={700} sx={{
                  background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>
                  ({filtered.length})
                </Typography>
              </Box>
            </Box>
          </motion.div>

          {/* Subject filter */}
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 4 }}>
              {filters.map(({ id, label, color }) => {
                const active = activeFilter === id;
                return (
                  <Button key={id} size="small" onClick={() => setActiveFilter(id)}
                    startIcon={id !== 'all' ? <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: active ? 'white' : (color || 'primary.main'), flexShrink: 0 }} /> : null}
                    sx={{
                      borderRadius: '20px', px: 2, py: 0.6,
                      fontWeight: active ? 700 : 500, fontSize: '0.8rem', textTransform: 'none',
                      border: '1.5px solid',
                      borderColor: active ? (id === 'all' ? 'primary.main' : (color || 'primary.main')) : 'divider',
                      bgcolor: active ? (id === 'all' ? 'primary.main' : (color || 'primary.main')) : 'transparent',
                      color: active ? 'white' : 'text.secondary',
                      transition: 'all 0.18s',
                      '&:hover': {
                        borderColor: id === 'all' ? 'primary.main' : (color || 'primary.main'),
                        bgcolor: active ? (id === 'all' ? 'primary.dark' : color + 'DD') : (id === 'all' ? 'primary.main' : color || 'primary.main') + '10',
                        color: active ? 'white' : (id === 'all' ? 'primary.main' : (color || 'primary.main')),
                      },
                    }}>
                    {label}
                  </Button>
                );
              })}
            </Stack>
          </motion.div>

          {/* Loading state */}
          {isLoading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          )}

          {/* Cards grid */}
          <Grid container spacing={3}>
            <AnimatePresence mode="popLayout">
              {!isLoading && filtered.length === 0 ? (
                <Grid item xs={12} key="empty">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
                      <SchoolIcon sx={{ fontSize: 48, opacity: 0.3, mb: 2 }} />
                      <Typography variant="h6" fontWeight={600} color="text.secondary">
                        {lang === 'ru' ? 'Преподаватели не найдены' : "O'qituvchilar topilmadi"}
                      </Typography>
                    </Box>
                  </motion.div>
                </Grid>
              ) : (
                filtered.map((tr, i) => (
                  <Grid item xs={12} sm={6} md={4} key={tr._id}>
                    <motion.div key={tr._id} variants={cardVariants} initial="hidden" animate="visible" exit="exit" transition={{ delay: i * 0.07 }} style={{ height: '100%' }}>
                      <TeacherCard teacher={tr} idx={i} t={t} navigate={navigate} />
                    </motion.div>
                  </Grid>
                ))
              )}
            </AnimatePresence>
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box sx={{
        bgcolor: isDark ? '#0d0318' : '#f5f0ff',
        borderTop: '1px solid', borderColor: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.15)',
        py: { xs: 5.5, md: 7 },
      }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" gap={3}>
            <Box>
              <Box component="span" sx={{
                display: 'inline-flex', mb: 1.5,
                border: '1.5px solid rgba(124,58,237,0.35)', bgcolor: 'rgba(124,58,237,0.08)',
                color: '#7C3AED', borderRadius: '8px', px: 1.5, py: 0.5,
                fontSize: '0.67rem', fontWeight: 700, letterSpacing: '1.6px', textTransform: 'uppercase',
              }}>
                {lang === 'ru' ? 'Присоединяйтесь' : "Qo'shiling"}
              </Box>
              <Typography fontWeight={800} sx={{ fontSize: { xs: '1.3rem', md: '1.55rem' }, mb: 0.75 }}>
                {t('page.teachers.ctaTitle')}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', maxWidth: 460 }}>
                {t('page.teachers.ctaBody')}
              </Typography>
            </Box>
            <Button variant="contained" size="large" startIcon={<WorkIcon />}
              onClick={() => navigate('/vacancies')}
              sx={{
                flexShrink: 0,
                background: 'linear-gradient(135deg, #5b21b6 0%, #7C3AED 100%)',
                fontWeight: 700, borderRadius: 3, textTransform: 'none',
                px: 3.5, py: 1.4, fontSize: '0.95rem',
                boxShadow: '0 6px 22px rgba(124,58,237,0.36)',
                '&:hover': { background: 'linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%)' },
              }}>
              {t('nav.vacancies')}
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
