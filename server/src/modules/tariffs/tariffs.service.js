import TariffPlan from '../../models/TariffPlan.model.js';
import { AppError } from '../../utils/response.utils.js';

const TEACHER_FIELDS = 'name nameRu nameUz avatar';

/* ── Значения по умолчанию ───────────────────────────────────── */
const DEFAULTS = [
  {
    key:  'online',
    name: { uz: 'Onlayn', ru: 'Онлайн' },
    description: {
      uz: "Uydan qulay vaqtda o'qing",
      ru: 'Учитесь из дома в удобное время',
    },
    defaultPrice: 600000,
    color:        '#1976D2',
    popular:      false,
    type:         'regular',
    features: [
      'Видеоуроки (HD качество)',
      'Онлайн тесты и задания',
      'Telegram группа (помощь 24/7)',
      'Проверка домашних заданий',
      'Ежемесячный отчёт успеваемости',
      'Доступ через мобильное приложение',
    ],
    featuresUz: [
      'Video darslar (HD sifat)',
      'Onlayn testlar va topshiriqlar',
      'Telegram guruh (24/7 yordam)',
      'Uyga vazifalarni tekshirish',
      'Oylik natija hisoboti',
      'Mobil ilova orqali kirish',
    ],
  },
  {
    key:  'offline',
    name: { uz: 'Oflayn', ru: 'Оффлайн' },
    description: {
      uz: "Akademiyada bevosita mashg'ulotlar",
      ru: 'Очные занятия в академии',
    },
    defaultPrice: 800000,
    color:        '#7C3AED',
    popular:      true,
    type:         'regular',
    features: [
      'Очные уроки (малые группы)',
      'Записи видео (для повторения)',
      'Домашние задания и тесты',
      'Бесплатные дополнительные занятия',
      'Ежемесячное родительское собрание',
      'Сертификат (по окончании курса)',
      'Библиотека и ресурсы',
    ],
    featuresUz: [
      'Jonli darslar (kichik guruhlar)',
      'Video yozuvlar (takrorlash uchun)',
      'Uyga vazifalar va testlar',
      "Bepul qo'shimcha darslar",
      "Oylik ota-ona yig'ilishi",
      'Sertifikat (kurs oxirida)',
      'Kutubxona va resurslar',
    ],
  },
  {
    key:  'individual_offline',
    name: { uz: 'Individual Oflayn', ru: 'Индивидуальный Оффлайн' },
    description: {
      uz: "Yakkama-yakka, o'quv markazda",
      ru: 'Очно 1-на-1 в учебном центре',
    },
    defaultPrice: 1500000,
    color:        '#10B981',
    popular:      false,
    type:         'regular',
    features: [
      'Индивидуальное расписание',
      'Очные занятия 1-на-1',
      'Персональная программа обучения',
      'Ускоренный результат',
      'Вопросы через WhatsApp / Telegram',
      'Еженедельный отчёт прогресса',
      'Стратегия подготовки к экзамену',
      'Гарантированный результат',
    ],
    featuresUz: [
      'Individual jadval',
      '1-ga-1 jonli darslar',
      "Shaxsiy o'quv dasturi",
      'Tezlashtirilgan natija',
      'WhatsApp / Telegram orqali savol',
      'Haftalik rivojlanish hisoboti',
      'Imtihon tayyorlash strategiyasi',
      'Kafolatlangan natija',
    ],
  },
  {
    key:  'individual_online',
    name: { uz: 'Individual Onlayn', ru: 'Индивидуальный Онлайн' },
    description: {
      uz: 'Yakkama-yakka, Zoom orqali',
      ru: 'Онлайн 1-на-1 через Zoom',
    },
    defaultPrice: 1200000,
    color:        '#EC4899',
    popular:      false,
    type:         'regular',
    features: [
      'Онлайн занятия 1-на-1 (Zoom/Meet)',
      'Индивидуальное расписание',
      'Персональная программа обучения',
      'Ускоренный результат',
      'Записи всех занятий',
      'Вопросы через WhatsApp / Telegram',
      'Еженедельный отчёт прогресса',
      'Гарантированный результат',
    ],
    featuresUz: [
      'Individual jadval',
      '1-ga-1 onlayn darslar (Zoom)',
      'Barcha darslar yozib olinadi',
      "Shaxsiy o'quv dasturi",
      'Tezlashtirilgan natija',
      'WhatsApp / Telegram orqali savol',
      'Haftalik rivojlanish hisoboti',
      'Kafolatlangan natija',
    ],
  },
];

/* ─────────────────────────────────────────────────────────────────
 * Авто-сид при первом запросе.
 * Удаляет устаревший тариф 'individual' (заменён на individual_offline/online).
 * Обновляет существующие записи новыми полями через $set (без перезатирания).
 * ───────────────────────────────────────────────────────────────── */
export async function seedDefaults() {
  await TariffPlan.deleteOne({ key: 'individual' }).catch(() => {});

  for (const plan of DEFAULTS) {
    const { key, name, defaultPrice, color, popular, features } = plan;
    await TariffPlan.findOneAndUpdate(
      { key },
      {
        // Поля без изменений — только при создании новой записи
        $setOnInsert: { name, defaultPrice, color, popular, features },
        // Новые поля — добавляем и к существующим записям (миграция)
        $set: {
          description: plan.description ?? { uz: '', ru: '' },
          featuresUz:  plan.featuresUz  ?? [],
          type:        plan.type        ?? 'regular',
        },
      },
      { upsert: true },
    );
  }
}

/* ── Все тарифы (для admin-панели) ─────────────────────────────── */
export async function getAll() {
  const newKeys = ['individual_offline', 'individual_online'];
  const hasNew  = await TariffPlan.exists({ key: { $in: newKeys } });
  if (!hasNew) await seedDefaults();

  return TariffPlan
    .find()
    .populate('teacher', TEACHER_FIELDS)
    .sort({ createdAt: 1 });
}

/* ── Только активные тарифы (для публичной страницы) ───────────── */
export async function getPublicPlans() {
  return TariffPlan
    .find({ isActive: true })
    .populate('teacher', TEACHER_FIELDS)
    .sort({ createdAt: 1 });
}

/* ── CRUD ───────────────────────────────────────────────────────── */
export async function createPlan(data) {
  const exists = await TariffPlan.findOne({ key: data.key });
  if (exists) throw new AppError(`Tariff plan with key '${data.key}' already exists`, 409);
  const doc = await TariffPlan.create(data);
  return TariffPlan.findById(doc._id).populate('teacher', TEACHER_FIELDS);
}

export async function updatePlan(key, data) {
  const plan = await TariffPlan
    .findOneAndUpdate(
      { key },
      { $set: data },
      { new: true, runValidators: true },
    )
    .populate('teacher', TEACHER_FIELDS);
  if (!plan) throw new AppError(`Tariff plan '${key}' not found`, 404);
  return plan;
}

export async function deletePlan(key) {
  const plan = await TariffPlan.findOneAndDelete({ key });
  if (!plan) throw new AppError(`Tariff plan '${key}' not found`, 404);
  return plan;
}
