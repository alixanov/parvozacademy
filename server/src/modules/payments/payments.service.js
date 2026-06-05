import { Payment, Group } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';

/* ── date helper ─────────────────────────────────────────────────────────── */
/** Returns a new Date shifted by N calendar months (handles month-end clamping). */
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/** "2025-06" string from a Date */
function toYearMonth(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export async function getAll({ page = 1, limit = 20, studentId, groupId, month, status } = {}) {
  const filter = {};
  if (studentId) filter.student = studentId;
  if (groupId)   filter.group   = groupId;
  if (month)     filter.month   = month;
  if (status)    filter.status  = status;

  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('student', 'name email phone avatar studentId')
      .populate('group', 'name course')
      .populate('confirmedBy', 'name')
      .sort({ dueDate: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  return { payments, total, page, pages: Math.ceil(total / limit) };
}

export async function getByStudent(studentId, { page = 1, limit = 20, month } = {}) {
  const filter = { student: studentId };
  if (month) filter.month = month;
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('group', 'name')
      .sort({ month: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);
  return { payments, total, page, pages: Math.ceil(total / limit) };
}

export async function create(data) {
  return Payment.create(data);
}

export async function confirm(id, { paidAmount, paymentMethod, confirmedBy, note }) {
  const payment = await Payment.findById(id);
  if (!payment) throw new AppError('Payment not found', 404);

  payment.paidAmount = paidAmount ?? payment.amount;
  payment.status = payment.paidAmount >= payment.amount ? 'paid' : 'partial';
  payment.paymentMethod = paymentMethod;
  payment.confirmedBy = confirmedBy;
  payment.paidAt = new Date();
  if (note) payment.note = note;

  return payment.save();
}

/**
 * Студент загружает чек — статус меняется debt → pending.
 * Ждёт подтверждения администратора.
 */
export async function uploadReceipt(id, studentId, receiptUrl) {
  const payment = await Payment.findOne({ _id: id, student: studentId });
  if (!payment) throw new AppError('Payment not found', 404);
  if (payment.status === 'paid') throw new AppError('Payment already paid', 400);

  payment.receiptUrl = receiptUrl;
  payment.status     = 'pending';
  return payment.save();
}

/* ── generate monthly payments for a student in a group ─────────────────── */
/**
 * Creates "debt" payment records for every month of the course duration,
 * starting from group.startDate.  Already-existing month records are skipped
 * (unique index student+group+month guarantees no duplicates).
 *
 * Example: group starts June 1, course = 3 months:
 *   month 1: periodStart=Jun 1 → periodEnd=Jul 1, dueDate=Jul 1, month="2025-06"
 *   month 2: periodStart=Jul 1 → periodEnd=Aug 1, dueDate=Aug 1, month="2025-07"
 *   month 3: periodStart=Aug 1 → periodEnd=Sep 1, dueDate=Sep 1, month="2025-08"
 *
 * @returns {Payment[]} array of created (or already-existing) payment docs
 */
export async function generateGroupPayments(studentId, groupId) {
  const group = await Group.findById(groupId).populate('course', 'duration title');
  if (!group) return [];

  const duration  = group.course?.duration ?? 1;
  const startDate = group.startDate ?? new Date();

  const results = [];
  for (let i = 0; i < duration; i++) {
    const periodStart = addMonths(startDate, i);
    const periodEnd   = addMonths(startDate, i + 1);
    const dueDate     = new Date(periodEnd); // payment due = start of next period
    const month       = toYearMonth(periodStart);

    // Skip if already recorded (any status)
    const existing = await Payment.findOne({ student: studentId, group: groupId, month });
    if (existing) { results.push(existing); continue; }

    const p = await Payment.create({
      student:     studentId,
      group:       groupId,
      amount:      group.price?.amount ?? 0,
      currency:    group.price?.currency ?? 'UZS',
      month,
      status:      'debt',
      dueDate,
      periodStart,
      periodEnd,
    });
    results.push(p);
  }
  return results;
}

/* ── per-group progress for a student ───────────────────────────────────── */
/**
 * Returns an array of group-progress objects for the student:
 * { group, duration, startDate, endDate, paidMonths, progressPct, payments }
 */
export async function getGroupProgress(studentId) {
  const payments = await Payment.find({ student: studentId })
    .populate({
      path:     'group',
      select:   'name startDate price',
      populate: { path: 'course', select: 'title duration subject' },
    })
    .sort({ month: 1 });

  // Group by group._id
  const groupMap = {};
  for (const p of payments) {
    const gid = p.group?._id?.toString();
    if (!gid) continue;
    if (!groupMap[gid]) groupMap[gid] = { group: p.group, payments: [] };
    groupMap[gid].payments.push(p);
  }

  return Object.values(groupMap).map(({ group, payments: gPayments }) => {
    const duration    = group.course?.duration ?? 1;
    const startDate   = group.startDate ?? null;
    const endDate     = startDate ? addMonths(new Date(startDate), duration) : null;
    const paidMonths  = gPayments.filter((p) => p.status === 'paid').length;
    const progressPct = duration > 0 ? Math.round((paidMonths / duration) * 100) : 0;
    return { group, duration, startDate, endDate, paidMonths, progressPct, payments: gPayments };
  });
}

export async function getSummary(month) {
  const [paid, partial, debt, total] = await Promise.all([
    Payment.aggregate([
      { $match: { month, status: 'paid' } },
      { $group: { _id: null, sum: { $sum: '$paidAmount' }, count: { $sum: 1 } } },
    ]),
    Payment.countDocuments({ month, status: 'partial' }),
    Payment.countDocuments({ month, status: 'debt' }),
    Payment.countDocuments({ month }),
  ]);

  return {
    revenue: paid[0]?.sum ?? 0,
    paidCount: paid[0]?.count ?? 0,
    partialCount: partial,
    debtCount: debt,
    totalCount: total,
  };
}
