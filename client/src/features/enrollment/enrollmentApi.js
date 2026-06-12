import { baseApi } from '../../utils/api.js';

export const enrollmentApi = baseApi.injectEndpoints({
  endpoints: (b) => ({

    // POST /enrollment-applications  (public — no auth)
    submitApplication: b.mutation({
      query: (body) => ({ url: '/enrollment-applications', method: 'POST', body }),
      invalidatesTags: ['Enrollment'],
    }),

    // GET /enrollment-applications  (admin)
    getEnrollments: b.query({
      query: ({ page = 1, limit = 20, status = 'all' } = {}) =>
        `/enrollment-applications?page=${page}&limit=${limit}&status=${status}`,
      providesTags: ['Enrollment'],
    }),

    // GET /enrollment-applications/:id  (admin)
    getEnrollment: b.query({
      query: (id) => `/enrollment-applications/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Enrollment', id }],
    }),

    // PATCH /enrollment-applications/:id/approve  (admin)
    approveEnrollment: b.mutation({
      query: ({ id, groupId }) => ({
        url:    `/enrollment-applications/${id}/approve`,
        method: 'PATCH',
        body:   groupId ? { groupId } : {},
      }),
      invalidatesTags: ['Enrollment', 'Group', 'GroupMember', 'Payment', 'User', 'Course'],
    }),

    // PATCH /enrollment-applications/:id/reject  (admin)
    rejectEnrollment: b.mutation({
      query: ({ id, reason }) => ({
        url:    `/enrollment-applications/${id}/reject`,
        method: 'PATCH',
        body:   { reason },
      }),
      invalidatesTags: ['Enrollment'],
    }),

  }),
});

export const {
  useSubmitApplicationMutation,
  useGetEnrollmentsQuery,
  useGetEnrollmentQuery,
  useApproveEnrollmentMutation,
  useRejectEnrollmentMutation,
} = enrollmentApi;
