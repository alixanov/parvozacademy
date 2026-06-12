import mongoose from 'mongoose';
import { EnrollmentApplication, User, Group, GroupMember, Payment } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';
import { generateGroupPayments } from '../payments/payments.service.js';
import * as pkgSvc from '../packages/packages.service.js';

/* ─── helpers ──────────────────────────────────────────────────────────────── */

/** Генерирует уникальный studentId вида STU-0042 */
async function generateStudentId() {
  const count = await User.countDocuments({ role: 'student' });
  return `STU-${String(count + 1).padStart(4, '0')}`;
}

/** Возвращает строку 'YYYY-MM' для текущего месяца */
function currentYearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/* ─── public: submit application ───────────────────────────────────────────── */

/**
 * Создаёт заявку от незарегистрированного клиента.
 * @param {{ fullName, phone, courseId, tariffKey, amount, receiptUrl, receiptKey }} data
 */
export async function submitApplication(data) {
  const doc = {
    fullName:   data.fullName,
    phone:      data.phone,
    course:     data.courseId  ?? data.course  ?? null,
    package:    data.packageId ?? data.package ?? null,
    tariffKey:  data.tariffKey ?? (data.packageId || data.package ? 'individual_package' : ''),
    amount:     data.amount,
    receiptUrl: data.receiptUrl,
    receiptKey: data.receiptKey ?? '',
  };
  if (!doc.course && !doc.package) {
    throw new AppError('Kurs yoki paket ko\'rsatilmagan', 400);
  }
  // If submitted by an already-registered user, link their account
  if (data.student) doc.student = data.student;
  return EnrollmentApplication.create(doc);
}

/* ─── admin: list ──────────────────────────────────────────────────────────── */

export async function getAll({ page = 1, limit = 20, status } = {}) {
  const filter = {};
  if (status && status !== 'all') filter.status = status;

  const skip = (page - 1) * limit;
  const [applications, total] = await Promise.all([
    EnrollmentApplication.find(filter)
      .populate('course',      'title tariffs')
      .populate('package',     'title price')
      .populate('processedBy', 'name')
      .populate('student',     'name phone studentId')
      .populate('group',       'name type')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    EnrollmentApplication.countDocuments(filter),
  ]);

  return { applications, total, page, pages: Math.ceil(total / limit) };
}

export async function getById(id) {
  const app = await EnrollmentApplication.findById(id)
    .populate('course',      'title tariffs')
    .populate('package',     'title price')
    .populate('processedBy', 'name')
    .populate('student',     'name phone studentId')
    .populate('group',       'name type schedule');
  if (!app) throw new AppError('Application not found', 404);
  return app;
}

/* ─── admin: approve ───────────────────────────────────────────────────────── */

/**
 * Подтверждает заявку:
 *  1. Находит / создаёт аккаунт ученика
 *  2. Назначает группу
 *  3. Создаёт запись оплаты
 *  4. Обновляет статус заявки → approved
 *
 * @param {string} id          — _id заявки
 * @param {{ adminId, groupId? }} opts
 *   groupId — опционально; если не передан, берётся первая подходящая группа
 */
