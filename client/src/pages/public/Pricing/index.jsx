import {
  Box, Container, Grid, Typography,
  Button, Stack, useTheme, Divider, Skeleton,
} from '@mui/material';
import CheckIcon            from '@mui/icons-material/Check';
import StarIcon             from '@mui/icons-material/Star';
import LaptopIcon           from '@mui/icons-material/Laptop';
import SchoolIcon           from '@mui/icons-material/School';
import PersonIcon           from '@mui/icons-material/Person';
import HelpOutlineIcon      from '@mui/icons-material/HelpOutline';
import ArrowForwardIcon     from '@mui/icons-material/ArrowForward';
import CardGiftcardIcon     from '@mui/icons-material/CardGiftcard';
import PaymentIcon          from '@mui/icons-material/Payment';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import InventoryIcon        from '@mui/icons-material/Inventory';
import { useTranslation }   from 'react-i18next';
import { motion }           from 'framer-motion';
import { useNavigate }      from 'react-router-dom';
import i18n                 from '../../../utils/i18n.js';
import { useGetPublicTariffPlansQuery } from '../../../features/tariffs/tariffsApi.js';
import PageBanner           from '../../../components/ui/PageBanner.jsx';

/* ─── constants ─────────────────────────────────────────────────── */
const PLAN_ICON_MAP = {
  online:              LaptopIcon,
  offline:             SchoolIcon,
  individual_offline:  PersonIcon,
  individual_online:   PersonIcon,
};

/* Только эти ключи получают бейдж «бесплатный пробный урок» */
const TRIAL_IDS = new Set(['offline', 'individual_offline', 'individual_online']);

const EASING = [0.25, 0.46, 0.45, 0.94];

const fadeUp = {
  initial:     { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, margin: '-40px' },
  transition:  { duration: 0.4, ease: EASING },
};

/* ─── карточка скелетон при загрузке ────────────────────────── */
function PlanCardSkeleton() {
  return (
    <Box sx={{ borderRadius: '20px', border: '1.5px solid', borderColor: 'divider', overflow: 'hidden', height: 480 }}>
      <Skeleton variant="rectangular" height={4} />
      <Box sx={{ p: 3.5 }}>
        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
          <Skeleton variant="rounded" width={46} height={46} />
          <Skeleton variant="text" width={140} height={30} />
        </Stack>
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="60%" sx={{ mb: 2 }} />
        <Skeleton variant="text" width={100} height={50} sx={{ mb: 2 }} />
        <Stack spacing={1}>
          {[1, 2, 3, 4].map((n) => <Skeleton key={n} variant="text" />)}
        </Stack>
      </Box>
    </Box>
  );
}

