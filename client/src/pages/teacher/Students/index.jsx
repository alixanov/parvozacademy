import {
  Box, Typography, Card, CardContent, Stack, Chip, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow,
  TextField, InputAdornment, Select, MenuItem, FormControl,
  InputLabel, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, CircularProgress,
} from '@mui/material';
import { useState, useMemo }        from 'react';
import { useNavigate }              from 'react-router-dom';
import { useTranslation }           from 'react-i18next';
import SearchIcon       from '@mui/icons-material/Search';
import VisibilityIcon   from '@mui/icons-material/Visibility';
import MessageIcon      from '@mui/icons-material/Message';
import CloseIcon        from '@mui/icons-material/Close';
import PeopleIcon       from '@mui/icons-material/People';
import EmailIcon        from '@mui/icons-material/Email';
import PhoneIcon        from '@mui/icons-material/Phone';
import SchoolIcon       from '@mui/icons-material/School';
import i18n from '../../../utils/i18n.js';
import PageHeader       from '../../../components/common/PageHeader/index.jsx';
import { useGetGroupsQuery, useGetMyStudentsQuery } from '../../../features/groups/groupsApi.js';

/* ─── helpers ─────────────────────────────────────────────────────────────── */

function gName(group) {
  if (!group) return '';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const n = group.name;
  if (typeof n === 'object') return n[lang] ?? n.uz ?? n.ru ?? '';
  return n ?? '';
}

const AVATAR_COLORS = ['#1976D2', '#EF4444', '#7C3AED', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#06B6D4'];

/* ─── component ───────────────────────────────────────────────────────────── */

export default function TeacherStudents() {
  const navigate  = useNavigate();
  const { t }     = useTranslation();

  /* ── data ──────────────────────────────────────────────────────────────── */
  const { data: groupsRes, isLoading: loadingGroups } = useGetGroupsQuery({ limit: 100 });
  const myGroups = groupsRes?.data ?? [];

  const { data: membersRes, isLoading: loadingMembers } = useGetMyStudentsQuery();
  const rawMembers = membersRes?.data ?? [];

  /* enrich with display props only — no fake stats */
  const enriched = useMemo(() =>
    rawMembers.map((m, i) => {
      const s = m.student ?? {};
      return {
        id:        String(s._id ?? i),
        name:      s.name  ?? '—',
        email:     s.email ?? '',
        phone:     s.phone ?? '',
        avatar:    s.avatar ?? null,
        color:     AVATAR_COLORS[i % AVATAR_COLORS.length],
        groupName: gName(m.group),
        groupId:   String(m.group?._id ?? ''),
      };
    }),
  [rawMembers]);

  /* ── filters ────────────────────────────────────────────────────────────── */
  const [search,      setSearch]      = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [viewStudent, setViewStudent] = useState(null);

  const filtered = useMemo(() =>
    enriched.filter((s) => {
      const q = search.toLowerCase();
      return (
        (groupFilter === 'all' || s.groupId === groupFilter) &&
        (s.name.toLowerCase().includes(q) ||
         s.email.toLowerCase().includes(q) ||
         s.groupName.toLowerCase().includes(q))
      );
    }).sort((a, b) => a.name.localeCompare(b.name)),
  [enriched, search, groupFilter]);

  const isLoading = loadingGroups || loadingMembers;

  /* ══════════════════════════════════════════════════════════════════════════ */

  return (
    <Box>
      <PageHeader
        icon={<PeopleIcon />}
        title={t('teacher.myStudents')}
        actions={
          <Chip
            label={`${t('common.total')}: ${enriched.length}`}
            color="primary"
            variant="outlined"
          />
        }
      />

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ py: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              size="small"
              placeholder={t('teacher.searchByName')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>{t('teacher.group')}</InputLabel>
              <Select
                value={groupFilter}
                label={t('teacher.group')}
                onChange={(e) => setGroupFilter(e.target.value)}
              >
                <MenuItem value="all">{t('common.all')}</MenuItem>
                {myGroups.map((g) => (
                  <MenuItem key={String(g._id)} value={String(g._id)}>
                    {gName(g)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Loading ────────────────────────────────────────────────────────── */}
      {isLoading && (
        <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
      )}

      {/* ── Empty ──────────────────────────────────────────────────────────── */}
      {!isLoading && enriched.length === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', py: 6 }}>
          <Stack alignItems="center" spacing={1.5}>
            <PeopleIcon sx={{ fontSize: 52, color: 'text.disabled' }} />
            <Typography variant="h6" color="text.secondary">
              {t('teacher.noStudentsEmpty')}
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {t('teacher.noStudentsHint')}
            </Typography>
          </Stack>
        </Card>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      {!isLoading && enriched.length > 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 0 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{t('teacher.studentLabel')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('teacher.group')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t('auth.phone')}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">{t('teacher.action')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id} hover>

                    {/* student */}
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Avatar
                          src={s.avatar || undefined}
                          sx={{
                            width: 36, height: 36,
                            bgcolor: s.color + '22',
                            color: s.color,
                            fontSize: '0.9rem', fontWeight: 700,
                          }}
                        >
                          {(s.name[0] ?? '?').toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.email}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* group */}
                    <TableCell>
                      <Chip label={s.groupName} size="small" variant="outlined" color="primary" />
                    </TableCell>

                    {/* phone */}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {s.phone || '—'}
                      </Typography>
                    </TableCell>

                    {/* actions */}
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title={t('teacher.viewDetails')}>
                          <IconButton size="small" onClick={() => setViewStudent(s)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={t('teacher.sendNotif')}>
                          <IconButton
                            size="small"
                            onClick={() => navigate('/teacher/notifications')}
                          >
                            <MessageIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Student detail dialog ──────────────────────────────────────────── */}
      <Dialog
        open={!!viewStudent}
        onClose={() => setViewStudent(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {t('teacher.studentInfo')}
          <IconButton size="small" onClick={() => setViewStudent(null)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {viewStudent && (
          <DialogContent dividers>
            {/* avatar + name */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Avatar
                src={viewStudent.avatar || undefined}
                sx={{
                  width: 64, height: 64, mx: 'auto', mb: 1.5,
                  bgcolor: viewStudent.color + '22',
                  color: viewStudent.color,
                  fontSize: '1.5rem', fontWeight: 700,
                }}
              >
                {(viewStudent.name[0] ?? '?').toUpperCase()}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{viewStudent.name}</Typography>
              <Chip label={viewStudent.groupName} size="small" variant="outlined" color="primary" sx={{ mt: 0.5 }} />
            </Box>

            {/* info rows */}
            <Stack spacing={1.5}>
              {[
                { icon: <EmailIcon />, label: 'Email',              value: viewStudent.email || '—' },
                { icon: <PhoneIcon />, label: t('auth.phone'),       value: viewStudent.phone || '—' },
                { icon: <SchoolIcon />, label: t('teacher.group'),   value: viewStudent.groupName },
              ].map(({ icon, label, value }) => (
                <Box
                  key={label}
                  sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    p: 1.5, borderRadius: 2, bgcolor: 'background.default',
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ color: 'text.secondary', display: 'flex' }}>{icon}</Box>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                  </Stack>
                  <Typography variant="body2" fontWeight={600}>{value}</Typography>
                </Box>
              ))}
            </Stack>
          </DialogContent>
        )}

        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={() => setViewStudent(null)} sx={{ borderRadius: 2 }}>
            {t('common.close')}
          </Button>
          <Button
            variant="contained"
            sx={{ borderRadius: 2 }}
            onClick={() => { navigate('/teacher/homework'); setViewStudent(null); }}
          >
            {t('teacher.viewHomework')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
