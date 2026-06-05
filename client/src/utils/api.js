import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { clearCredentials, setAccessToken } from '../features/auth/authSlice.js';

const rawBase = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: 'include',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// Auto-refresh on 401
const baseQueryWithReauth = async (args, api, extra) => {
  let result = await rawBase(args, api, extra);

  if (result.error?.status === 401) {
    const refresh = await rawBase(
      { url: '/auth/refresh', method: 'POST' },
      api,
      extra,
    );
    if (refresh.data?.data?.accessToken) {
      api.dispatch(setAccessToken(refresh.data.data.accessToken));
      result = await rawBase(args, api, extra);
    } else {
      api.dispatch(clearCredentials());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User', 'Course', 'Module', 'Lesson',
    'Group', 'GroupMember', 'Homework', 'Submission',
    'Test', 'TestResult', 'PlacementTest', 'Question', 'Attendance',
    'Payment', 'Notification', 'Vacancy', 'Settings', 'TariffPlan',
    'Review', 'Dashboard', 'Enrollment', 'Session', 'TeacherDashboard',
  ],
  endpoints: () => ({}),
});
