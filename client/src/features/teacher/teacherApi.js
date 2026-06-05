import { baseApi } from '../../utils/api.js';

export const teacherApi = baseApi.injectEndpoints({
  endpoints: (b) => ({

    // GET /teacher/dashboard
    getTeacherDashboard: b.query({
      query: () => '/teacher/dashboard',
      providesTags: ['TeacherDashboard'],
    }),

    // GET /teacher/groups
    getTeacherGroups: b.query({
      query: () => '/teacher/groups',
      providesTags: ['TeacherDashboard', 'Group'],
    }),

    // GET /teacher/groups/:groupId/history?page=&limit=
    getGroupHistory: b.query({
      query: ({ groupId, page = 1, limit = 20 }) => {
        const q = new URLSearchParams({ page, limit });
        return `/teacher/groups/${groupId}/history?${q.toString()}`;
      },
      providesTags: (_r, _e, { groupId }) => [{ type: 'Session', id: `group-${groupId}` }],
    }),

    // GET /teacher/groups/:groupId/attendance
    getGroupAttendanceSummary: b.query({
      query: (groupId) => `/teacher/groups/${groupId}/attendance`,
      providesTags: (_r, _e, groupId) => ['Attendance', { type: 'Group', id: groupId }],
    }),
  }),
});

export const {
  useGetTeacherDashboardQuery,
  useGetTeacherGroupsQuery,
  useGetGroupHistoryQuery,
  useGetGroupAttendanceSummaryQuery,
} = teacherApi;
