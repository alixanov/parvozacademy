import { createSlice } from '@reduxjs/toolkit';

// ─── Shared constants (exported for use in pages) ──────────────────────────────
export const COURSE_COLORS = {
  'Matematika (DTM)':    '#1976D2',
  'Ingliz tili (IELTS)': '#EF4444',
  'Frontend React':      '#7C3AED',
  "Ona tili (DTM)":      '#10B981',
  "O'zbekiston tarixi":  '#F97316',
  'Python & ML':         '#F59E0B',
};

export const COURSES_LIST = Object.keys(COURSE_COLORS);

export const PALETTE = ['#1976D2','#EF4444','#7C3AED','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4'];

export const DAYS_LIST = ['Du','Se','Ch','Pa','Ju','Sh'];

// Maps short day code → ISO date string for the current calendar week
const _getMonday = () => {
  const d   = new Date();
  const dow = d.getDay() || 7;          // Sunday → 7
  d.setDate(d.getDate() - dow + 1);
  d.setHours(0, 0, 0, 0);
  return d;
};
const _monday = _getMonday();
export const DAY_DATES = DAYS_LIST.reduce((acc, key, i) => {
  const d = new Date(_monday);
  d.setDate(_monday.getDate() + i);
  acc[key] = d.toISOString().slice(0, 10);
  return acc;
}, {});

export const DAY_LABELS = {
  'Du': 'Dushanba',
  'Se': 'Seshanba',
  'Ch': 'Chorshanba',
  'Pa': 'Payshanba',
  'Ju': 'Juma',
  'Sh': 'Shanba',
};

/** Add `minutes` to "HH:MM" string, returns "HH:MM" */
export const addMinutesToTime = (timeStr, minutes) => {
  const [h, m] = timeStr.split(':').map(Number);
  const total  = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2,'0')}:${String(nm).padStart(2,'0')}`;
};

// ─── Initial data (empty — all data comes from backend) ────────────────────────
const INIT_STUDENTS      = [];
const INIT_TEACHERS      = [];
const INIT_GROUPS        = [];
const INIT_PAYMENTS      = [];
const INIT_NOTIFICATIONS = [];

// ─── Internal counter for notification IDs ─────────────────────────────────────
let _nid = 200;
const nxtId = () => `n${++_nid}`;

// ─── Slice ─────────────────────────────────────────────────────────────────────
const lmsSlice = createSlice({
  name: 'lms',
  initialState: {
    students:      INIT_STUDENTS,
    teachers:      INIT_TEACHERS,
    groups:        INIT_GROUPS,
    payments:      INIT_PAYMENTS,
    notifications: INIT_NOTIFICATIONS,
  },
  reducers: {

    /* ── GROUPS ──────────────────────────────────────────────────────────────── */
    addGroup(state, { payload }) {
      const group = {
        ...payload,
        id: `g${Date.now()}`,
        status: 'active',
        createdAt: new Date().toISOString().slice(0, 10),
      };
      state.groups.push(group);

      // Notify teacher
      if (group.teacherId) {
        state.notifications.push({
          id: nxtId(), recipientRole: 'teacher', recipientId: group.teacherId,
          type: 'group_assigned',
          text: `Sizga "${group.name}" guruhi tayinlandi (${group.course}, ${group.days.join('/')} ${group.time})`,
          read: false, createdAt: new Date().toISOString(),
        });
      }
      // Notify each student
      group.studentIds.forEach((sid) => {
        state.notifications.push({
          id: nxtId(), recipientRole: 'student', recipientId: sid,
          type: 'added_to_group',
          text: `"${group.name}" guruhiga qo'shildingiz — ${group.course} · ${group.teacherName}`,
          read: false, createdAt: new Date().toISOString(),
        });
      });
      // Admin log
      state.notifications.push({
        id: nxtId(), recipientRole: 'admin', recipientId: 'admin',
        type: 'group_created',
        text: `Yangi guruh yaratildi: "${group.name}" — ${group.course}, ${group.studentIds.length} o'quvchi`,
        read: false, createdAt: new Date().toISOString(),
      });
    },

    updateGroup(state, { payload }) {
      const { id, ...changes } = payload;
      const idx = state.groups.findIndex((g) => g.id === id);
      if (idx === -1) return;
      const oldGroup = state.groups[idx];
      state.groups[idx] = { ...oldGroup, ...changes };

      // Notify newly-added students
      const added = (changes.studentIds ?? []).filter((sid) => !oldGroup.studentIds.includes(sid));
      added.forEach((sid) => {
        state.notifications.push({
          id: nxtId(), recipientRole: 'student', recipientId: sid,
          type: 'added_to_group',
          text: `"${state.groups[idx].name}" guruhiga qo'shildingiz — ${state.groups[idx].course} · ${state.groups[idx].teacherName}`,
          read: false, createdAt: new Date().toISOString(),
        });
      });
      // Notify new teacher if changed
      if (changes.teacherId && changes.teacherId !== oldGroup.teacherId) {
        state.notifications.push({
          id: nxtId(), recipientRole: 'teacher', recipientId: changes.teacherId,
          type: 'group_assigned',
          text: `Sizga "${state.groups[idx].name}" guruhi tayinlandi`,
          read: false, createdAt: new Date().toISOString(),
        });
      }
    },

    deleteGroup(state, { payload: id }) {
      state.groups = state.groups.filter((g) => g.id !== id);
    },

    /* ── TEACHERS ─────────────────────────────────────────────────────────────── */
    addTeacher(state, { payload }) {
      state.teachers.push({
        ...payload,
        id: `t${Date.now()}`,
        rating: 5.0,
        avatar: payload.name[0].toUpperCase(),
        color: PALETTE[state.teachers.length % PALETTE.length],
      });
    },

    updateTeacher(state, { payload }) {
      const { id, ...changes } = payload;
      const idx = state.teachers.findIndex((t) => t.id === id);
      if (idx !== -1) state.teachers[idx] = { ...state.teachers[idx], ...changes };
    },

    toggleTeacherActive(state, { payload: id }) {
      const t = state.teachers.find((t) => t.id === id);
      if (t) t.isActive = !t.isActive;
    },

    deleteTeacher(state, { payload: id }) {
      state.teachers = state.teachers.filter((t) => t.id !== id);
    },

    /* ── STUDENTS ─────────────────────────────────────────────────────────────── */
    addStudent(state, { payload }) {
      state.students.push({
        ...payload,
        id: `s${Date.now()}`,
        avatar: payload.name[0].toUpperCase(),
        color: PALETTE[state.students.length % PALETTE.length],
        isActive: true,
        joinDate: new Date().toISOString().slice(0, 10),
      });
    },

    updateStudent(state, { payload }) {
      const { id, ...changes } = payload;
      const idx = state.students.findIndex((s) => s.id === id);
      if (idx !== -1) state.students[idx] = { ...state.students[idx], ...changes };
    },

    toggleStudentActive(state, { payload: id }) {
      const s = state.students.find((s) => s.id === id);
      if (s) s.isActive = !s.isActive;
    },

    deleteStudent(state, { payload: id }) {
      state.groups.forEach((g) => { g.studentIds = g.studentIds.filter((sid) => sid !== id); });
      state.students = state.students.filter((s) => s.id !== id);
    },

    /* ── NOTIFICATIONS ────────────────────────────────────────────────────────── */
    markRead(state, { payload: id }) {
      const n = state.notifications.find((n) => n.id === id);
      if (n) n.read = true;
    },

    markAllRead(state, { payload: { role, recipientId } }) {
      state.notifications.forEach((n) => {
        if (n.recipientRole === role && (!recipientId || n.recipientId === recipientId)) n.read = true;
      });
    },

    /* ── PAYMENTS ─────────────────────────────────────────────────────────────── */
    addPayment(state, { payload }) {
      state.payments.push({ ...payload, id: `pay${Date.now()}` });
      state.notifications.push({
        id: nxtId(), recipientRole: 'student', recipientId: payload.studentId,
        type: 'payment',
        text: `To'lov qabul qilindi: ${new Intl.NumberFormat('ru-RU').format(payload.amount)} so'm (${payload.groupName})`,
        read: false, createdAt: new Date().toISOString(),
      });
      state.notifications.push({
        id: nxtId(), recipientRole: 'admin', recipientId: 'admin',
        type: 'payment',
        text: `Yangi to'lov: ${payload.studentName} — ${new Intl.NumberFormat('ru-RU').format(payload.amount)} so'm (${payload.groupName})`,
        read: false, createdAt: new Date().toISOString(),
      });
    },

    updatePaymentStatus(state, { payload: { id, status } }) {
      const p = state.payments.find((p) => p.id === id);
      if (p) p.status = status;
    },
  },
});

