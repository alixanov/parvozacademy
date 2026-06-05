import { Box, Container, Typography, Divider, Stack, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import GavelIcon       from '@mui/icons-material/Gavel';
import DescriptionIcon from '@mui/icons-material/Description';
import i18n            from '../../../utils/i18n.js';
import PageHero        from '../../../components/ui/PageHero.jsx';

const uz = {
  sections: [
    {
      title: '1. Umumiy qoidalar',
      body: `Ushbu Foydalanish shartlari «STAR FLIGHT NODAVLAT TA'LIM MUASSASASI» (STAR FLIGHT NTM) tomonidan boshqariladigan Parvoz Academy ta'lim platformasidan foydalanuvchilar bilan o'rnatilgan shartnoma hisoblanadi.\n\nPlatformadan foydalanishni boshlaganda siz ushbu shartlarni to'liq qabul qilgan hisoblanasiz. Agar shartlarga rozi bo'lmasangiz, platformadan foydalanmang.\n\nYuridik nomi: STAR FLIGHT NODAVLAT TA'LIM MUASSASASI (STAR FLIGHT NTM)\nManzil: O'zbekiston Respublikasi\nElektron pochta: info@parvozacademy.uz`,
    },
    {
      title: '2. Xizmatlar haqida',
      body: `Parvoz Academy quyidagi ta'lim xizmatlarini ko'rsatadi:\n\n• Onlayn va oflayn kurs darslari\n• Onlayn testlar va bilimlarni tekshirish\n• Uy vazifalari va o'qituvchi bilan muloqot\n• Shaxsiy o'quv kabineti va progress kuzatuvi\n• Sertifikat berish (kursni muvaffaqiyatli tugatganda)\n\nXizmatlar faqat ro'yxatdan o'tgan va to'lovni amalga oshirgan foydalanuvchilarga taqdim etiladi.`,
    },
    {
      title: '3. Ro\'yxatdan o\'tish',
      body: `Platformadan foydalanish uchun ro'yxatdan o'tish shart. Ro'yxatdan o'tishda:\n\n• To'g'ri va dolzarb ma'lumotlar kiritishingiz shart\n• Hisob ma'lumotlarini maxfiy saqlash majburiyatingiz bor\n• Bir kishi faqat bitta hisob ochishi mumkin\n• 16 yoshdan kichik foydalanuvchilar ota-ona roziligini talab etadi\n\nSiz hisob ma'lumotlaringizdan foydalanilgan barcha harakatlar uchun javobgarsiz.`,
    },
    {
      title: '4. To\'lov shartlari',
      body: `Kurslarga yozilish uchun to'lov quyidagi tartibda amalga oshiriladi:\n\n• To'lov oylik to'lov sifatida amalga oshiriladi\n• To'lov Uzcard/Humo kartasi orqali bank o'tkazmasida bajariladi\n• To'lov ID (tranzaksiya raqami) platformaga kiritilishi shart\n• Administrator to'lovni 24 soat ichida tasdiqlaydi\n• Tasdiqlanmagan to'lov holat "kutilmoqda"da qoladi\n\nTarif rejalari:\n• Onlayn: 600 000 so'm/oy — faqat onlayn darslar\n• Offline: 800 000 so'm/oy — jismoniy va onlayn darslar\n• Individual: 1 500 000 so'm/oy — shaxsiy darslar`,
    },
    {
      title: '5. Qaytarish siyosati',
      body: `To'lovni qaytarish quyidagi hollarda amalga oshiriladi:\n\n• Kurs boshlanmagan bo'lsa va so'rov 3 kun ichida berilsa — to'liq qaytarish\n• Kurs boshlangan bo'lsa va 1 haftadan kam bo'lsa — 50% qaytarish\n• Kurs boshlanib 1 haftadan o'tgan bo'lsa — qaytarish amalga oshirilmaydi\n\nBarcha qaytarish so'rovlari info@parvozacademy.uz manziliga yuborilishi kerak.`,
    },
    {
      title: '6. Foydalanuvchi majburiyatlari',
      body: `Platformadan foydalanishda siz quyidagilarga rioya qilishingiz shart:\n\n• Boshqa foydalanuvchilarni hurmat qilish\n• Hisob ma'lumotlaringizni boshqa shaxslarga bermaslik\n• Platformaning normal ishlashiga xalaqit qilmaslik\n• Mualliflik huquqlariga rioya etish (darslarni ruxsatsiz tarqatmaslik)\n• Noto'g'ri, yolg'on yoki zararli ma'lumot tarqatmaslik\n• O'zbek Respublikasi qonunchiligiga rioya etish`,
    },
    {
      title: '7. Intellektual mulk',
      body: `Platformadagi barcha kontent — darslar, testlar, materiallar, dizayn va dasturiy ta'minot — STAR FLIGHT NTM ning intellektual mulki hisoblanadi.\n\nSiz platformadan faqat shaxsiy ta'lim maqsadida foydalanishingiz mumkin. Kontent yoki materiallarni tijorat maqsadida qayta nashr etish, tarqatish yoki sotish qat'iyan taqiqlanadi.`,
    },
    {
      title: '8. Xizmatni to\'xtatish',
      body: `Biz quyidagi hollarda foydalanuvchi hisobini to'xtatish yoki o'chirish huquqini saqlaymiz:\n\n• Foydalanish shartlarini buzish\n• Firibgarlik yoki to'lovni suiiste'mol qilish\n• Platforma va boshqa foydalanuvchilarga zarar yetkazish\n• Qonunchilikka zid harakatlar\n\nHisobni to'xtatish haqida siz elektron pochta orqali xabardor qilinasiz.`,
    },
    {
      title: '9. Javobgarlik cheklovi',
      body: `STAR FLIGHT NTM quyidagi hollar uchun javobgar emas:\n\n• Internet aloqasi muammolari tufayli darslarni o'tkazib yuborish\n• Foydalanuvchining o'z ma'lumotlarini yo'qotishi\n• Platformadagi texnik nosozliklar (biz ularni bartaraf etishga harakat qilamiz)\n• Uchinchi tomon xizmatlari (to'lov tizimlari, xarita va h.k.) xatosi`,
    },
    {
      title: '10. Nizolarni hal etish',
      body: `Nizolar birinchi navbatda muzokaralar yo'li bilan hal etiladi. Buning uchun:\n\n1. info@parvozacademy.uz manziliga shikoyat yuboring\n2. Biz 5 ish kuni ichida javob beramiz\n3. Muzokaralar natija bermasа, nizo O'zbekiston Respublikasi qonunchiligi asosida sudda hal etiladi.\n\nYuridik manzil: O'zbekiston Respublikasi`,
    },
    {
      title: '11. Shartlarga o\'zgartirish kiritish',
      body: `Biz ushbu Foydalanish shartlarini istalgan vaqt yangilash huquqini saqlaymiz. Muhim o'zgartirishlar haqida ro'yxatdan o'tgan elektron pochta manzilingizga xabar yuboriladi. Keyingi foydalanishingiz yangilangan shartlarni qabul qilganingizni bildiradi.`,
    },
  ],
};

const ru = {
  sections: [
    {
      title: '1. Общие положения',
      body: `Настоящие Условия использования являются договором между пользователями образовательной платформы Parvoz Academy и компанией «STAR FLIGHT NODAVLAT TA'LIM MUASSASASI» (STAR FLIGHT NTM).\n\nНачиная пользоваться платформой, вы полностью принимаете настоящие условия. Если вы не согласны с условиями — не пользуйтесь платформой.\n\nЮридическое наименование: STAR FLIGHT NODAVLAT TA'LIM MUASSASASI (STAR FLIGHT NTM)\nАдрес: Республика Узбекистан\nЭлектронная почта: info@parvozacademy.uz`,
    },
    {
      title: '2. Предоставляемые услуги',
      body: `Parvoz Academy предоставляет следующие образовательные услуги:\n\n• Онлайн и офлайн курсовые занятия\n• Онлайн тесты и проверка знаний\n• Домашние задания и общение с преподавателем\n• Личный учебный кабинет и отслеживание прогресса\n• Выдача сертификата (при успешном завершении курса)\n\nУслуги предоставляются только зарегистрированным пользователям, совершившим оплату.`,
    },
    {
      title: '3. Регистрация',
      body: `Для использования платформы необходима регистрация. При регистрации:\n\n• Вы обязаны вводить корректные и актуальные данные\n• Вы несёте ответственность за сохранность данных своего аккаунта\n• Один человек может иметь только один аккаунт\n• Пользователям до 16 лет необходимо согласие родителей\n\nВы несёте ответственность за все действия, совершённые с использованием данных вашего аккаунта.`,
    },
    {
      title: '4. Условия оплаты',
      body: `Запись на курсы осуществляется в следующем порядке:\n\n• Оплата производится ежемесячно\n• Оплата осуществляется банковским переводом через карту Uzcard/Humo\n• ID транзакции (номер перевода) необходимо ввести в платформу\n• Администратор подтверждает оплату в течение 24 часов\n• Неподтверждённый платёж остаётся в статусе «ожидание»\n\nТарифные планы:\n• Онлайн: 600 000 сум/мес — только онлайн занятия\n• Офлайн: 800 000 сум/мес — очные и онлайн занятия\n• Индивидуальный: 1 500 000 сум/мес — персональные занятия`,
    },
    {
      title: '5. Политика возврата',
      body: `Возврат средств осуществляется в следующих случаях:\n\n• Если курс не начался и запрос подан в течение 3 дней — полный возврат\n• Если курс начался и прошло менее 1 недели — возврат 50%\n• Если с начала курса прошло более 1 недели — возврат не производится\n\nВсе запросы на возврат направляйте на info@parvozacademy.uz`,
    },
    {
      title: '6. Обязательства пользователя',
      body: `При использовании платформы вы обязаны соблюдать следующие правила:\n\n• Уважительно относиться к другим пользователям\n• Не передавать данные своего аккаунта третьим лицам\n• Не нарушать нормальную работу платформы\n• Соблюдать авторские права (не распространять уроки без разрешения)\n• Не распространять некорректную, ложную или вредоносную информацию\n• Соблюдать законодательство Республики Узбекистан`,
    },
    {
      title: '7. Интеллектуальная собственность',
      body: `Весь контент на платформе — уроки, тесты, материалы, дизайн и программное обеспечение — является интеллектуальной собственностью STAR FLIGHT NTM.\n\nВы можете использовать платформу исключительно в личных образовательных целях. Повторная публикация, распространение или продажа контента и материалов в коммерческих целях строго запрещены.`,
    },
    {
      title: '8. Прекращение обслуживания',
      body: `Мы оставляем за собой право приостановить или удалить аккаунт пользователя в следующих случаях:\n\n• Нарушение условий использования\n• Мошенничество или злоупотребление при оплате\n• Нанесение вреда платформе или другим пользователям\n• Действия, противоречащие законодательству\n\nО приостановке аккаунта вы будете уведомлены по электронной почте.`,
    },
    {
      title: '9. Ограничение ответственности',
      body: `STAR FLIGHT NTM не несёт ответственности за:\n\n• Пропуск занятий из-за проблем с интернет-соединением\n• Потерю пользователем своих данных\n• Технические неисправности на платформе (мы стараемся их устранять)\n• Ошибки сторонних сервисов (платёжные системы, карты и т.д.)`,
    },
    {
      title: '10. Разрешение споров',
      body: `Споры решаются в первую очередь путём переговоров. Для этого:\n\n1. Направьте жалобу на info@parvozacademy.uz\n2. Мы ответим в течение 5 рабочих дней\n3. Если переговоры не дали результата, спор разрешается в суде в соответствии с законодательством Республики Узбекистан.\n\nЮридический адрес: Республика Узбекистан`,
    },
    {
      title: '11. Изменение условий',
      body: `Мы оставляем за собой право обновлять настоящие Условия использования в любое время. О существенных изменениях вы будете уведомлены по электронной почте, указанной при регистрации. Продолжение использования платформы означает принятие обновлённых условий.`,
    },
  ],
};

const fadeUp = { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] } };

