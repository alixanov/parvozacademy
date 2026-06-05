import { baseApi } from '../../utils/api.js';

export const groupsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /groups  (admin or teacher)
    getGroups: b.query({
      query: (p = {}) => {
        const q = new URLSearchParams();
        if (p.teacherId) q.set('teacherId', p.teacherId);
        if (p.courseId)  q.set('courseId',  p.courseId);
        if (p.isActive !== undefined) q.set('isActive', p.isActive);
        if (p.page)  q.set('page',  p.page);
        if (p.limit) q.set('limit', p.limit);
        const qs = q.toString();
        return `/groups${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Group'],
    }),

    // GET /groups/:id  (admin or teacher)
    getGroupById: b.query({
      query: (id) => `/groups/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Group', id }],
    }),

    // GET /groups/:id/members  (admin or teacher)
    getGroupMembers: b.query({
      query: (id) => `/groups/${id}/members`,
      providesTags: (_r, _e, id) => [{ type: 'Group', id }, 'GroupMember'],
    }),

    // POST /groups  (admin)
    createGroup: b.mutation({
      query: (body) => ({ url: '/groups', method: 'POST', body }),
      invalidatesTags: ['Group'],
    }),

    // PUT /groups/:id  (admin)
    updateGroup: b.mutation({
      query: ({ id, ...body }) => ({ url: `/groups/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['Group', { type: 'Group', id }],
    }),

    // PATCH /groups/:id/active  (admin) — legacy toggle
    setGroupActive: b.mutation({
      query: ({ id, isActive }) => ({
        url: `/groups/${id}/active`, method: 'PATCH', body: { isActive },
      }),
      invalidatesTags: (_r, _e, { id }) => ['Group', { type: 'Group', id }],
    }),

    // PATCH /groups/:id/activate  (admin) — full activation: sets startDate, generates payments
    activateGroup: b.mutation({
      query: ({ id, startDate }) => ({
        url: `/groups/${id}/activate`,
        method: 'PATCH',
        body: { startDate },
      }),
      invalidatesTags: (_r, _e, { id }) => ['Group', { type: 'Group', id }, 'GroupMember', 'Payment', 'Session'],
    }),

    // PATCH /groups/:id/complete  (admin) — finish course, graduate students
    completeGroup: b.mutation({
      query: (id) => ({ url: `/groups/${id}/complete`, method: 'PATCH' }),
      invalidatesTags: (_r, _e, id) => ['Group', { type: 'Group', id }, 'GroupMember'],
    }),

    // DELETE /groups/:id  (admin)
    deleteGroup: b.mutation({
      query: (id) => ({ url: `/groups/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Group'],
    }),

    // POST /groups/:id/members  (admin) — добавить студента
    addGroupMember: b.mutation({
      query: ({ groupId, studentId }) => ({
        url:    `/groups/${groupId}/members`,
        method: 'POST',
        body:   { studentId },
      }),
      invalidatesTags: (_r, _e, { groupId }) => ['GroupMember', { type: 'Group', id: groupId }],
    }),

    // DELETE /groups/:id/members/:studentId  (admin)
    removeGroupMember: b.mutation({
      query: ({ groupId, studentId }) => ({
        url:    `/groups/${groupId}/members/${studentId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { groupId }) => ['GroupMember', { type: 'Group', id: groupId }],
    }),

    // GET /groups/my  (any authenticated — returns student's own groups)
    getMyGroups: b.query({
      query: () => '/groups/my',
      providesTags: ['Group'],
    }),

    // GET /groups/my-students  (teacher — returns all students in teacher's groups)
    getMyStudents: b.query({
      query: () => '/groups/my-students',
      providesTags: ['Group', 'GroupMember'],
    }),

    // GET /groups/:id/members/payments  (admin/teacher) — members + payment status
    getGroupMembersWithPayments: b.query({
      query: (id) => `/groups/${id}/members/payments`,
      providesTags: (_r, _e, id) => [{ type: 'Group', id }, 'GroupMember', 'Payment'],
    }),

    // PATCH /groups/:id/members/:studentId/access  (admin) — grant/revoke manual access
    setMemberAccess: b.mutation({
      query: ({ groupId, studentId, manualAccessGranted }) => ({
        url:    `/groups/${groupId}/members/${studentId}/access`,
        method: 'PATCH',
        body:   { manualAccessGranted },
      }),
      invalidatesTags: (_r, _e, { groupId }) => ['GroupMember', { type: 'Group', id: groupId }],
    }),
  }),
});

export const {
  useGetGroupsQuery,
  useGetGroupByIdQuery,
  useGetGroupMembersQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useSetGroupActiveMutation,
  useActivateGroupMutation,
  useCompleteGroupMutation,
  useDeleteGroupMutation,
  useAddGroupMemberMutation,
  useRemoveGroupMemberMutation,
  useGetMyGroupsQuery,
  useGetMyStudentsQuery,
  useGetGroupMembersWithPaymentsQuery,
  useSetMemberAccessMutation,
} = groupsApi;
