import { baseApi } from '../../utils/api.js';

export const sessionsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({

    // GET /sessions?group=<id>&status=&from=&to=&page=&limit=
    getSessionsByGroup: b.query({
      query: (p = {}) => {
        const q = new URLSearchParams({ group: p.group });
        if (p.status) q.set('status', p.status);
        if (p.from)   q.set('from',   p.from);
        if (p.to)     q.set('to',     p.to);
        if (p.page)   q.set('page',   p.page);
        if (p.limit)  q.set('limit',  p.limit);
        return `/sessions?${q.toString()}`;
      },
      providesTags: (_r, _e, p) => ['Session', { type: 'Session', id: `group-${p.group}` }],
    }),

    // GET /sessions/teacher?dateRange=today|week|month&status=&teacherId=(admin only)
    getTeacherSessions: b.query({
      query: (p = {}) => {
        const q = new URLSearchParams();
        if (p.dateRange) q.set('dateRange', p.dateRange);
        if (p.status)    q.set('status',    p.status);
        if (p.teacherId) q.set('teacherId', p.teacherId);
        if (p.page)      q.set('page',      p.page);
        if (p.limit)     q.set('limit',     p.limit);
        const qs = q.toString();
        return `/sessions/teacher${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Session'],
    }),

    // GET /sessions/:id
    getSessionById: b.query({
      query: (id) => `/sessions/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Session', id }],
    }),

    // POST /sessions (admin)
    createSession: b.mutation({
      query: (body) => ({ url: '/sessions', method: 'POST', body }),
      invalidatesTags: ['Session'],
    }),

    // PATCH /sessions/:id
    updateSession: b.mutation({
      query: ({ id, ...body }) => ({ url: `/sessions/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['Session', { type: 'Session', id }],
    }),

    // POST /sessions/:id/link — teacher sends join link, students notified
    sendSessionLink: b.mutation({
      query: ({ id, url, type }) => ({
        url:    `/sessions/${id}/link`,
        method: 'POST',
        body:   { url, type },
      }),
      invalidatesTags: (_r, _e, { id }) => ['Session', { type: 'Session', id }],
    }),

    // PATCH /sessions/:id/complete
    completeSession: b.mutation({
      query: ({ id, topic, notes }) => ({
        url:    `/sessions/${id}/complete`,
        method: 'PATCH',
        body:   { topic, notes },
      }),
      invalidatesTags: (_r, _e, { id }) => ['Session', { type: 'Session', id }],
    }),

    // PATCH /sessions/:id/cancel (admin)
    cancelSession: b.mutation({
      query: (id) => ({ url: `/sessions/${id}/cancel`, method: 'PATCH' }),
      invalidatesTags: (_r, _e, id) => ['Session', { type: 'Session', id }],
    }),

    // POST /sessions/:id/materials
    addSessionMaterials: b.mutation({
      query: ({ id, materials }) => ({
        url:    `/sessions/${id}/materials`,
        method: 'POST',
        body:   { materials },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Session', id }],
    }),

    // DELETE /sessions/:id/materials/:idx
    removeSessionMaterial: b.mutation({
      query: ({ id, idx }) => ({
        url:    `/sessions/${id}/materials/${idx}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'Session', id }],
    }),

    // POST /sessions/:id/homework
    createSessionHomework: b.mutation({
      query: ({ id, ...body }) => ({
        url:    `/sessions/${id}/homework`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ['Homework', { type: 'Session', id }],
    }),

    // GET /sessions/:id/homework
    getSessionHomework: b.query({
      query: (id) => `/sessions/${id}/homework`,
      providesTags: (_r, _e, id) => ['Homework', { type: 'Session', id }],
    }),

    // GET /sessions/:id/attendance
    getSessionAttendance: b.query({
      query: (id) => `/sessions/${id}/attendance`,
      providesTags: (_r, _e, id) => ['Attendance', { type: 'Session', id }],
    }),

    // POST /sessions/generate/:groupId
    generateGroupSessions: b.mutation({
      query: (groupId) => ({ url: `/sessions/generate/${groupId}`, method: 'POST' }),
      invalidatesTags: ['Session'],
    }),
  }),
});

export const {
  useGetSessionsByGroupQuery,
  useGetTeacherSessionsQuery,
  useGetSessionByIdQuery,
  useCreateSessionMutation,
  useUpdateSessionMutation,
  useSendSessionLinkMutation,
  useCompleteSessionMutation,
  useCancelSessionMutation,
  useAddSessionMaterialsMutation,
  useRemoveSessionMaterialMutation,
  useCreateSessionHomeworkMutation,
  useGetSessionHomeworkQuery,
  useGetSessionAttendanceQuery,
  useGenerateGroupSessionsMutation,
} = sessionsApi;
