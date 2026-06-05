import { createSlice } from '@reduxjs/toolkit';
import { clearCredentials } from '../auth/authSlice.js';

const STORAGE_KEY = 'parvoz_payment_state';

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      cardNumber:     state.cardNumber,
      verifications:  state.verifications,
      enrolledCourses: state.enrolledCourses,
    }));
  } catch { /* storage unavailable */ }
}

const saved = load();

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    /** Card number admin uses to receive payments */
    cardNumber: saved.cardNumber ?? '4916 9912 0121 0346',
    /** Array of verification requests from students */
    verifications: saved.verifications ?? [],
    /**
     * Map of userId → [courseId, …]
     * Populated when admin approves a verification
     */
    enrolledCourses: saved.enrolledCourses ?? {},
  },
  reducers: {
    setCardNumber(state, { payload }) {
      state.cardNumber = payload;
      persist(state);
    },

    /**
     * payload: {
     *   id, userId, userName, userEmail,
     *   courseId, courseTitle, amount,
     *   transactionId, note
     * }
     */
    submitVerification(state, { payload }) {
      // Replace any existing entry for this user+course so student can retry
      state.verifications = state.verifications.filter(
        (v) => !(v.userId === payload.userId && v.courseId === payload.courseId),
      );
      state.verifications.unshift({
        ...payload,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
        reviewNote: '',
      });
      persist(state);
    },

    approveVerification(state, { payload: id }) {
      const v = state.verifications.find((v) => v.id === id);
      if (v) {
        v.status     = 'approved';
        v.reviewedAt = new Date().toISOString();
        const prev = state.enrolledCourses[v.userId] ?? [];
        if (!prev.includes(v.courseId)) {
          state.enrolledCourses[v.userId] = [...prev, v.courseId];
        }
      }
      persist(state);
    },

    rejectVerification(state, { payload: { id, note } }) {
      const v = state.verifications.find((v) => v.id === id);
      if (v) {
        v.status     = 'rejected';
        v.reviewNote = note ?? '';
        v.reviewedAt = new Date().toISOString();
      }
      persist(state);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(clearCredentials, (state) => {
      state.verifications  = [];
      state.enrolledCourses = {};
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    });
  },
});

export const {
  setCardNumber,
  submitVerification,
  approveVerification,
  rejectVerification,
} = paymentSlice.actions;

export default paymentSlice.reducer;

/* ── Selectors ───────────────────────────────────────────────── */
export const selectCardNumber      = (s) => s.payment.cardNumber;
export const selectVerifications   = (s) => s.payment.verifications;
export const selectEnrolledCourses = (s) => s.payment.enrolledCourses;
export const selectPendingCount    = (s) =>
  s.payment.verifications.filter((v) => v.status === 'pending').length;
