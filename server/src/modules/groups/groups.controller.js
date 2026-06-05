import * as svc from './groups.service.js';
import { success, created, paginated } from '../../utils/response.utils.js';

export const list = async (req, res, next) => {
  try {
    const { page, limit, teacherId, courseId, isActive } = req.query;
    // Teachers only see their own groups
    const effectiveTeacher = req.user.role === 'teacher' ? req.user._id : teacherId;
    const result = await svc.getAll({ page: +page || 1, limit: +limit || 20, teacherId: effectiveTeacher, courseId, isActive });
    paginated(res, result.groups, { total: result.total, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

export const detail = async (req, res, next) => {
  try {
    const group = await svc.getById(req.params.id);
    success(res, group);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const group = await svc.create(req.body);
    created(res, group, 'Group created');
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const group = await svc.update(req.params.id, req.body);
    success(res, group, 'Group updated');
  } catch (e) { next(e); }
};

export const setActive = async (req, res, next) => {
  try {
    const group = await svc.update(req.params.id, { isActive: req.body.isActive });
    success(res, group, 'Group status updated');
  } catch (e) { next(e); }
};

// PATCH /groups/:id/activate  — full activation: sets startDate, generates payments
export const activate = async (req, res, next) => {
  try {
    const result = await svc.activateGroup(req.params.id, req.body.startDate);
    success(res, result, 'Guruh faollashtirildi');
  } catch (e) { next(e); }
};

// PATCH /groups/:id/complete  — mark group as finished, graduate students
export const complete = async (req, res, next) => {
  try {
    const result = await svc.completeGroup(req.params.id);
    success(res, result, 'Kurs yakunlandi');
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id);
    success(res, null, 'Group deleted');
  } catch (e) { next(e); }
};

export const members = async (req, res, next) => {
  try {
    const list = await svc.getMembers(req.params.id);
    success(res, list);
  } catch (e) { next(e); }
};

export const addMember = async (req, res, next) => {
  try {
    const member = await svc.addMember(req.params.id, req.body.studentId);
    created(res, member, 'Student added to group');
  } catch (e) { next(e); }
};

export const removeMember = async (req, res, next) => {
  try {
    const member = await svc.removeMember(req.params.id, req.params.studentId);
    success(res, member, 'Student removed from group');
  } catch (e) { next(e); }
};

// GET /groups/:id/members/payments  — members + payment status (admin/teacher)
export const membersWithPayments = async (req, res, next) => {
  try {
    const data = await svc.getMembersWithPaymentStatus(req.params.id);
    success(res, data);
  } catch (e) { next(e); }
};

// PATCH /groups/:id/members/:studentId/access  — admin: grant/revoke manual access
export const setMemberAccess = async (req, res, next) => {
  try {
    const { manualAccessGranted } = req.body;
    const member = await svc.setMemberAccess(
      req.params.id,
      req.params.studentId,
      Boolean(manualAccessGranted)
    );
    success(res, member, manualAccessGranted ? 'Kirish tiklandi' : 'Kirish bloklandi');
  } catch (e) { next(e); }
};

// GET /groups/my  — returns groups the authenticated student belongs to
export const myGroups = async (req, res, next) => {
  try {
    const groups = await svc.getMyGroups(req.user._id);
    success(res, groups);
  } catch (e) { next(e); }
};

// GET /groups/my-students  — returns all active students across teacher's groups
export const myStudents = async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return success(res, []);
    }
    const teacherId = req.user.role === 'teacher' ? req.user._id : null;
    if (!teacherId) return success(res, []);
    const members = await svc.getTeacherStudents(teacherId);
    success(res, members);
  } catch (e) { next(e); }
};
