import { Attendance, GroupMember } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';

export async function getByGroupDate(groupId, date) {
  return Attendance.findOne({ group: groupId, date: new Date(date) })
    .populate('records.student', 'name avatar studentId');
}

export async function getByGroup(groupId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    Attendance.find({ group: groupId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments({ group: groupId }),
  ]);
  return { docs, total, page, pages: Math.ceil(total / limit) };
}

export async function getByStudent(studentId) {
  return Attendance.find({ 'records.student': studentId })
    .populate('group', 'name')
    .sort({ date: -1 });
}

/**
 * Mark attendance for a group on a specific date.
 *
 * @param sessionId — preferred: the GroupSession ObjectId
 * @param lessonId  — legacy: content lesson ObjectId (kept for backward compat)
 */
export async function mark({ groupId, date, sessionId, lessonId, records, markedBy }) {
  const existing = await Attendance.findOne({ group: groupId, date: new Date(date) });

  if (existing) {
    existing.records  = records;
    existing.markedBy = markedBy;
    if (sessionId) existing.session = sessionId;
    if (lessonId)  existing.lesson  = lessonId;
    return existing.save();
  }

  return Attendance.create({
    group:   groupId,
    session: sessionId,
    lesson:  lessonId,
    date:    new Date(date),
    markedBy,
    records,
  });
}

export async function getStudentStats(studentId, groupId) {
  const sheets = await Attendance.find({ group: groupId, 'records.student': studentId });
  const total = sheets.length;
  const present = sheets.filter((s) => {
    const r = s.records.find((r) => String(r.student) === String(studentId));
    return r && (r.status === 'present' || r.status === 'late');
  }).length;

  return { total, present, absent: total - present, pct: total ? Math.round((present / total) * 100) : 0 };
}
