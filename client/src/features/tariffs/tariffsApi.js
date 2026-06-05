import { baseApi } from '../../utils/api.js';

export const tariffsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /tariff-plans/public  — публично, только активные (для страницы цен)
    getPublicTariffPlans: b.query({
      query: () => '/tariff-plans/public',
      providesTags: ['TariffPlan'],
    }),

    // GET /tariff-plans  — все тарифы для admin
    getTariffPlans: b.query({
      query: () => '/tariff-plans',
      providesTags: ['TariffPlan'],
    }),

    // POST /tariff-plans  (admin)
    createTariffPlan: b.mutation({
      query: (body) => ({ url: '/tariff-plans', method: 'POST', body }),
      invalidatesTags: ['TariffPlan'],
    }),

    // PUT /tariff-plans/:key  (admin)
    updateTariffPlan: b.mutation({
      query: ({ key, ...body }) => ({
        url:    `/tariff-plans/${key}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['TariffPlan'],
    }),

    // DELETE /tariff-plans/:key  (admin)
    deleteTariffPlan: b.mutation({
      query: (key) => ({ url: `/tariff-plans/${key}`, method: 'DELETE' }),
      invalidatesTags: ['TariffPlan'],
    }),
  }),
});

export const {
  useGetPublicTariffPlansQuery,
  useGetTariffPlansQuery,
  useCreateTariffPlanMutation,
  useUpdateTariffPlanMutation,
  useDeleteTariffPlanMutation,
} = tariffsApi;
