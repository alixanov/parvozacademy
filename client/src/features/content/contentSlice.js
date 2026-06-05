import { createSlice, current } from '@reduxjs/toolkit';

const KEY = 'parvoz_content';
const load  = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
// Use current() to convert Immer draft → plain JS before JSON.stringify
const save  = (s)  => { try { localStorage.setItem(KEY, JSON.stringify(current(s))); } catch {} };

/* ── Default data ────────────────────────────────────────────── */
export const DEFAULT_SUBJECTS = [
  { id: 'math',    color: '#1976D2', isActive: true },
  { id: 'uzbek',   color: '#10B981', isActive: true },
  { id: 'history', color: '#F59E0B', isActive: true },
  { id: 'english', color: '#EF4444', isActive: true },
  { id: 'it',      color: '#7C3AED', isActive: true },
];

export const DEFAULT_REVIEWS = [
  { id: 'r1', name: 'Dilnoza Yusupova', avatar: 'D', rating: 5,
    roleUz: "IT kursi o'quvchisi",  roleRu: 'Ученик IT курса',
    textUz: "PARVOZ ACADEMY'da o'qish hayotimni o'zgartirdi. 6 oyda dasturchi bo'ldim!",
    textRu: 'Учёба в PARVOZ ACADEMY изменила мою жизнь. За 6 месяцев стал программистом!' },
  { id: 'r2', name: 'Bobur Toshmatov',  avatar: 'B', rating: 5,
    roleUz: 'Matematika kursi',      roleRu: 'Курс математики',
    textUz: "O'qituvchilar juda professional. DTM da 90+ ball oldim!",
    textRu: 'Преподаватели очень профессиональные. Набрал 90+ баллов на ЦТ!' },
  { id: 'r3', name: 'Malika Rahimova', avatar: 'M', rating: 5,
    roleUz: "Ingliz tili kursi",     roleRu: 'Курс английского языка',
    textUz: "IELTS 7.0 ball oldim. Bu ajoyib akademiyaga minnatdorman!",
    textRu: 'Получил IELTS 7.0. Благодарен этой замечательной академии!' },
];

export const DEFAULT_TEAM = [
  { id: 't1', name: 'Alisher Nazarov',   avatar: 'A', color: '#1976D2',
    roleUz: 'Direktur',                             roleRu: 'Директор',
    bioUz: "15 yil ta'lim sohasida tajriba. PARVOZ ACADEMY asoschilaridan biri.",
    bioRu: '15 лет опыта в сфере образования. Один из основателей PARVOZ ACADEMY.' },
  { id: 't2', name: 'Sabohat Mirzayeva', avatar: 'S', color: '#7C3AED',
    roleUz: "Metodika bo'lim boshlig'i",             roleRu: 'Руководитель методического отдела',
    bioUz: "O'zbekiston Milliy Universiteti metodist eksperti. 12 yil pedagogik tajriba.",
    bioRu: 'Эксперт-методист НУУз. 12 лет педагогического опыта.' },
  { id: 't3', name: 'Kamol Tursunov',    avatar: 'K', color: '#10B981',
    roleUz: "IT bo'limi rahbari",                    roleRu: 'Руководитель IT-отдела',
    bioUz: 'Senior Full-Stack Developer. EPAM Systems, AralTech kompaniyalarida ishlagan.',
    bioRu: 'Senior Full-Stack Developer. Работал в EPAM Systems, AralTech.' },
];

export const DEFAULT_TEST_SUBJECTS = [
  { id: 'all',     labelUz: 'Aralash (barcha fanlar)',  labelRu: 'Смешанный (все предметы)', color: '#64748B', questions: 10, minutes: 10 },
  { id: 'math',    labelUz: 'Matematika',               labelRu: 'Математика',              color: '#1976D2', questions: 10, minutes: 10 },
  { id: 'english', labelUz: 'Ingliz tili',              labelRu: 'Английский язык',          color: '#EF4444', questions: 10, minutes: 10 },
  { id: 'uzbek',   labelUz: "Ona tili",                 labelRu: 'Родной язык',              color: '#10B981', questions: 10, minutes: 10 },
  { id: 'history', labelUz: 'Tarix',                    labelRu: 'История',                  color: '#F59E0B', questions: 10, minutes: 10 },
  { id: 'it',      labelUz: 'IT / Dasturlash',          labelRu: 'IT / Программирование',    color: '#7C3AED', questions: 10, minutes: 10 },
];

