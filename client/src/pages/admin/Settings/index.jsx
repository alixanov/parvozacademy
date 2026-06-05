import {
  Box, Typography, Card, CardContent, Stack, Switch,
  FormControlLabel, Button, TextField, Grid, Divider,
  Chip, Alert, Snackbar, IconButton, CircularProgress,
  Tooltip, InputAdornment,
} from '@mui/material';
import { useState, useContext, useEffect } from 'react';
import { useTranslation }      from 'react-i18next';
import SaveIcon          from '@mui/icons-material/Save';
import BusinessIcon      from '@mui/icons-material/Business';
import SecurityIcon      from '@mui/icons-material/Security';
import PaymentIcon       from '@mui/icons-material/Payment';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SettingsIcon      from '@mui/icons-material/Settings';
import PaletteIcon       from '@mui/icons-material/Palette';
import ImageIcon         from '@mui/icons-material/Image';
import TextFieldsIcon    from '@mui/icons-material/TextFields';
import CreditCardIcon    from '@mui/icons-material/CreditCard';
import AddIcon           from '@mui/icons-material/Add';
import DeleteIcon        from '@mui/icons-material/Delete';
import { ColorModeContext }  from '../../../app/providers.jsx';
import PageHeader            from '../../../components/common/PageHeader/index.jsx';
import {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} from '../../../features/settings/settingsApi.js';

const LS_UI      = 'parvoz_ui_settings';
const EMPTY_CARD = { bank: '', cardNumber: '', cardHolder: '' };

const DEFAULT_NOTIF = {
  paymentReminder: true, newStudent: true, testResult: true,
  homeworkSubmit: false, systemAlerts: true,
};
const DEFAULT_PAY = { payme: true, click: true, uzum: false, naqd: true };
const DEFAULT_SEC = { twoFactor: true, sessionTimeout: true };
const DEFAULT_LOGO = { type: 'text', text: 'PARVOZ ACADEMY' };

function loadUi() {
  try { return JSON.parse(localStorage.getItem(LS_UI)) || {}; } catch { return {}; }
}

function saveUi(data) {
  localStorage.setItem(LS_UI, JSON.stringify(data));
}

const SECTION = ({ icon, title, children }) => (
  <Card elevation={0} sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
    <CardContent sx={{ p: 3 }}>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
        <Box sx={{ color: 'primary.main' }}>{icon}</Box>
        <Typography variant="h6" fontWeight={700}>{title}</Typography>
      </Stack>
      {children}
    </CardContent>
  </Card>
);

