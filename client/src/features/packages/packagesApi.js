import { baseApi } from '../../utils/api.js';

export const packagesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({

    /* ── Public / Teacher / Admin lists ── */

    // GET /packages — published list
    getPublishedPackages: b.query({
      query: (p = {}) => {
        const q = new URLSearchParams();
        if (p.page)   q.set('page',   p.page);
        if (p.limit)  q.set('limit',  p.limit);
        if (p.course) q.set('course', p.course);
        return `/packages?${q.toString()}`;
      },
      providesTags: ['Package'],
    }),

    // GET /packages/admin — admin all packages
    getAllPackagesAdmin: b.query({
      query: (p = {}) => {
        const q = new URLSearchParams();
        if (p.page)    q.set('page',    p.page);
        if (p.limit)   q.set('limit',   p.limit);
        if (p.status)  q.set('status',  p.status);
        if (p.teacher) q.set('teacher', p.teacher);
        return `/packages/admin?${q.toString()}`;
      },
      providesTags: ['Package'],
    }),

    // GET /packages/my — teacher's own packages
    getMyPackages: b.query({
      query: () => '/packages/my',
      providesTags: ['Package'],
    }),

    // GET /packages/my-access — student's purchased packages
    getMyAccessPackages: b.query({
      query: () => '/packages/my-access',
      providesTags: ['Package', 'PackageAccess'],
    }),

    // GET /packages/:id
    getPackageById: b.query({
      query: (id) => `/packages/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Package', id }],
    }),

    /* ── CRUD ── */

    // POST /packages
    createPackage: b.mutation({
      query: (body) => ({ url: '/packages', method: 'POST', body }),
      invalidatesTags: ['Package'],
    }),

    // PATCH /packages/:id
    updatePackage: b.mutation({
      query: ({ id, ...body }) => ({ url: `/packages/${id}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['Package', { type: 'Package', id }],
    }),

    // DELETE /packages/:id
    deletePackage: b.mutation({
      query: (id) => ({ url: `/packages/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Package'],
    }),

    // PATCH /packages/:id/status
    setPackageStatus: b.mutation({
      query: ({ id, status }) => ({ url: `/packages/${id}/status`, method: 'PATCH', body: { status } }),
      invalidatesTags: (_r, _e, { id }) => ['Package', { type: 'Package', id }],
    }),

    /* ── Modules ── */

    // POST /packages/:id/modules
    addPackageModule: b.mutation({
      query: ({ id, ...body }) => ({ url: `/packages/${id}/modules`, method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => ['Package', { type: 'Package', id }],
    }),

    // PATCH /packages/:id/modules/:idx
    updatePackageModule: b.mutation({
      query: ({ id, idx, ...body }) => ({ url: `/packages/${id}/modules/${idx}`, method: 'PATCH', body }),
      invalidatesTags: (_r, _e, { id }) => ['Package', { type: 'Package', id }],
    }),

    // DELETE /packages/:id/modules/:idx
    deletePackageModule: b.mutation({
      query: ({ id, idx }) => ({ url: `/packages/${id}/modules/${idx}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, { id }) => ['Package', { type: 'Package', id }],
    }),

    // PATCH /packages/:id/modules/reorder
    reorderPackageModules: b.mutation({
      query: ({ id, orderedIds }) => ({ url: `/packages/${id}/modules/reorder`, method: 'PATCH', body: { orderedIds } }),
      invalidatesTags: (_r, _e, { id }) => ['Package', { type: 'Package', id }],
    }),

    /* ── Access ── */

    // GET /packages/:id/access/check
    checkPackageAccess: b.query({
      query: (id) => `/packages/${id}/access/check`,
      providesTags: (_r, _e, id) => [{ type: 'PackageAccess', id }],
    }),

    // GET /packages/:id/students
    getPackageStudents: b.query({
      query: ({ id, ...p }) => {
        const q = new URLSearchParams(p).toString();
        return `/packages/${id}/students${q ? `?${q}` : ''}`;
      },
      providesTags: (_r, _e, { id }) => ['PackageAccess', { type: 'Package', id }],
    }),

    // POST /packages/:id/access
    grantPackageAccess: b.mutation({
      query: ({ id, ...body }) => ({ url: `/packages/${id}/access`, method: 'POST', body }),
      invalidatesTags: ['PackageAccess', 'Package'],
    }),

    // DELETE /packages/:id/access/:studentId
    revokePackageAccess: b.mutation({
      query: ({ id, studentId }) => ({ url: `/packages/${id}/access/${studentId}`, method: 'DELETE' }),
      invalidatesTags: ['PackageAccess'],
    }),

    /* ── Teacher permission ── */

    // PATCH /packages/teacher-permission/:teacherId
    setTeacherPackagePermission: b.mutation({
      query: ({ teacherId, enabled }) => ({
        url:    `/packages/teacher-permission/${teacherId}`,
        method: 'PATCH',
        body:   { enabled },
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useGetPublishedPackagesQuery,
  useGetAllPackagesAdminQuery,
  useGetMyPackagesQuery,
  useGetMyAccessPackagesQuery,
  useGetPackageByIdQuery,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useDeletePackageMutation,
  useSetPackageStatusMutation,
  useAddPackageModuleMutation,
  useUpdatePackageModuleMutation,
  useDeletePackageModuleMutation,
  useReorderPackageModulesMutation,
  useCheckPackageAccessQuery,
  useGetPackageStudentsQuery,
  useGrantPackageAccessMutation,
  useRevokePackageAccessMutation,
  useSetTeacherPackagePermissionMutation,
} = packagesApi;
