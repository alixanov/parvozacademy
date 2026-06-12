import { Group, GroupMember, Payment, Course } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';
import { generateGroupPayments } from '../payments/payments.service.js';
import * as notifSvc from '../notifications/notifications.service.js';
import { generateSessions } from '../sessions/sessions.service.js';

// ── Date helpers ──────────────────────────────────────────────────────────────
function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Grace period (days) after dueDate before access is revoked.
 * Standard LMS practice: 3–7 days.
 */
const GRACE_DAYS = 3;

export async function getAll({ page = 1, limit = 20, teacherId, courseId, isActive } = {}) {
  const filter = {};
  if (teacherId) filter.teacher = teacherId;
  if (courseId)  filter.course  = courseId;
  if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;

  const skip = (page - 1) * limit;
  const [groups, total] = await Promise.all([
    Group.find(filter)
      .populate('course',   'title subject duration')
      .populate('teacher',  'name avatar')
      .populate('package',  'title price status modules')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Group.countDocuments(filter),
  ]);

  // Attach real enrolled student count to each group
  const groupIds = groups.map((g) => g._id);
  const counts   = await GroupMember.aggregate([
    { $match: { group: { $in: groupIds }, status: 'active' } },
    { $group: { _id: '$group', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  const enriched = groups.map((g) => {
    const obj = g.toObject();
    obj.memberCount = countMap[String(g._id)] ?? 0;
    return obj;
  });

  return { groups: enriched, total, page, pages: Math.ceil(total / limit) };
}

export async function getById(id) {
  const group = await Group.findById(id)
    .populate('course', 'title subject price')
    .populate('teacher', 'name avatar subject');
  if (!group) throw new AppError('Group not found', 404);
  return group;
}

export async function create(data) {
  const group = await Group.create(data);

  // Notify the assigned teacher immediately after group creation
  if (group.teacher) {
    const populated = await Group.findById(group._id)
      .populate('course', 'title subject')
      .populate('teacher', 'name');

    const course   = populated?.course;
    const schedule = (group.schedule ?? [])
      .map((s) => {
        const days = ['Yak', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
        return `${days[s.dayOfWeek]} ${s.startTime}–${s.endTime}`;
      })
      .join(', ');

    await notifSvc.send({
      title:    `Yangi guruh tayinlandi: ${group.name}`,
      message:  [
        `Siz "${group.name}" guruhiga ustoz sifatida tayinlandingiz.`,
        course?.title ? `Kurs: ${typeof course.title === 'object' ? (course.title.uz ?? course.title.ru) : course.title}` : '',
        course?.subject ? `Fan: ${course.subject}` : '',
        schedule ? `Jadval: ${schedule}` : '',
        group.startDate ? `Boshlanish: ${new Date(group.startDate).toLocaleDateString('uz-UZ')}` : '',
        `Tarif: ${group.type}`,
      ].filter(Boolean).join('\n'),
      type:     'info',
      category: 'announcement',
      target:   { userId: group.teacher },
      metadata: { groupId: group._id },
    }).catch(() => {}); // non-blocking
  }

  return group;
}

export async function update(id, data) {
  const group = await Group.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!group) throw new AppError('Group not found', 404);
  return group;
}

export async function remove(id) {
  const group = await Group.findByIdAndDelete(id);
  if (!group) throw new AppError('Group not found', 404);
}

// ── Group lifecycle ───────────────────────────────────────────────────────────

/**
 * ACTIVATE — admin explicitly starts the course.
 *
 * Flow:
 *   1. status: inactive → active, isActive: true
 *   2. startDate = now  (activation date becomes the billing anchor)
 *   3. endDate   = startDate + course.duration months
 *   4. Generate monthly DEBT payment records for every active member
 *      (idempotent — skips already-existing month records)
 *
 * Returns { group, membersCount, paymentsGenerated }
 */
export async function activateGroup(id, startDateInput) {
  const group = await Group.findById(id).populate('course', 'duration title');
  if (!group) throw new AppError('Guruh topilmadi', 404);
  if (group.status === 'active') throw new AppError('Guruh allaqachon faol', 400);
  if (group.status === 'completed') throw new AppError('Tugagan guruhni qayta faollashtirish mumkin emas', 400);

  const now      = new Date();
  const duration = group.course?.duration ?? 1;

  // Use provided startDate or default to today
  const start = startDateInput ? new Date(startDateInput) : now;
  start.setHours(0, 0, 0, 0); // normalize to start of day

  // isActive = true only if course starts today or in the past
  const isImmediate = start <= now;

  group.status      = 'active';
  group.isActive    = isImmediate;
  group.activatedAt = now;
  group.startDate   = start;
  group.endDate     = addMonths(start, duration);
  await group.save();

  // Generate payment schedule for every active member
  const members = await GroupMember.find({ group: id, status: 'active' }, 'student');
  const results = await Promise.allSettled(
    members.map((m) => generateGroupPayments(m.student, id))
  );

  const paymentsGenerated = results
    .filter((r) => r.status === 'fulfilled')
    .reduce((sum, r) => sum + (r.value?.length ?? 0), 0);

  // Auto-generate GroupSession records for the full course duration
  const sessionResult = await generateSessions(id).catch(() => ({ created: 0 }));

  return { group, membersCount: members.length, paymentsGenerated, sessionsGenerated: sessionResult.created };
}

/**
 * COMPLETE — admin marks the group as finished.
 *
 * Flow:
 *   1. status: active → completed, isActive: false
 *   2. Members who paid all months → status: 'graduated'
 *   3. Members with debt → stay 'active' (debt visible, access read-only)
 *
 * Returns { group, graduatedCount, debtCount }
 */
export async function completeGroup(id) {
  const group = await Group.findById(id).populate('course', 'duration');
  if (!group) throw new AppError('Guruh topilmadi', 404);
  if (group.status !== 'active') throw new AppError('Faqat faol guruhni yakunlash mumkin', 400);

  group.status   = 'completed';
  group.isActive = false;
  group.endDate  = new Date(); // actual end = today
  await group.save();

  const duration = group.course?.duration ?? 1;
  const members  = await GroupMember.find({ group: id, status: 'active' });

  let graduatedCount = 0;
  let debtCount      = 0;

  await Promise.all(
    members.map(async (m) => {
      const paidCount = await Payment.countDocuments({
        student: m.student,
        group:   id,
        status:  'paid',
      });

      if (paidCount >= duration) {
        m.status = 'graduated';
        graduatedCount++;
      } else {
        // Keep as active — debt is still visible to admin
        debtCount++;
      }
      return m.save();
    })
  );

  return { group, graduatedCount, debtCount };
}

// Members
export async function getMembers(groupId) {
  return GroupMember.find({ group: groupId, status: 'active' })
    .populate('student', 'name email phone avatar studentId');
}

export async function addMember(groupId, studentId) {
  const group = await Group.findById(groupId);
  if (!group) throw new AppError('Group not found', 404);

  const existing = await GroupMember.findOne({ group: groupId, student: studentId });
  if (existing) {
    if (existing.status === 'active') throw new AppError('Student already in group', 409);
    existing.status   = 'active';
    existing.joinedAt = new Date();
    await existing.save();
    // Only generate payments if group is already running
    if (group.status === 'active') {
      await generateGroupPayments(studentId, groupId).catch(() => {});
    }
    // Update course student count
    if (group.course) {
      await Course.findByIdAndUpdate(group.course, { $inc: { totalStudents: 1 } }).catch(() => {});
    }
    return existing;
  }

  // Capacity check
  const count = await GroupMember.countDocuments({ group: groupId, status: 'active' });
  if (count >= group.maxStudents) throw new AppError('Group is full', 400);

  const member = await GroupMember.create({ group: groupId, student: studentId });
  // Only generate payments if group is already running
  if (group.status === 'active') {
    await generateGroupPayments(studentId, groupId).catch(() => {});
  }
  // Update course student count
  if (group.course) {
    await Course.findByIdAndUpdate(group.course, { $inc: { totalStudents: 1 } }).catch(() => {});
  }
  return member;
}

export async function removeMember(groupId, studentId) {
  const group = await Group.findById(groupId);
  const member = await GroupMember.findOneAndUpdate(
    { group: groupId, student: studentId },
    { status: 'expelled' },
    { new: true }
  );
  if (!member) throw new AppError('Member not found', 404);
  // Decrement course student count
  if (group?.course) {
    await Course.findByIdAndUpdate(group.course, { $inc: { totalStudents: -1 } }).catch(() => {});
  }
  return member;
}

/**
 * Returns all group members with their payment status for the group.
 * Also auto-updates GroupMember.paymentBlocked if overdue payments exist.
 *
 * Response per member:
 *   { member, student, payments, paidMonths, duration, progressPct,
 *     overdueCount, pendingCount, nextDuePayment, paymentBlocked }
 */
export async function getMembersWithPaymentStatus(groupId) {
  const group = await Group.findById(groupId)
    .populate('course', 'title duration subject')
    .populate('teacher', 'name');
  if (!group) throw new AppError('Group not found', 404);

  const members = await GroupMember.find({ group: groupId })
    .populate('student', 'name email phone avatar studentId');

  const duration  = group.course?.duration ?? 1;
  const startDate = group.startDate ?? null;

  // Batch-load all payments for this group (one query)
  const allPayments = await Payment.find({ group: groupId }).sort({ month: 1 });
  const payByStudent = {};
  for (const p of allPayments) {
    const sid = p.student.toString();
    if (!payByStudent[sid]) payByStudent[sid] = [];
    payByStudent[sid].push(p);
  }

  const now = new Date();

  // ── Auto-generate payments for students who have none yet ─────────────────
  // (idempotent — safe to call even if some months already exist)
  const studentsWithoutPayments = members
    .filter((m) => m.student && !payByStudent[m.student._id.toString()])
    .map((m) => m.student._id);

  if (studentsWithoutPayments.length > 0) {
    await Promise.allSettled(
      studentsWithoutPayments.map((sid) => generateGroupPayments(sid, groupId))
    );
    // Re-fetch all payments after generation
    const refreshed = await Payment.find({ group: groupId }).sort({ month: 1 });
    for (const p of refreshed) {
      const sid = p.student.toString();
      if (!payByStudent[sid]) payByStudent[sid] = [];
      // Avoid duplicates when merging
      if (!payByStudent[sid].find((x) => x._id.toString() === p._id.toString())) {
        payByStudent[sid].push(p);
      }
    }
  }

  const result = [];

  for (const member of members) {
    if (!member.student) continue;
    const sid      = member.student._id.toString();
    const payments = payByStudent[sid] ?? [];

    const paidList = payments.filter((p) => p.status === 'paid');

    // Grace deadline = dueDate + GRACE_DAYS (world-standard: 3 days after due)
    // Overdue = grace period expired and payment still unpaid
    const overdueList = payments.filter((p) => {
      if (p.status !== 'debt' && p.status !== 'partial') return false;
      const graceDeadline = new Date(p.dueDate);
      graceDeadline.setDate(graceDeadline.getDate() + GRACE_DAYS);
      return graceDeadline.getTime() <= now.getTime();
    });

    // In grace period = dueDate passed but grace deadline hasn't expired yet
    const inGraceList = payments.filter((p) => {
      if (p.status !== 'debt' && p.status !== 'partial') return false;
      const graceDeadline = new Date(p.dueDate);
      graceDeadline.setDate(graceDeadline.getDate() + GRACE_DAYS);
      return new Date(p.dueDate).getTime() <= now.getTime() && graceDeadline.getTime() > now.getTime();
    });

    // Started but unpaid = periodStart passed, dueDate not yet passed
    const startedUnpaidList = payments.filter((p) =>
      (p.status === 'debt' || p.status === 'partial') &&
      p.periodStart && new Date(p.periodStart) <= now &&
      new Date(p.dueDate) > now
    );

    const pendingList = payments.filter((p) => p.status === 'pending');

    // ── Block decision ─────────────────────────────────────────────────────
    //
    // Rule 1 — neverPaid: group is ACTIVE and student has ZERO paid months
    //   → block immediately (no grace, no exceptions)
    //   → AA oʻquvchi (toʻladi) → neverPaid=false → kirish bor
    //   → BB oʻquvchi (toʻlamadi) → neverPaid=true → darhol bloklangan
    //
    // Rule 2 — hasOverdue: at least one payment whose grace period expired
    //   → block (grace period = GRACE_DAYS after dueDate)
    //
    // Admin can override BOTH rules with manualAccessGranted=true.
    //
    const hasOverdue = overdueList.length > 0;
    const neverPaid  = group.isActive && paidList.length === 0;
    const shouldBlock = (neverPaid || hasOverdue) && !member.manualAccessGranted;

    // blockReason — for UI to show correct message
    const blockReason = shouldBlock
      ? (neverPaid && !hasOverdue ? 'never_paid' : 'overdue')
      : null;

    // Persist paymentBlocked change if needed
    if (member.paymentBlocked !== shouldBlock) {
      await GroupMember.findByIdAndUpdate(member._id, { paymentBlocked: shouldBlock }).exec();
    }

    const paidMonths  = paidList.length;
    const progressPct = duration > 0 ? Math.round((paidMonths / duration) * 100) : 0;

    const nextDuePayment = payments
      .filter((p) => p.status === 'debt')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] ?? null;

    result.push({
      member: {
        _id:                 member._id,
        status:              member.status,
        paymentBlocked:      shouldBlock,
        blockReason,          // 'never_paid' | 'overdue' | null
        hasOverdue,
        neverPaid,
        manualAccessGranted: member.manualAccessGranted,
        joinedAt:            member.joinedAt,
      },
      student:            member.student,
      payments,
      paidMonths,
      duration,
      progressPct,
      overdueCount:       overdueList.length,
      inGraceCount:       inGraceList.length,
      startedUnpaidCount: startedUnpaidList.length,
      pendingCount:       pendingList.length,
      nextDuePayment,
    });
  }

  return { group, members: result };
}

/**
 * Admin: manually grant or revoke lesson access for a blocked student.
 * grant = true  → sets manualAccessGranted=true, paymentBlocked=false (access restored)
 * grant = false → sets manualAccessGranted=false, re-evaluates paymentBlocked
 */
export async function setMemberAccess(groupId, studentId, grant) {
  const member = await GroupMember.findOne({ group: groupId, student: studentId });
  if (!member) throw new AppError('Member not found', 404);

  member.manualAccessGranted = grant;

  if (grant) {
    // Admin opens access → clear block
    member.paymentBlocked = false;
  } else {
    // Admin revokes manual grant → re-evaluate:
    // block if neverPaid OR overdue
    const group      = await Group.findById(groupId);
    const paidCount  = await Payment.countDocuments({ student: studentId, group: groupId, status: 'paid' });
    const neverPaid  = (group?.isActive ?? false) && paidCount === 0;

    const overdueCount = await Payment.countDocuments({
      student: studentId,
      group:   groupId,
      status:  'debt',
      dueDate: { $lte: new Date(Date.now() - GRACE_DAYS * 86400000) },
    });
    member.paymentBlocked = neverPaid || overdueCount > 0;
  }

  await member.save();
  return member;
}

// Student: groups the student belongs to
export async function getMyGroups(studentId) {
  const memberships = await GroupMember.find({ student: studentId, status: 'active' }, 'group');
  const groupIds = memberships.map((m) => m.group);
  return Group.find({ _id: { $in: groupIds } })
    .populate('course', 'title subject')
    .populate('teacher', 'name avatar')
    .sort({ createdAt: -1 });
}

// Teacher: all active students across the teacher's groups
export async function getTeacherStudents(teacherId) {
  const groups = await Group.find({ teacher: teacherId, isActive: true }, '_id name');
  const groupIds = groups.map((g) => g._id);
  return GroupMember.find({ group: { $in: groupIds }, status: 'active' })
    .populate('student', 'name email phone avatar studentId')
    .populate('group', 'name _id');
}
