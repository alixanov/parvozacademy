import { Box, Container, Typography, Divider, Stack, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import GavelIcon       from '@mui/icons-material/Gavel';
import SecurityIcon    from '@mui/icons-material/Security';
import i18n            from '../../../utils/i18n.js';
import PageHero        from '../../../components/ui/PageHero.jsx';

const uz = {
  sections: [
    {
      title: '1. Umumiy ma\'lumot',
      body: `Ushbu Maxfiylik siyosati «STAR FLIGHT NODAVLAT TA'LIM MUASSASASI» (STAR FLIGHT NTM) tomonidan boshqariladigan Parvoz Academy ta'lim platformasida ro'yxatdan o'tgan va foydalanayotgan barcha foydalanuvchilarga nisbatan qo'llaniladi.\n\nYuridik nomi: STAR FLIGHT NODAVLAT TA'LIM MUASSASASI (STAR FLIGHT NTM)\nManzil: O'zbekiston Respublikasi\nElektron pochta: info@parvozacademy.uz\nTelefon: +998 50 500 76 13`,
    },
    {
      title: '2. Qanday ma\'lumotlar to\'planadi',
      body: `Biz foydalanuvchilardan quyidagi shaxsiy ma'lumotlarni to'playmiz:\n\n• To'liq ismi-sharifi\n• Telefon raqami\n• Elektron pochta manzili\n• Ta'lim darajasi va qiziqishlar\n• To'lov ma'lumotlari (karta raqami oxirgi 4 raqami va tranzaksiya ID)\n• Platformada faoliyat tarixi (kirish vaqtlari, ko'rilgan darslar, test natijalari)`,
    },
    {
      title: '3. Ma\'lumotlar qanday ishlatiladi',
      body: `To'plangan shaxsiy ma'lumotlar faqat quyidagi maqsadlarda ishlatiladi:\n\n• Kurs va ta'lim xizmatlariga yozilishni rasmiylashtirish\n• To'lovlarni tasdiqlash va qayta ishlash\n• Dars jadvali, uy vazifalari va bildirishnomalar yuborish\n• Platformani yaxshilash va texnik qo'llab-quvvatlash\n• Qonunchilik talablariga rioya etish`,
    },
    {
      title: '4. Ma\'lumotlarni saqlash',
      body: `Shaxsiy ma'lumotlaringiz xavfsiz serverda saqlanadi. Biz ma'lumotlarni faqat zarur muddatga saqlaymiz va keraksiz ma'lumotlarni o'chirib tashlaymiz.\n\nHisobingizni o'chirish talabini info@parvozacademy.uz manziliga yuboring — biz 30 kun ichida barcha shaxsiy ma'lumotlaringizni o'chiramiz.`,
    },
    {
      title: '5. Uchinchi shaxslarga oshkor etish',
      body: `Biz shaxsiy ma'lumotlaringizni uchinchi shaxslarga sotmaymiz yoki ijaraga bermaymiz. Ma'lumotlar faqat quyidagi hollarda uchinchi tomonlarga uzatilishi mumkin:\n\n• Qonun talabi asosida (sud buyrug'i, prokuratura talabi)\n• To'lov operatsiyalarini amalga oshiruvchi ishonchli sheriklar bilan (faqat tranzaksiya ma'lumotlari)\n• Platformaning texnik xizmatini ta'minlovchi kompaniyalar bilan (maxfiylik shartnomasi asosida)`,
    },
    {
      title: '6. Foydalanuvchi huquqlari',
      body: `Siz quyidagi huquqlarga egasiz:\n\n• Shaxsiy ma'lumotlaringizga kirish va ko'rish\n• Noto'g'ri ma'lumotlarni tuzatish talabi\n• Ma'lumotlaringizni o'chirish talabi\n• Ma'lumotlardan foydalanishni cheklash talabi\n• Bizning platforma bilan ma'lumot almashishni to'xtatish\n\nBarcha so'rovlar uchun: info@parvozacademy.uz`,
    },
    {
      title: '7. Cookie va tracking',
      body: `Platformamiz ishlashini ta'minlash uchun cookie fayllaridan foydalanamiz. Cookie fayllar brauzeringiz sozlamalarida o'chirilishi mumkin, ammo bu platformaning ba'zi funksiyalarini ishlamay qolishiga olib kelishi mumkin.`,
    },
    {
      title: '8. Siyosatga o\'zgartirish kiritish',
      body: `Biz ushbu Maxfiylik siyosatini istalgan vaqt yangilash huquqini saqlab qolamiz. Muhim o'zgartirishlar haqida siz ro'yxatdan o'tgan elektron pochta manzilingizga xabar yuboriladi. Keyingi foydalanishingiz yangilangan siyosatni qabul qilganingizni bildiradi.`,
    },
    {
      title: '9. Bog\'lanish',
      body: `Maxfiylik siyosati bo'yicha savollar yoki shikoyatlar uchun:\n\nYuridik nomi: STAR FLIGHT NODAVLAT TA'LIM MUASSASASI\nElektron pochta: info@parvozacademy.uz\nTelefon: +998 50 500 76 13\nTelegram: @parvozacademy`,
    },
  ],
};

const ru = {
  sections: [
    {
      title: '1. Общие сведения',
      body: `Настоящая Политика конфиденциальности применяется ко всем пользователям образовательной платформы Parvoz Academy, управляемой компанией «STAR FLIGHT NODAVLAT TA'LIM MUASSASASI» (STAR FLIGHT NTM).\n\nЮридическое наименование: STAR FLIGHT NODAVLAT TA'LIM MUASSASASI (STAR FLIGHT NTM)\nАдрес: Республика Узбекистан\nЭлектронная почта: info@parvozacademy.uz\nТелефон: +998 50 500 76 13`,
    },
    {
      title: '2. Какие данные мы собираем',
      body: `Мы собираем следующие персональные данные пользователей:\n\n• Полное имя и фамилия\n• Номер телефона\n• Адрес электронной почты\n• Уровень образования и интересы\n• Платёжная информация (последние 4 цифры карты и ID транзакции)\n• История активности на платформе (время входа, просмотренные уроки, результаты тестов)`,
    },
    {
      title: '3. Как используются данные',
      body: `Собранные персональные данные используются исключительно в следующих целях:\n\n• Оформление записи на курсы и образовательные услуги\n• Подтверждение и обработка платежей\n• Отправка расписания, домашних заданий и уведомлений\n• Улучшение платформы и техническая поддержка\n• Соблюдение требований законодательства`,
    },
    {
      title: '4. Хранение данных',
      body: `Ваши персональные данные хранятся на защищённых серверах. Мы храним данные только необходимое время и удаляем лишние данные.\n\nДля удаления аккаунта направьте запрос на info@parvozacademy.uz — мы удалим все ваши персональные данные в течение 30 дней.`,
    },
    {
      title: '5. Раскрытие третьим лицам',
      body: `Мы не продаём и не передаём в аренду ваши персональные данные третьим лицам. Данные могут быть переданы третьим сторонам только в следующих случаях:\n\n• По требованию закона (судебное предписание, запрос прокуратуры)\n• Надёжным партнёрам по обработке платежей (только данные транзакции)\n• Компаниям, обеспечивающим техническое обслуживание платформы (на основании договора о конфиденциальности)`,
    },
    {
      title: '6. Права пользователей',
      body: `Вы имеете следующие права:\n\n• Доступ и просмотр своих персональных данных\n• Требование исправления некорректных данных\n• Требование удаления своих данных\n• Требование ограничения использования данных\n• Прекращение обмена данными с нашей платформой\n\nПо всем запросам: info@parvozacademy.uz`,
    },
    {
      title: '7. Cookie и отслеживание',
      body: `Для обеспечения работы платформы мы используем файлы cookie. Файлы cookie можно отключить в настройках браузера, однако это может привести к неработоспособности некоторых функций платформы.`,
    },
    {
      title: '8. Изменения политики',
      body: `Мы оставляем за собой право обновлять настоящую Политику конфиденциальности в любое время. О существенных изменениях вы будете уведомлены по электронной почте, указанной при регистрации. Продолжение использования платформы означает принятие обновлённой политики.`,
    },
    {
      title: '9. Контакты',
      body: `По вопросам и жалобам, связанным с политикой конфиденциальности:\n\nЮридическое наименование: STAR FLIGHT NODAVLAT TA'LIM MUASSASASI\nЭлектронная почта: info@parvozacademy.uz\nТелефон: +998 50 500 76 13\nTelegram: @parvozacademy`,
    },
  ],
};

const fadeUp = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } };

