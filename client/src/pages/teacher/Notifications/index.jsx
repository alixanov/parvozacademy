import {
  Box, Typography, Card, List, ListItem,
  ListItemAvatar, ListItemText, Avatar, IconButton, Chip,
  Stack, Button, Tooltip, Divider, CircularProgress,
} from '@mui/material';
import { useTranslation }          from 'react-i18next';
import AssignmentIcon              from '@mui/icons-material/Assignment';
import QuizIcon                    from '@mui/icons-material/Quiz';
import PersonAddIcon               from '@mui/icons-material/PersonAdd';
import NotificationsIcon           from '@mui/icons-material/Notifications';
import DeleteIcon                  from '@mui/icons-material/Delete';
import DoneAllIcon                 from '@mui/icons-material/DoneAll';
import PageHeader                  from '../../../components/common/PageHeader/index.jsx';
import {
  useGetNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
} from '../../../features/notifications/notificationsApi.js';

/* ─── type → icon / color config ─────────────────────────────────────────── */

const TYPE_CFG = {
  hw:      { icon: <AssignmentIcon />,     color: '#1976D2' },
  test:    { icon: <QuizIcon />,           color: '#7C3AED' },
  student: { icon: <PersonAddIcon />,      color: '#10B981' },
  system:  { icon: <NotificationsIcon />,  color: '#F59E0B' },
};

function typeCfg(type) {
  return TYPE_CFG[type] ?? TYPE_CFG.system;
}

/* ─── time formatter ─────────────────────────────────────────────────────── */

function fmtTime(d) {
  if (!d) return '';
  const date = new Date(d);
  const diff  = (Date.now() - date.getTime()) / 1000;
  if (diff < 60)    return 'только что';
  if (diff < 3600)  return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

/* ─── component ───────────────────────────────────────────────────────────── */

export default function TeacherNotifications() {
  const { t } = useTranslation();

  /* ── RTK Query ────────────────────────────────────────────────────────── */
  const { data: res, isLoading } = useGetNotificationsQuery({ limit: 50 });
  const [markRead]               = useMarkReadMutation();
  const [markAllRead]            = useMarkAllReadMutation();
  const [deleteNotif]            = useDeleteNotificationMutation();

  /* backend returns { data: [...] } or array directly */
  const notifs = Array.isArray(res?.data) ? res.data
               : Array.isArray(res)       ? res
               : [];

  const unread = notifs.filter((n) => !n.read).length;

  /* ─────────────────────────────────────────────────────────────────────── */

  return (
    <Box>
      <PageHeader
        icon={<NotificationsIcon />}
        title={t('teacher.notifications')}
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center">
            {unread > 0 && (
              <Chip label={`${unread} ${t('teacher.newLabel')}`} color="error" size="small" />
            )}
            {unread > 0 && (
              <Button
                startIcon={<DoneAllIcon />}
                size="small"
                onClick={() => markAllRead()}
                sx={{ borderRadius: 2 }}
              >
                {t('teacher.markAllRead')}
              </Button>
            )}
          </Stack>
        }
      />

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {isLoading && (
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      )}

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {!isLoading && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
          <List disablePadding>
            {notifs.map((n, i) => {
              const cfg   = typeCfg(n.type);
              /* backend may use n.message or n.body */
              const body  = n.body ?? n.message ?? '';
              const nid   = String(n._id ?? n.id);

              return (
                <Box key={nid}>
                  <ListItem
                    sx={{
                      px: 3,
                      py: 1.75,
                      bgcolor: n.read ? 'transparent' : 'action.selected',
                      cursor: 'pointer',
                      transition: 'background .2s',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    onClick={() => !n.read && markRead(nid)}
                    secondaryAction={
                      <Tooltip title={t('teacher.deleteNotif')}>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => { e.stopPropagation(); deleteNotif(nid); }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: cfg.color + '18', color: cfg.color }}>
                        {cfg.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" fontWeight={n.read ? 400 : 700}>
                            {n.title}
                          </Typography>
                          {!n.read && (
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0 }} />
                          )}
                        </Stack>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {body}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            {fmtTime(n.createdAt ?? n.time)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {i < notifs.length - 1 && <Divider component="li" />}
                </Box>
              );
            })}

            {notifs.length === 0 && (
              <ListItem>
                <ListItemText
                  primary={
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <NotificationsIcon sx={{ fontSize: 52, color: 'text.disabled', mb: 1.5, display: 'block', mx: 'auto' }} />
                      <Typography variant="body2" color="text.disabled">
                        {t('teacher.noNotifications')}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            )}
          </List>
        </Card>
      )}
    </Box>
  );
}
