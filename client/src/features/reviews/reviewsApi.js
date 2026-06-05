import { baseApi } from '../../utils/api.js';

export const reviewsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /reviews  (public — approved only)
    getReviews: b.query({
      query: (p = {}) => {
        const q = new URLSearchParams();
        if (p.page)     q.set('page',     p.page);
        if (p.limit)    q.set('limit',    p.limit);
        if (p.courseId) q.set('courseId', p.courseId);
        const qs = q.toString();
        return `/reviews${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Review'],
    }),

    // GET /reviews/admin  (admin — all statuses)
    getAdminReviews: b.query({
      query: (p = {}) => {
        const q = new URLSearchParams();
        if (p.page)   q.set('page',   p.page);
        if (p.limit)  q.set('limit',  p.limit);
        if (p.status) q.set('status', p.status);
        const qs = q.toString();
        return `/reviews/admin${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Review'],
    }),

    // POST /reviews  (public)
    createReview: b.mutation({
      query: (body) => ({ url: '/reviews', method: 'POST', body }),
      invalidatesTags: ['Review'],
    }),

    // PATCH /reviews/:id/status  (admin)
    setReviewStatus: b.mutation({
      query: ({ id, status }) => ({
        url:    `/reviews/${id}/status`,
        method: 'PATCH',
        body:   { status },
      }),
      invalidatesTags: ['Review'],
    }),

    // DELETE /reviews/:id  (admin)
    deleteReview: b.mutation({
      query: (id) => ({ url: `/reviews/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Review'],
    }),
  }),
});

export const {
  useGetReviewsQuery,
  useGetAdminReviewsQuery,
  useCreateReviewMutation,
  useSetReviewStatusMutation,
  useDeleteReviewMutation,
} = reviewsApi;