export async function approve(id, { adminId, groupId } = {}) {
  const session = await mongoose.startSession();

  try {
    let result;
    await session.withTransaction(async () => {
      const app = await EnrollmentApplication.findById(id)
        .populate('course',  'title')
        .populate('package', 'title price')
        .session(session);
      if (!app)               throw new AppError('Application not found', 404);
      if (app.status !== 'pending') throw new AppError('Application already processed', 400);

      /* 1. Найти или создать ученика ───────────────────────────────────────── */
      let student  = await User.findOne({ phone: app.phone }).session(session);
      let isNewUser = false;

      if (!student) {
        isNewUser = true;
        student   = new User({
          name:      app.fullName,
          phone:     app.phone,
          password:  app.phone.replace(/\D/g, '').slice(-6) || '000000',
          role:      'student',
          isActive:  true,
          studentId: await generateStudentId(),
        });
        await student.save({ session });
      } else if (!student.isActive) {
        student.isActive = true;
        await student.save({ session });
      }

      /* ── Package application: grant access directly ─────────────────────── */
      if (app.package) {
        const packageId = app.package._id ?? app.package;
        await pkgSvc.grantAccess(packageId, student._id, adminId, {
          paymentAmount: app.amount,
          note: `Enrollment #${app._id} approved`,
        });

        app.status      = 'approved';
        app.processedAt = new Date();
        app.processedBy = adminId;
        app.student     = student._id;
        await app.save({ session });

        result = { application: app, student, isNewUser, group: null, payment: null };
        return;
      }

      /* ── Course application ──────────────────────────────────────────────── */

      /* 2. Определить группу ───────────────────────────────────────────────── */
      let group;
      if (groupId) {
        group = await Group.findById(groupId).session(session);
        if (!group) throw new AppError('Selected group not found', 404);
      } else {
        group = await Group.findOne({
          course:   app.course._id,
          type:     app.tariffKey,
          isActive: true,
        }).session(session);
      }

      if (!group) {
        const courseName = app.course?.title?.ru ?? app.course?.title?.uz ?? String(app.course._id);
        throw new AppError(
          `"${courseName}" kursi uchun "${app.tariffKey}" turidagi aktiv guruh topilmadi. ` +
          `Avval guruh yarating yoki groupId parametrini yuboring.`,
          404,
        );
      }

      /* 3. Добавить в группу ──────────────────────────────────────────────── */
      const existing = await GroupMember.findOne({ group: group._id, student: student._id }).session(session);
      if (!existing) {
        await GroupMember.create([{
          group:    group._id,
          student:  student._id,
          status:   'active',
          joinedAt: new Date(),
        }], { session });
      } else if (existing.status !== 'active') {
        existing.status   = 'active';
        existing.joinedAt = new Date();
        await existing.save({ session });
      }

      /* 4. Создать запись оплаты ──────────────────────────────────────────── */
      const now         = new Date();
      const yearMonth   = currentYearMonth();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const dueDate     = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      let payment = await Payment.findOne({ student: student._id, group: group._id, month: yearMonth }).session(session);
      if (!payment) {
        const paymentAmount = group.price?.amount ?? app.amount;
        [payment] = await Payment.create([{
          student:      student._id,
          group:        group._id,
          amount:       paymentAmount,
          currency:     group.price?.currency ?? 'UZS',
          month:        yearMonth,
          status:       'paid',
          paymentMethod:'transfer',
          paidAmount:   app.amount,
          confirmedBy:  adminId,
          receiptUrl:   app.receiptUrl,
          paidAt:       now,
          dueDate,
          periodStart,
          periodEnd,
          enrollment:   app._id,
        }], { session });
      }

      /* 5. Долговые платежи (вне транзакции — idempotent) ─────────────────── */
      if (group.status === 'active' || group.isActive) {
        await generateGroupPayments(student._id, group._id);
      }

      /* 6. Обновить заявку → approved ──────────────────────────────────────── */
      app.status      = 'approved';
      app.processedAt = now;
      app.processedBy = adminId;
      app.student     = student._id;
      app.group       = group._id;
      app.payment     = payment._id;
      await app.save({ session });

      result = { application: app, student, isNewUser, group, payment };
    });

    return result;
  } finally {
    session.endSession();
  }
}

/* ─── admin: reject ────────────────────────────────────────────────────────── */

export async function reject(id, { adminId, reason } = {}) {
  const app = await EnrollmentApplication.findById(id);
  if (!app)               throw new AppError('Application not found', 404);
  if (app.status !== 'pending') throw new AppError('Application already processed', 400);

  app.status          = 'rejected';
  app.processedAt     = new Date();
  app.processedBy     = adminId;
  app.rejectionReason = (reason ?? '').trim();
  await app.save();

  return app;
}
