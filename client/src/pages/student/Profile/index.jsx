import {
  Box, Typography, Card, CardContent, Grid, TextField, Button,
  Avatar, Stack, Divider, Chip, Alert, IconButton, Tooltip, InputAdornment,
  CircularProgress,
} from '@mui/material';
import { useState, useMemo }      from 'react';
import { useNavigate }            from 'react-router-dom';
import { useTranslation }         from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { motion }                 from 'framer-motion';
import SaveIcon         from '@mui/icons-material/Save';
import EditIcon         from '@mui/icons-material/Edit';
import PersonIcon       from '@mui/icons-material/Person';
import SchoolIcon       from '@mui/icons-material/School';
import BadgeIcon        from '@mui/icons-material/Badge';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import TelegramIcon     from '@mui/icons-material/Telegram';
import EmailIcon        from '@mui/icons-material/Email';
import PhoneIcon        from '@mui/icons-material/Phone';
import PageHeader       from '../../../components/common/PageHeader/index.jsx';
import { useGetMyGroupsQuery }      from '../../../features/groups/groupsApi.js';
import { useUpdateMyProfileMutation } from '../../../features/users/usersApi.js';
import { selectUser, selectAccessToken, setCredentials } from '../../../features/auth/authSlice.js';
import i18n from '../../../utils/i18n.js';

const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6'];

