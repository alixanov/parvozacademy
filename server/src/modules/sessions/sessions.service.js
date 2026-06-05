import { GroupSession, Group, GroupMember, Homework, Attendance } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';
import * as notifSvc from '../notifications/notifications.service.js';

/* ── Helpers ──────────────────────────────────────────────────────────────── */

/**
 * Given a Date and an array of schedule slots ({ dayOfWeek, startTime, endTime }),
 * returns true if that date's day-of-week matches any slot.
 */
function matchesSchedule(date, schedule) {
  const dow = new Date(date).getDay(); // 0=Sun … 6=Sat
  return schedule.some((s) => s.dayOfWeek === dow);
}

/**
 * Returns a Date-only string "YYYY-MM-DD" for grouping/indexing.
 */
function toDateStr(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ── Session generation ───────────────────────────────────────────────────── */

/**
 * Auto-generate GroupSession records for a group across its course duration.
 *
 * Called automatically when a group is activated.
 * Idempotent — existing sessions are skipped (unique index on group+date+startTime).
 *
 * @returns { created: number }
 */
export async function generateSessions(groupId) {
  const group = await Group.findById(groupId).populate('course', 'duration');
  if (!group) throw new AppError('Guruh topilmadi', 404);
  if (!group.startDate) throw new AppError('Guruhning boshlanish sanasi aniqlanmagan', 400);
  if (!group.schedule?.length) return { created: 0 };

  const start    = new Date(group.startDate);
  const end      = group.endDate ? new Date(group.endDate) : (() => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + (group.course?.duration ?? 3));
    return d;
  })();

  const toInsert = [];
  const cursor   = new Date(start);

  // Iterate day-by-day from startDate to endDate
  while (cursor <= end) {
    const dow = cursor.getDay();
    const slots = group.schedule.filter((s) => s.dayOfWeek === dow);
    for (const slot of slots) {
      toInsert.push({
        group:     group._id,
        teacher:   group.teacher,
        date:      new Date(cursor),
        startTime: slot.startTime,
        endTime:   slot.endTime,
        status:    'scheduled',
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (!toInsert.length) return { created: 0 };

  // insertMany with ordered:false + ignore duplicate-key errors
  let created = 0;
  try {
    const result = await GroupSession.insertMany(toInsert, {
      ordered: false,
      rawResult: true,
    });
    created = result.insertedCount ?? toInsert.length;
  } catch (err) {
    // E11000 = duplicate key (session already exists) — safe to ignore
    if (err.code !== 11000 && err.name !== 'MongoBulkWriteError') throw err;
    created = err.result?.nInserted ?? 0;
  }

  return { created };
}

/* ── Queries ──────────────────────────────────────────────────────────────── */

/**
 * List sessions for a group, optionally filtered by date range / status.
 */
export async function getByGroup(groupId, { page = 1, limit = 30, status, from, to } = {}) {
  const filter = { group: groupId };
  if (status) filter.status = status;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to)   filter.date.$lte = new Date(to);
  }

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    GroupSession.find(filter)
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate('teacher', 'name avatar'),
    GroupSession.countDocuments(filter),
  ]);

  return { docs, total, page, pages: Math.ceil(total / limit) };
}

/**
 * Sessions for a teacher — used by teacher dashboard.
 * @param dateRange: 'today' | 'week' | 'month' | undefined (all)
 */
export async function getByTeacher(teacherId, { dateRange, status, page = 1, limit = 50 } = {}) {
  const filter = { teacher: teacherId };
  if (status) filter.status = status;

  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (dateRange === 'today') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    filter.date = { $gte: today, $lt: tomorrow };
  } else if (dateRange === 'week') {
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    filter.date = { $gte: today, $lt: nextWeek };
  } else if (dateRange === 'month') {
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    filter.date = { $gte: today, $lt: nextMonth };
  }

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    GroupSession.find(filter)
      .sort({ date: 1, startTime: 1 })
      .skip(skip)
      .limit(limit)
      .populate('group', 'name course schedule type price status isActive')
      .populate({ path: 'group', populate: { path: 'course', select: 'title subject' } }),
    GroupSession.countDocuments(filter),
  ]);

  return { docs, total, page, pages: Math.ceil(total / limit) };
}

export async function getById(id) {
  const session = await GroupSession.findById(id)
    .populate('group',   'name course schedule type price maxStudents status isActive')
    .populate({ path: 'group', populate: { path: 'course', select: 'title subject' } })
    .populate('teacher', 'name avatar phone');
  if (!session) throw new AppError('Sessiya topilmadi', 404);
  return session;
}

/* ── Mutations ────────────────────────────────────────────────────────────── */

export async function create(data) {
  const session = await GroupSession.create(data);
  return session;
}

export async function update(id, data, teacherId) {
  const session = await GroupSession.findById(id);
  if (!session) throw new AppError('Sessiya topilmadi', 404);

  // Teachers can only update their own sessions
  if (teacherId && String(session.teacher) !== String(teacherId)) {
    throw new AppError('Ruxsat berilmagan', 403);
  }

  Object.assign(session, data);
  await session.save();
  return session;
}

/**
 * Teacher sends a lesson join link → all active students in the group are notified.
 */