export default function Privacy() {
  const { t } = useTranslation();
  const lang = i18n.language;
  const content = lang === 'ru' ? ru : uz;

  return (
    <Box sx={{ mx: { xs: -2, sm: -3 } }}>
      <PageHero
        eyebrow="STAR FLIGHT NTM"
        title={t('footer.privacy')}
        subtitle={
          lang === 'ru'
            ? 'Как мы собираем, используем и защищаем ваши персональные данные'
            : 'Shaxsiy ma\'lumotlaringizni qanday to\'plash, foydalanish va himoya qilishimiz'
        }
        lightBg="linear-gradient(135deg, #0ea5e9 0%, #0284c7 50%, #0369a1 100%)"
        darkBg="linear-gradient(135deg, #001828 0%, #002038 100%)"
        blob1="radial-gradient(circle, rgba(14,165,233,0.92) 0%, transparent 65%)"
        blob2="radial-gradient(circle, rgba(3,105,161,0.86) 0%, transparent 65%)"
        darkBlob1="radial-gradient(circle, rgba(14,165,233,0.58) 0%, transparent 65%)"
        darkBlob2="radial-gradient(circle, rgba(3,105,161,0.50) 0%, transparent 65%)"
        chips={[
          { label: lang === 'ru' ? 'Обновлено: январь 2025' : 'Yangilangan: yanvar 2025', icon: <SecurityIcon /> },
          { label: 'STAR FLIGHT NTM', icon: <GavelIcon /> },
        ]}
      />

      <Box sx={{ py: { xs: 5, md: 8 }, bgcolor: 'background.default' }}>
        <Container maxWidth="md">
          {/* Legal entity box */}
          <motion.div {...fadeUp}>
            <Box sx={{
              p: 3, mb: 5, borderRadius: 3,
              border: '1px solid', borderColor: 'primary.main',
              bgcolor: 'primary.main' + '08',
            }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                <Chip label="Yuridik shaxs / Юридическое лицо" size="small" color="primary" />
              </Stack>
              <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                STAR FLIGHT NODAVLAT TA'LIM MUASSASASI
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                STAR FLIGHT NTM · info@parvozacademy.uz · +998 50 500 76 13
              </Typography>
            </Box>
          </motion.div>

          {/* Sections */}
          <Stack spacing={5}>
            {content.sections.map((sec, i) => (
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.05 }}>
                <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1.5 }}>
                  {sec.title}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ whiteSpace: 'pre-line', lineHeight: 1.9 }}
                >
                  {sec.body}
                </Typography>
              </motion.div>
            ))}
          </Stack>

          {/* Footer note */}
          <motion.div {...fadeUp}>
            <Box sx={{
              mt: 6, p: 3, borderRadius: 3,
              bgcolor: 'background.paper',
              border: '1px solid', borderColor: 'divider',
              textAlign: 'center',
            }}>
              <Typography variant="caption" color="text.disabled">
                {lang === 'ru'
                  ? '© 2025 STAR FLIGHT NODAVLAT TA\'LIM MUASSASASI. Все права защищены.'
                  : '© 2025 STAR FLIGHT NODAVLAT TA\'LIM MUASSASASI. Barcha huquqlar himoyalangan.'}
              </Typography>
            </Box>
          </motion.div>
        </Container>
      </Box>
    </Box>
  );
}
