import * as svc from './packages.service.js';
import { success, created, paginated } from '../../utils/response.utils.js';

/* ── Package CRUD ─────────────────────────────────────────────────────────── */

/** GET /packages — published list (public) */
export const listPublished = async (req, res, next) => {
  try {
    const { page, limit, course } = req.query;
    const result = await svc.listPublished({ page: +page || 1, limit: +limit || 20, course });
    paginated(res, result.docs, { total: result.total, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

/** GET /packages/admin — all packages (admin only) */
export const listAll = async (req, res, next) => {
  try {
    const { page, limit, status, teacher } = req.query;
    const result = await svc.listAll({ page: +page || 1, limit: +limit || 30, status, teacher });
    paginated(res, result.docs, { total: result.total, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

/** GET /packages/my — teacher's own packages */
export const listMine = async (req, res, next) => {
  try {
    const docs = await svc.listByTeacher(req.user._id);
    success(res, docs);
  } catch (e) { next(e); }
};

/** GET /packages/my-access — student's purchased packages */
export const listMyAccess = async (req, res, next) => {
  try {
    const data = await svc.getStudentPackages(req.user._id);
    success(res, data);
  } catch (e) { next(e); }
};

/** GET /packages/:id */
export const detail = async (req, res, next) => {
  try {
    const pkg = await svc.getById(req.params.id, req.user ?? null);
    success(res, pkg);
  } catch (e) { next(e); }
};

/** POST /packages */
export const create = async (req, res, next) => {
  try {
    const pkg = await svc.create(req.body, req.user);
    created(res, pkg, 'Paket yaratildi');
  } catch (e) { next(e); }
};

/** PATCH /packages/:id */
export const update = async (req, res, next) => {
  try {
    const pkg = await svc.update(req.params.id, req.body, req.user);
    success(res, pkg, 'Paket yangilandi');
  } catch (e) { next(e); }
};

/** DELETE /packages/:id */
export const remove = async (req, res, next) => {
  try {
    const result = await svc.remove(req.params.id, req.user);
    success(res, result, 'Paket o\'chirildi');
  } catch (e) { next(e); }
};

/** PATCH /packages/:id/status — change status (publish/archive/draft) */
export const changeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['draft', 'published', 'archived'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Noto\'g\'ri status' });
    }
    const pkg = await svc.setStatus(req.params.id, status, req.user);
    success(res, pkg, `Paket holati "${status}" ga o'zgartirildi`);
  } catch (e) { next(e); }
};

/* ── Modules ──────────────────────────────────────────────────────────────── */

/** POST /packages/:id/modules */
export const addModule = async (req, res, next) => {
  try {
    const pkg = await svc.addModule(req.params.id, req.body, req.user);
    success(res, pkg, 'Modul qo\'shildi');
  } catch (e) { next(e); }
};

/** PATCH /packages/:id/modules/:idx */
export const updateModule = async (req, res, next) => {
  try {
    const pkg = await svc.updateModule(req.params.id, req.params.idx, req.body, req.user);
    success(res, pkg, 'Modul yangilandi');
  } catch (e) { next(e); }
};

/** DELETE /packages/:id/modules/:idx */
export const removeModule = async (req, res, next) => {
  try {
    const pkg = await svc.removeModule(req.params.id, req.params.idx, req.user);
    success(res, pkg, 'Modul o\'chirildi');
  } catch (e) { next(e); }
};

/** PATCH /packages/:id/modules/reorder */
export const reorderModules = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) return res.status(400).json({ success: false, message: 'orderedIds massiv bo\'lishi kerak' });
    const pkg = await svc.reorderModules(req.params.id, orderedIds, req.user);
    success(res, pkg, 'Modullar tartiblandi');
  } catch (e) { next(e); }
};

/* ── Access ───────────────────────────────────────────────────────────────── */

/** POST /packages/:id/access — admin grants student access */
export const grantAccess = async (req, res, next) => {
  try {
    const { studentId, paymentAmount, note } = req.body;
    if (!studentId) return res.status(400).json({ success: false, message: 'studentId majburiy' });
    const access = await svc.grantAccess(req.params.id, studentId, req.user._id, { paymentAmount, note });
    created(res, access, 'Kirish huquqi berildi');
  } catch (e) { next(e); }
};

/** DELETE /packages/:id/access/:studentId — admin revokes access */
export const revokeAccess = async (req, res, next) => {
  try {
    const access = await svc.revokeAccess(req.params.id, req.params.studentId);
    success(res, access, 'Kirish huquqi bekor qilindi');
  } catch (e) { next(e); }
};

/** GET /packages/:id/access/check — student checks own access */
export const checkAccess = async (req, res, next) => {
  try {
    const result = await svc.checkAccess(req.params.id, req.user._id);
    success(res, result);
  } catch (e) { next(e); }
};

/** GET /packages/:id/students — package student list (teacher/admin) */
export const getStudents = async (req, res, next) => {
  try {
    const students = await svc.getPackageStudents(req.params.id, req.user);
    success(res, students);
  } catch (e) { next(e); }
};

/* ── Teacher permissions ──────────────────────────────────────────────────── */

/** PATCH /packages/teacher-permission/:teacherId */
export const setTeacherPermission = async (req, res, next) => {
  try {
    const { enabled } = req.body;
    const result = await svc.setTeacherPackagePermission(req.params.teacherId, enabled);
    success(res, result, enabled ? 'Ruxsat berildi' : 'Ruxsat olib qolindi');
  } catch (e) { next(e); }
};
