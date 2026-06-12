import * as svc from './enrollment.service.js';
import { success, created, paginated } from '../../utils/response.utils.js';

/** POST /enrollment-applications  — публично */
export const submit = async (req, res, next) => {
  try {
    const app = await svc.submitApplication({
      fullName:   req.body.fullName,
      phone:      req.body.phone,
      courseId:   req.body.course,
      tariffKey:  req.body.tariffKey,
      amount:     req.body.amount,
      receiptUrl: req.body.receiptUrl,
      receiptKey: req.body.receiptKey ?? '',
      // If authenticated, always use the real user id — never trust body
      student:    req.user?._id ?? null,
    });
    created(res, app, 'Arizangiz qabul qilindi. Tez orada javob beramiz.');
  } catch (e) { next(e); }
};

/** GET /enrollment-applications  — admin */
export const list = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await svc.getAll({ page: +page || 1, limit: +limit || 20, status });
    paginated(res, result.applications, {
      total: result.total, page: result.page, pages: result.pages,
    });
  } catch (e) { next(e); }
};

/** GET /enrollment-applications/:id  — admin */
export const detail = async (req, res, next) => {
  try {
    const app = await svc.getById(req.params.id);
    success(res, app);
  } catch (e) { next(e); }
};

/** PATCH /enrollment-applications/:id/approve  — admin */
export const approve = async (req, res, next) => {
  try {
    const result = await svc.approve(req.params.id, {
      adminId: req.user._id,
      groupId: req.body.groupId,  // optional
    });
    success(res, result, result.isNewUser
      ? `Ariza tasdiqlandi. Yangi o'quvchi yaratildi: ${result.student.name}`
      : `Ariza tasdiqlandi. Mavjud o'quvchi aktivlashtirildi: ${result.student.name}`
    );
  } catch (e) { next(e); }
};

/** PATCH /enrollment-applications/:id/reject  — admin */
export const reject = async (req, res, next) => {
  try {
    const app = await svc.reject(req.params.id, {
      adminId: req.user._id,
      reason:  req.body.reason,
    });
    success(res, app, "Ariza rad etildi.");
  } catch (e) { next(e); }
};
