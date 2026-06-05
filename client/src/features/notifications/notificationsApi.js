import { baseApi } from '../../utils/api.js';

export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /notifications  (any authenticated)
    getNotifications: b.query({
      query: (p = {}) => {
        const q = new URLSearchParams();
        if (p.page)  q.set('page',  p.page);
        if (p.limit) q.set('limit', p.limit);
        const qs = q.toString();
        return `/notifications${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Notification'],
    }),

    // PATCH /notifications/:id/read
    markRead: b.mutation({
      query: (id) => ({ url: `/notifications/${id}/read`, method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),

    // PATCH /notifications/read-all
    markAllRead: b.mutation({
      query: () => ({ url: '/notifications/read-all', method: 'PATCH' }),
      invalidatesTags: ['Notification'],
    }),

    // DELETE /notifications/:id
    deleteNotification: b.mutation({
      query: (id) => ({ url: `/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification'],
    }),

    // POST /notifications/send  (admin or teacher)
    sendNotification: b.mutation({
      query: (body) => ({ url: '/notifications/send', method: 'POST', body }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkReadMutation,
  useMarkAllReadMutation,
  useDeleteNotificationMutation,
  useSendNotificationMutation,
} = notificationsApi;
