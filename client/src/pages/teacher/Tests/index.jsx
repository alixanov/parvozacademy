import {
  Box, Typography, Card, CardContent, Stack, Chip, Button,
  Table, TableBody, TableCell, TableHead, TableRow,
  LinearProgress, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, Select,
  MenuItem, FormControl, InputLabel, Tabs, Tab,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AddIcon        from '@mui/icons-material/Add';
import EditIcon       from '@mui/icons-material/Edit';
import BarChartIcon   from '@mui/icons-material/BarChart';
import QuizIcon       from '@mui/icons-material/Quiz';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PageHeader     from '../../../components/common/PageHeader/index.jsx';

const TESTS = [];

export default function TeacherTests() {
  const { t }               = useTranslation();
  const [tab, setTab]       = useState(0);
  const [openAdd, setOA]    = useState(false);
  const [openRes, setOR]    = useState(null);

  const upcoming  = TESTS.filter((item) => item.status === 'upcoming');
  const completed = TESTS.filter((item) => item.status === 'completed');
  const list      = tab === 0 ? upcoming : completed;

  return (
    <Box>
      <PageHeader
        icon={<QuizIcon />}
        title={t('teacher.testManagement')}
        actions={
          <Button variant="contained" startIcon={<AddIcon />} sx={{ borderRadius: 2 }} onClick={() => setOA(true)}>
            {t('teacher.newTest')}
          </Button>
        }
      />

      {/* Summary */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Card elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} color="primary.main">{upcoming.length}</Typography>
            <Typography variant="caption" color="text.secondary">{t('student.upcomingTests')}</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} color="success.main">{completed.length}</Typography>
            <Typography variant="caption" color="text.secondary">{t('student.completedTests')}</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ flex: 1, border: '1px solid', borderColor: 'divider' }}>
          <CardContent sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" fontWeight={800} color="warning.main">
              {Math.round(completed.reduce((a, item) => a + (item.results?.avgScore ?? 0), 0) / (completed.length || 1))}%
            </Typography>
            <Typography variant="caption" color="text.secondary">{t('teacher.avgScore')}</Typography>
          </CardContent>
        </Card>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`${t('teacher.scheduledTab')} (${upcoming.length})`} />
        <Tab label={`${t('teacher.conductedTab')} (${completed.length})`} />
      </Tabs>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t('teacher.testName')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('teacher.courseGroupLabel')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">{t('teacher.questions')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">{t('teacher.durationLabel')}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>{t('table.date')}</TableCell>
                {tab === 1 && <TableCell sx={{ fontWeight: 700 }} align="center">{t('teacher.resultLabel')}</TableCell>}
                <TableCell sx={{ fontWeight: 700 }} align="right">{t('teacher.action')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map((test) => (
                <TableRow key={test.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <QuizIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight={600}>{test.title}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{test.course}</Typography>
                    <Chip label={test.group} size="small" variant="outlined" color="primary" sx={{ mt: 0.25 }} />
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={600}>{test.questions}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">{test.duration}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{test.scheduled}</Typography>
                  </TableCell>
                  {tab === 1 && (
                    <TableCell align="center">
                      {test.results && (
                        <Box sx={{ minWidth: 90 }}>
                          <Typography variant="caption" fontWeight={700}
                            color={test.results.avgScore >= 70 ? 'success.main' : 'warning.main'}>
                            {test.results.avgScore}%
                          </Typography>
                          <LinearProgress
                            variant="determinate" value={test.results.avgScore}
                            color={test.results.avgScore >= 70 ? 'success' : 'warning'}
                            sx={{ height: 4, borderRadius: 2, mt: 0.5 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {test.results.passed}/{test.results.total} {t('teacher.passedLabel')}
                          </Typography>
                        </Box>
                      )}
                    </TableCell>
                  )}
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      {tab === 1 && (
                        <Tooltip title={t('teacher.viewResultsTooltip')}>
                          <IconButton size="small" color="primary" onClick={() => setOR(test)}>
                            <BarChartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title={t('common.edit')}>
                        <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add test dialog */}
      <Dialog open={openAdd} onClose={() => setOA(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{t('teacher.createTestTitle')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField label={t('teacher.testName')} fullWidth size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('form.course')}</InputLabel>
                <Select label={t('form.course')} defaultValue="Matematika (DTM)">
                  <MenuItem value="Matematika (DTM)">Matematika (DTM)</MenuItem>
                  <MenuItem value="Mat (10-sinf)">Mat (10-sinf)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('form.group')}</InputLabel>
                <Select label={t('form.group')} defaultValue="Mat-A1">
                  {['Mat-A1', 'Mat-A2', 'Mat-B1', 'Mat-10A'].map((g) => (
                    <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField label={t('teacher.questionsCount')} type="number" fullWidth size="small" defaultValue={20} />
            </Grid>
            <Grid item xs={6}>
              <TextField label={t('teacher.durationMin')} type="number" fullWidth size="small" defaultValue={30} />
            </Grid>
            <Grid item xs={12}>
              <TextField label={t('teacher.scheduleDate')} type="datetime-local" fullWidth size="small"
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button sx={{ borderRadius: 2 }} onClick={() => setOA(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" sx={{ borderRadius: 2 }} onClick={() => setOA(false)}>{t('teacher.create')}</Button>
        </DialogActions>
      </Dialog>

      {/* Results dialog */}
      <Dialog open={!!openRes} onClose={() => setOR(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{t('teacher.testResultsTitle')}</DialogTitle>
        <DialogContent>
          {openRes?.results && (
            <Box>
              <Typography variant="body1" fontWeight={700} sx={{ mb: 2 }}>{openRes.title}</Typography>
              {[
                { label: t('teacher.avgScore'),          value: `${openRes.results.avgScore}%`, color: 'primary.main' },
                { label: t('teacher.passedCount'),       value: openRes.results.passed,         color: 'success.main' },
                { label: t('teacher.failedCount'),       value: openRes.results.failed,         color: 'error.main' },
                { label: t('teacher.totalParticipants'), value: openRes.results.total,          color: 'text.primary' },
              ].map((r) => (
                <Stack key={r.label} direction="row" justifyContent="space-between" sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">{r.label}</Typography>
                  <Typography variant="body2" fontWeight={700} color={r.color}>{r.value}</Typography>
                </Stack>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" sx={{ borderRadius: 2 }} onClick={() => setOR(null)}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
