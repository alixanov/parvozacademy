import { Homework, HomeworkSubmission } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';

// ─── Homework ─────────────────────────────────────────────────────────────────

export async function getByGroup(groupId) {
  return Homework.find({ group: groupId, isActive: true })
    .populate('teacher', 'name avatar')
    .populate('lesson', 'title')
    .sort({ dueDate: 1 });
}

export async function getById(id) {
  const hw = await Homework.findById(id)
    .populate('teacher', 'name avatar')
    .populate('lesson', 'title')
    .populate('group', 'name');
  if (!hw) throw new AppError('Homework not found', 404);
  return hw;
}

export async function create(data) {
  return Homework.create(data);
}

export async function update(id, data) {
  const hw = await Homework.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!hw) throw new AppError('Homework not found', 404);
  return hw;
}

export async function remove(id) {
  const hw = await Homework.findByIdAndDelete(id);
  if (!hw) throw new AppError('Homework not found', 404);
}

// ─── Submissions ─────────────────────────────────────────────────────────────

export async function getSubmissions(homeworkId) {
  return HomeworkSubmission.find({ homework: homeworkId })
    .populate('student', 'name avatar studentId')
    .sort({ submittedAt: -1 });
}

export async function getMySubmission(homeworkId, studentId) {
  return HomeworkSubmission.findOne({ homework: homeworkId, student: studentId });
}

export async function submit(homeworkId, studentId, groupId, body = {}) {
  const hw = await Homework.findById(homeworkId);
  if (!hw) throw new AppError('Homework not found', 404);

  // Normalise field names: frontend sends { answer, fileUrl }, legacy sends { comment, files }
  const comment = body.comment || body.answer || '';
  const files   = body.files?.length
    ? body.files
    : body.fileUrl ? [{ url: body.fileUrl, name: body.fileUrl.split('/').pop() }] : [];

  const now    = new Date();
  const isLate = hw.dueDate ? now > new Date(hw.dueDate) : false;

  const existing = await HomeworkSubmission.findOne({ homework: homeworkId, student: studentId });
  if (existing) {
    existing.files       = files;
    existing.comment     = comment;
    existing.status      = isLate ? 'late' : 'submitted';
    existing.submittedAt = now;
    return existing.save();
  }

  return HomeworkSubmission.create({
    homework: homeworkId,
    student:  studentId,
    group:    groupId,
    files,
    comment,
    status: isLate ? 'late' : 'submitted',
  });
}

export async function grade(submissionId, { score, feedback, gradedBy }) {
  const sub = await HomeworkSubmission.findByIdAndUpdate(
    submissionId,
    { score, feedback, status: 'graded', gradedAt: new Date(), gradedBy },
    { new: true, runValidators: true }
  );
  if (!sub) throw new AppError('Submission not found', 404);
  return sub;
}
