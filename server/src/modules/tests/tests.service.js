import { Test, TestQuestion, TestResult } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';

// ─── Tests ────────────────────────────────────────────────────────────────────

export async function getAll({ groupId, courseId, type, isPublished = true } = {}) {
  const filter = {};
  if (groupId)     filter.group   = groupId;
  if (courseId)    filter.course  = courseId;
  if (type)        filter.type    = type;
  if (isPublished !== null) filter.isPublished = isPublished;

  return Test.find(filter)
    .populate('teacher', 'name avatar')
    .sort({ createdAt: -1 });
}

export async function getById(id) {
  const test = await Test.findById(id).populate('teacher', 'name avatar');
  if (!test) throw new AppError('Test not found', 404);
  return test;
}

export async function create(data) {
  return Test.create(data);
}

export async function update(id, data) {
  const test = await Test.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!test) throw new AppError('Test not found', 404);
  return test;
}

export async function remove(id) {
  const test = await Test.findByIdAndDelete(id);
  if (!test) throw new AppError('Test not found', 404);
  // Also remove questions
  await TestQuestion.deleteMany({ test: id });
}

export async function setPublished(id, isPublished) {
  const test = await Test.findByIdAndUpdate(id, { isPublished }, { new: true });
  if (!test) throw new AppError('Test not found', 404);
  return test;
}

// ─── Questions ───────────────────────────────────────────────────────────────

export async function getQuestions(testId) {
  return TestQuestion.find({ test: testId }).sort('order');
}

export async function addQuestion(testId, data) {
  const count = await TestQuestion.countDocuments({ test: testId });
  const q = await TestQuestion.create({ ...data, test: testId, order: data.order ?? count + 1 });
  await Test.findByIdAndUpdate(testId, { $inc: { totalQuestions: 1 } });
  return q;
}

export async function updateQuestion(qId, data) {
  const q = await TestQuestion.findByIdAndUpdate(qId, data, { new: true, runValidators: true });
  if (!q) throw new AppError('Question not found', 404);
  return q;
}

export async function deleteQuestion(qId) {
  const q = await TestQuestion.findByIdAndDelete(qId);
  if (!q) throw new AppError('Question not found', 404);
  await Test.findByIdAndUpdate(q.test, { $inc: { totalQuestions: -1 } });
}

// ─── Public placement tests ───────────────────────────────────────────────────

export async function getPlacementTests() {
  const tests = await Test.find({ type: 'placement', isPublished: true })
    .populate('course', 'subject title')
    .lean();

  const result = [];
  for (const test of tests) {
    const rawQs = await TestQuestion.find({ test: test._id }).sort('order').lean();
    const subject = test.course?.subject ?? 'other';
    result.push({
      id: String(test._id),
      title: test.title,
      subject,
      duration: test.duration,
      questions: rawQs.map((q) => ({
        _id: String(q._id),
        subject,
        question: q.question,
        options: (q.options ?? []).map((o) => o.text),
        answer: (q.options ?? []).findIndex((o) => o.isCorrect),
      })),
    });
  }
  return result;
}

// ─── Results ─────────────────────────────────────────────────────────────────

export async function start(testId, studentId, groupId) {
  const test = await Test.findById(testId);
  if (!test) throw new AppError('Test not found', 404);
  if (!test.isPublished) throw new AppError('Test not published', 403);

  // Check if already started / submitted
  const existing = await TestResult.findOne({ test: testId, student: studentId });
  if (existing?.submittedAt) throw new AppError('Test already submitted', 409);
  if (existing) return existing; // resume

  return TestResult.create({
    test: testId,
    student: studentId,
    group: groupId,
    startedAt: new Date(),
  });
}

export async function submit(testId, studentId, answers) {
  const result = await TestResult.findOne({ test: testId, student: studentId });
  if (!result) throw new AppError('Start the test first', 400);
  if (result.submittedAt) throw new AppError('Already submitted', 409);

  const questions = await TestQuestion.find({ test: testId });
  const qMap = {};
  questions.forEach((q) => { qMap[String(q._id)] = q; });

  let totalScore = 0;
  const gradedAnswers = answers.map((ans) => {
    const q = qMap[ans.questionId];
    const selIdx0 = ans.selectedOption !== undefined ? Number(ans.selectedOption) : undefined;
    const selArr0 = Array.isArray(ans.selectedOptions) ? ans.selectedOptions : (selIdx0 !== undefined ? [selIdx0] : []);
    if (!q) return { question: ans.questionId, selectedOptions: selArr0, isCorrect: false, score: 0 };

    let isCorrect = false;
    let score = 0;

    // Support both selectedOption (number) and selectedOptions (array) from frontend
    const selIdx  = ans.selectedOption  !== undefined ? Number(ans.selectedOption) : undefined;
    const selArr  = Array.isArray(ans.selectedOptions) ? ans.selectedOptions : (selIdx !== undefined ? [selIdx] : []);

    if (q.type === 'single') {
      const correctIdx = q.options.findIndex((o) => o.isCorrect);
      isCorrect = (selArr[0] !== undefined ? Number(selArr[0]) : selIdx) === correctIdx;
      score = isCorrect ? q.score : 0;
    } else if (q.type === 'multiple') {
      const correctSet = new Set(q.options.reduce((acc, o, i) => o.isCorrect ? [...acc, i] : acc, []));
      const selectedSet = new Set(selArr.map(Number));
      isCorrect = [...correctSet].every((i) => selectedSet.has(i)) && selectedSet.size === correctSet.size;
      score = isCorrect ? q.score : 0;
    } else {
      // text — manual grading; mark as pending
      isCorrect = false;
      score = 0;
    }

    totalScore += score;
    return {
      question: q._id,
      selectedOptions: selArr,
      textAnswer: ans.textAnswer,
      isCorrect,
      score,
    };
  });

  const test = await Test.findById(testId);
  const maxPossible = questions.reduce((a, q) => a + q.score, 0) || 1;
  const percentage = Math.round((totalScore / maxPossible) * 100);
  const isPassed = percentage >= test.passingScore;
  const timeSpent = Math.round((Date.now() - new Date(result.startedAt).getTime()) / 1000);

  result.answers = gradedAnswers;
  result.score = totalScore;
  result.percentage = percentage;
  result.isPassed = isPassed;
  result.submittedAt = new Date();
  result.timeSpent = timeSpent;
  return result.save();
}

export async function getResults(testId) {
  return TestResult.find({ test: testId })
    .populate('student', 'name avatar studentId')
    .sort({ score: -1 });
}

export async function getMyResult(testId, studentId) {
  return TestResult.findOne({ test: testId, student: studentId });
}

export async function getStudentResults(studentId) {
  return TestResult.find({ student: studentId })
    .populate('test', 'title type')
    .sort({ submittedAt: -1 });
}
