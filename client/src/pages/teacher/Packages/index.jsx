import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Box, Typography, Stack, Button,
  CircularProgress, Alert, Grid,
} from '@mui/material';
import EditIcon        from '@mui/icons-material/Edit';
import InventoryIcon   from '@mui/icons-material/Inventory';
import PeopleIcon      from '@mui/icons-material/People';
import LockIcon        from '@mui/icons-material/Lock';
import i18n from '../../../utils/i18n.js';
import { useGetMyPackagesQuery } from '../../../features/packages/packagesApi.js';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function pTitle(pkg) {
  if (!pkg?.title) return '—';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const t = pkg.title;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '—';
  return t ?? '—';
}
function cTitle(c) {
  if (!c?.title) return '';
  const lang = i18n.language === 'ru' ? 'ru' : 'uz';
  const t = c.title;
  if (typeof t === 'object') return t[lang] ?? t.uz ?? t.ru ?? '';
  return t ?? '';
}

const STATUS_CFG = {
  draft:     { label: 'Qoralama',  bg: '#F9FAFB', color: '#6B7280', dot: '#9CA3AF' },
  published: { label: 'Nashr',     bg: '#F0FDF4', color: '#15803D', dot: '#10B981' },
  archived:  { label: 'Arxiv',     bg: '#FFF7ED', color: '#C2410C', dot: '#F59E0B' },
};

const StatusPill = ({ status }) => {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.draft;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5,
      px: 1, py: 0.3, borderRadius: 5, bgcolor: cfg.bg, color: cfg.color, fontSize: '0.7rem', fontWeight: 700 }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.dot }} />
      {cfg.label}
    </Box>
  );
};

const PALETTE = ['#7C3AED', '#1976D2', '#10B981', '#F59E0B', '#EF4444', '#0891B2'];

/* ── Package Card ────────────────────────────────────────────────────────── */
function PackageCard({ pkg, color }) {
  const navigate = useNavigate();
  return (
    <Box sx={{
      borderRadius: 2.5, overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 0 0 1px #F1F5F9',
      bgcolor: '#fff',
      transition: 'box-shadow 0.18s',
      '&:hover': { boxShadow: `0 4px 20px rgba(0,0,0,0.10), 0 0 0 1px ${color}30` },
      cursor: 'pointer',
    }}
      onClick={() => navigate(`/teacher/packages/${pkg._id}`)}
    >
      {/* Color top bar */}
      <Box sx={{ height: 4, bgcolor: color }} />

      <Box sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="flex-start" mb={1.5}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', lineHeight: 1.3, mb: 0.3 }}>
              {pTitle(pkg)}
            </Typography>
            {pkg.course && (
              <Typography sx={{ fontSize: '0.73rem', color: '#94A3B8' }}>{cTitle(pkg.course)}</Typography>
            )}
          </Box>
          <StatusPill status={pkg.status} />
        </Stack>

        {/* Stats row */}
        <Stack direction="row" spacing={1.5} mb={1.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: color + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <InventoryIcon sx={{ fontSize: 12, color }} />
            </Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
              {pkg.modules?.length ?? 0} modul
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <Box sx={{ width: 20, height: 20, borderRadius: 1, bgcolor: '#EFF6FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PeopleIcon sx={{ fontSize: 12, color: '#1976D2' }} />
            </Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B' }}>
              {pkg.purchaseCount ?? 0} o'quvchi
            </Typography>
          </Box>
        </Stack>

        {/* Price */}
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: '#F8FAFF',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>Narx</Typography>
          <Typography sx={{ fontSize: '0.92rem', fontWeight: 800, color: '#1D4ED8' }}>
            {(pkg.price?.amount ?? 0).toLocaleString()} {pkg.price?.currency ?? 'UZS'}
          </Typography>
        </Box>

        {/* Actions */}
        <Stack direction="row" spacing={0.75} onClick={(e) => e.stopPropagation()}>
          <Button size="small" variant="contained" fullWidth
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700,
              fontSize: '0.82rem', bgcolor: color, '&:hover': { filter: 'brightness(0.92)' },
              boxShadow: `0 2px 8px ${color}40` }}
            startIcon={<EditIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate(`/teacher/packages/${pkg._id}`)}>
            Modullar qo'shish
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function TeacherPackages() {
  const { data: res, isLoading } = useGetMyPackagesQuery();

  const packages = res?.data ?? [];

  return (
    <Box sx={{ maxWidth: 980, mx: 'auto', py: { xs: 2, md: 3.5 }, px: { xs: 2, md: 0 } }}>

      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#7C3AED',
          display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px #7C3AED40' }}>
          <InventoryIcon sx={{ fontSize: 21, color: '#fff' }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography fontWeight={800} fontSize="1.2rem">Individual Paketlar</Typography>
          <Typography variant="caption" color="text.secondary">
            O'quv paketlaringizni boshqaring va modullar qo'shing
          </Typography>
        </Box>
      </Stack>

      {/* Info banner */}
      <Box sx={{ mb: 3, p: 2, borderRadius: 2.5, bgcolor: '#F8F5FF',
        border: '1px solid #EDE9FE', display: 'flex', gap: 1.5 }}>
        <LockIcon sx={{ fontSize: 20, color: '#7C3AED', flexShrink: 0, mt: 0.1 }} />
        <Box>
          <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#6D28D9', mb: 0.25 }}>
            Paket qanday ishlaydi?
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: '#7C3AED', lineHeight: 1.6 }}>
            Admin sizga paket yaratib beradi. Siz har bir paketga modullar qo'shasiz:
            tavsif + fayl (PDF/Word) + YouTube havolasi. Paket nashr etilgach, admin o'quvchilarga kirish huquqi beradi.
          </Typography>
        </Box>
      </Box>

      {isLoading ? (
        <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress sx={{ color: '#CBD5E1' }} /></Box>
      ) : packages.length === 0 ? (
        /* ── Empty state: no packages assigned yet ── */
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Box sx={{ width: 64, height: 64, borderRadius: 3, bgcolor: '#F3E8FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <InventoryIcon sx={{ fontSize: 30, color: '#7C3AED' }} />
          </Box>
          <Typography fontWeight={700} mb={0.5}>Hali paket yo'q</Typography>
          <Typography variant="body2" color="text.secondary" maxWidth={340} mx="auto">
            Admin sizga paket yuklagach, bu yerda ko'rinadi. Admin bilan bog'laning.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {packages.map((pkg, i) => {
            const color = PALETTE[i % PALETTE.length];
            return (
              <Grid item xs={12} sm={6} md={4} key={pkg._id}>
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.06 }}>
                  <PackageCard pkg={pkg} color={color} />
                </motion.div>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
