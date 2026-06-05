/**
 * DateBadge — professional date display component
 *
 * <DateBadge iso="2024-01-15T10:00:00Z" />
 *   → "15 yan 2024"  (or "3 kun oldin" if recent)
 *   → tooltip: full date + time
 *
 * <DueDateBadge iso="2024-01-15T10:00:00Z" />
 *   → colored urgency chip (overdue / soon / ok)
 */

import { Box, Tooltip, Typography, Stack } from '@mui/material';
import CalendarTodayIcon  from '@mui/icons-material/CalendarToday';
import AccessTimeIcon     from '@mui/icons-material/AccessTime';
import AlarmIcon          from '@mui/icons-material/Alarm';
import CheckCircleIcon    from '@mui/icons-material/CheckCircle';

const MON = ['yan','feb','mar','apr','may','iyn','iyl','avg','sen','okt','noy','dek'];

/** Returns human-friendly parts from an ISO string */
function parse(iso) {
  if (!iso) return null;
  const d   = new Date(iso);
  if (isNaN(d)) return null;
  const now  = new Date();

  // strip time — compare calendar days
  const dDay  = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const nDay  = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff  = Math.round((nDay - dDay) / 86400000); // positive = past

  const day   = d.getDate();
  const mon   = MON[d.getMonth()];
  const yr    = d.getFullYear();
  const hh    = String(d.getHours()).padStart(2, '0');
  const mm    = String(d.getMinutes()).padStart(2, '0');

  const full  = `${day} ${mon} ${yr}, ${hh}:${mm}`;
  const short = `${day} ${mon} ${yr}`;

  return { d, diff, full, short, day, mon, yr };
}

/** Relative label for past dates */
function relLabel(diff) {
  if (diff === 0)  return 'Bugun';
  if (diff === 1)  return 'Kecha';
  if (diff <= 6)   return `${diff} kun oldin`;
  if (diff <= 29)  return `${Math.floor(diff / 7)} hafta oldin`;
  if (diff <= 364) return `${Math.floor(diff / 30)} oy oldin`;
  return `${Math.floor(diff / 365)} yil oldin`;
}

// ─── DateBadge ────────────────────────────────────────────────────────────────
/**
 * For "when it happened" dates (createdAt, joinedAt, paidAt).
 * Shows relative time if < 30 days, else absolute date.
 * Tooltip always shows full date+time.
 */
export function DateBadge({ iso, showTime = false }) {
  const p = parse(iso);
  if (!p) return <Typography variant="caption" color="text.disabled">—</Typography>;

  const isRecent = p.diff >= 0 && p.diff <= 29;
  const label    = isRecent ? relLabel(p.diff) : p.short;

  const isToday     = p.diff === 0;
  const textColor   = isToday ? 'success.main' : 'text.secondary';

  return (
    <Tooltip title={p.full} arrow placement="top">
      <Stack
        direction="row" spacing={0.4} alignItems="center"
        sx={{ display: 'inline-flex', cursor: 'default', userSelect: 'none' }}
      >
        {isRecent
          ? <AccessTimeIcon  sx={{ fontSize: 11, color: isToday ? 'success.main' : 'text.disabled', flexShrink: 0 }} />
          : <CalendarTodayIcon sx={{ fontSize: 11, color: 'text.disabled', flexShrink: 0 }} />
        }
        <Typography
          variant="caption"
          color={textColor}
          sx={{ fontSize: '0.72rem', fontWeight: isToday ? 700 : 400, lineHeight: 1 }}
        >
          {label}
        </Typography>
      </Stack>
    </Tooltip>
  );
}

// ─── DueDateBadge ─────────────────────────────────────────────────────────────
/**
 * For deadline / payment due dates.
 * Color-coded: overdue=red, today=orange, ≤3d=yellow, ≤7d=blue, future=gray, paid=green.
 */
export function DueDateBadge({ iso, paid = false }) {
  if (paid) {
    return (
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.4,
        px: 0.75, py: 0.2, borderRadius: 1,
        bgcolor: '#10B98112',
      }}>
        <CheckCircleIcon sx={{ fontSize: 10, color: '#10B981' }} />
        <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color: '#10B981', lineHeight: 1 }}>
          To'landi
        </Typography>
      </Box>
    );
  }

  const p = parse(iso);
  if (!p) return <Typography variant="caption" color="text.disabled">—</Typography>;

  // diff is days from today: positive = past (overdue), negative = future
  const days = p.diff; // positive = overdue

  let label, bg, color, Icon;

  if (days > 7)        { label = `${days}k kechikdi`;      bg = '#EF444414'; color = '#EF4444'; Icon = AlarmIcon; }
  else if (days > 0)   { label = `${days}k kechikdi`;      bg = '#EF444414'; color = '#EF4444'; Icon = AlarmIcon; }
  else if (days === 0) { label = 'Bugun';                   bg = '#F59E0B14'; color = '#D97706'; Icon = AlarmIcon; }
  else if (-days <= 3) { label = `${-days}k qoldi`;        bg = '#F59E0B14'; color = '#D97706'; Icon = AccessTimeIcon; }
  else if (-days <= 7) { label = `${-days}k qoldi`;        bg = '#3B82F614'; color = '#3B82F6'; Icon = CalendarTodayIcon; }
  else                 { label = p.short;                   bg = '#94A3B810'; color = '#64748B'; Icon = CalendarTodayIcon; }

  return (
    <Tooltip title={p.full} arrow placement="top">
      <Box sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.4,
        px: 0.75, py: 0.2, borderRadius: 1, bgcolor: bg,
        cursor: 'default', userSelect: 'none',
      }}>
        <Icon sx={{ fontSize: 10, color }} />
        <Typography variant="caption" sx={{ fontSize: '0.68rem', fontWeight: 700, color, lineHeight: 1 }}>
          {label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

// ─── DateRangeBadge ───────────────────────────────────────────────────────────
/**
 * For period ranges (periodStart – periodEnd).
 * Compact: "1 yan – 31 yan 2024"
 */
export function DateRangeBadge({ from, to }) {
  const pFrom = parse(from);
  const pTo   = parse(to);
  if (!pFrom && !pTo) return <Typography variant="caption" color="text.disabled">—</Typography>;

  const sameYear  = pFrom && pTo && pFrom.yr === pTo.yr;
  const fromLabel = pFrom ? `${pFrom.day} ${pFrom.mon}${!sameYear ? ` ${pFrom.yr}` : ''}` : '?';
  const toLabel   = pTo   ? `${pTo.day} ${pTo.mon} ${pTo.yr}` : '?';
  const full      = `${pFrom?.full ?? '?'} → ${pTo?.full ?? '?'}`;

  return (
    <Tooltip title={full} arrow placement="top">
      <Stack
        direction="row" spacing={0.4} alignItems="center"
        sx={{ display: 'inline-flex', cursor: 'default', userSelect: 'none' }}
      >
        <CalendarTodayIcon sx={{ fontSize: 11, color: 'text.disabled', flexShrink: 0 }} />
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', lineHeight: 1 }}>
          {fromLabel}
          <Typography component="span" color="text.disabled" sx={{ mx: 0.3 }}>–</Typography>
          {toLabel}
        </Typography>
      </Stack>
    </Tooltip>
  );
}

// ─── default export (most common) ─────────────────────────────────────────────
export default DateBadge;