export default function StudentProfile() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { t }     = useTranslation();
  const lang      = i18n.language === 'ru' ? 'ru' : 'uz';
  const user      = useSelector(selectUser);
  const token     = useSelector(selectAccessToken);

  /* ── My groups → unique courses ──────────────────────────────── */
  const { data: groupsRes } = useGetMyGroupsQuery();
  const groups = groupsRes?.data ?? groupsRes ?? [];
  const myCourses = useMemo(() => {
    const seen = new Set();
    const list = [];
    groups.forEach((g) => {
      if (!g.course) return;
      const cid = g.course._id ?? g.course;
      if (seen.has(cid)) return;
      seen.add(cid);
      list.push({ ...g.course, teacher: g.teacher });
    });
    return list;
  }, [groups]);

  /* ── Profile mutation ─────────────────────────────────────────── */
  const [updateMyProfile, { isLoading: saving }] = useUpdateMyProfileMutation();

  /* ── Phone helpers ────────────────────────────────────────────── */
  const stripPhone = (raw = '') => {
    const d = (raw ?? '').replace(/\D/g, '');
    if (d.startsWith('998') && d.length >= 12) return d.slice(3, 12);
    if (d.startsWith('998') && d.length >= 11) return d.slice(3);
    if (d.startsWith('0')   && d.length === 10) return d.slice(1);
    return d.slice(0, 9);
  };

  /* ── Form state ───────────────────────────────────────────────── */
  const initFromUser = useMemo(() => ({
    name:        user?.name        ?? '',
    email:       user?.email       ?? '',
    phone:       stripPhone(user?.phone ?? ''),
    dateOfBirth: user?.dateOfBirth?.slice(0, 10) ?? '',
    address:     user?.address     ?? '',
    telegram:    user?.telegram    ?? '',
    studentId:   user?._id?.slice(-8).toUpperCase() ?? '',
  }), [user]);

  const [form, setForm]       = useState(initFromUser);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');

  const change = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  /* ── Save handler — calls PATCH /users/me ─────────────────────── */
  const handleSave = async () => {
    setError('');
    try {
      const payload = {
        name:        form.name.trim(),
        phone:       form.phone.trim(),
        address:     form.address.trim(),
        telegram:    form.telegram.trim(),
        dateOfBirth: form.dateOfBirth || undefined,
      };
      const res = await updateMyProfile(payload).unwrap();
      const updatedUser = res?.data ?? res;
      /* Update Redux store so header/sidebar reflect new name immediately */
      dispatch(setCredentials({ user: updatedUser, accessToken: token }));
      setSaved(true);
      setEditing(false);
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      setError(err?.data?.message ?? t('common.error'));
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setForm(initFromUser);
    setError('');
  };

  const initials = form.name.split(' ').map((w) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <Box>
      <PageHeader
        icon={<PersonIcon />}
        title={t('student.myProfile')}
        actions={!editing ? (
          <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setEditing(true)}>
            {t('common.edit')}
          </Button>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button onClick={handleCancel} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button variant="contained" startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveIcon />} onClick={handleSave} disabled={saving}>
              {t('common.save')}
            </Button>
          </Stack>
        )}
      />

      {saved && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert severity="success" sx={{ mb: 3 }}>
            {t('student.profileUpdated')}
          </Alert>
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        </motion.div>
      )}

      <Grid container spacing={3}>
        {/* ── Avatar / info card ──────────────────────────────── */}
        <Grid item xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}>
            <Card sx={{ overflow: 'hidden' }}>
              {/* Gradient header */}
              <Box sx={{
                height: 80,
                background: 'linear-gradient(135deg, #1565C0 0%, #7C3AED 100%)',
                position: 'relative',
              }}>
                <Box sx={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
              </Box>

              <CardContent sx={{ pt: 0, pb: 3, px: 3 }}>
                {/* Avatar — overlaps header */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: '-40px', mb: 2 }}>
                  <Box sx={{ position: 'relative' }}>
                    <Avatar sx={{
                      width: 80, height: 80,
                      bgcolor: 'primary.main',
                      fontSize: '1.8rem', fontWeight: 800,
                      border: '4px solid',
                      borderColor: 'background.paper',
                      boxShadow: '0 4px 16px rgba(25,118,210,0.3)',
                    }}>
                      {initials}
                    </Avatar>
                    {editing && (
                      <Tooltip title={t('student.changeAvatar')}>
                        <IconButton
                          size="small"
                          sx={{
                            position: 'absolute', bottom: -2, right: -2,
                            width: 26, height: 26,
                            bgcolor: 'primary.main', color: 'white',
                            '&:hover': { bgcolor: 'primary.dark' },
                            border: '2px solid white',
                          }}
                        >
                          <EditIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>

                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={800}>{form.name}</Typography>
                  <Chip
                    icon={<BadgeIcon sx={{ fontSize: '14px !important' }} />}
                    label={form.studentId}
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ mt: 0.75, fontWeight: 600, fontSize: '0.72rem' }}
                  />
                </Box>

                {/* Contact info */}
                <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                  {[
                    { icon: <EmailIcon sx={{ fontSize: 15 }} />, value: form.email,    color: '#1976D2' },
                    { icon: <PhoneIcon sx={{ fontSize: 15 }} />, value: form.phone ? `+998 ${form.phone}` : '—', color: '#10B981' },
                    { icon: <TelegramIcon sx={{ fontSize: 15 }} />, value: form.telegram || '—', color: '#229ED9' },
                  ].map(({ icon, value, color }, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                      <Box sx={{ color, flexShrink: 0 }}>{icon}</Box>
                      <Typography variant="caption" color="text.secondary" noWrap>{value}</Typography>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ mb: 2 }} />

                {/* My courses */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={700}>{t('student.myCourses')}</Typography>
                  <Button
                    size="small"
                    endIcon={<NavigateNextIcon sx={{ fontSize: 13 }} />}
                    sx={{ fontSize: '0.72rem', py: 0.25, minWidth: 0 }}
                    onClick={() => navigate('/student/courses')}
                  >
                    {t('common.seeAll')}
                  </Button>
                </Stack>
                {myCourses.length === 0 && (
                  <Typography variant="caption" color="text.disabled">
                    {t('student.notInGroup')}
                  </Typography>
                )}
                {myCourses.slice(0, 3).map((c, idx) => {
                  const color = PALETTE[idx % PALETTE.length];
                  const title = typeof c.title === 'object'
                    ? (c.title[lang] ?? c.title.uz ?? c.title.ru ?? '')
                    : (c.title ?? '');
                  return (
                    <Box
                      key={c._id ?? idx}
                      onClick={() => navigate('/student/courses')}
                      sx={{
                        p: 1.5, mb: 1, borderRadius: 2,
                        border: '1px solid', borderColor: 'divider',
                        cursor: 'pointer',
                        transition: 'border-color 0.18s, background-color 0.18s',
                        '&:hover': { bgcolor: 'action.hover', borderColor: color + '55' },
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.75 }}>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <SchoolIcon sx={{ fontSize: 14, color }} />
                          <Typography variant="caption" fontWeight={700} noWrap>{title}</Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color, fontWeight: 700 }}>0%</Typography>
                      </Stack>
                      <Box sx={{ height: 4, borderRadius: 2, bgcolor: color + '18' }}>
                        <Box sx={{ height: 4, borderRadius: 2, width: '0%', bgcolor: color, transition: 'width 0.6s' }} />
                      </Box>
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* ── Edit form ───────────────────────────────────────── */}
        <Grid item xs={12} md={8}>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.06 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                  {t('student.personalInfo')}
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label={t('form.name')} fullWidth value={form.name}
                      onChange={change('name')} disabled={!editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email" fullWidth value={form.email}
                      disabled type="email"
                      helperText={t('student.emailNote')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label={t('form.phone')} fullWidth value={form.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                        setForm((f) => ({ ...f, phone: digits }));
                      }}
                      disabled={!editing}
                      placeholder="90 123 45 67"
                      inputProps={{ maxLength: 9, inputMode: 'numeric' }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Chip
                              label="+998"
                              size="small"
                              sx={{
                                height: 22, fontSize: '0.72rem', fontWeight: 700,
                                bgcolor: 'rgba(25,118,210,0.10)',
                                color: 'primary.main',
                                border: 'none',
                                borderRadius: '4px',
                                mr: 0.5,
                                '& .MuiChip-label': { px: 0.75 },
                              }}
                            />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label={t('student.dateOfBirth')} fullWidth value={form.dateOfBirth}
                      onChange={change('dateOfBirth')} disabled={!editing}
                      type="date"
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label={t('student.address')} fullWidth value={form.address}
                      onChange={change('address')} disabled={!editing}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Telegram" fullWidth value={form.telegram}
                      onChange={change('telegram')} disabled={!editing}
                      placeholder="@username"
                    />
                  </Grid>
                </Grid>

                {editing && (
                  <Box sx={{ mt: 4 }}>
                    <Divider sx={{ mb: 3 }} />
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
                      {t('student.changePassword')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      {lang === 'ru' ? 'Смена пароля будет доступна в ближайшее время' : "Parolni o'zgartirish tez orada qo'shiladi"}
                    </Typography>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={4}>
                        <TextField label={t('student.currentPassword')} fullWidth type="password" disabled />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField label={t('student.newPassword')} fullWidth type="password" disabled />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <TextField label={t('student.repeatPassword')} fullWidth type="password" disabled />
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </Box>
  );
}
