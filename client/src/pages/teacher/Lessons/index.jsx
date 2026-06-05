import {
  Box, Typography, Card, CardContent, Stack, Chip, Button,
  Table, TableBody, TableCell, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, IconButton,
  Tooltip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid,
} from '@mui/material';
import { useState }       from 'react';
import { useTranslation } from 'react-i18next';
import AddIcon         from '@mui/icons-material/Add';
import EditIcon        from '@mui/icons-material/Edit';
import PlayCircleIcon  from '@mui/icons-material/PlayCircle';
import AttachFileIcon  from '@mui/icons-material/AttachFile';
import AssignmentIcon  from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PageHeader      from '../../../components/common/PageHeader/index.jsx';
import { useGetTeacherCoursesQuery } from '../../../features/courses/coursesApi.js';
import i18n from '../../../utils/i18n.js';

const LESSONS = [];

export default function TeacherLessons() {
  const { t }    = useTranslation();
  const lang     = i18n.language === 'ru' ? 'ru' : 'uz';

  const { data: coursesRes } = useGetTeacherCoursesQuery();
  const teacherCourses = coursesRes?.data ?? [];

  const getCourseTitle = (c) => typeof c.title === 'object'
    ? (c.title[lang] ?? c.title.uz ?? c._id)
    : (c.title ?? c._id);

  const [courseFilter, setCourseFilter] = useState('');
  const [openAdd, setOpenAdd]           = useState(false);
  const [newLesson, setNewLesson]       = useState({ title: '', module: '', course: '' });

  const filtered = LESSONS.filter(
    (l) => !courseFilter || l.course === courseFilter,
  );

  const doneCount    = filtered.filter((l) => l.done).length;
  const pendingCount = filtered.filter((l) => !l.done).length;

  return (
    <Box>
      <PageHeader
        icon={<PlayCircleIcon />}
        title={t('teacher.lessonManagement')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }} onClick={() => setOpenAdd(true)}>
            {t('teacher.newLesson')}
          </Button>
        }
      />

      {/* Summary chips */}
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        <Chip icon={<CheckCircleIcon />} label={`${t('teacher.completed')}: ${doneCount}`} color="success" variant="outlined" />
        <Chip icon={<RadioButtonUncheckedIcon />} label={`${t('teacher.pending')}: ${pendingCount}`} color="default" variant="outlined" />
        <Chip label={`${t('common.total')}: ${filtered.length}`} color="primary" variant="outlined" />
      </Stack>

      {/* Filter */}
      <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ py: 2 }}>
          <FormControl size="small" sx={{ minWidth: 240 }}>
            <InputLabel>{t('teacher.filterByCourse')}</InputLabel>
            <Select value={courseFilter} label={t('teacher.filterByCourse')}
              onChange={(e) => setCourseFilter(e.target.value)}>
              <MenuItem value="">{t('teacher.allCourses')}</MenuItem>
              {teacherCourses.map((c) => (
                <MenuItem key={c._id} value={c._id}>{getCourseTitle(c)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      {/* Table */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('teacher.lessonTitle')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('nav.courses')} / {t('teacher.moduleLabel')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">{t('teacher.video')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">{t('teacher.hwShort')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">{t('table.status')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">{t('teacher.students')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">{t('teacher.action')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id} hover sx={{ opacity: l.done ? 1 : 0.75 }}>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                      {l.order}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{l.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{l.course}</Typography>
                    <Typography variant="caption" color="text.disabled">{l.module}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    {l.video
                      ? <PlayCircleIcon fontSize="small" color="primary" />
                      : <Typography variant="caption" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell align="center">
                    {l.homework
                      ? <AssignmentIcon fontSize="small" color="warning" />
                      : <Typography variant="caption" color="text.disabled">—</Typography>}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={l.done ? t('teacher.completed') : t('teacher.pending')}
                      size="small"
                      color={l.done ? 'success' : 'default'}
                      variant={l.done ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" color={l.done ? 'text.primary' : 'text.disabled'}>
                      {l.done ? l.students : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('common.edit')}>
                      <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add lesson dialog */}
      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{t('teacher.addLesson')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('nav.courses')}</InputLabel>
                <Select value={newLesson.course} label={t('nav.courses')}
                  onChange={(e) => setNewLesson((p) => ({ ...p, course: e.target.value }))}>
                  {teacherCourses.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{getCourseTitle(c)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField label={t('teacher.moduleLabel')} fullWidth size="small" value={newLesson.module}
                onChange={(e) => setNewLesson((p) => ({ ...p, module: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <TextField label={t('teacher.lessonTitle')} fullWidth size="small" value={newLesson.title}
                onChange={(e) => setNewLesson((p) => ({ ...p, title: e.target.value }))} />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" startIcon={<AttachFileIcon />} fullWidth sx={{ borderRadius: 2 }}>
                {t('common.upload')}
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button sx={{ borderRadius: 2 }} onClick={() => setOpenAdd(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" sx={{ borderRadius: 2 }} onClick={() => setOpenAdd(false)}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
