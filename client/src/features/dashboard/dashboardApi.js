import { baseApi } from '../../utils/api.js';

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /dashboard/admin  (admin)
    getAdminDashboard: b.query({
      query: () => '/dashboard/admin',
      providesTags: ['Dashboard'],
    }),

    // GET /dashboard/teacher  (admin or teacher)
    getTeacherDashboard: b.query({
      query: () => '/dashboard/teacher',
      providesTags: ['Dashboard'],
    }),

    // GET /dashboard/student  (student or admin) — ?groupId optional
    getStudentDashboard: b.query({
      query: ({ groupId } = {}) =>
        `/dashboard/student${groupId ? `?groupId=${groupId}` : ''}`,
      providesTags: ['Dashboard'],
    }),
  }),
});

export const {
  useGetAdminDashboardQuery,
  useGetTeacherDashboardQuery,
  useGetStudentDashboardQuery,
} = dashboardApi;
