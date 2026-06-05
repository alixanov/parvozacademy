import {
  Box, Typography, Card, CardContent, Stack, Chip, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  TextField, InputAdornment, Select, MenuItem, FormControl,
  InputLabel, IconButton, Tooltip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  Divider, Alert, CircularProgress,
} from '@mui/material';
import { useState, useMemo }  from 'react';
import { motion }            from 'framer-motion';
import { useTranslation }     from 'react-i18next';
import SearchIcon            from '@mui/icons-material/Search';
import PowerSettingsNewIcon  from '@mui/icons-material/PowerSettingsNew';
import { DateBadge }  from '../../../components/common/DateBadge/index.jsx';
import AddIcon        from '@mui/icons-material/Add';
import EditIcon       from '@mui/icons-material/Edit';
import VisibilityIcon    from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockIcon         from '@mui/icons-material/Lock';
import DeleteIcon     from '@mui/icons-material/Delete';
import CloseIcon      from '@mui/icons-material/Close';
import PeopleIcon     from '@mui/icons-material/People';
import SchoolIcon     from '@mui/icons-material/School';
import PhoneIcon      from '@mui/icons-material/Phone';
import EmailIcon      from '@mui/icons-material/Email';
import PageHeader     from '../../../components/common/PageHeader/index.jsx';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useSetUserActiveMutation,
} from '../../../features/users/usersApi.js';

const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