/* ─── single plan card ───────────────────────────────────────── */
function PlanCard({ plan, index }) {
  const navigate  = useNavigate();
  const { t }     = useTranslation();
  const theme     = useTheme();
  const isDark    = theme.palette.mode === 'dark';
  const lang      = i18n.language === 'ru' ? 'ru' : 'uz';

  const {
    key, defaultPrice, color, popular,
    type = 'regular', teacher,
  } = plan;

  const PlanIcon = PLAN_ICON_MAP[key]
    ?? (type === 'individual_package' ? InventoryIcon : WorkspacePremiumIcon);

  const hasTrial  = TRIAL_IDS.has(key);
  const isPackage = type === 'individual_package';

  const name = lang === 'ru'
    ? (plan.name?.ru ?? '')
    : (plan.name?.uz || (plan.name?.ru ?? ''));

  const desc = lang === 'ru'
    ? (plan.description?.ru ?? '')
    : (plan.description?.uz || (plan.description?.ru ?? ''));

  const features = lang === 'ru'
    ? (plan.features ?? [])
    : (plan.featuresUz?.length ? plan.featuresUz : (plan.features ?? []));

  const priceFormatted = new Intl.NumberFormat('ru-RU').format(defaultPrice);
  const teacherName    = teacher ? (teacher.name ?? '') : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: EASING }}
      style={{ height: '100%' }}
    >
      <Box sx={{
        height: '100%',
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
        borderRadius: '20px',
        /* ── Popular: цветная рамка 2px, остальные серые 1.5px ── */
        border: popular
          ? `2px solid ${color}`
          : `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        /* ── Popular: лёгкий gradient-background для отличия ─── */
        background: popular
          ? isDark
            ? `linear-gradient(160deg, ${color}18 0%, rgba(18,20,36,1) 50%)`
            : `linear-gradient(160deg, ${color}0c 0%, #ffffff 50%)`
          : 'background.paper',
        bgcolor: popular ? undefined : 'background.paper',
        /* ── Тени ─────────────────────────────────────────────── */
        boxShadow: popular
          ? `0 24px 64px ${color}2e, 0 6px 24px ${color}16`
          : isDark ? '0 2px 16px rgba(0,0,0,0.22)' : '0 2px 16px rgba(0,0,0,0.06)',
        /* ── НЕТ CSS transform scale — он обрезает карточку ──── */
        transition: 'box-shadow 0.25s cubic-bezier(0.4,0,0.2,1), transform 0.25s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: popular
            ? `0 32px 80px ${color}38, 0 12px 28px ${color}1e`
            : isDark ? '0 16px 48px rgba(0,0,0,0.32)' : `0 16px 48px ${color}14`,
        },
      }}>

        {/* Popular — aurora glow top-right */}
        {popular && (
          <Box sx={{
            position: 'absolute', top: '-10%', right: '-8%',
            width: 260, height: 260, borderRadius: '50%',
            background: `radial-gradient(circle, ${color}2a 0%, transparent 70%)`,
            filter: 'blur(42px)',
            pointerEvents: 'none', zIndex: 0,
          }} />
        )}

        {/* Colored top accent bar — популярная толще */}
        <Box sx={{
          height: popular ? 6 : 4, flexShrink: 0,
          background: popular
            ? `linear-gradient(90deg, ${color} 0%, ${color}dd 55%, ${color}66 100%)`
            : `linear-gradient(90deg, ${color}99 0%, ${color}44 100%)`,
          position: 'relative', zIndex: 1,
        }} />

        <Box sx={{
          flex: 1, p: { xs: 3, sm: 3.5, md: popular ? 4 : 3.5 },
          display: 'flex', flexDirection: 'column',
          position: 'relative', zIndex: 1,
        }}>

          {/* ── Plan header ──────────────────────────────────────── */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                {/* Иконка — у популярной чуть крупнее */}
                <Box sx={{
                  width: popular ? 52 : 46, height: popular ? 52 : 46,
                  borderRadius: popular ? '16px' : '14px', flexShrink: 0,
                  bgcolor: color + (isDark ? '22' : '16'),
                  border: `1px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color,
                  boxShadow: popular ? `0 8px 22px ${color}30` : 'none',
                }}>
                  <PlanIcon sx={{ fontSize: popular ? 25 : 22 }} />
                </Box>

                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{
                    letterSpacing: '-0.3px',
                    fontSize: popular ? '1.15rem' : '1.05rem',
                    lineHeight: 1.25,
                  }}>
                    {name}
                  </Typography>
                  {isPackage && (
                    <Box component="span" sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.4,
                      fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.5px',
                      color, bgcolor: `${color}14`, border: `1px solid ${color}28`,
                      px: 0.8, py: 0.2, borderRadius: '5px', mt: 0.3,
                    }}>
                      <InventoryIcon sx={{ fontSize: 10 }} />
                      {lang === 'ru' ? 'Инд. пакет' : 'Ind. paket'}
                    </Box>
                  )}
                </Box>
              </Stack>

              {/* Popular badge — справа в шапке */}
              {popular && (
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 0.5,
                  background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                  color: 'white',
                  px: 1.5, py: 0.6, borderRadius: '12px', flexShrink: 0,
                  boxShadow: `0 4px 16px ${color}45`,
                  ml: 1,
                }}>
                  <StarIcon sx={{ fontSize: 13 }} />
                  <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, lineHeight: 1, letterSpacing: '0.3px' }}>
                    {t('page.pricing.popular')}
                  </Typography>
                </Box>
              )}
            </Stack>

            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {desc}
            </Typography>

            {isPackage && teacherName && (
              <Box sx={{
                mt: 1.25, display: 'inline-flex', alignItems: 'center', gap: 0.6,
                bgcolor: `${color}10`, border: `1px solid ${color}28`,
                borderRadius: '8px', px: 1.25, py: 0.4,
              }}>
                <PersonIcon sx={{ fontSize: 13, color }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color }}>
                  {teacherName}
                </Typography>
              </Box>
            )}
          </Box>

          {/* ── Price ────────────────────────────────────────────── */}
          <Box sx={{ mb: 3 }}>
            <Stack direction="row" alignItems="baseline" spacing={0.5}>
              <Typography sx={{
                fontSize: popular
                  ? { xs: '2.6rem', sm: '3rem' }
                  : { xs: '2.2rem', sm: '2.5rem' },
                fontWeight: 900, lineHeight: 1, letterSpacing: '-1.5px',
                background: `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {priceFormatted}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={500}>
                {isPackage
                  ? (lang === 'ru' ? 'сум' : "so'm")
                  : `${t('common.sum')}/${t('page.pricing.month')}`}
              </Typography>
            </Stack>

            {hasTrial && (
              <Box sx={{
                mt: 1.25, display: 'inline-flex', alignItems: 'center', gap: 0.6,
                bgcolor: '#10B98114', border: '1px solid #10B98132',
                borderRadius: '8px', px: 1.25, py: 0.45,
              }}>
                <CardGiftcardIcon sx={{ fontSize: 13, color: '#10B981' }} />
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#10B981' }}>
                  {lang === 'ru' ? 'Бесплатный пробный урок' : "Bepul sinov darsi"}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ mb: 2.5, borderColor: popular ? `${color}28` : 'divider' }} />

          {/* ── Features ─────────────────────────────────────────── */}
          <Stack spacing={1.25} sx={{ flex: 1, mb: 3 }}>
            {features.map((feat) => (
              <Box key={feat} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                <Box sx={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0, mt: 0.1,
                  bgcolor: color + (popular ? '22' : '18'),
                  border: `1px solid ${color}${popular ? '38' : '28'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color,
                }}>
                  <CheckIcon sx={{ fontSize: 11 }} />
                </Box>
                <Typography variant="body2" sx={{ lineHeight: 1.65, fontWeight: popular ? 500 : 400 }}>
                  {feat}
                </Typography>
              </Box>
            ))}
          </Stack>

          {/* ── CTA button ───────────────────────────────────────── */}
          <Button
            fullWidth size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate(
              isPackage && plan.package
                ? `/packages/${plan.package._id ?? plan.package}`
                : '/contacts'
            )}
            sx={{
              borderRadius: '12px', py: popular ? 1.7 : 1.5,
              fontWeight: 700, fontSize: '0.93rem',
              textTransform: 'none',
              position: 'relative', overflow: 'hidden',
              transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
              ...(popular ? {
                /* Solid gradient — главный призыв к действию */
                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                color: 'white', border: 'none',
                boxShadow: `0 10px 30px ${color}42`,
                '&::before': {
                  content: '""', position: 'absolute', inset: 0,
                  background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%)',
                  transform: 'translateX(-100%)',
                  transition: 'transform 0.6s',
                },
                '&:hover': {
                  boxShadow: `0 18px 44px ${color}58`,
                  transform: 'translateY(-2px)',
                  '&::before': { transform: 'translateX(100%)' },
                },
              } : {
                /* Outlined — вторичный вызов */
                bgcolor: 'transparent',
                border: `1.5px solid ${color}55`,
                color,
                '&:hover': {
                  borderColor: color,
                  bgcolor: color + '0a',
                  transform: 'translateY(-2px)',
                  boxShadow: `0 8px 22px ${color}18`,
                },
              }),
            }}
          >
            {isPackage
              ? (lang === 'ru' ? 'Подать заявку' : 'Ariza berish')
              : t('page.pricing.btnChoose')}
          </Button>
        </Box>
      </Box>
    </motion.div>
  );
}

/* ─── main page ──────────────────────────────────────────────── */
export default function Pricing() {
  const navigate = useNavigate();
  const { t }    = useTranslation();
  const theme    = useTheme();
  const isDark   = theme.palette.mode === 'dark';
  const lang     = i18n.language === 'ru' ? 'ru' : 'uz';

  const { data: plansData, isLoading: plansLoading } = useGetPublicTariffPlansQuery();
  const plans = Array.isArray(plansData?.data) ? plansData.data : [];

  return (
    <Box sx={{ mx: { xs: -2, sm: -3 } }}>

      {/* ━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <PageBanner
        eyebrow="Parvoz Academy"
        title={t('page.pricing.title')}
        subtitle={t('page.pricing.subtitle')}
        color="#D97706"
        stats={[
          { value: `${plans.length || '—'}`, label: lang === 'ru' ? 'тарифа' : 'ta tarif' },
          { value: lang === 'ru' ? 'Рассрочка' : 'Muddatli', label: lang === 'ru' ? 'без переплат' : "to'lovsiz" },
          { value: lang === 'ru' ? 'Пробный' : 'Sinov', label: lang === 'ru' ? 'урок бесплатно' : 'dars bepul' },
        ]}
        visual={
          <Stack spacing={1.25}>
            {[
              { label: lang === 'ru' ? 'Онлайн'        : 'Online',      price: '600 000',   color: '#1976D2', popular: false },
              { label: lang === 'ru' ? 'Оффлайн'       : 'Offline',     price: '800 000',   color: '#7C3AED', popular: true  },
              { label: lang === 'ru' ? 'Инд. пакет'    : 'Ind. paket',  price: '1 500 000', color: '#10B981', popular: false },
            ].map(({ label, price, color, popular }) => (
              <Box key={label} sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 2, py: 1.4,
                bgcolor: isDark ? 'rgba(255,255,255,0.04)' : 'background.default',
                border: popular ? `2px solid ${color}` : '1.5px solid',
                borderColor: popular ? color : 'divider',
                borderRadius: '12px',
                boxShadow: popular ? `0 4px 20px ${color}20` : 'none',
              }}>
                <Stack direction="row" alignItems="center" gap={1.25}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                  <Typography sx={{ fontSize: '0.84rem', fontWeight: popular ? 700 : 500, color: 'text.primary' }}>
                    {label}
                  </Typography>
                  {popular && (
                    <Box sx={{
                      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.8px',
                      color: color, bgcolor: `${color}15`,
                      border: `1px solid ${color}30`,
                      px: 0.75, py: 0.2, borderRadius: '5px', textTransform: 'uppercase',
                    }}>
                      TOP
                    </Box>
                  )}
                </Stack>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color }}>
                  {price} <Box component="span" sx={{ fontSize: '0.65rem', fontWeight: 400, color: 'text.secondary' }}>
                    {lang === 'ru' ? 'сум/мес' : "so'm/oy"}
                  </Box>
                </Typography>
              </Box>
            ))}
          </Stack>
        }
      />

      {/* ━━━━━━━━━━━━━━━━ PLAN CARDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: 'background.default' }}>
        <Container maxWidth="lg">
          {(() => {
            /*
              ─── Smart grid layout logic (Senior UX) ─────────────────
              Количество тарифов определяет сетку:
                ≤3  → все md=4   (1 ряд, 3 в ряд)
                 4  → все md=6   (2 ряда, 2+2)
                 5  → первые 3: md=4, остальные 2: md=6  (ряд 3 + ряд 2)
                 6  → все md=4   (2 ряда, 3+3)
                 7+ → md=4  (3+3+... последний ряд центрируется)

              Elevation (pt: 28px):
                Применяется ТОЛЬКО к карточкам в первом ряду (index < 3)
                И только если в первом ряду есть popular-карточка
                И сама карточка не popular.
                Второй ряд и далее — pt: 0 всегда.

              Mobile: popular всегда первая (order: -1).
              sm breakpoint не используется → нет 2+1 поломки.
              ─────────────────────────────────────────────────────────
            */
            const total = plans.length;

            const getMdSize = () => 4; // все карточки одного размера md=4

            const popularInFirstRow = plans
              .slice(0, Math.min(3, total))
              .some((p) => p.popular);

            return (
              <Grid
                container
                spacing={{ xs: 2.5, md: 3 }}
                alignItems="stretch"
              >
                {plansLoading
                  ? [1, 2, 3].map((n) => (
                      <Grid item xs={12} md={4} key={n} sx={{ display: 'flex' }}>
                        <PlanCardSkeleton />
                      </Grid>
                    ))
                  : plans.map((plan, i) => {
                      const mdSize = getMdSize(i);
                      /* Offset только в первом ряду рядом с popular */
                      const shouldOffset =
                        popularInFirstRow && !plan.popular && i < 3;

                      return (
                        <Grid
                          item
                          xs={12}
                          md={mdSize}
                          key={plan._id ?? plan.key}
                          sx={{
                            order: { xs: plan.popular ? -1 : 0, md: 0 },
                            display: 'flex',
                          }}
                        >
                          {/*
                            Wrapper: pt смещает карточку вниз внутри item.
                            height='100%' + display=flex гарантирует что карточка
                            растянется на всю оставшуюся высоту (нет пустоты снизу).
                          */}
                          <Box sx={{
                            width: '100%',
                            flex: 1,               // растягивается до высоты Grid item
                            display: 'flex',
                            flexDirection: 'column',
                            pt: { xs: 0, md: shouldOffset ? '28px' : 0 },
                          }}>
                            <PlanCard plan={plan} index={i} />
                          </Box>
                        </Grid>
                      );
                    })
                }
              </Grid>
            );
          })()}


          {/* Disclaimer */}
          {!plansLoading && (
            <Box sx={{ mt: 5, textAlign: 'center' }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={0}
                flexWrap="wrap"
                justifyContent="center"
                gap={1.5}
                divider={
                  <Box sx={{
                    display: { xs: 'none', sm: 'block' },
                    width: '1px', bgcolor: 'divider', my: 'auto', height: 14,
                  }} />
                }
              >
                {[
                  {
                    icon: <CardGiftcardIcon sx={{ fontSize: 13 }} />,
                    text: lang === 'ru'
                      ? 'Пробный урок: Оффлайн и Индивидуальный'
                      : "Sinov darsi: Offline va Individual",
                  },
                  {
                    icon: <PaymentIcon sx={{ fontSize: 13 }} />,
                    text: lang === 'ru'
                      ? 'Оплата: наличные, карта, Click, Payme'
                      : "To'lov: naqd, karta, Click, Payme",
                  },
                ].map(({ icon, text }) => (
                  <Stack key={text} direction="row" alignItems="center" spacing={0.6} sx={{ color: 'text.secondary' }}>
                    <Box sx={{ display: 'flex', color: 'text.disabled' }}>{icon}</Box>
                    <Typography variant="caption" color="text.secondary">
                      {text}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </Container>
      </Box>

      {/* ━━━━━━━━━━━━━━━━ COMPARISON STRIP ━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Box sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', borderBottom: '1px solid' }}>
        <Container maxWidth="lg">
          <Grid container>
            {[
              {
                value: lang === 'ru' ? 'Нет скрытых платежей' : "Yashirin to'lovlar yo'q",
                label: lang === 'ru' ? 'Прозрачное ценообразование' : "Shaffof narxlash",
                color: '#1976D2',
              },
              {
                value: lang === 'ru' ? 'Возврат за 30 дней' : "30 kun ichida qaytarish",
                label: lang === 'ru' ? 'Гарантия качества' : "Sifat kafolati",
                color: '#7C3AED',
              },
              {
                value: lang === 'ru' ? 'Пробный урок' : "Sinov darsi",
                label: lang === 'ru' ? 'Оффлайн и Индивидуальный' : "Offline va Individual uchun",
                color: '#10B981',
              },
              {
                value: lang === 'ru' ? '8–12 человек' : "8–12 kishi",
                label: lang === 'ru' ? 'В офлайн группах' : "Offline guruhlarda",
                color: '#F59E0B',
              },
            ].map(({ value, label, color }, i) => (
              <Grid item xs={6} md={3} key={label}>
                <motion.div {...fadeUp} transition={{ duration: 0.38, delay: i * 0.07 }}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: { xs: 3.5, md: 4.5 },
                      px: 2,
                      position: 'relative',
                      '&::after': i < 3 ? {
                        content: '""',
                        position: 'absolute',
                        right: 0, top: '20%', bottom: '20%',
                        width: '1px',
                        bgcolor: 'divider',
                      } : {},
                      borderBottom: { xs: i < 2 ? '1px solid' : 'none', md: 'none' },
                      borderColor: 'divider',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: '0.95rem', md: '1.05rem' },
                        mb: 0.5,
                        color,
                      }}
                    >
                      {value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4 }}>
                      {label}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ━━━━━━━━━━━━━━━━ FAQ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Box sx={{ py: { xs: 7, md: 9 }, bgcolor: 'background.default' }}>
        <Container maxWidth="md">
          <motion.div {...fadeUp}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography variant="h4" fontWeight={800} gutterBottom sx={{ letterSpacing: '-0.3px' }}>
                {t('page.pricing.faqTitle')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {lang === 'ru' ? 'Ответы на самые частые вопросы' : "Eng ko'p beriladigan savollarga javoblar"}
              </Typography>
            </Box>
          </motion.div>

          <Grid container spacing={2.5}>
            {[1, 2, 3, 4].map((n, i) => (
              <Grid item xs={12} sm={6} key={n}>
                <motion.div
                  {...fadeUp}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                  style={{ height: '100%' }}
                >
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      height: '100%',
                      position: 'relative', overflow: 'hidden',
                      transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.22s',
                      '&:hover': {
                        borderColor: 'primary.light',
                        boxShadow: '0 4px 16px rgba(25,118,210,0.10)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Typography sx={{
                      position: 'absolute', bottom: 8, right: 16,
                      fontSize: '4.5rem', fontWeight: 900, lineHeight: 1,
                      color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                      userSelect: 'none', pointerEvents: 'none',
                    }}>
                      {String(n).padStart(2, '0')}
                    </Typography>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.25 }}>
                      <Box sx={{
                        width: 26, height: 26,
                        borderRadius: '8px',
                        bgcolor: 'primary.main' + '14',
                        color: 'primary.main',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, mt: 0.1,
                      }}>
                        <HelpOutlineIcon sx={{ fontSize: 14 }} />
                      </Box>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ lineHeight: 1.45 }}>
                        {n === 1
                          ? (lang === 'ru'
                            ? 'Первый урок действительно бесплатный?'
                            : 'Birinchi dars rostdan ham bepulmi?')
                          : t(`page.pricing.faq_q${n}`)
                        }
                      </Typography>
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ pl: '38px', lineHeight: 1.75 }}
                    >
                      {n === 1
                        ? (lang === 'ru'
                          ? 'Да — но только для форматов Оффлайн и Индивидуальный. Первый пробный урок совершенно бесплатный, без каких-либо обязательств.'
                          : "Ha — lekin faqat Offline va Individual formatlarda. Birinchi sinov darsi mutlaqo bepul, hech qanday majburiyatsiz.")
                        : t(`page.pricing.faq_a${n}`)
                      }
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ━━━━━━━━━━━━━━━━ BOTTOM CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <Box sx={{
        bgcolor: isDark ? '#110800' : '#fffbeb',
        borderTop: '1px solid', borderColor: isDark ? 'rgba(217,119,6,0.2)' : 'rgba(217,119,6,0.15)',
        py: { xs: 5.5, md: 7 },
      }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center"
            justifyContent="space-between" gap={3}
          >
            <Box>
              <Box component="span" sx={{
                display: 'inline-flex', mb: 1.5,
                border: '1.5px solid rgba(217,119,6,0.35)',
                bgcolor: 'rgba(217,119,6,0.08)',
                color: '#D97706',
                borderRadius: '8px', px: 1.5, py: 0.5,
                fontSize: '0.67rem', fontWeight: 700,
                letterSpacing: '1.6px', textTransform: 'uppercase',
              }}>
                {lang === 'ru' ? 'Бесплатная консультация' : 'Bepul konsultatsiya'}
              </Box>
              <Typography fontWeight={800} sx={{ fontSize: { xs: '1.3rem', md: '1.55rem' }, mb: 0.75, color: 'text.primary' }}>
                {lang === 'ru' ? 'Не знаете, какой тариф выбрать?' : "Qaysi tarifni tanlashni bilmayapsizmi?"}
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.95rem', maxWidth: 460 }}>
                {lang === 'ru'
                  ? 'Поможем подобрать оптимальный формат под ваши цели и бюджет'
                  : "Maqsadingiz va byudjetingizga mos formatni tanlab beramiz"}
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={1.5} sx={{ flexShrink: 0 }}>
              <Button variant="contained" size="large" endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/contacts')}
                sx={{
                  background: 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
                  fontWeight: 700, borderRadius: 3, textTransform: 'none',
                  px: 3.5, py: 1.4, fontSize: '0.95rem',
                  boxShadow: '0 6px 22px rgba(180,83,9,0.36)',
                  position: 'relative', overflow: 'hidden',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                  '&::before': {
                    content: '""', position: 'absolute', inset: 0,
                    background: 'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.25) 50%, transparent 70%)',
                    transform: 'translateX(-100%)',
                    transition: 'transform 0.6s',
                  },
                  '&:hover': {
                    background: 'linear-gradient(135deg, #92400e 0%, #b45309 100%)',
                    boxShadow: '0 14px 36px rgba(180,83,9,0.52)',
                    transform: 'translateY(-2px)',
                    '&::before': { transform: 'translateX(100%)' },
                  },
                }}
              >
                {lang === 'ru' ? 'Получить консультацию' : 'Konsultatsiya olish'}
              </Button>
              <Button variant="outlined" size="large" onClick={() => navigate('/courses')}
                sx={{
                  borderColor: '#D97706', color: '#D97706',
                  fontWeight: 600, borderRadius: 3, textTransform: 'none',
                  px: 3, py: 1.4, fontSize: '0.93rem',
                  '&:hover': { bgcolor: 'rgba(217,119,6,0.06)', borderColor: '#b45309' },
                }}
              >
                {lang === 'ru' ? 'Смотреть курсы' : "Kurslarni ko'rish"}
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

    </Box>
  );
}
