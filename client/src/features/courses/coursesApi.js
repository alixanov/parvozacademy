import { baseApi } from '../../utils/api.js';

export const coursesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /courses  (public + admin with showAll=true)
    getCourses: b.query({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.subject) q.set('subject', params.subject);
        if (params.level)   q.set('level',   params.level);
        if (params.search)  q.set('search',  params.search);
        if (params.page)    q.set('page',    params.page);
        if (params.limit)   q.set('limit',   params.limit);
        // NOTE: showAll is NOT a backend param — admin sees all courses
        // automatically via JWT token (optionalAuthenticate middleware)
        const qs = q.toString();
        return `/courses${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Course'],
    }),

    // GET /courses/mine  (teacher / admin)
    getTeacherCourses: b.query({
      query: () => '/courses/mine',
      providesTags: ['Course'],
    }),

    // GET /courses/:id  (public)
    getCourseById: b.query({
      query: (id) => `/courses/${id}`,
      providesTags: (_res, _err, id) => [{ type: 'Course', id }],
    }),

    // POST /courses  (admin)
    createCourse: b.mutation({
      query: (body) => ({ url: '/courses', method: 'POST', body }),
      invalidatesTags: ['Course'],
    }),

    // PUT /courses/:id  (admin)
    updateCourse: b.mutation({
      query: ({ id, ...body }) => ({ url: `/courses/${id}`, method: 'PUT', body }),
      invalidatesTags: (_res, _err, { id }) => ['Course', { type: 'Course', id }],
    }),

    // DELETE /courses/:id  (admin)
    deleteCourse: b.mutation({
      query: (id) => ({ url: `/courses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Course'],
    }),

    // PATCH /courses/:id/publish  (admin)
    publishCourse: b.mutation({
      query: ({ id, isPublished }) => ({
        url: `/courses/${id}/publish`,
        method: 'PATCH',
        body: { isPublished },
      }),
      invalidatesTags: (_res, _err, { id }) => ['Course', { type: 'Course', id }],
    }),

    // PATCH /courses/:id/activate  (admin)
    activateCourse: b.mutation({
      query: ({ id, isActive }) => ({
        url: `/courses/${id}/activate`,
        method: 'PATCH',
        body: { isActive },
      }),
      invalidatesTags: (_res, _err, { id }) => ['Course', { type: 'Course', id }],
    }),
  }),
});

export const {
  useGetCoursesQuery,
  useGetTeacherCoursesQuery,
  useGetCourseByIdQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  usePublishCourseMutation,
  useActivateCourseMutation,
} = coursesApi;
