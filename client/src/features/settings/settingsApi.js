import { baseApi } from '../../utils/api.js';

export const settingsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /settings  (public)
    getSettings: b.query({
      query: () => '/settings',
      providesTags: ['Settings'],
    }),

    // PUT /settings  (admin)
    updateSettings: b.mutation({
      query: (body) => ({ url: '/settings', method: 'PUT', body }),
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const {
  useGetSettingsQuery,
  useUpdateSettingsMutation,
} = settingsApi;
