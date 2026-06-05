import { baseApi } from '../../utils/api.js';

export const homeworkApi = baseApi.injectEndpoints({
  endpoints: (b) => ({

    // GET /homework?group=:groupId  — список ДЗ для группы
    getHomeworkByGroup: b.query({
      query: (groupId) => `/homework?group=${groupId}`,
      providesTags: (_r, _e, gId) => ['Homework', { type: 'Homework', id: `g-${gId}` }],
    }),

    // GET /homework/:id/submissions  — ответы студентов на одно ДЗ
    getHomeworkSubmissions: b.query({
      query: (hwId) => `/homework/${hwId}/submissions`,
      providesTags: (_r, _e, id) => ['HomeworkSubmission', { type: 'HomeworkSubmission', id }],
    }),

    // POST /homework  — создать ДЗ (teacher/admin)
    createHomework: b.mutation({
      query: (body) => ({ url: '/homework', method: 'POST', body }),
      invalidatesTags: ['Homework'],
    }),

    // PUT /homework/:id  — обновить ДЗ
    updateHomework: b.mutation({
      query: ({ id, ...body }) => ({ url: `/homework/${id}`, method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['Homework', { type: 'Homework', id }],
    }),

    // DELETE /homework/:id
    deleteHomework: b.mutation({
      query: (id) => ({ url: `/homework/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Homework'],
    }),

    // PUT /homework/submissions/:subId/grade  — выставить оценку
    gradeSubmission: b.mutation({
      query: ({ subId, score, feedback }) => ({
        url:    `/homework/submissions/${subId}/grade`,
        method: 'PUT',
        body:   { score, feedback },
      }),
      invalidatesTags: (_r, _e, { subId }) => [
        'HomeworkSubmission',
        { type: 'HomeworkSubmission', id: subId },
      ],
    }),

    // ── Student endpoints ─────────────────────────────────────────────────

    // GET /homework/:id/my-submission  — моя сдача (student)
    getMySubmission: b.query({
      query: (hwId) => `/homework/${hwId}/my-submission`,
      providesTags: (_r, _e, id) => [{ type: 'HomeworkSubmission', id: `my-${id}` }],
    }),

    // POST /homework/:id/submit  — сдать ДЗ (student)
    submitHomework: b.mutation({
      query: ({ id, groupId, answer, fileUrl }) => ({
        url:    `/homework/${id}/submit`,
        method: 'POST',
        body:   { groupId, answer, fileUrl },
      }),
      invalidatesTags: (_r, _e, { id }) => [
        'Homework',
        { type: 'HomeworkSubmission', id: `my-${id}` },
      ],
    }),

  }),
});

export const {
  useGetHomeworkByGroupQuery,
  useGetHomeworkSubmissionsQuery,
  useCreateHomeworkMutation,
  useUpdateHomeworkMutation,
  useDeleteHomeworkMutation,
  useGradeSubmissionMutation,
  useGetMySubmissionQuery,
  useSubmitHomeworkMutation,
} = homeworkApi;