/* ── Add/Edit Dialog ──────────────────────────────────────────── */
function StudentDialog({ open, onClose, student, onSave, loading, apiError }) {
  const { t }    = useTranslation();
  const EMPTY    = { firstName:'', lastName:'', phone:'', email:'', password:'', passwordPlain:'' };
  const [form,        setForm]        = useState(EMPTY);
  const [local,       setLocal]       = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);

  /* split "Ism Familiya" → { firstName, lastName } */
  const splitName = (full = '') => {
    const parts = full.trim().split(/\s+/);
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') };
  };
  /* "+998901234567" or "901234567" → "901234567" (9 digits) */
  const stripPhone = (raw = '') => {
    const d = raw.replace(/\D/g, '');
    if (d.startsWith('998') && d.length >= 11) return d.slice(3, 12);
    if (d.startsWith('0')   && d.length === 10) return d.slice(1);
    return d.slice(0, 9);
  };

  const handleEnter = () => {
    if (student) {
      const { firstName, lastName } = splitName(student.name || student.nameUz || '');
      setForm({
        firstName,
        lastName,
        phone:        stripPhone(student.phone || ''),
        email:        student.email         || '',
        password:     '',
        passwordPlain: student.passwordPlain || '',
      });
    } else {
      setForm(EMPTY);
    }
    setLocal('');
    setShowCurrent(false);
    setShowNew(false);
  };

  const ch = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  /* phone: digits only, max 9 */
  const handlePhone = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
    setForm((p) => ({ ...p, phone: digits }));
  };

  const handleSave = () => {
    const firstName = form.firstName.trim();
    const lastName  = form.lastName.trim();
    if (!firstName) return setLocal(t('form.nameRequired'));
    if (form.phone.length !== 9) return setLocal("Telefon raqam 9 ta raqamdan iborat bo'lishi kerak");
    if (!student && !form.password) return setLocal(t('form.passwordRequired'));
    if (!student && form.password.length < 6) return setLocal('Parol kamida 6 ta belgi');
    if (form.password && form.password.length < 6) return setLocal('Yangi parol kamida 6 ta belgi');
    setLocal('');
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;
    onSave({
      name:     fullName,
      nameUz:   fullName,
      phone:    `+998${form.phone}`,
      email:    form.email || undefined,
      password: form.password,
    });
  };

  const error = local || apiError;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth TransitionProps={{ onEnter: handleEnter }}>
      <DialogTitle sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontWeight:700 }}>
        {student ? t('dialog.editStudent') : t('dialog.addStudent')}
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb:2 }}>{error}</Alert>}
        <Grid container spacing={2.5}>

          {/* ── First name + Last name ── */}
          <Grid item xs={12} sm={6}>
            <TextField label={`Ism *`} fullWidth value={form.firstName} onChange={ch('firstName')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Familiya" fullWidth value={form.lastName} onChange={ch('lastName')} />
          </Grid>

          {/* ── Phone with +998 chip ── */}
          <Grid item xs={12} sm={6}>
            <TextField
              label={`${t('form.phone')} *`}
              fullWidth
              value={form.phone}
              onChange={handlePhone}
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

          {/* ── Email ── */}
          <Grid item xs={12} sm={6}>
            <TextField label="Email" type="email" fullWidth value={form.email || ''} onChange={ch('email')} />
          </Grid>

          {/* ── Current password (edit mode only) ── */}
          {student && (
            <Grid item xs={12} sm={6}>
              {form.passwordPlain ? (
                /* ── Known password: show with eye toggle ── */
                <TextField
                  label="Joriy parol"
                  type={showCurrent ? 'text' : 'password'}
                  fullWidth
                  value={form.passwordPlain}
                  InputProps={{
                    readOnly: true,
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" sx={{ color: 'success.main' }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" edge="end" onClick={() => setShowCurrent((p) => !p)}>
                          {showCurrent
                            ? <VisibilityOffIcon fontSize="small" />
                            : <VisibilityIcon   fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'success.main' + '0A',
                      '& fieldset': { borderColor: 'success.main' + '60' },
                    },
                    '& input': { cursor: 'default', fontFamily: showCurrent ? 'inherit' : 'monospace' },
                  }}
                  helperText="✓ Parol mavjud — ko'rish uchun ko'zni bosing"
                  FormHelperTextProps={{ sx: { color: 'success.main' } }}
                />
              ) : (
                /* ── Unknown password: old account created before this feature ── */
                <TextField
                  label="Joriy parol"
                  fullWidth
                  value="Noma'lum"
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon fontSize="small" sx={{ color: 'warning.main' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': { bgcolor: 'warning.main' + '0A' },
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'var(--mui-palette-warning-main)',
                      fontStyle: 'italic',
                    },
                  }}
                  helperText="Eski hisob — yangi parol o'rnating ↘"
                  FormHelperTextProps={{ sx: { color: 'warning.main' } }}
                />
              )}
            </Grid>
          )}

          {/* ── New password ── */}
          <Grid item xs={12} sm={6}>
            <TextField
              label={student ? 'Yangi parol' : `${t('form.password')} *`}
              type={showNew ? 'text' : 'password'}
              fullWidth
              value={form.password}
              onChange={ch('password')}
              placeholder={student ? "O'zgartirmasangiz bo'sh qoldiring" : ''}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end" onClick={() => setShowNew((p) => !p)}>
                      {showNew ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px:3, py:2 }}>
        <Button sx={{ borderRadius:2 }} onClick={onClose}>{t('common.cancel')}</Button>
        <Button variant="contained" sx={{ borderRadius:2 }} onClick={handleSave} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : null}>
          {student ? t('common.save') : t('common.add')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── View Dialog ─────────────────────────────────────────────── */
function ViewDialog({ open, onClose, student }) {
  const { t } = useTranslation();
  if (!student) return null;
  const idx    = student.name.charCodeAt(0) % PALETTE.length;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontWeight:700 }}>
        {t('students.studentInfo')}
        <IconButton size="small" onClick={onClose}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ textAlign:'center', mb:3 }}>
          <Avatar sx={{ width:72, height:72, mx:'auto', mb:1.5, bgcolor: PALETTE[idx], fontSize:'1.8rem', fontWeight:700 }}>
            {student.name[0]}
          </Avatar>
          <Typography variant="h6" fontWeight={700}>{student.name}</Typography>
          <Chip label={student.isActive ? t('status.active') : t('status.inactive')}
            color={student.isActive ? 'success' : 'error'} size="small" sx={{ mt:0.5 }} />
        </Box>
        <Stack spacing={1.5}>
          {student.email && (
            <Box sx={{ display:'flex', alignItems:'center', gap:1.5, p:1.5, bgcolor:'background.default', borderRadius:2 }}>
              <EmailIcon fontSize="small" sx={{ color:'primary.main' }} />
              <Box>
                <Typography variant="caption" color="text.secondary">Email</Typography>
                <Typography variant="body2" fontWeight={600}>{student.email}</Typography>
              </Box>
            </Box>
          )}
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5, p:1.5, bgcolor:'background.default', borderRadius:2 }}>
            <PhoneIcon fontSize="small" sx={{ color:'primary.main' }} />
            <Box>
              <Typography variant="caption" color="text.secondary">{t('form.phone')}</Typography>
              <Typography variant="body2" fontWeight={600}>{student.phone}</Typography>
            </Box>
          </Box>
          <Box sx={{ p:1.5, bgcolor:'background.default', borderRadius:2 }}>
            <Typography variant="caption" color="text.secondary">{t('students.joinedDate')}</Typography>
            <DateBadge iso={student.createdAt} />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px:3, py:1.5 }}>
        <Button sx={{ borderRadius:2 }} onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function AdminStudents() {
  const { t } = useTranslation();

  const { data, isLoading } = useGetUsersQuery({ role: 'student', limit: 200 });
  const students = data?.data ?? [];

  const [createUser, { isLoading: creating, error: createErr }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating, error: updateErr }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: deleting }]                   = useDeleteUserMutation();
  const [setActive]                                             = useSetUserActiveMutation();

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [addOpen, setAddOpen]         = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [viewItem, setViewItem]       = useState(null);
  const [delId, setDelId]             = useState(null);
  const [page, setPage]               = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  const filtered = useMemo(() => students.filter((s) => {
    const q = search.toLowerCase();
    const matchName   = s.name.toLowerCase().includes(q) || (s.phone ?? '').includes(q) || (s.email ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? s.isActive : !s.isActive);
    return matchName && matchStatus;
  }), [students, search, statusFilter]);

  const paged       = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const activeCount = students.filter((s) => s.isActive).length;

  const apiErrMsg = (err) => err?.data?.message || err?.data?.error || '';

  const handleAdd = async (form) => {
    try {
      await createUser({ ...form, role: 'student' }).unwrap();
      setAddOpen(false);
    } catch { /* error shown in dialog */ }
  };

  const handleEdit = async (form) => {
    try {
      await updateUser({ id: editItem._id, ...form }).unwrap();
      setEditItem(null);
    } catch { /* error shown in dialog */ }
  };

  const handleDelete = async () => {
    try {
      await deleteUser(delId).unwrap();
      setDelId(null);
    } catch { setDelId(null); }
  };

  const color = (name) => PALETTE[name.charCodeAt(0) % PALETTE.length];

  return (
    <Box>
      <PageHeader
        icon={<PeopleIcon />}
        title={t('students.management')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius:2 }} onClick={() => setAddOpen(true)}>
            {t('dialog.addStudent')}
          </Button>
        }
      />

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: t('common.total'),    value: students.length,                  color: '#1976D2' },
          { label: t('status.active'),   value: activeCount,                      color: '#10B981' },
          { label: t('status.inactive'), value: students.length - activeCount,    color: '#EF4444' },
        ].map((s, i) => (
          <Grid item xs={4} key={s.label}>
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.06, duration:0.22 }}>
              <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius:2 }}>
                <CardContent sx={{ p:1, '&:last-child':{ pb:1 }, textAlign:'center' }}>
                  <Typography variant="subtitle1" fontWeight={800} color={s.color} lineHeight={1.2}>
                    {isLoading ? <CircularProgress size={14} /> : s.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize:'0.62rem', mt:0.15 }}>
                    {s.label}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Card elevation={0} sx={{ mb:3, border:'1px solid', borderColor:'divider' }}>
        <CardContent sx={{ py:2 }}>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2} alignItems="center">
            <TextField
              size="small" placeholder={t('students.searchPlaceholder')} value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ flex:1 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            />
            <FormControl size="small" sx={{ minWidth:150 }}>
              <InputLabel>{t('form.status')}</InputLabel>
              <Select value={statusFilter} label={t('form.status')} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                <MenuItem value="all">{t('common.all')}</MenuItem>
                <MenuItem value="active">{t('status.active')}</MenuItem>
                <MenuItem value="inactive">{t('status.inactive')}</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <Card elevation={0} sx={{ border:'1px solid', borderColor:'divider', borderRadius: 2 }}>
        <Box sx={{ overflowX:'auto' }}>
          <Table sx={{ minWidth:650 }}>
            <TableHead>
              <TableRow>
                {[t('form.student'), t('form.phone'), t('students.joined'), t('status.active'), t('common.actions')].map((h, i) => (
                  <TableCell key={h} align={i === 3 ? 'center' : i === 4 ? 'right' : 'left'}
                    sx={{ py: 1, px: 1.75, fontSize: '0.66rem', fontWeight: 600, color: 'text.disabled',
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                      borderBottom: '1px solid', borderColor: 'divider',
                      bgcolor: 'transparent', whiteSpace: 'nowrap' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4, border: 0 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && paged.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, border: 0, color: 'text.secondary' }}>
                    {t('common.noData')}
                  </TableCell>
                </TableRow>
              )}
              {paged.map((s) => (
                <TableRow key={s._id}
                  sx={{ opacity: s.isActive ? 1 : 0.6,
                    '&:hover td': { bgcolor: 'action.hover' },
                    '&:last-child td': { border: 0 },
                    transition: 'background 0.1s' }}>
                  <TableCell sx={{ py: 1.25, px: 1.75 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: color(s.name), flexShrink: 0 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{s.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{s.email || '—'}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ py: 1.25, px: 1.75 }}>
                    <Typography variant="body2" color="text.secondary">{s.phone}</Typography>
                  </TableCell>
                  <TableCell sx={{ py: 1.25, px: 1.75 }}>
                    <DateBadge iso={s.createdAt} />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title={s.isActive ? 'Faolsizlantirish' : 'Faollashtirish'}>
                      <Box onClick={() => setActive({ id: s._id, isActive: !s.isActive })}
                        sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.4, cursor: 'pointer' }}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          bgcolor: s.isActive ? '#10B981' : '#EF4444',
                          boxShadow: s.isActive
                            ? '0 0 0 3px #10B98128, 0 2px 8px #10B98150'
                            : '0 0 0 3px #EF444428, 0 2px 8px #EF444450',
                          transition: 'all .2s',
                          '&:hover': { transform: 'scale(1.1)', filter: 'brightness(1.1)' },
                          '&:active': { transform: 'scale(0.92)' },
                        }}>
                          <PowerSettingsNewIcon sx={{ fontSize: 15, color: '#fff' }} />
                        </Box>
                        <Typography sx={{ fontSize: '0.58rem', fontWeight: 700, lineHeight: 1,
                          color: s.isActive ? '#10B981' : '#EF4444' }}>
                          {s.isActive ? 'Faol' : 'Noaktiv'}
                        </Typography>
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title={t('common.view')}>
                        <IconButton size="small" onClick={() => setViewItem(s)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.edit')}>
                        <IconButton size="small" onClick={() => setEditItem(s)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('common.delete')}>
                        <IconButton size="small" color="error" onClick={() => setDelId(s._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <Divider />
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(+e.target.value); setPage(0); }}
          rowsPerPageOptions={[8, 15, 25, 50]}
          labelRowsPerPage={t('common.rowsPerPage', { defaultValue: 'Qatorlar:' })}
          sx={{ borderTop:'none' }}
        />
      </Card>

      {/* Add */}
      <StudentDialog open={addOpen} onClose={() => setAddOpen(false)} student={null}
        onSave={handleAdd} loading={creating} apiError={apiErrMsg(createErr)} />

      {/* Edit */}
      <StudentDialog open={!!editItem} onClose={() => setEditItem(null)} student={editItem}
        onSave={handleEdit} loading={updating} apiError={apiErrMsg(updateErr)} />

      {/* View */}
      <ViewDialog open={!!viewItem} onClose={() => setViewItem(null)} student={viewItem} />

      {/* Delete confirm */}
      <Dialog open={!!delId} onClose={() => setDelId(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{t('dialog.deleteTitle')}</DialogTitle>
        <DialogContent><Typography>{t('dialog.deleteText')}</Typography></DialogContent>
        <DialogActions sx={{ px:3, py:1.5 }}>
          <Button sx={{ borderRadius:2 }} onClick={() => setDelId(null)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" sx={{ borderRadius:2 }} onClick={handleDelete} disabled={deleting}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