export async function sendLink(sessionId, { url, type }, senderId) {
  const session = await GroupSession.findById(sessionId).populate('group', 'name status');
  if (!session) throw new AppError('Sessiya topilmadi', 404);
  if (String(session.teacher) !== String(senderId)) throw new AppError('Ruxsat berilmagan', 403);
  if (session.group && !session.group.isActive && session.group.status !== 'completed') throw new AppError("Guruh admin tomonidan aktivatsiyalanmagan. Avval admin guruhni faollashtirishi kerak.", 403);
  if (!url) throw new AppError('Link URL majburiy', 400);

  // Save link — do NOT change status (link is just the address, not a start signal)
  session.lessonLink       = { url, type: type || 'other' };
  session.lessonLinkSentAt = new Date();
  await session.save();

  // Notify all active students: "here is where your lesson will be"
  const members    = await GroupMember.find({ group: session.group._id, status: 'active' }, 'student');
  const studentIds = members.map((m) => m.student);

  const groupNameStr = (() => {
    const n = session.group.name;
    if (!n) return 'guruh';
    if (typeof n === 'object') return n.ru ?? n.uz ?? 'guruh';
    return n;
  })();

  const platformLabels = {
    zoom: 'Zoom', google_meet: 'Google Meet', youtube: 'YouTube',
    telegram: 'Telegram', other: 'Havola',
  };
  const platform = platformLabels[type] ?? 'Havola';

  // Format session date for notification
  const sessionDate = session.date
    ? new Date(session.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'long' })
    : '';

  await Promise.allSettled(
    studentIds.map((sid) =>
      notifSvc.send({
        senderId,
        title:    `📍 ${groupNameStr} — dars manzili`,
        message:  `${sessionDate ? sessionDate + ', ' : ''}${session.startTime ?? ''} — dars ${platform} orqali o'tkaziladi. Havola: ${url}`,
        type:     'info',
        category: 'lesson',
        target:   { userId: sid },
        link:     url,
        metadata: { sessionId: session._id, groupId: session.group._id },
      }),
    ),
  );

  return session;
}

/**
 * Teacher marks a session as completed.
 * Records completedAt. Does NOT auto-create attendance (teacher does that separately).
 */
export async function complete(sessionId, { topic, notes } = {}, teacherId) {
  const session = await GroupSession.findById(sessionId).populate('group', 'status');
  if (!session) throw new AppError('Sessiya topilmadi', 404);
  if (String(session.teacher) !== String(teacherId)) throw new AppError('Ruxsat berilmagan', 403);
  if (session.group && !session.group.isActive && session.group.status !== 'completed') throw new AppError("Guruh admin tomonidan aktivatsiyalanmagan. Avval admin guruhni faollashtirishi kerak.", 403);
  if (session.status === 'completed') throw new AppError('Sessiya allaqachon yakunlangan', 400);

  session.status      = 'completed';
  session.completedAt = new Date();
  if (topic) session.topic = topic;
  if (notes) session.notes = notes;
  await session.save();

  return session;
}

/**
 * Add materials to a session (append, not replace).
 */
export async function addMaterials(sessionId, materials, teacherId) {
  const session = await GroupSession.findById(sessionId);
  if (!session) throw new AppError('Sessiya topilmadi', 404);
  if (String(session.teacher) !== String(teacherId)) throw new AppError('Ruxsat berilmagan', 403);

  session.materials.push(...materials);
  await session.save();
  return session;
}

/**
 * Remove a material by index from a session.
 */
export async function removeMaterial(sessionId, materialIndex, teacherId) {
  const session = await GroupSession.findById(sessionId);
  if (!session) throw new AppError('Sessiya topilmadi', 404);
  if (String(session.teacher) !== String(teacherId)) throw new AppError('Ruxsat berilmagan', 403);

  const idx = Number(materialIndex);
  if (idx < 0 || idx >= session.materials.length) throw new AppError('Material topilmadi', 404);

  session.materials.splice(idx, 1);
  await session.save();
  return session;
}

/**
 * Create a homework linked to a session and notify all group students.
 */
export async function createHomework(sessionId, hwData, teacherId) {
  const session = await GroupSession.findById(sessionId).populate('group', 'name');
  if (!session) throw new AppError('Sessiya topilmadi', 404);
  if (String(session.teacher) !== String(teacherId)) throw new AppError('Ruxsat berilmagan', 403);

  const hw = await Homework.create({
    ...hwData,
    session: session._id,
    group:   session.group._id,
    teacher: teacherId,
  });

  // Notify students
  const members = await GroupMember.find({ group: session.group._id, status: 'active' }, 'student');
  await Promise.allSettled(
    members.map((m) =>
      notifSvc.send({
        senderId: teacherId,
        title:    "Yangi uyga vazifa!",
        message:  `${session.group.name} guruhi uchun yangi uyga vazifa qo'shildi: "${hw.title}"`,
        type:     'info',
        category: 'homework',
        target:   { userId: m.student },
        metadata: { homeworkId: hw._id, sessionId: session._id },
      }),
    ),
  );

  return hw;
}

/**
 * Get homework for a session.
 */
export async function getSessionHomework(sessionId) {
  return Homework.find({ session: sessionId })
    .populate('teacher', 'name')
    .sort({ createdAt: -1 });
}

/**
 * Get attendance for a session.
 */
export async function getSessionAttendance(sessionId) {
  const session = await GroupSession.findById(sessionId);
  if (!session) throw new AppError('Sessiya topilmadi', 404);
  return Attendance.findOne({ session: sessionId })
    .populate('records.student', 'name phone studentId avatar');
}

/**
 * Admin: manually cancel a session.
 */
export async function cancel(sessionId) {
  const session = await GroupSession.findByIdAndUpdate(
    sessionId,
    { status: 'cancelled' },
    { new: true },
  );
  if (!session) throw new AppError('Sessiya topilmadi', 404);
  return session;
}
