import { baseApi } from '../../utils/api.js';

export const paymentsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /payments  (admin)
    getPayments: b.query({
      query: (p = {}) => {
        const q = new URLSearchParams();
        if (p.studentId) q.set('studentId', p.studentId);
        if (p.groupId)   q.set('groupId',   p.groupId);
        if (p.month)     q.set('month',      p.month);
        if (p.status)    q.set('status',     p.status);
        if (p.page)      q.set('page',       p.page);
        if (p.limit)     q.set('limit',      p.limit);
        const qs = q.toString();
        return `/payments${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Payment'],
    }),

    // GET /payments/summary  (admin)
    getPaymentsSummary: b.query({
      query: ({ month } = {}) =>
        `/payments/summary${month ? `?month=${month}` : ''}`,
      providesTags: ['Payment'],
    }),

    // GET /payments/me  (student)
    getMyPayments: b.query({
      query: (p = {}) => {
        const q = new URLSearchParams();
        if (p.page)  q.set('page',  p.page);
        if (p.limit) q.set('limit', p.limit);
        if (p.month) q.set('month', p.month);
        const qs = q.toString();
        return `/payments/me${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Payment'],
    }),

    // POST /payments  (admin)
    createPayment: b.mutation({
      query: (body) => ({ url: '/payments', method: 'POST', body }),
      invalidatesTags: ['Payment'],
    }),

    // PATCH /payments/:id/confirm  (admin)
    confirmPayment: b.mutation({
      query: ({ id, ...body }) => ({
        url:    `/payments/${id}/confirm`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['Payment'],
    }),

    // PATCH /payments/:id/upload-receipt  (student)
    uploadPaymentReceipt: b.mutation({
      query: ({ id, receiptUrl }) => ({
        url:    `/payments/${id}/upload-receipt`,
        method: 'PATCH',
        body:   { receiptUrl },
      }),
      invalidatesTags: ['Payment'],
    }),

    // GET /payments/me/progress  (student) — per-group course progress
    getMyPaymentProgress: b.query({
      query: () => '/payments/me/progress',
      providesTags: ['Payment'],
    }),

    // POST /payments/generate  (admin) — generate debt records for student/group
    generatePayments: b.mutation({
      query: (body) => ({ url: '/payments/generate', method: 'POST', body }),
      invalidatesTags: ['Payment'],
    }),
  }),
});

export const {
  useGetPaymentsQuery,
  useGetPaymentsSummaryQuery,
  useGetMyPaymentsQuery,
  useCreatePaymentMutation,
  useConfirmPaymentMutation,
  useUploadPaymentReceiptMutation,
  useGetMyPaymentProgressQuery,
  useGeneratePaymentsMutation,
} = paymentsApi;
