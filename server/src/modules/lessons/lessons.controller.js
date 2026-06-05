import * as svc from './lessons.service.js';
import { success, created, AppError } from '../../utils/response.utils.js';
import { Group, GroupMember, Payment } from '../../models/index.js';

const GRACE_DAYS = 3;

/**
 * Real-time access check for a student opening a lesson.
 *
 * Blocked if ANY of:
 *   1. neverPaid  — group is active, student has ZERO paid months
 *   2. overdue    — a payment's grace deadline (dueDate + 3 days) has expired
 *
 * Always allowed if:
 *   - lesson.isFree = true
 *   - group not yet active (inactive/completed)
 *   - student not enrolled
 *   - member.manualAccessGranted = true  (admin override)
 */
async function checkStudentAccess(userId, lesson) {
  if (lesson.isFree) return null;

  // Only active groups count for access
  const groups = await Group.find({ course: lesson.course, isActive: true }, '_id');
  if (groups.length === 0) return null;

  const groupIds = groups.map((g) => g._id);

  const member = await GroupMember.findOne({
    group:   { $in: groupIds },
    student: userId,
    status:  'active',
  });
  if (!member) return null;

  // Admin override always wins
  if (member.manualAccessGranted) return null;

  // Rule 1: Never paid → blocked immediately
  const paidCount = await Payment.countDocuments({
    student: userId,
    group:   { $in: groupIds },
    status:  'paid',
  });
  if (paidCount === 0) {
    return new AppError(
      "To'lov amalga oshirilmagan. Darsga kirish uchun avval to'lov qiling.",
      403
    );
  }

  // Rule 2: Overdue (grace period expired)
  const now            = new Date();
  const graceThreshold = new Date(now.getTime() - GRACE_DAYS * 86400000);
  const overdueCount   = await Payment.countDocuments({
    student: userId,
    group:   { $in: groupIds },
    status:  'debt',
    dueDate: { $lte: graceThreshold },
  });
  if (overdueCount > 0) {
    return new AppError(
      "To'lov muddati o'tdi. Darsga kirish taqiqlangan. Iltimos, to'lovni amalga oshiring.",
      403
    );
  }

  return null;
}

export const list = async (req, res, next) => {
  try {
    const lessons = await svc.getByModule(req.query.module);
    success(res, lessons);
  } catch (e) { next(e); }
};

export const detail = async (req, res, next) => {
  try {
    const lesson = await svc.getById(req.params.id);

    // Students-only: check payment block
    if (req.user.role === 'student') {
      const err = await checkStudentAccess(req.user._id, lesson);
      if (err) return next(err);
    }

    success(res, lesson);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const lesson = await svc.create(req.body);
    created(res, lesson, 'Lesson created');
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const lesson = await svc.update(req.params.id, req.body);
    success(res, lesson, 'Lesson updated');
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id);
    success(res, null, 'Lesson deleted');
  } catch (e) { next(e); }
};
