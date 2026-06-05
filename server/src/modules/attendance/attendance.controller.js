import * as svc from './attendance.service.js';
import { success, paginated } from '../../utils/response.utils.js';

export const byGroupDate = async (req, res, next) => {
  try {
    const { group, date } = req.query;
    const doc = await svc.getByGroupDate(group, date);
    success(res, doc);
  } catch (e) { next(e); }
};

export const byGroup = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await svc.getByGroup(req.params.groupId, { page: +page || 1, limit: +limit || 20 });
    paginated(res, result.docs, { total: result.total, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

export const byStudent = async (req, res, next) => {
  try {
    const docs = await svc.getByStudent(req.params.studentId);
    success(res, docs);
  } catch (e) { next(e); }
};

export const mark = async (req, res, next) => {
  try {
    const { groupId, date, sessionId, lessonId, records } = req.body;
    const doc = await svc.mark({ groupId, date, sessionId, lessonId, records, markedBy: req.user._id });
    success(res, doc, 'Attendance marked');
  } catch (e) { next(e); }
};

export const studentStats = async (req, res, next) => {
  try {
    const { groupId } = req.query;
    const stats = await svc.getStudentStats(req.params.studentId, groupId);
    success(res, stats);
  } catch (e) { next(e); }
};
