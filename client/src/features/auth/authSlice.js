import { createSlice } from '@reduxjs/toolkit';

const LS_TOKEN = 'lms_at';
const LS_USER  = 'lms_user';

function loadFromStorage() {
  try {
    const token = localStorage.getItem(LS_TOKEN);
    const user  = JSON.parse(localStorage.getItem(LS_USER) || 'null');
    if (token && user) return { token, user };
  } catch { /* */ }
  return null;
}

const cached = loadFromStorage();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:            cached?.user  ?? null,
    accessToken:     cached?.token ?? null,
    isAuthenticated: !!cached,
    // If we have a cached token, mark as NOT initializing — video can load immediately.
    // AuthInitializer will still run a background refresh to validate/renew the token.
    initializing:    !cached,
  },
  reducers: {
    setCredentials(state, { payload }) {
      state.user            = payload.user;
      state.accessToken     = payload.accessToken;
      state.isAuthenticated = true;
      state.initializing    = false;
      // Persist to localStorage so next page load doesn't need to wait for refresh
      try {
        localStorage.setItem(LS_TOKEN, payload.accessToken);
        localStorage.setItem(LS_USER,  JSON.stringify(payload.user));
      } catch { /* */ }
    },
    clearCredentials(state) {
      state.user            = null;
      state.accessToken     = null;
      state.isAuthenticated = false;
      state.initializing    = false;
      try {
        localStorage.removeItem(LS_TOKEN);
        localStorage.removeItem(LS_USER);
      } catch { /* */ }
    },
    setAccessToken(state, { payload }) {
      state.accessToken = payload;
      try { localStorage.setItem(LS_TOKEN, payload); } catch { /* */ }
    },
    setInitializing(state, { payload }) {
      state.initializing = payload;
    },
  },
});

export const { setCredentials, clearCredentials, setAccessToken, setInitializing } =
  authSlice.actions;

export const selectAuth         = (s) => s.auth;
export const selectUser         = (s) => s.auth.user;
export const selectIsAuth       = (s) => s.auth.isAuthenticated;
export const selectAccessToken  = (s) => s.auth.accessToken;
export const selectInitializing = (s) => s.auth.initializing;

export default authSlice.reducer;