export const DEFAULT_PLANS = [
  { id: 'online',     price: 600000,  color: '#1976D2', popular: false,
    nameUz: 'Online',      nameRu: 'Онлайн',
    descUz: "Uydan qulay vaqtda o'qing", descRu: 'Учитесь из дома в удобное время',
    featuresUz: "Video darslar (HD sifat)\nOnlayn testlar va topshiriqlar\nTelegram guruh (24/7 yordam)\nUyga vazifalarni tekshirish\nOylik natija hisoboti\nMobil ilova orqali kirish",
    featuresRu: "Видеоуроки (HD качество)\nОнлайн тесты и задания\nTelegram группа (помощь 24/7)\nПроверка домашних заданий\nЕжемесячный отчёт успеваемости\nДоступ через мобильное приложение",
  },
  { id: 'offline',    price: 800000,  color: '#7C3AED', popular: true,
    nameUz: 'Offline',     nameRu: 'Оффлайн',
    descUz: "Akademiyada bevosita mashg'ulotlar", descRu: 'Очные занятия в академии',
    featuresUz: "Jonli darslar (kichik guruhlar)\nVideo yozuvlar (takrorlash uchun)\nUyga vazifalar va testlar\nBepul qo'shimcha darslar\nOylik ota-ona yig'ilishi\nSertifikat (kurs oxirida)\nKutubxona va resurslar",
    featuresRu: "Очные уроки (малые группы)\nЗаписи видео (для повторения)\nДомашние задания и тесты\nБесплатные дополнительные занятия\nЕжемесячное родительское собрание\nСертификат (по окончании курса)\nБиблиотека и ресурсы",
  },
  { id: 'individual_offline', price: 1500000, color: '#7C3AED', popular: false,
    nameUz: 'Individual Oflayn',  nameRu: 'Индивидуальный Оффлайн',
    descUz: "Yakkama-yakka, o'quv markazda", descRu: 'Очно 1-на-1 в учебном центре',
    featuresUz: "Individual jadval\n1-ga-1 jonli darslar\nShaxsiy o'quv dasturi\nTezlashtirilgan natija\nWhatsApp / Telegram orqali savol\nHaftalik rivojlanish hisoboti\nImtihon tayyorlash strategiyasi\nKafolatlangan natija",
    featuresRu: "Индивидуальное расписание\nОчные занятия 1-на-1\nПерсональная программа обучения\nУскоренный результат\nВопросы через WhatsApp / Telegram\nЕженедельный отчёт прогресса\nСтратегия подготовки к экзамену\nГарантированный результат",
  },
  { id: 'individual_online', price: 1200000, color: '#EC4899', popular: false,
    nameUz: 'Individual Onlayn',  nameRu: 'Индивидуальный Онлайн',
    descUz: "Yakkama-yakka, Zoom orqali", descRu: 'Онлайн 1-на-1 через Zoom',
    featuresUz: "Individual jadval\n1-ga-1 onlayn darslar (Zoom)\nBarcha darslar yozib olinadi\nShaxsiy o'quv dasturi\nTezlashtirilgan natija\nWhatsApp / Telegram orqali savol\nHaftalik rivojlanish hisoboti\nKafolatlangan natija",
    featuresRu: "Индивидуальное расписание\nОнлайн занятия 1-на-1 (Zoom)\nЗаписи всех занятий\nПерсональная программа обучения\nУскоренный результат\nВопросы через WhatsApp / Telegram\nЕженедельный отчёт прогресса\nГарантированный результат",
  },
];

/* ── Slice ───────────────────────────────────────────────────── */
const s = load();

