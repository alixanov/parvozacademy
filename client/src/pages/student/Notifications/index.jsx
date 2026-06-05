import {
  Box, Typography, Card, CardContent, Stack, Chip, Avatar,
  Button, Divider, IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import { useState, useMemo } from 'react';
import { useNavigate }       from 'react-router-dom';
import { useTranslation }    from 'react-i18next';
import NotificationsIcon     from '@mui/icons-material/Notifications';
import AssignmentIcon        from '@mui/icons-material/Assignment';
import EventIcon             from '@mui/icons-material/Event';
import PaymentIcon           from '@mui/icons-material/Payment';
import TrendingUpIcon        from '@mui/icons-material/TrendingUp';
import DoneAllIcon           from '@mui/icons-material/DoneAll';
import DeleteOutlineIcon     from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon      from '@mui/icons-material/ArrowForward';
import AlarmIcon             from '@mui/icons-material/Alarm';
import WarningAmberIcon      from '@mui/icons-material/WarningAmber';
import CheckCircleIcon       from '@mui/icons-material/CheckCircle';
import HourglassTopIcon      from '@mui/icons-material/HourglassTop';
import CalendarMonthIcon     from '@mui/icons-material/CalendarMonth';
import CampaignIcon          from '@mui/icons-material/Campaign';
import PageHeader            from '../../../components/common/PageHeader/index.jsx';
import {
  useGetNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
} from '../../../features/notifications/notificationsApi.js';
import { useGetMyPaymentsQuery } from '../../../features/payments/paymentsApi.js';

/* ── helpers ──────────────────────────────────────────────────────────────── */

/** Format "YYYY-MM" using browser Intl (locale-aware) */
function fmtMonth(ym, lang = 'uz') {
  if (!ym) return '—';
  const [y, m] = ym.split('-');
  if (!y || !m) return ym;
  const locale = lang === 'ru' ? 'ru-RU' : 'uz-UZ';
  const name = new Date(+y, +m - 1, 1).toLocaleDateString(locale, { month: 'long' });
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}

function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function daysFrom(iso) {
  if (!iso) return null;
  return Math.ceil((new Date(iso) - new Date()) / 86400000);
}

/** Locale-aware time-ago string */
function timeAgo(iso, lang = 'uz') {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'ru' ? 'Сейчас' : 'Hozir';
  if (mins < 60) return lang === 'ru' ? `${mins} мин. назад` : `${mins} daqiqa oldin`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === 'ru' ? `${hrs} ч. назад` : `${hrs} soat oldin`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return lang === 'ru' ? `${days} дн. назад` : `${days} kun oldin`;
  return fmtDate(iso);
}

/* ── icon & color maps ───────────────────────────────────────────────────── */
const CATEGORY_BASE = {
  homework:     { Icon: AssignmentIcon,    color: '#1976D2', route: '/student/homework'  },
  payment:      { Icon: PaymentIcon,       color: '#7C3AED', route: '/student/payments'  },
  test:         { Icon: TrendingUpIcon,    color: '#10B981', route: '/student/tests'     },
  attendance:   { Icon: EventIcon,         color: '#F59E0B', route: '/student/schedule'  },
  system:       { Icon: NotificationsIcon, color: '#64748B', route: null                 },
  announcement: { Icon: CampaignIcon,      color: '#1976D2', route: null                 },
};

/** Build CATEGORY_CFG with translated action labels */
function buildCategoryCfg(t) {
  return {
    homework:     { ...CATEGORY_BASE.homework,     action: t('student.viewHomework')  },
    payment:      { ...CATEGORY_BASE.payment,      action: t('student.viewPayments')  },
    test:         { ...CATEGORY_BASE.test,         action: t('student.viewResults')   },
    attendance:   { ...CATEGORY_BASE.attendance,   action: t('student.goSchedule')    },
    system:       { ...CATEGORY_BASE.system,       action: null                       },
    announcement: { ...CATEGORY_BASE.announcement, action: null                       },
  };
}

const TYPE_ICON = {
  urgent:  { Icon: AlarmIcon,         color: '#EF4444' },
  warning: { Icon: WarningAmberIcon,  color: '#F59E0B' },
  success: { Icon: CheckCircleIcon,   color: '#10B981' },
  info:    { Icon: CalendarMonthIcon, color: '#1976D2' },
};

/* ═══════════════════════════════════════════════════════════════════════════
   NOTIFICATION CARD
═══════════════════════════════════════════════════════════════════════════ */
function NotifCard({ n, onRead, onDelete, onNavigate }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';

  const isVirtual = n.isVirtual;
  const categoryCfg = buildCategoryCfg(t);
  const catCfg  = categoryCfg[n.category] ?? categoryCfg.system;
  const typeCfg = TYPE_ICON[n.type] ?? TYPE_ICON.info;

  const useTypeColor = (n.category === 'payment' || isVirtual) && (n.type === 'urgent' || n.type === 'warning');
  const iconColor   = useTypeColor ? typeCfg.color : catCfg.color;
  const IconComp    = useTypeColor ? typeCfg.Icon  : catCfg.Icon;

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: n.isRead ? 'transparent' : (
          n.type === 'urgent' ? '#EF444406' :
          n.type === 'warning' ? '#F59E0B06' :
          'primary.main' + '06'
        ),
        cursor: 'pointer',
        transition: 'background-color 0.15s',
        '&:hover': { bgcolor: 'action.hover' },
        borderLeft: !n.isRead ? `3px solid ${iconColor}` : '3px solid transparent',
      }}
      onClick={() => {
        if (!n.isRead && !isVirtual) onRead(n._id);
        if (catCfg.route) onNavigate(catCfg.route);
      }}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Avatar sx={{ bgcolor: iconColor + '18', color: iconColor, width: 40, height: 40, flexShrink: 0 }}>
          <IconComp sx={{ fontSize: 20 }} />
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
            <Typography variant="subtitle2" fontWeight={n.isRead ? 500 : 700} sx={{ lineHeight: 1.4 }}>
              {n.title}
            </Typography>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexShrink: 0 }}>
              {!n.isRead && (
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: iconColor }} />
              )}
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {timeAgo(n.createdAt, lang)}
              </Typography>
              {!isVirtual && (
                <Tooltip title={t('student.deleteNotif')}>
                  <IconButton size="small"
                    onClick={(e) => { e.stopPropagation(); onDelete(n._id); }}
                    sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}>
                    <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.6 }}>
            {n.message}
          </Typography>

          {catCfg.route && catCfg.action && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
              <Typography variant="caption" fontWeight={700}
                color={useTypeColor ? iconColor : 'primary.main'}>
                {catCfg.action}
              </Typography>
              <ArrowForwardIcon sx={{ fontSize: 12, color: useTypeColor ? iconColor : 'primary.main' }} />
            </Stack>
          )}

          {isVirtual && (
            <Chip label={t('student.notifPaymentBadge')} size="small" variant="outlined"
              sx={{ mt: 1, height: 18, fontSize: '0.62rem', borderColor: iconColor, color: iconColor }} />
          )}
        </Box>
      </Stack>
    </Box>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════════════════ */
