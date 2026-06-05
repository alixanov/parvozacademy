import * as svc from './payments.service.js';
import { success, created, paginated } from '../../utils/response.utils.js';

export const list = async (req, res, next) => {
  try {
    const { page, limit, studentId, groupId, month, status } = req.query;
    const result = await svc.getAll({ page: +page || 1, limit: +limit || 20, studentId, groupId, month, status });
    paginated(res, result.payments, { total: result.total, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

export const myPayments = async (req, res, next) => {
  try {
    const { page, limit, month } = req.query;
    const result = await svc.getByStudent(req.user._id, { page: +page || 1, limit: +limit || 20, month });
    paginated(res, result.payments, { total: result.total, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const payment = await svc.create(req.body);
    created(res, payment, 'Payment record created');
  } catch (e) { next(e); }
};

export const confirm = async (req, res, next) => {
  try {
    const payment = await svc.confirm(req.params.id, { ...req.body, confirmedBy: req.user._id });
    success(res, payment, 'Payment confirmed');
  } catch (e) { next(e); }
};

export const uploadReceipt = async (req, res, next) => {
  try {
    const payment = await svc.uploadReceipt(
      req.params.id,
      req.user._id,
      req.body.receiptUrl,
    );
    success(res, payment, "Chek yuborildi. Administrator tasdiqlanishini kuting.");
  } catch (e) { next(e); }
};

export const summary = async (req, res, next) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const data = await svc.getSummary(month);
    success(res, data);
  } catch (e) { next(e); }
};

/**
 * POST /payments/generate  (admin)
 * Body: { studentId, groupId }
 * Generates debt payment records for every month of the course.
 * Already-existing records are skipped (idempotent).
 */
export const generate = async (req, res, next) => {
  try {
    const { studentId, groupId } = req.body;
    const payments = await svc.generateGroupPayments(studentId, groupId);
    success(res, payments, `${payments.length} ta to'lov yozuvi tayyor`);
  } catch (e) { next(e); }
};

/**
 * GET /payments/me/progress  (student)
 * Returns per-group course progress with paid / total months.
 */
export const myProgress = async (req, res, next) => {
  try {
    const data = await svc.getGroupProgress(req.user._id);
    success(res, data);
  } catch (e) { next(e); }
};
