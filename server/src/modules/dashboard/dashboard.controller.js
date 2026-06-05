import * as svc from './dashboard.service.js';
import { success } from '../../utils/response.utils.js';

export const adminDashboard = async (req, res, next) => {
  try {
    const data = await svc.getAdminStats();
    success(res, data);
  } catch (e) { next(e); }
};

export const teacherDashboard = async (req, res, next) => {
  try {
    const data = await svc.getTeacherStats(req.user._id);
    success(res, data);
  } catch (e) { next(e); }
};

export const studentDashboard = async (req, res, next) => {
  try {
    const data = await svc.getStudentStats(req.user._id);
    success(res, data);
  } catch (e) { next(e); }
};
