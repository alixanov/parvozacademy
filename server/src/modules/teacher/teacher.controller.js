import * as svc from './teacher.service.js';
import { success, paginated } from '../../utils/response.utils.js';

/** GET /teacher/dashboard */
export const dashboard = async (req, res, next) => {
  try {
    const data = await svc.getDashboard(req.user._id);
    success(res, data);
  } catch (e) { next(e); }
};

/** GET /teacher/groups */
export const groups = async (req, res, next) => {
  try {
    const data = await svc.getGroups(req.user._id);
    success(res, data);
  } catch (e) { next(e); }
};

/** GET /teacher/groups/:groupId/history?page=&limit= */
export const groupHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await svc.getGroupHistory(
      req.params.groupId,
      req.user._id,
      { page: +page || 1, limit: +limit || 20 },
    );
    paginated(res, result.docs, { total: result.total, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

/** GET /teacher/groups/:groupId/attendance */
export const attendanceSummary = async (req, res, next) => {
  try {
    const data = await svc.getAttendanceSummary(req.params.groupId, req.user._id);
    success(res, data);
  } catch (e) { next(e); }
};