export default function AdminSettings() {
  const colorMode = useContext(ColorModeContext);
  const { t }     = useTranslation();

  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  /* ── API ── */
  const { data: settingsRes, isLoading: loadingSettings } = useGetSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();
  const apiSettings = settingsRes?.data;

  /* ── Payment cards (from API) ── */
  const [payCards, setPayCards]           = useState([]);
  const [payInstruction, setPayInstruction] = useState('');

  /* ── Academy fields (from API) ── */
  const [academy, setAcademy] = useState({
    name: 'PARVOZ ACADEMY', slogan: "Bilim — kelajagingiz kaliti",
    phone: '', email: '', address: '', telegram: '', instagram: '', website: '',
  });

  /* ── Logo (UI-only, localStorage) ── */
  const ui = loadUi();
  const [logo, setLogo]   = useState({ ...DEFAULT_LOGO, ...ui.logo });

  /* ── UI-only preferences (localStorage) ── */
  const [notifSettings, setNotifSettings] = useState({ ...DEFAULT_NOTIF, ...ui.notif });
  const [paymentMethods, setPaymentMethods] = useState({ ...DEFAULT_PAY, ...ui.pay });
  const [security, setSecurity]             = useState({ ...DEFAULT_SEC, ...ui.sec });

  const stripPhone = (raw = '') => {
    const d = (raw ?? '').replace(/\D/g, '');
    if (d.startsWith('998') && d.length >= 11) return d.slice(3, 12);
    if (d.startsWith('0')   && d.length === 10) return d.slice(1);
    return d.slice(0, 9);
  };

  // Populate form from API response
  useEffect(() => {
    if (!apiSettings) return;
    setAcademy({
      name:      apiSettings.academyName ?? 'PARVOZ ACADEMY',
      slogan:    ui.slogan ?? "Bilim — kelajagingiz kaliti",
      phone:     stripPhone((apiSettings.phones ?? [])[0] ?? ''),
      email:     apiSettings.email ?? '',
      address:   apiSettings.address ?? '',
      telegram:  apiSettings.telegram ?? '',
      instagram: apiSettings.instagram ?? '',
      website:   apiSettings.website ?? '',
    });
    if (apiSettings.logo?.url) {
      setLogo((prev) => ({ ...prev, imageUrl: apiSettings.logo.url }));
    }
    if (apiSettings.paymentCards) {
      setPayCards(
        apiSettings.paymentCards.length
          ? apiSettings.paymentCards.map((c) => ({ ...c }))
          : []
      );
    }
    if (apiSettings.paymentInstruction !== undefined) {
      setPayInstruction(apiSettings.paymentInstruction);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiSettings]);

  const change = (k) => (e) => {
    const val = k === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 9) : e.target.value;
    setAcademy((p) => ({ ...p, [k]: val }));
  };
  const changeLogo  = (k) => (e) => setLogo((p) => ({ ...p, [k]: e.target.value }));
  const setLogoType = (type) => setLogo((p) => ({ ...p, type }));
  const toggleNotif = (k) => setNotifSettings((p) => ({ ...p, [k]: !p[k] }));
  const togglePay   = (k) => setPaymentMethods((p) => ({ ...p, [k]: !p[k] }));
  const toggleSec   = (k) => setSecurity((p) => ({ ...p, [k]: !p[k] }));

  /* ── Payment cards helpers ── */
  const addCard    = () => setPayCards((p) => [...p, { ...EMPTY_CARD }]);
  const removeCard = (i) => setPayCards((p) => p.filter((_, idx) => idx !== i));
  const changeCard = (i, field) => (e) =>
    setPayCards((p) => p.map((c, idx) => idx === i ? { ...c, [field]: e.target.value } : c));

  const handleSave = async () => {
    try {
      await updateSettings({
        academyName:        academy.name,
        phones:             academy.phone.length === 9 ? [`+998${academy.phone}`] : [],
        email:              academy.email       || undefined,
        address:            academy.address     || undefined,
        telegram:           academy.telegram    || undefined,
        instagram:          academy.instagram   || undefined,
        website:            academy.website     || undefined,
        paymentCards:       payCards.filter((c) => c.cardNumber.trim()),
        paymentInstruction: payInstruction      || undefined,
      }).unwrap();
    } catch (err) {
      setSnack({ open: true, msg: err?.data?.message ?? t('common.error'), severity: 'error' });
      return;
    }
    saveUi({ logo, notif: notifSettings, pay: paymentMethods, sec: security, slogan: academy.slogan });
    setSnack({ open: true, msg: t('settings.saved'), severity: 'success' });
  };

  const handleReset = () => {
    localStorage.removeItem(LS_UI);
    setNotifSettings(DEFAULT_NOTIF);
    setPaymentMethods(DEFAULT_PAY);
    setSecurity(DEFAULT_SEC);
    setLogo(DEFAULT_LOGO);
    setSnack({ open: true, msg: t('settings.resetDone'), severity: 'info' });
  };

  if (loadingSettings) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        icon={<SettingsIcon />}
        title={t('settings.title')}
        actions={
          <Button variant="outlined" color="warning" size="small" onClick={handleReset}
            sx={{ borderRadius: 2 }}>
            {t('settings.reset')}
          </Button>
        }
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack((p) => ({ ...p, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>

      {/* Academy info */}
      <SECTION icon={<BusinessIcon />} title={t('settings.academyInfo')}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <TextField label="Academy nomi" fullWidth value={academy.name} onChange={change('name')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Shiori" fullWidth value={academy.slogan} onChange={change('slogan')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('form.phone')} fullWidth
              value={academy.phone} onChange={change('phone')}
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
          <Grid item xs={12} sm={6}>
            <TextField label={t('form.email')} fullWidth value={academy.email} onChange={change('email')} />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Manzil" fullWidth value={academy.address} onChange={change('address')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Telegram" fullWidth value={academy.telegram} onChange={change('telegram')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Instagram" fullWidth value={academy.instagram} onChange={change('instagram')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Veb-sayt" fullWidth value={academy.website} onChange={change('website')} />
          </Grid>
        </Grid>
      </SECTION>

      {/* Logo management */}
      <SECTION icon={<ImageIcon />} title={t('settings.logo')}>
        <Stack direction="row" spacing={1} sx={{ mb: 2.5 }}>
          <Button
            variant={logo.type === 'text' ? 'contained' : 'outlined'}
            size="small" startIcon={<TextFieldsIcon />}
            onClick={() => setLogoType('text')}
            sx={{ borderRadius: 2, textTransform: 'none' }}>
            {t('settings.textLogo')}
          </Button>
          <Button
            variant={logo.type === 'image' ? 'contained' : 'outlined'}
            size="small" startIcon={<ImageIcon />}
            onClick={() => setLogoType('image')}
            sx={{ borderRadius: 2, textTransform: 'none' }}>
            {t('settings.imageLogo')}
          </Button>
        </Stack>

        {logo.type === 'text' && (
          <TextField label={t('settings.logoText')} fullWidth value={logo.text ?? ''}
            onChange={changeLogo('text')} sx={{ mb: 2.5 }} inputProps={{ maxLength: 40 }} />
        )}
        {logo.type === 'image' && (
          <Stack spacing={2} sx={{ mb: 2.5 }}>
            <TextField label={t('settings.logoUrl')} fullWidth placeholder="https://example.com/logo.svg"
              value={logo.imageUrl ?? ''} onChange={changeLogo('imageUrl')}
              helperText={t('settings.logoUrlHint')} />
          </Stack>
        )}

        {/* Preview */}
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: 'block' }}>
            {t('settings.logoPreview')}
          </Typography>
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 1, p: 1.5,
            border: '1.5px dashed', borderColor: 'divider', borderRadius: 2,
            bgcolor: 'action.hover', minWidth: 180,
          }}>
            {logo.type === 'text' ? (
              <>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: 'primary.main',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ color: 'primary.contrastText', fontWeight: 900, fontSize: '0.9rem', lineHeight: 1 }}>
                    {(logo.text?.[0] ?? 'P').toUpperCase()}
                  </Typography>
                </Box>
                <Typography variant="subtitle2" fontWeight={800} color="primary" noWrap>
                  {logo.text || 'PARVOZ ACADEMY'}
                </Typography>
              </>
            ) : logo.imageUrl ? (
              <Box component="img" src={logo.imageUrl} alt="Logo"
                sx={{ height: 36, maxWidth: 220, objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>
                {t('settings.logoUrlEmpty')}
              </Typography>
            )}
          </Box>
        </Box>
      </SECTION>

      {/* Appearance */}
      <SECTION icon={<PaletteIcon />} title={t('settings.appearance')}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="body2">{t('settings.lightMode')}</Typography>
          <Switch checked={colorMode.mode === 'dark'} onChange={colorMode.toggle} color="primary" />
          <Typography variant="body2">{t('settings.darkMode')}</Typography>
        </Stack>
      </SECTION>

      {/* Notifications */}
      <SECTION icon={<NotificationsIcon />} title={t('settings.notifSettings')}>
        {[
          { key: 'paymentReminder', label: t('settings.notif_paymentReminder'),  desc: t('settings.notif_paymentReminderDesc') },
          { key: 'newStudent',      label: t('settings.notif_newStudent'),       desc: t('settings.notif_newStudentDesc') },
          { key: 'testResult',      label: t('settings.notif_testResult'),       desc: t('settings.notif_testResultDesc') },
          { key: 'homeworkSubmit',  label: t('settings.notif_homeworkSubmit'),   desc: t('settings.notif_homeworkSubmitDesc') },
          { key: 'systemAlerts',    label: t('settings.notif_systemAlerts'),     desc: t('settings.notif_systemAlertsDesc') },
        ].map(({ key, label, desc }, i, arr) => (
          <Box key={key}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.25 }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{label}</Typography>
                <Typography variant="caption" color="text.secondary">{desc}</Typography>
              </Box>
              <Switch size="small" checked={notifSettings[key]} onChange={() => toggleNotif(key)} />
            </Stack>
            {i < arr.length - 1 && <Divider />}
          </Box>
        ))}
      </SECTION>

      {/* Payment cards */}
      <SECTION icon={<CreditCardIcon />} title="To'lov rekvizitlari">
        <Stack spacing={2.5}>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            Bu kartalar o'quvchi ro'yxatga olishda va oylik to'lov sahifasida ko'rsatiladi.
          </Alert>

          {payCards.map((card, i) => (
            <Box key={i} sx={{
              p: 2, borderRadius: 2, border: '1px solid',
              borderColor: 'divider', position: 'relative',
            }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <CreditCardIcon fontSize="small" color="primary" />
                <Typography variant="subtitle2" fontWeight={700}>
                  Karta #{i + 1}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Tooltip title="O'chirish">
                  <IconButton size="small" color="error" onClick={() => removeCard(i)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Bank / To'lov tizimi"
                    placeholder="Uzcard, Humo, Visa…"
                    fullWidth size="small"
                    value={card.bank}
                    onChange={changeCard(i, 'bank')}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Karta raqami"
                    placeholder="8600 1234 5678 9012"
                    fullWidth size="small"
                    value={card.cardNumber}
                    onChange={changeCard(i, 'cardNumber')}
                    inputProps={{ maxLength: 19 }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Karta egasi"
                    placeholder="PARVOZ ACADEMY"
                    fullWidth size="small"
                    value={card.cardHolder}
                    onChange={changeCard(i, 'cardHolder')}
                  />
                </Grid>
              </Grid>
            </Box>
          ))}

          <Button
            variant="outlined" startIcon={<AddIcon />} size="small"
            onClick={addCard}
            sx={{ borderRadius: 2, alignSelf: 'flex-start', textTransform: 'none' }}
          >
            Karta qo'shish
          </Button>

          <Divider />

          <TextField
            label="To'lov yo'riqnomasi"
            placeholder="To'lov amalga oshirgach, chekni yuklang..."
            multiline rows={3} fullWidth
            value={payInstruction}
            onChange={(e) => setPayInstruction(e.target.value)}
            helperText="Bu matn o'quvchilarga to'lov chekini yuklash sahifasida ko'rsatiladi."
          />
        </Stack>
      </SECTION>

      {/* Payment methods */}
      <SECTION icon={<PaymentIcon />} title={t('settings.paymentMethods')}>
        <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 1.5 }}>
          {[
            { key: 'payme', label: 'Payme', color: '#00ADEF' },
            { key: 'click', label: 'Click', color: '#F48024' },
            { key: 'uzum',  label: 'Uzum',  color: '#9B59B6' },
            { key: 'naqd',  label: 'Naqd pul', color: '#27AE60' },
          ].map(({ key, label, color }) => (
            <Chip key={key} label={label} onClick={() => togglePay(key)}
              sx={{
                borderRadius: 2, px: 1, fontWeight: 700, cursor: 'pointer',
                bgcolor: paymentMethods[key] ? color + '18' : 'action.hover',
                color: paymentMethods[key] ? color : 'text.disabled',
                border: '1px solid',
                borderColor: paymentMethods[key] ? color + '66' : 'divider',
              }}
            />
          ))}
        </Stack>
      </SECTION>

      {/* Security */}
      <SECTION icon={<SecurityIcon />} title={t('settings.security')}>
        <Stack spacing={2}>
          <FormControlLabel
            control={<Switch size="small" checked={security.twoFactor} onChange={() => toggleSec('twoFactor')} />}
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>{t('settings.twoFactor')}</Typography>
                <Typography variant="caption" color="text.secondary">{t('settings.twoFactorDesc')}</Typography>
              </Box>
            }
          />
          <Divider />
          <FormControlLabel
            control={<Switch size="small" checked={security.sessionTimeout} onChange={() => toggleSec('sessionTimeout')} />}
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>{t('settings.sessionTimeout')}</Typography>
                <Typography variant="caption" color="text.secondary">{t('settings.sessionTimeoutDesc')}</Typography>
              </Box>
            }
          />
        </Stack>
      </SECTION>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          sx={{ borderRadius: 2, px: 4 }} onClick={handleSave} disabled={saving}>
          {t('settings.save')}
        </Button>
      </Stack>
    </Box>
  );
}