const contentSlice = createSlice({
  name: 'content',
  initialState: {
    subjects:             s.subjects             ?? DEFAULT_SUBJECTS,
    homeReviews:          s.homeReviews          ?? DEFAULT_REVIEWS,
    team:                 s.team                 ?? DEFAULT_TEAM,
    testSubjects:         s.testSubjects         ?? DEFAULT_TEST_SUBJECTS,
    plans:                s.plans                ?? DEFAULT_PLANS,
    courseCustomizations: s.courseCustomizations ?? {}, // { [courseId]: { iconKey, color } }
    teachersSection:      s.teachersSection
      ? { show: s.teachersSection.show ?? true, limit: [3, 6].includes(s.teachersSection.limit) ? s.teachersSection.limit : 3 }
      : { show: true, limit: 3 },
  },
  reducers: {
    /* ── Subjects ── */
    upsertSubject(state, { payload }) {
      const i = state.subjects.findIndex((x) => x.id === payload.id);
      if (i >= 0) state.subjects[i] = payload; else state.subjects.push(payload);
      save(state);
    },
    deleteSubject(state, { payload: id }) {
      state.subjects = state.subjects.filter((x) => x.id !== id);
      save(state);
    },
    /** Toggle isActive for a subject (creates entry if not yet in Redux) */
    setSubjectActive(state, { payload: { id, isActive, color } }) {
      const s = state.subjects.find((x) => x.id === id);
      if (s) {
        s.isActive = isActive;
      } else {
        state.subjects.push({ id, color: color ?? '#64748B', isActive });
      }
      save(state);
    },

    /* ── Reviews ── */
    upsertReview(state, { payload }) {
      const i = state.homeReviews.findIndex((x) => x.id === payload.id);
      if (i >= 0) state.homeReviews[i] = payload; else state.homeReviews.push(payload);
      save(state);
    },
    deleteReview(state, { payload: id }) {
      state.homeReviews = state.homeReviews.filter((x) => x.id !== id);
      save(state);
    },

    /* ── Team ── */
    upsertTeamMember(state, { payload }) {
      const i = state.team.findIndex((x) => x.id === payload.id);
      if (i >= 0) state.team[i] = payload; else state.team.push(payload);
      save(state);
    },
    deleteTeamMember(state, { payload: id }) {
      state.team = state.team.filter((x) => x.id !== id);
      save(state);
    },

    /* ── Test subjects ── */
    upsertTestSubject(state, { payload }) {
      const i = state.testSubjects.findIndex((x) => x.id === payload.id);
      if (i >= 0) state.testSubjects[i] = payload; else state.testSubjects.push(payload);
      save(state);
    },
    deleteTestSubject(state, { payload: id }) {
      state.testSubjects = state.testSubjects.filter((x) => x.id !== id);
      save(state);
    },

    /* ── Course customizations (icon + color per course) ── */
    setCourseCustomization(state, { payload: { id, iconKey, color } }) {
      // Spread into new object so Immer produces a new reference → useSelector re-renders
      state.courseCustomizations = {
        ...state.courseCustomizations,
        [id]: { iconKey, color },
      };
      save(state);
    },

    /* ── Plans ── */
    upsertPlan(state, { payload }) {
      const i = state.plans.findIndex((x) => x.id === payload.id);
      if (i >= 0) state.plans[i] = payload; else state.plans.push(payload);
      save(state);
    },
    deletePlan(state, { payload: id }) {
      state.plans = state.plans.filter((x) => x.id !== id);
      save(state);
    },

    /* ── Teachers section settings ── */
    setTeachersSection(state, { payload: { show, limit } }) {
      state.teachersSection = { show, limit };
      save(state);
    },
  },
});

export const {
  upsertSubject, deleteSubject, setSubjectActive,
  upsertReview, deleteReview,
  upsertTeamMember, deleteTeamMember,
  upsertTestSubject, deleteTestSubject,
  upsertPlan, deletePlan,
  setCourseCustomization,
  setTeachersSection,
} = contentSlice.actions;

export const selectCourseCustomizations = (s) => s.content.courseCustomizations;

export default contentSlice.reducer;

/* ── Selectors ── */
export const selectSubjects        = (s) => s.content.subjects;
export const selectHomeReviews     = (s) => s.content.homeReviews;
export const selectTeam            = (s) => s.content.team;
export const selectTestSubjects    = (s) => s.content.testSubjects;
export const selectPlans           = (s) => s.content.plans;
export const selectTeachersSection = (s) => s.content.teachersSection;