// ─── Actions ───────────────────────────────────────────────────────────────────
export const {
  addGroup, updateGroup, deleteGroup,
  addTeacher, updateTeacher, toggleTeacherActive, deleteTeacher,
  addStudent, updateStudent, toggleStudentActive, deleteStudent,
  markRead, markAllRead,
  addPayment, updatePaymentStatus,
} = lmsSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────────
export const selectGroups        = (s) => s.lms.groups;
export const selectTeachers      = (s) => s.lms.teachers;
export const selectStudents      = (s) => s.lms.students;
export const selectPayments      = (s) => s.lms.payments;
export const selectNotifications = (s) => s.lms.notifications;

/** Groups belonging to a teacher (by teacher id) */
export const selectTeacherGroups  = (tid) => (s) => s.lms.groups.filter((g) => g.teacherId === tid);
/** Groups a student is enrolled in (by student id) */
export const selectStudentGroups  = (sid) => (s) => s.lms.groups.filter((g) => g.studentIds.includes(sid));
/** Teacher record matched by display name (for demo auth) */
export const selectTeacherByName  = (name) => (s) =>
  s.lms.teachers.find((t) => t.name.toLowerCase() === (name ?? '').toLowerCase()) ?? null;
/** Student record matched by display name (for demo auth) */
export const selectStudentByName  = (name) => (s) =>
  s.lms.students.find((t) => t.name.toLowerCase() === (name ?? '').toLowerCase()) ?? null;
/** Unread count for a given role+recipientId */
export const selectUnreadCount    = (role, rid) => (s) =>
  s.lms.notifications.filter((n) => n.recipientRole === role && n.recipientId === rid && !n.read).length;

export default lmsSlice.reducer;
