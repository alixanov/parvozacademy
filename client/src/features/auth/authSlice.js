import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    initializing: true, // true until first refresh attempt completes
  },
  reducers: {
    setCredentials(state, { payload }) {
      state.user = payload.user;
      state.accessToken = payload.accessToken;
      state.isAuthenticated = true;
      state.initializing = false;
    },
    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.initializing = false;
    },
    setAccessToken(state, { payload }) {
      state.accessToken = payload;
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