export default function StudentNotifications() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';

  /* ── Real notifications ── */
  const { data: notifRes, isLoading } = useGetNotificationsQuery({ limit: 50 });
  const realNotifs = notifRes?.data ?? [];

  const [markRead]    = useMarkReadMutation();
  const [markAll]     = useMarkAllReadMutation();
  const [deleteNotif] = useDeleteNotificationMutation();

  /* ── Payment data for virtual notifications ── */
  const { data: payRes } = useGetMyPaymentsQuery({ limit: 100 });
  const payments = payRes?.data ?? [];

  /* ── Virtual notifications derived from payments ── */
  const virtualNotifs = useMemo(() => {
    const items = [];

    const debtList = payments
      .filter((p) => p.status === 'debt' || p.status === 'partial')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    const pendingList = payments.filter((p) => p.status === 'pending');

    debtList.forEach((p) => {
      const days    = daysFrom(p.dueDate);
      const isOver  = days !== null && days < 0;
      const isSoon  = days !== null && days >= 0 && days <= 7;
      const monthStr = fmtMonth(p.month, lang);
      items.push({
        _id:       `virtual-debt-${p._id}`,
        isVirtual: true,
        type:      isOver ? 'urgent' : isSoon ? 'warning' : 'info',
        category:  'payment',
        title: isOver
          ? lang === 'ru'
            ? `⚠️ Оплата за ${monthStr} просрочена!`
            : `⚠️ ${monthStr} to'lovi kechikdi!`
          : isSoon
          ? lang === 'ru'
            ? `🔔 Срок оплаты за ${monthStr} скоро истекает`
            : `🔔 ${monthStr} to'lovi muddati yaqin`
          : lang === 'ru'
          ? `📅 Ожидается оплата за ${monthStr}`
          : `📅 ${monthStr} uchun to'lov`,
        message: isOver
          ? lang === 'ru'
            ? `Срок оплаты истёк ${Math.abs(days)} дн. назад (${fmtDate(p.dueDate)}). Пожалуйста, оплатите как можно скорее.`
            : `To'lov muddati ${Math.abs(days)} kun oldin o'tib ketdi (${fmtDate(p.dueDate)}). Imkon qadar tezroq to'lovni amalga oshiring.`
          : isSoon
          ? lang === 'ru'
            ? `Срок оплаты ${days === 0 ? 'сегодня' : `через ${days} дн.`} (${fmtDate(p.dueDate)}). Рекомендуем оплатить заранее.`
            : `To'lov muddati ${days === 0 ? 'bugun' : `${days} kundan so'ng`} tugaydi (${fmtDate(p.dueDate)}). Muddatidan oldin to'lash tavsiya etiladi.`
          : lang === 'ru'
          ? `Срок оплаты: ${fmtDate(p.dueDate)}. Сумма: ${new Intl.NumberFormat('ru-RU').format(p.amount ?? 0)} сум.`
          : `To'lov muddati: ${fmtDate(p.dueDate)}. To'lov miqdori: ${new Intl.NumberFormat('ru-RU').format(p.amount ?? 0)} so'm.`,
        isRead:    false,
        createdAt: new Date().toISOString(),
      });
    });

    pendingList.forEach((p) => {
      const monthStr = fmtMonth(p.month, lang);
      items.push({
        _id:       `virtual-pending-${p._id}`,
        isVirtual: true,
        type:      'info',
        category:  'payment',
        title: lang === 'ru'
          ? `⏳ Оплата за ${monthStr} проверяется`
          : `⏳ ${monthStr} to'lovi tekshirilmoqda`,
        message: lang === 'ru'
          ? "Администратор проверяет квитанцию. Обычно это занимает до 24 часов. После подтверждения статус изменится на «Оплачено»."
          : "Administrator chekni ko'rib chiqmoqda. Odatda 24 soat ichida tasdiqlanadi. Tasdiqlangach, to'lov holati 'To'langan' ga o'zgaradi.",
        isRead:    false,
        createdAt: new Date().toISOString(),
      });
    });

    return items;
  }, [payments, lang]);

  /* ── Merged list: virtual (urgent first) + real ── */
  const allNotifs = [
    ...virtualNotifs.sort((a, b) => {
      const order = { urgent: 0, warning: 1, info: 2 };
      return (order[a.type] ?? 3) - (order[b.type] ?? 3);
    }),
    ...realNotifs,
  ];

  const unreadCount = realNotifs.filter((n) => !n.isRead).length + virtualNotifs.length;

  return (
    <Box>
      <PageHeader
        icon={<NotificationsIcon />}
        title={t('student.notifications')}
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center">
            {unreadCount > 0 && (
              <Chip
                label={`${unreadCount} ${t('student.newLabel')}`}
                color="error" size="small" sx={{ fontWeight: 700 }}
              />
            )}
            {realNotifs.some((n) => !n.isRead) && (
              <Button startIcon={<DoneAllIcon />} size="small"
                onClick={() => markAll()} sx={{ borderRadius: 2 }}>
                {t('student.markAllRead')}
              </Button>
            )}
          </Stack>
        }
      />

      {isLoading && (
        <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
      )}

      {!isLoading && allNotifs.length === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography color="text.secondary" fontWeight={600}>
              {t('student.noNotifications')}
            </Typography>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
              {t('student.noNotificationsHint')}
            </Typography>
          </CardContent>
        </Card>
      )}

      {!isLoading && allNotifs.length > 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          {allNotifs.map((n, i) => (
            <Box key={n._id ?? n.id}>
              <NotifCard
                n={n}
                onRead={(id) => markRead(id)}
                onDelete={(id) => deleteNotif(id)}
                onNavigate={(route) => navigate(route)}
              />
              {i < allNotifs.length - 1 && <Divider />}
            </Box>
          ))}
        </Card>
      )}
    </Box>
  );
}