export default function Terms() {
  const { t } = useTranslation();
  const lang = i18n.language;
  const content = lang === 'ru' ? ru : uz;

  return (
    <Box sx={{ mx: { xs: -2, sm: -3 } }}>
      <PageHero
        eyebrow="STAR FLIGHT NTM"
        title={t('footer.terms')}
        subtitle={
          lang === 'ru'
            ? 'Правила и условия использования образовательной платформы Parvoz Academy'
            : 'Parvoz Academy ta\'lim platformasidan foydalanish qoidalari va shartlari'
        }
        lightBg="linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)"
        darkBg="linear-gradient(135deg, #130428 0%, #1c0a3a 100%)"
        blob1="radial-gradient(circle, rgba(124,58,237,0.92) 0%, transparent 65%)"
        blob2="radial-gradient(circle, rgba(91,33,182,0.86) 0%, transparent 65%)"
        darkBlob1="radial-gradient(circle, rgba(124,58,237,0.58) 0%, transparent 65%)"
        darkBlob2="radial-gradient(circle, rgba(91,33,182,0.50) 0%, transparent 65%)"
        chips={[
          { label: lang === 'ru' ? 'Обновлено: январь 2025' : 'Yangilangan: yanvar 2025', icon: <DescriptionIcon /> },
          { label: 'STAR FLIGHT NTM', icon: <GavelIcon /> },
        ]}
      />

      <Box sx={{ py: { xs: 5, md: 8 }, bgcolor: 'background.default' }}>
        <Container maxWidth="md">
          {/* Legal entity box */}
          <motion.div {...fadeUp}>
            <Box sx={{
              p: 3, mb: 5, borderRadius: 3,
              border: '1px solid', borderColor: 'secondary.main',
              bgcolor: 'secondary.main' + '08',
            }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1.5 }}>
                <Chip label="Yuridik shaxs / Юридическое лицо" size="small" color="secondary" />
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
              <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.04 }}>
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
