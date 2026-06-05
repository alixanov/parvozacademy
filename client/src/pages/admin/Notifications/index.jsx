import {
  Box, Typography, Card, CardContent, Stack, Chip, Button,
  TextField, FormControl, InputLabel, Select, MenuItem,
  Grid, Divider, List, ListItem, ListItemAvatar,
  ListItemText, Avatar, IconButton, Tooltip, CircularProgress, Alert,
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SendIcon          from '@mui/icons-material/Send';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PeopleIcon        from '@mui/icons-material/People';
import DeleteIcon        from '@mui/icons-material/Delete';
import PageHeader        from '../../../components/common/PageHeader/index.jsx';
import { useSendNotificationMutation } from '../../../features/notifications/notificationsApi.js';

export default function AdminNotifications() {
  const { t } = useTranslation();
  const [title, setTitle]     = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget]   = useState('all');
  const [sent, setSent]       = useState([]);
  const [errMsg, setErrMsg]   = useState('');

  const [sendNotification, { isLoading: sending }] = useSendNotificationMutation();

  const handleSend = async () => {
    if (!title || !message) return;
    setErrMsg('');
    try {
      await sendNotification({ title, message, target }).unwrap();
      setSent((prev) => [{
        id: String(Date.now()),
        title,
        body: message,
        target,
        sent: new Date().toLocaleString('ru-RU'),
      }, ...prev]);
      setTitle('');
      setMessage('');
    } catch (err) {
      setErrMsg(err?.data?.message ?? t('common.error'));
    }
  };

  const TARGET_LABELS = {
    all:      t('notifications.allUsers'),
    students: t('notifications.allStudents'),
    teachers: t('notifications.allTeachers'),
  };

  return (
    <Box>
      <PageHeader icon={<NotificationsIcon />} title={t('notifications.management')} />

      {errMsg && (
        <Alert severity="error" onClose={() => setErrMsg('')} sx={{ mb: 2 }}>{errMsg}</Alert>
      )}

      <Grid container spacing={3}>
        {/* Send form */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ position: 'sticky', top: 80, border: '1px solid', borderColor: 'divider' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>{t('notifications.newMessage')}</Typography>

              <Stack spacing={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('notifications.sendTo')}</InputLabel>
                  <Select value={target} label={t('notifications.sendTo')} onChange={(e) => setTarget(e.target.value)}>
                    <MenuItem value="all">{t('notifications.allUsers')}</MenuItem>
                    <MenuItem value="students">{t('notifications.allStudents')}</MenuItem>
                    <MenuItem value="teachers">{t('notifications.allTeachers')}</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label={t('notifications.title')} fullWidth size="small" value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('notifications.titlePlaceholder')}
                />

                <TextField
                  label={t('notifications.body')} fullWidth multiline rows={4} value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('notifications.bodyPlaceholder')}
                />

                {/* Preview */}
                {(title || message) && (
                  <Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: 2, color: 'primary.contrastText' }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <NotificationsIcon sx={{ fontSize: 16 }} />
                      <Typography variant="caption" fontWeight={700}>PARVOZ ACADEMY</Typography>
                    </Stack>
                    {title && <Typography variant="body2" fontWeight={700}>{title}</Typography>}
                    {message && <Typography variant="caption" sx={{ opacity: 0.9 }}>{message}</Typography>}
                  </Box>
                )}

                <Button
                  variant="contained" size="large"
                  startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                  fullWidth sx={{ borderRadius: 2 }}
                  disabled={!title || !message || sending}
                  onClick={handleSend}
                >
                  {sending ? t('notifications.sending') : t('notifications.send')}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Sent history */}
        <Grid item xs={12} md={7}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>{t('notifications.sentHistory')}</Typography>
            <Chip label={`${sent.length} ${t('notifications.countSuffix')}`} color="primary" variant="outlined" size="small" />
          </Stack>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            {sent.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <NotificationsIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.disabled">{t('notifications.noSentHistory')}</Typography>
              </Box>
            ) : (
              <List disablePadding>
                {sent.map((n, i) => (
                  <Box key={n.id}>
                    <ListItem
                      sx={{ px: 3, py: 2 }}
                      secondaryAction={
                        <Tooltip title={t('common.delete')}>
                          <IconButton edge="end" size="small" onClick={() => setSent((p) => p.filter((x) => x.id !== n.id))}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <NotificationsIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Typography variant="body2" fontWeight={700}>{n.title}</Typography>
                            <Chip
                              icon={<PeopleIcon />}
                              label={TARGET_LABELS[n.target] ?? n.target}
                              size="small" variant="outlined"
                              sx={{ height: 18, fontSize: '0.7rem' }}
                            />
                          </Stack>
                        }
                        secondary={
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ my: 0.5 }}>
                              {n.body}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">{n.sent}</Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {i < sent.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
