import { Group, GroupMember, GroupSession, Homework, HomeworkSubmission, Attendance } from '../../models/index.js';

/* ── Helpers ──────────────────────────────────────────────────────────────── */
function dayStart(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function dayEnd(d = new Date()) {
  const e = dayStart(d);
  e.setDate(e.getDate() + 1);
  return e;
}
function weekEnd(d = new Date()) {
  const e = dayStart(d);
  e.setDate(e.getDate() + 7);
  return e;
}

/* ── Dashboard ────────────────────────────────────────────────────────────── */

/**
 * Full teacher dashboard payload.
 *
 * Returns:
 *   stats       — totals: groups, students, sessions this month, completed sessions
 *   todaySessions  — sessions scheduled for today
 *   upcomingSessions — next 7 days (excluding today)
 *   groups      — teacher's active groups (brief)
 *   recentHomework  — last 5 homework items created by teacher
 *   pendingSubmissions — ungraded submissions across teacher's groups
 */
export async function getDashboard(teacherId) {
  const now   = new Date();
  const today = dayStart(now);
  const tEnd  = dayEnd(now);
  const wEnd  = weekEnd(now);
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const mEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  /* ── Groups ─────────────────────────────────────────────────────────── */
  const groups = await Group.find({ teacher: teacherId })
    .populate('course', 'title subject')
    .sort({ isActive: -1, createdAt: -1 });

  const groupIds  = groups.map((g) => g._id);
  const activeIds = groups.filter((g) => g.isActive).map((g) => g._id);

  /* ── Student counts ─────────────────────────────────────────────────── */
  const memberCountsRaw = await GroupMember.aggregate([
    { $match: { group: { $in: groupIds }, status: 'active' } },
    { $group: { _id: '$group', count: { $sum: 1 } } },
  ]);
  const memberCountMap = Object.fromEntries(
    memberCountsRaw.map((c) => [String(c._id), c.count]),
  );

  const totalStudents = Object.values(memberCountMap).reduce((s, c) => s + c, 0);

  /* ── Sessions ───────────────────────────────────────────────────────── */
  const [todaySessions, upcomingSessions, monthSessions] = await Promise.all([
    GroupSession.find({ teacher: teacherId, date: { $gte: today, $lt: tEnd } })
      .sort({ startTime: 1 })
      .populate('group', 'name course type status isActive')
      .populate({ path: 'group', populate: { path: 'course', select: 'title subject' } }),

    GroupSession.find({
      teacher: teacherId,
      date:    { $gte: tEnd, $lt: wEnd },
      status:  { $ne: 'cancelled' },
    })
      .sort({ date: 1, startTime: 1 })
      .populate('group', 'name course type status isActive')
      .populate({ path: 'group', populate: { path: 'course', select: 'title subject' } }),

    GroupSession.countDocuments({
      teacher: teacherId,
      date:    { $gte: mStart, $lt: mEnd },
    }),
  ]);

  const completedThisMonth = await GroupSession.countDocuments({
    teacher: teacherId,
    date:    { $gte: mStart, $lt: mEnd },
    status:  'completed',
  });

  /* ── Homework ───────────────────────────────────────────────────────── */
  const recentHomework = await Homework.find({ teacher: teacherId })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('group', 'name');

  /* ── Pending submissions (ungraded) ─────────────────────────────────── */
  const hwIds = await Homework.find({ teacher: teacherId }, '_id');
  const pendingSubmissions = await HomeworkSubmission.countDocuments({
    homework: { $in: hwIds.map((h) => h._id) },
    status:   'submitted',
  });

  /* ── Groups with member count ────────────────────────────────────────── */
  const groupsWithCount = groups.map((g) => ({
    ...g.toObject(),
    memberCount: memberCountMap[String(g._id)] ?? 0,
  }));

  return {
    stats: {
      totalGroups:          groups.length,
      activeGroups:         activeIds.length,
      totalStudents,
      sessionsThisMonth:    monthSessions,
      completedThisMonth,
      pendingSubmissions,
    },
    todaySessions,
    upcomingSessions,
    groups: groupsWithCount,
    recentHomework,
  };
}

/* ── Teacher's groups (detailed) ──────────────────────────────────────────── */
export async function getGroups(teacherId) {
  const groups = await Group.find({ teacher: teacherId })
    .populate('course', 'title subject duration')
    .sort({ isActive: -1, createdAt: -1 });

  const groupIds = groups.map((g) => g._id);

  const [memberCounts, nextSessions] = await Promise.all([
    GroupMember.aggregate([
      { $match: { group: { $in: groupIds }, status: 'active' } },
      { $group: { _id: '$group', count: { $sum: 1 } } },
    ]),
    GroupSession.aggregate([
      {
        $match: {
          group:  { $in: groupIds },
          date:   { $gte: dayStart() },
          status: { $in: ['scheduled', 'live'] },
        },
      },
      { $sort: { date: 1, startTime: 1 } },
      {
        $group: {
          _id:       '$group',
          nextDate:  { $first: '$date' },
          nextTime:  { $first: '$startTime' },
          sessionId: { $first: '$_id' },
          status:    { $first: '$status' },
        },
      },
    ]),
  ]);

  const countMap   = Object.fromEntries(memberCounts.map((c) => [String(c._id), c.count]));
  const sessionMap = Object.fromEntries(nextSessions.map((s) => [String(s._id), s]));

  return groups.map((g) => ({
    ...g.toObject(),
    memberCount:  countMap[String(g._id)] ?? 0,
    nextSession:  sessionMap[String(g._id)] ?? null,
  }));
}

/* ── Session history for a group ──────────────────────────────────────────── */
export async function getGroupHistory(groupId, teacherId, { page = 1, limit = 20 } = {}) {
  // Verify teacher owns the group
  const group = await Group.findOne({ _id: groupId, teacher: teacherId });
  if (!group) throw new Error('Guruh topilmadi yoki ruxsat yo\'q');

  const skip = (page - 1) * limit;
  const filter = { group: groupId, status: { $in: ['completed', 'cancelled'] } };

  const [docs, total] = await Promise.all([
    GroupSession.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    GroupSession.countDocuments(filter),
  ]);

  return { docs, total, page, pages: Math.ceil(total / limit) };
}

/* ── Attendance summary for a group ──────────────────────────────────────── */
export async function getAttendanceSummary(groupId, teacherId) {
  const group = await Group.findOne({ _id: groupId, teacher: teacherId });
  if (!group) throw new Error('Ruxsat yo\'q');

  const members = await GroupMember.find({ group: groupId, status: 'active' })
    .populate('student', 'name phone studentId avatar');

  const sessions = await GroupSession.find({ group: groupId, status: 'completed' }, '_id date');
  const sessionIds = sessions.map((s) => s._id);
  const totalSessions = sessions.length;

  if (totalSessions === 0) {
    return {
      totalSessions: 0,
      members: members.map((m) => ({
        student:    m.student,
        present:    0,
        late:       0,
        absent:     0,
        excused:    0,
        attendPct:  0,
      })),
    };
  }

  // Fetch all attendance records for these sessions
  const records = await Attendance.find({
    group:   groupId,
    session: { $in: sessionIds },
  });

  // Build map: studentId → { present, late, absent, excused }
  const statsMap = {};
  for (const att of records) {
    for (const rec of att.records) {
      const sid = String(rec.student);
      if (!statsMap[sid]) statsMap[sid] = { present: 0, late: 0, absent: 0, excused: 0 };
      statsMap[sid][rec.status] = (statsMap[sid][rec.status] ?? 0) + 1;
    }
  }

  const result = members.map((m) => {
    const sid   = String(m.student._id);
    const s     = statsMap[sid] ?? { present: 0, late: 0, absent: 0, excused: 0 };
    const attended = s.present + s.late;
    return {
      student:    m.student,
      present:    s.present,
      late:       s.late,
      absent:     s.absent,
      excused:    s.excused,
      attendPct:  totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 0,
    };
  });

  return { totalSessions, members: result };
}
