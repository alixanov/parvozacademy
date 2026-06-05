import * as svc from './sessions.service.js';
import { success, created, paginated } from '../../utils/response.utils.js';

/* ── List ─────────────────────────────────────────────────────────────────── */

/** GET /sessions?group=:id&status=&from=&to=&page=&limit= */
export const listByGroup = async (req, res, next) => {
  try {
    const { group, status, from, to, page, limit } = req.query;
    const result = await svc.getByGroup(group, {
      status, from, to,
      page:  +page  || 1,
      limit: +limit || 30,
    });
    paginated(res, result.docs, { total: result.total, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

/** GET /sessions/teacher?dateRange=today|week|month&status= */
export const listByTeacher = async (req, res, next) => {
  try {
    const teacherId = req.user.role === 'admin'
      ? (req.query.teacherId ?? req.user._id)
      : req.user._id;
    const { dateRange, status, page, limit } = req.query;
    const result = await svc.getByTeacher(teacherId, {
      dateRange, status,
      page:  +page  || 1,
      limit: +limit || 50,
    });
    paginated(res, result.docs, { total: result.total, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

/** GET /sessions/:id */
export const detail = async (req, res, next) => {
  try {
    const session = await svc.getById(req.params.id);
    success(res, session);
  } catch (e) { next(e); }
};

/* ── Create / Update ─────────────────────────────────────────────────────── */

/** POST /sessions (admin only — manual session creation) */
export const create = async (req, res, next) => {
  try {
    const session = await svc.create(req.body);
    created(res, session, 'Sessiya yaratildi');
  } catch (e) { next(e); }
};

/** PATCH /sessions/:id */
export const update = async (req, res, next) => {
  try {
    const teacherId = req.user.role === 'admin' ? undefined : req.user._id;
    const session = await svc.update(req.params.id, req.body, teacherId);
    success(res, session, 'Sessiya yangilandi');
  } catch (e) { next(e); }
};

/* ── Teacher actions ─────────────────────────────────────────────────────── */

/** POST /sessions/:id/link  — send join link, notify students */
export const sendLink = async (req, res, next) => {
  try {
    const { url, type } = req.body;
    const session = await svc.sendLink(req.params.id, { url, type }, req.user._id);
    success(res, session, 'Link yuborildi va o\'quvchilar xabardor qilindi');
  } catch (e) { next(e); }
};

/** PATCH /sessions/:id/complete — mark session as completed */
export const complete = async (req, res, next) => {
  try {
    const { topic, notes } = req.body;
    const session = await svc.complete(req.params.id, { topic, notes }, req.user._id);
    success(res, session, 'Sessiya yakunlandi');
  } catch (e) { next(e); }
};

/** PATCH /sessions/:id/cancel — admin cancels session */
export const cancel = async (req, res, next) => {
  try {
    const session = await svc.cancel(req.params.id);
    success(res, session, 'Sessiya bekor qilindi');
  } catch (e) { next(e); }
};

/* ── Materials ───────────────────────────────────────────────────────────── */

/** POST /sessions/:id/materials */
export const addMaterials = async (req, res, next) => {
  try {
    // body.materials = [{ name, url, publicId?, type? }, ...]
    const materials = Array.isArray(req.body.materials) ? req.body.materials : [req.body];
    const session = await svc.addMaterials(req.params.id, materials, req.user._id);
    success(res, session, 'Materiallar qo\'shildi');
  } catch (e) { next(e); }
};

/** DELETE /sessions/:id/materials/:idx */
export const removeMaterial = async (req, res, next) => {
  try {
    const session = await svc.removeMaterial(req.params.id, req.params.idx, req.user._id);
    success(res, session, 'Material o\'chirildi');
  } catch (e) { next(e); }
};

/* ── Homework via session ─────────────────────────────────────────────────── */

/** POST /sessions/:id/homework */
export const createHomework = async (req, res, next) => {
  try {
    const hw = await svc.createHomework(req.params.id, req.body, req.user._id);
    created(res, hw, 'Uyga vazifa yaratildi va o\'quvchilarga yuborildi');
  } catch (e) { next(e); }
};

/** GET /sessions/:id/homework */
export const getHomework = async (req, res, next) => {
  try {
    const items = await svc.getSessionHomework(req.params.id);
    success(res, items);
  } catch (e) { next(e); }
};

/* ── Attendance via session ──────────────────────────────────────────────── */

/** GET /sessions/:id/attendance */
export const getAttendance = async (req, res, next) => {
  try {
    const doc = await svc.getSessionAttendance(req.params.id);
    success(res, doc);
  } catch (e) { next(e); }
};

/* ── Generate sessions for group (admin/teacher) ─────────────────────────── */

/** POST /sessions/generate/:groupId */
export const generate = async (req, res, next) => {
  try {
    const result = await svc.generateSessions(req.params.groupId);
    success(res, result, `${result.created} ta sessiya yaratildi`);
  } catch (e) { next(e); }
};
