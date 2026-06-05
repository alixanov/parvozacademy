import { baseApi } from '../../utils/api.js';

export const attendanceApi = baseApi.injectEndpoints({
  endpoints: (b) => ({

    // GET /attendance?session=<id>  or  ?lesson=<id>  or  ?group=<id>
    getAttendance: b.query({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.session) q.set('session', params.session);
        if (params.lesson)  q.set('lesson',  params.lesson);
        if (params.group)   q.set('group',   params.group);
        if (params.student) q.set('student', params.student);
        return `/attendance?${q.toString()}`;
      },
      providesTags: ['Attendance'],
    }),

    // POST /attendance  — mark single student
    markAttendance: b.mutation({
      query: (body) => ({ url: '/attendance', method: 'POST', body }),
      invalidatesTags: (_r, _e, { sessionId, lessonId }) => [
        'Attendance',
        sessionId ? { type: 'Session', id: sessionId } : null,
        lessonId  ? { type: 'Lesson',  id: lessonId  } : null,
      ].filter(Boolean),
    }),

    // PUT /attendance/bulk  — upsert many records at once
    bulkMarkAttendance: b.mutation({
      query: (body) => ({ url: '/attendance/bulk', method: 'PUT', body }),
      invalidatesTags: (_r, _e, { sessionId }) => [
        'Attendance',
        sessionId ? { type: 'Session', id: sessionId } : null,
      ].filter(Boolean),
    }),

    // GET /attendance/summary?group=<id>
    getAttendanceSummary: b.query({
      query: (groupId) => `/attendance/summary?group=${groupId}`,
      providesTags: (_r, _e, groupId) => ['Attendance', { type: 'Group', id: groupId }],
    }),
  }),
});

export const {
  useGetAttendanceQuery,
  useMarkAttendanceMutation,
  useBulkMarkAttendanceMutation,
  useGetAttendanceSummaryQuery,
} = attendanceApi;
