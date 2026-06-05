import { baseApi } from '../../utils/api.js';

export const vacanciesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /vacancies  (public)
    getVacancies: b.query({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.type)  q.set('type',  params.type);
        if (params.limit) q.set('limit', params.limit);
        const qs = q.toString();
        return `/vacancies${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Vacancy'],
    }),

    // GET /vacancies/:id  (public)
    getVacancyById: b.query({
      query: (id) => `/vacancies/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Vacancy', id }],
    }),

    // POST /vacancies  (admin)
    createVacancy: b.mutation({
      query: (body) => ({ url: '/vacancies', method: 'POST', body }),
      invalidatesTags: ['Vacancy'],
    }),

    // PUT /vacancies/:id  (admin)
    updateVacancy: b.mutation({
      query: ({ id, ...body }) => ({ url: `/vacancies/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Vacancy'],
    }),

    // DELETE /vacancies/:id  (admin)
    deleteVacancy: b.mutation({
      query: (id) => ({ url: `/vacancies/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Vacancy'],
    }),
  }),
});

export const {
  useGetVacanciesQuery,
  useGetVacancyByIdQuery,
  useCreateVacancyMutation,
  useUpdateVacancyMutation,
  useDeleteVacancyMutation,
} = vacanciesApi;
