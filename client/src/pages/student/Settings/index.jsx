import {
  Box, Typography, Card, CardContent, Stack, Switch,
  Divider, Button, ToggleButton, ToggleButtonGroup, Alert,
} from '@mui/material';
import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import DarkModeIcon      from '@mui/icons-material/DarkMode';
import LightModeIcon     from '@mui/icons-material/LightMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LanguageIcon      from '@mui/icons-material/Language';
import SaveIcon          from '@mui/icons-material/Save';
import SettingsIcon      from '@mui/icons-material/Settings';
import { ColorModeContext } from '../../../app/providers.jsx';
import PageHeader from '../../../components/common/PageHeader/index.jsx';

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

export default function StudentSettings() {
  const { i18n, t } = useTranslation();
  const colorMode   = useContext(ColorModeContext);
  const [lang, setLang] = useState(i18n.language ?? 'uz');
  const [saved, setSaved] = useState(false);

  const [notifs, setNotifs] = useState({
    homework: true,
    schedule: true,
    grades:   true,
    payments: true,
  });

  const toggleNotif = (key) => setNotifs((n) => ({ ...n, [key]: !n[key] }));

  const handleLang = (_, v) => {
    if (!v) return;
    setLang(v);
    i18n.changeLanguage(v);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box>
      <PageHeader icon={<SettingsIcon />} title={t('student.settings')} />

      {saved && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {t('student.settingsSaved')}
        </Alert>
      )}

      {/* Appearance */}
      <SECTION icon={<DarkModeIcon />} title={t('settings.appearance')}>
        <Stack direction="row" spacing={2} alignItems="center">
          <LightModeIcon sx={{ color: 'text.secondary' }} />
          <Typography variant="body2">{t('student.lightModeLabel')}</Typography>
          <Switch
            checked={colorMode.mode === 'dark'}
            onChange={colorMode.toggle}
            color="primary"
          />
          <Typography variant="body2">{t('student.darkModeLabel')}</Typography>
          <DarkModeIcon sx={{ color: 'text.secondary' }} />
        </Stack>
      </SECTION>

      {/* Language */}
      <SECTION icon={<LanguageIcon />} title={t('student.languageSection')}>
        <ToggleButtonGroup value={lang} exclusive onChange={handleLang}>
          {[
            { value: 'uz', label: "O'zbek tili" },
            { value: 'ru', label: 'Русский' },
          ].map(({ value, label }) => (
            <ToggleButton key={value} value={value} sx={{
              px: 3, borderRadius: '8px !important',
              '&.Mui-selected': { bgcolor: 'primary.main', color: 'white' },
            }}>
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </SECTION>

      {/* Notifications */}
      <SECTION icon={<NotificationsIcon />} title={t('student.notifications')}>
        {[
          { key: 'homework', label: t('student.hwNotif'),       desc: t('student.hwNotifDesc') },
          { key: 'schedule', label: t('student.scheduleNotif'), desc: t('student.scheduleNotifDesc') },
          { key: 'grades',   label: t('student.gradesNotif'),   desc: t('student.gradesNotifDesc') },
          { key: 'payments', label: t('student.paymentNotif'),  desc: t('student.paymentNotifDesc') },
        ].map(({ key, label, desc }, i, arr) => (
          <Box key={key}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.25 }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>{label}</Typography>
                <Typography variant="caption" color="text.secondary">{desc}</Typography>
              </Box>
              <Switch checked={notifs[key]} onChange={() => toggleNotif(key)} size="small" />
            </Stack>
            {i < arr.length - 1 && <Divider />}
          </Box>
        ))}
      </SECTION>

      <Button
        variant="contained" size="large" startIcon={<SaveIcon />}
        sx={{ borderRadius: 2, px: 4 }} onClick={handleSave}
      >
        {t('settings.save')}
      </Button>
    </Box>
  );
}
