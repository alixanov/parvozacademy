/**
 * Seed 5 real vacancies into the database.
 * Run: node --env-file=.env src/scripts/seedVacancies.js
 * (or with dotenv): node -r dotenv/config src/scripts/seedVacancies.js
 */
import { connectDB } from '../config/db.js';
import Vacancy from '../models/Vacancy.model.js';

const vacancies = [
  {
    title: 'Matematika o\'qituvchisi',
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
      'Onlayn dars berish ko\'nikmasi',
      'Mas\'uliyatlilik va punktuallik',
    ],
    isActive: true,
  },
  {
    title: 'Ingliz tili o\'qituvchisi',
    description:
      "Boshlang'ich va o'rta daraja o'quvchilariga Ingliz tilini o'rgatuvchi energik o'qituvchi kerak. " +
      "IELTS, TOEFL, suhbat va biznes ingliz tili yo'nalishlarida dars berish imkoniyati mavjud. " +
      "Natijaga yo'naltirilgan va zamonaviy metodologiyalarni qo'llaydigan mutaxassislarni ko'rib chiqamiz.",
    subject: 'Ingliz tili',
    type: 'full-time',
    salary: { min: 3_500_000, max: 7_000_000, currency: 'UZS' },
    requirements: [
      "IELTS 7.0+ yoki CEFR C1/C2 darajasi",
      'Kamida 1 yillik o\'qitish tajribasi',
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
      "React, TypeScript va zamonaviy UI kutubxonalari bilan ishlash tajribasi talab qilinadi. " +
      "Jamoada ishlash, kodni review qilish va mentoring imkoniyatlari mavjud.",
    subject: 'IT',
    type: 'full-time',
    salary: { min: 5_000_000, max: 12_000_000, currency: 'UZS' },
    requirements: [
      'React 18+ va TypeScript bilimi',
      'Redux Toolkit / RTK Query tajribasi',
      'REST API va GraphQL bilan ishlash',
      'Git, CI/CD tushunchasi',
      "UI/UX prinsiplarini tushunish",
      'Kamida 2 yillik commercial tajriba',
    ],
    isActive: true,
  },
  {
    title: 'SMM va Marketing Mutaxassisi',
    description:
      "Parvoz Academy ijtimoiy tarmoqdagi faoliyatini boshqarish va yangi o'quvchilarni jalb qilish uchun " +
      "ijodiy va natijaga yo'naltirilgan SMM mutaxassis qidirilmoqda. " +
      "Instagram, Telegram, YouTube kanallarini yuritish va reklama kampaniyalarini boshqarish vazifasini bajaradi.",
    subject: 'Marketing',
    type: 'full-time',
    salary: { min: 2_500_000, max: 5_000_000, currency: 'UZS' },
    requirements: [
      'Instagram, Telegram, YouTube bilan ishlash tajribasi',
      'Kontent yaratish va kopyrayting ko\'nikmasi',
      'Targeted reklama (Meta Ads, Google Ads) bilimi',
      'Grafik dizayn asoslari (Canva/Figma)',
      'Analitika: Reach, Engagement, CTR ko\'rsatkichlarini bilish',
    ],
    isActive: true,
  },
  {
    title: 'IT Amaliyotchi (Junior Developer)',
    description:
      "Dasturlashni endigina o'rganayotgan va real loyihada tajriba orttirmoqchi bo'lgan talabalar uchun " +
      "amaliyot o'rni. Mentor nazoratida ishlaysiz, haqiqiy kod yozasiz va jamoada rivojlanasiz. " +
      "Muvaffaqiyatli amaliyotdan so'ng doimiy ish o'rni taklif qilinadi.",
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

async function seed() {
  await connectDB();

  const existing = await Vacancy.countDocuments();
  if (existing > 0) {
    console.log(`⚠️  Ma'lumotlar bazasida allaqachon ${existing} ta vakansiya bor.`);
    console.log('   Takror qo\'shmaslik uchun skript to\'xtatildi.');
    console.log('   Qayta seed qilish uchun avval mavjud vakansiyalarni o\'chiring.');
    process.exit(0);
  }

  const docs = await Vacancy.insertMany(vacancies);
  console.log(`✅  ${docs.length} ta vakansiya muvaffaqiyatli qo'shildi:`);
  docs.forEach((v, i) => console.log(`   ${i + 1}. ${v.title}  (${v.type})`));
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed xatosi:', err.message);
  process.exit(1);
});
