import { baseApi } from '../../utils/api.js';

export const authApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    login: b.mutation({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    register: b.mutation({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    logout: b.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    refresh: b.mutation({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    getMe: b.query({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshMutation,
  useGetMeQuery,
} = authApi;
