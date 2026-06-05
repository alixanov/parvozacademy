import {
  User, Course, Group, GroupMember, Homework, HomeworkSubmission,
  Payment, Attendance, Notification, Test, TestResult,
} from '../../models/index.js';

/* ── Admin dashboard ─────────────────────────────────────────────────────────── */

export async function getAdminStats() {
  const now        = new Date();
  const monthStr   = now.toISOString().slice(0, 7); // 'YYYY-MM'
  const prevMonth  = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalStudents,
    totalTeachers,
    totalCourses,
    totalGroups,
    activeGroups,
    revenueAgg,
    prevRevenueAgg,
    pendingHomework,
    pendingPayments,
    newStudentsThisMonth,
    attendanceSummary,
    recentPayments,
  ] = await Promise.all([
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    Course.countDocuments({ isActive: true }),
    Group.countDocuments(),
    Group.countDocuments({ isActive: true }),

    Payment.aggregate([
      { $match: { month: monthStr, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),
    Payment.aggregate([
      { $match: { month: prevMonth, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$paidAmount' } } },
    ]),

    HomeworkSubmission.countDocuments({ status: { $in: ['submitted', 'late'] } }),
    Payment.countDocuments({ status: 'debt' }),

    User.countDocuments({
      role: 'student',
      createdAt: { $gte: monthStart },
    }),

    // Attendance: unwind records[] and count present/total since month start
    Attendance.aggregate([
      { $match: { date: { $gte: monthStart } } },
      { $unwind: '$records' },
      {
        $group: {
          _id: null,
          present: { $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] } },
          total:   { $sum: 1 },
        },
      },
    ]),

    Payment.find({ status: 'paid' })
      .sort({ paidAt: -1 })
      .limit(5)
      .populate('student', 'name avatar')
      .populate('group', 'name'),
  ]);

  const revenue     = revenueAgg[0]?.total ?? 0;
  const prevRevenue = prevRevenueAgg[0]?.total ?? 0;
  const revenueGrowth = prevRevenue > 0
    ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100)
    : 0;

  const attRaw = attendanceSummary[0];
  const avgAttendance = attRaw && attRaw.total > 0
    ? Math.round((attRaw.present / attRaw.total) * 100)
    : 0;

  return {
    totals:   { students: totalStudents, teachers: totalTeachers, courses: totalCourses, groups: totalGroups, activeGroups },
    finance:  { revenueThisMonth: revenue, revenueGrowth, pendingPayments },
    activity: { pendingHomework, newStudentsThisMonth, avgAttendance },
    recentPayments,
  };
}

/* ── Teacher dashboard ───────────────────────────────────────────────────────── */

export async function getTeacherStats(teacherId) {
  const now        = new Date();
  const weekAgo    = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const myGroups = await Group.find({ teacher: teacherId, isActive: true }, '_id name');
  const groupIds = myGroups.map((g) => g._id);

  const [
    totalStudents,
    pendingGrading,
    submittedThisWeek,
    attendanceSummary,
    upcomingTests,
  ] = await Promise.all([
    GroupMember.countDocuments({ group: { $in: groupIds }, status: 'active' }),

    HomeworkSubmission.countDocuments({
      group:  { $in: groupIds },
      status: { $in: ['submitted', 'late'] },
    }),

    HomeworkSubmission.countDocuments({
      group:       { $in: groupIds },
      submittedAt: { $gte: weekAgo },
    }),

    Attendance.aggregate([
      { $match: { group: { $in: groupIds }, date: { $gte: monthStart } } },
      { $unwind: '$records' },
      {
        $group: {
          _id:     null,
          present: { $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] } },
          total:   { $sum: 1 },
        },
      },
    ]),

    Test.find({ teacher: teacherId, isPublished: true, endTime: { $gte: now } })
      .sort({ endTime: 1 })
      .limit(3)
      .populate('group', 'name'),
  ]);

  const attRaw = attendanceSummary[0];
  const attendancePct = attRaw && attRaw.total > 0
    ? Math.round((attRaw.present / attRaw.total) * 100)
    : 0;

  return {
    groups:           myGroups,
    totalStudents,
    pendingGrading,
    submittedThisWeek,
    attendancePct,
    upcomingTests,
  };
}

/* ── Student dashboard ───────────────────────────────────────────────────────── */

export async function getStudentStats(studentId) {
  const now        = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get ALL active groups for this student (not just one)
  const memberships = await GroupMember.find({ student: studentId, status: 'active' }, 'group').lean();
  const groupIds    = memberships.map((m) => m.group).filter(Boolean);

  const [
    homeworkDue,
    homeworkDone,
    attendanceSummary,
    testResultsAgg,
    upcomingTests,
    recentNotifs,
    paymentStatus,
  ] = await Promise.all([
    groupIds.length
      ? Homework.countDocuments({ group: { $in: groupIds }, isActive: true, dueDate: { $gte: now } })
      : 0,

    HomeworkSubmission.countDocuments({ student: studentId }),

    groupIds.length
      ? Attendance.aggregate([
          { $match: { group: { $in: groupIds }, date: { $gte: monthStart } } },
          { $unwind: '$records' },
          { $match: { 'records.student': studentId } },
          {
            $group: {
              _id:     null,
              present: { $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] } },
              total:   { $sum: 1 },
            },
          },
        ])
      : [],

    TestResult.aggregate([
      { $match: { student: studentId, submittedAt: { $ne: null } } },
      { $group: { _id: null, avgPct: { $avg: '$percentage' }, count: { $sum: 1 } } },
    ]),

    groupIds.length
      ? Test.find({ group: { $in: groupIds }, isPublished: true, endTime: { $gte: now } })
          .sort({ endTime: 1 })
          .limit(3)
      : [],

    Notification.find({ recipient: studentId })
      .sort({ createdAt: -1 })
      .limit(5),

    Payment.find({ student: studentId })
      .sort({ month: -1 })
      .limit(3)
      .populate('group', 'name'),
  ]);

  const attRaw = attendanceSummary[0];
  const attendancePct = attRaw && attRaw.total > 0
    ? Math.round((attRaw.present / attRaw.total) * 100)
    : 0;

  return {
    homework:    { due: homeworkDue, done: homeworkDone },
    attendancePct,
    testAvgPct:  Math.round(testResultsAgg[0]?.avgPct ?? 0),
    testCount:   testResultsAgg[0]?.count ?? 0,
    upcomingTests,
    recentNotifs,
    paymentStatus,
  };
}
