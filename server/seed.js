/**
 * Seed script — creates the Super Admin and default academy Settings.
 * Usage: node seed.js   (or: npm run seed)
 */

import 'dotenv/config';
import mongoose from 'mongoose';

await mongoose.connect(process.env.MONGODB_URI);
console.log('✓ MongoDB connected');

import User     from './src/models/User.model.js';
import Settings from './src/models/Settings.model.js';
import Vacancy  from './src/models/Vacancy.model.js';

// ── Super Admin ────────────────────────────────────────────────────────────────
const name     = process.env.SUPER_ADMIN_NAME     ?? 'Мадина Бахриддинова';
const phone    = process.env.SUPER_ADMIN_PHONE    ?? '+998931567447';
const password = process.env.SUPER_ADMIN_PASSWORD ?? 'Madinaacademyadmin';

const existing = await User.findOne({ role: 'admin' });

if (existing) {
  existing.password = password;   // pre-save hook will re-hash
  existing.phone    = phone;
  await existing.save();
  console.log(`✓ Admin password updated: ${existing.name} (${phone})`);
  console.log(`  New password: ${password}`);
} else {
  await User.create({ name, phone, password, role: 'admin', isActive: true });
  console.log('✓ Super Admin created');
  console.log(`  Name:     ${name}`);
  console.log(`  Phone:    ${phone}`);
  console.log(`  Password: ${password}`);
  console.log('  Login:    use phone + password above');
}

// ── Default Settings ───────────────────────────────────────────────────────────
const existingSettings = await Settings.findOne();

if (existingSettings) {
  console.log('ℹ  Settings already exist');
} else {
  await Settings.create({
    academyName:   'PARVOZ ACADEMY',
    phones:        [phone],
    monthlyFee:    500000,
    currency:      'UZS',
    paymentDueDay: 5,
  });
  console.log('✓ Default Settings created');
}

// ── Vacancies ──────────────────────────────────────────────────────────────────
const vacancyCount = await Vacancy.countDocuments();
if (vacancyCount > 0) {
  console.log(`ℹ  Vacancies already exist (${vacancyCount} ta)`);
} else {
  const vacancies = [
    {
      title: "Matematika o'qituvchisi",
      description:
        "Parvoz Academy o'quvchilariga matematika fanidan sifatli ta'lim beruvchi tajribali o'qituvchi qidirilmoqda. " +
        "Darslar online va offline formatda o'tkaziladi. Maktab va olimpiadaga tayyorlov dasturlari bo'yicha ishlash imkoniyati mavjud.",
      subject: 'Matematika',
      type: 'full-time',
      salary: { min: 3_000_000, max: 6_000_000, currency: 'UZS' },
      requirements: [
        "Oliy matematika yoki pedagogika ta'limi",
        'Kamida 2 yillik dars berish tajribasi',
        "O'zbek va rus tillarini bilish",
        "Onlayn dars berish ko'nikmasi",
        "Mas'uliyatlilik va punktuallik",
      ],
      isActive: true,
    },
    {
      title: "Ingliz tili o'qituvchisi",
      description:
        "Boshlang'ich va o'rta daraja o'quvchilariga Ingliz tilini o'rgatuvchi energik o'qituvchi kerak. " +
        "IELTS, TOEFL, suhbat va biznes ingliz tili yo'nalishlarida dars berish imkoniyati mavjud.",
      subject: 'Ingliz tili',
      type: 'full-time',
      salary: { min: 3_500_000, max: 7_000_000, currency: 'UZS' },
      requirements: [
        'IELTS 7.0+ yoki CEFR C1/C2 darajasi',
        "Kamida 1 yillik o'qitish tajribasi",
        'CELTA/DELTA sertifikati afzallik',
        'Kommunikativ uslubda dars berish',
        "Barcha yoshdagi o'quvchilar bilan ishlash qobiliyati",
      ],
      isActive: true,
    },
    {
      title: 'Frontend Developer (React)',
      description:
        "Parvoz Academy platformasini yangi funksiyalar bilan boyitish uchun malakali Frontend dasturchi kerak. " +
        'React, TypeScript va zamonaviy UI kutubxonalari bilan ishlash tajribasi talab qilinadi.',
      subject: 'IT',
      type: 'full-time',
      salary: { min: 5_000_000, max: 12_000_000, currency: 'UZS' },
      requirements: [
        'React 18+ va TypeScript bilimi',
        'Redux Toolkit / RTK Query tajribasi',
        'REST API bilan ishlash',
        'Git, CI/CD tushunchasi',
        'Kamida 2 yillik commercial tajriba',
      ],
      isActive: true,
    },
    {
      title: 'SMM va Marketing Mutaxassisi',
      description:
        "Parvoz Academy ijtimoiy tarmoqdagi faoliyatini boshqarish va yangi o'quvchilarni jalb qilish uchun " +
        "ijodiy va natijaga yo'naltirilgan SMM mutaxassis qidirilmoqda.",
      subject: 'Marketing',
      type: 'full-time',
      salary: { min: 2_500_000, max: 5_000_000, currency: 'UZS' },
      requirements: [
        'Instagram, Telegram, YouTube bilan ishlash tajribasi',
        "Kontent yaratish va kopyrayting ko'nikmasi",
        'Targeted reklama (Meta Ads, Google Ads) bilimi',
        'Grafik dizayn asoslari (Canva/Figma)',
      ],
      isActive: true,
    },
    {
      title: 'IT Amaliyotchi (Junior Developer)',
      description:
        "Dasturlashni endigina o'rganayotgan va real loyihada tajriba orttirmoqchi bo'lgan talabalar uchun " +
        "amaliyot o'rni. Mentor nazoratida ishlaysiz, haqiqiy kod yozasiz va jamoada rivojlanasiz.",
      subject: 'IT',
      type: 'internship',
      salary: { min: 800_000, max: 2_000_000, currency: 'UZS' },
      requirements: [
        'HTML, CSS, JavaScript asoslari',
        'Git bilan ishlash (asosiy buyruqlar)',
        "O'rganishga ishtiyoq va mas'uliyatlilik",
        "Haftada kamida 20 soat ajrata olish qobiliyati",
      ],
      isActive: true,
    },
  ];

  const docs = await Vacancy.insertMany(vacancies);
  console.log(`✓ ${docs.length} ta vakansiya qo'shildi`);
}

await mongoose.disconnect();
console.log('✓ Done.');
process.exit(0);
