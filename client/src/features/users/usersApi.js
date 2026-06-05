import { baseApi } from '../../utils/api.js';

export const usersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /users/public  (public — active teachers only, no auth)
    getPublicTeachers: b.query({
      query: () => '/users/public',
      providesTags: [{ type: 'User', id: 'PUBLIC_TEACHERS' }],
    }),

    // GET /users?role=teacher&search=...
    getUsers: b.query({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.role)   q.set('role',   params.role);
        if (params.search) q.set('search', params.search);
        if (params.limit)  q.set('limit',  params.limit);
        return `/users?${q}`;
      },
      providesTags: (res, _err, arg) => [
        { type: 'User', id: `LIST_${arg?.role ?? 'all'}` },
      ],
    }),

    // POST /users  (admin creates teacher/student)
    createUser: b.mutation({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: (_res, _err, arg) => [
        { type: 'User', id: `LIST_${arg.role}` },
        { type: 'User', id: 'LIST_all' },
        { type: 'User', id: 'PUBLIC_TEACHERS' },
      ],
    }),

    // PATCH /users/me  (authenticated user updates own profile)
    updateMyProfile: b.mutation({
      query: (body) => ({ url: '/users/me', method: 'PATCH', body }),
      invalidatesTags: [{ type: 'User', id: 'ME' }],
    }),

    // PATCH /users/:id
    updateUser: b.mutation({
      query: ({ id, ...body }) => ({ url: `/users/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST_teacher' },
        { type: 'User', id: 'LIST_student' },
        { type: 'User', id: 'LIST_all' },
        { type: 'User', id: 'PUBLIC_TEACHERS' },
      ],
    }),

    // DELETE /users/:id
    deleteUser: b.mutation({
      query: (id) => ({ url: `/users/${id}`, method: 'DELETE' }),
      invalidatesTags: ['User'],
    }),

    // PATCH /users/:id/active
    setUserActive: b.mutation({
      query: ({ id, isActive }) => ({ url: `/users/${id}/active`, method: 'PATCH', body: { isActive } }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetPublicTeachersQuery,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateMyProfileMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useSetUserActiveMutation,
} = usersApi;
