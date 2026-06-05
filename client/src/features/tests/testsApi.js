import { baseApi } from '../../utils/api.js';

export const testsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ── Public ─────────────────────────────────────────────────────────
    getPlacementTests: b.query({
      query: () => '/tests/public/placement',
      providesTags: ['PlacementTest'],
    }),

    // ── Tests CRUD (admin/teacher) ─────────────────────────────────────
    getTests: b.query({
      query: (params = {}) => {
        const q = new URLSearchParams();
        if (params.type)     q.set('type',     params.type);
        if (params.courseId) q.set('courseId', params.courseId);
        const qs = q.toString();
        return `/tests${qs ? `?${qs}` : ''}`;
      },
      providesTags: ['Test'],
    }),

    createTest: b.mutation({
      query: (body) => ({ url: '/tests', method: 'POST', body }),
      invalidatesTags: ['Test', 'PlacementTest'],
    }),

    updateTest: b.mutation({
      query: ({ id, ...body }) => ({ url: `/tests/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Test', 'PlacementTest'],
    }),

    deleteTest: b.mutation({
      query: (id) => ({ url: `/tests/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Test', 'PlacementTest'],
    }),

    publishTest: b.mutation({
      query: ({ id, isPublished }) => ({
        url: `/tests/${id}/publish`,
        method: 'PATCH',
        body: { isPublished },
      }),
      invalidatesTags: ['Test', 'PlacementTest'],
    }),

    // ── Questions ──────────────────────────────────────────────────────
    getQuestions: b.query({
      query: (testId) => `/tests/${testId}/questions`,
      providesTags: (_res, _err, testId) => [{ type: 'Question', id: testId }],
    }),

    addQuestion: b.mutation({
      query: ({ testId, ...body }) => ({
        url: `/tests/${testId}/questions`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_res, _err, { testId }) => [
        { type: 'Question', id: testId },
        'Test',
        'PlacementTest',
      ],
    }),

    updateQuestion: b.mutation({
      query: ({ testId, qId, ...body }) => ({
        url: `/tests/${testId}/questions/${qId}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_res, _err, { testId }) => [
        { type: 'Question', id: testId },
        'PlacementTest',
      ],
    }),

    deleteQuestion: b.mutation({
      query: ({ testId, qId }) => ({
        url: `/tests/${testId}/questions/${qId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_res, _err, { testId }) => [
        { type: 'Question', id: testId },
        'Test',
        'PlacementTest',
      ],
    }),

    // ── Student endpoints ─────────────────────────────────────────────────

    // GET /tests?groupId=:groupId  — тесты группы (student видит только published)
    getTestsByGroup: b.query({
      query: (groupId) => `/tests?groupId=${groupId}`,
      providesTags: (_r, _e, gId) => ['Test', { type: 'Test', id: `g-${gId}` }],
    }),

    // GET /tests/:id/my-result  — мой результат
    getMyTestResult: b.query({
      query: (testId) => `/tests/${testId}/my-result`,
      providesTags: (_r, _e, id) => [{ type: 'TestResult', id }],
    }),

    // POST /tests/:id/start  — начать тест
    startTest: b.mutation({
      query: (testId) => ({ url: `/tests/${testId}/start`, method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'TestResult', id }],
    }),

    // POST /tests/:id/submit  — сдать тест
    submitTest: b.mutation({
      query: ({ testId, answers }) => ({
        url:    `/tests/${testId}/submit`,
        method: 'POST',
        body:   { answers },
      }),
      invalidatesTags: (_r, _e, { testId }) => [
        { type: 'TestResult', id: testId },
        'Test',
      ],
    }),
  }),
});

export const {
  useGetPlacementTestsQuery,
  useGetTestsQuery,
  useCreateTestMutation,
  useUpdateTestMutation,
  useDeleteTestMutation,
  usePublishTestMutation,
  useGetQuestionsQuery,
  useAddQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
  useGetTestsByGroupQuery,
  useGetMyTestResultQuery,
  useStartTestMutation,
  useSubmitTestMutation,
} = testsApi;
