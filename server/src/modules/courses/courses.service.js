import { Course, Group, GroupMember } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';

const PUBLIC_FILTER = { isPublished: true, isActive: true };

export async function getAll({ page = 1, limit = 12, subject, level, search, showAll = false, teacher } = {}) {
  const filter = showAll ? {} : { ...PUBLIC_FILTER };
  if (subject) filter.subject = subject;
  if (level)   filter.level   = level;
  if (teacher) filter.teacher = teacher;
  if (search)  filter.$or = [
    { 'title.uz': { $regex: search, $options: 'i' } },
    { 'title.ru': { $regex: search, $options: 'i' } },
  ];

  const skip = (page - 1) * limit;
  const [courses, total] = await Promise.all([
    Course.find(filter)
      .populate('teacher', 'name avatar subject experience')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Course.countDocuments(filter),
  ]);

  // Count unique active students per course via groups
  const courseIds = courses.map((c) => c._id);
  const groups = await Group.find({ course: { $in: courseIds } }, '_id course');
  const groupIds = groups.map((g) => g._id);

  const memberCounts = await GroupMember.aggregate([
    { $match: { group: { $in: groupIds }, status: 'active' } },
    { $lookup: { from: 'groups', localField: 'group', foreignField: '_id', as: 'g' } },
    { $unwind: '$g' },
    { $group: { _id: '$g.course', students: { $addToSet: '$student' } } },
    { $project: { _id: 1, count: { $size: '$students' } } },
  ]);

  const countMap = Object.fromEntries(memberCounts.map((m) => [String(m._id), m.count]));

  const enriched = courses.map((c) => {
    const obj = c.toObject();
    obj.totalStudents = countMap[String(c._id)] ?? 0;
    return obj;
  });

  return { courses: enriched, total, page, pages: Math.ceil(total / limit) };
}

export async function getMine(teacherId) {
  const courses = await Course.find({ teacher: teacherId })
    .sort({ createdAt: -1 });

  // Enrich with real student counts from groups
  const courseIds = courses.map((c) => c._id);
  const groups = await Group.find({ course: { $in: courseIds } }, '_id course');
  const groupIds = groups.map((g) => g._id);

  const memberCounts = await GroupMember.aggregate([
    { $match: { group: { $in: groupIds }, status: 'active' } },
    { $lookup: { from: 'groups', localField: 'group', foreignField: '_id', as: 'g' } },
    { $unwind: '$g' },
    { $group: { _id: '$g.course', students: { $addToSet: '$student' } } },
    { $project: { _id: 1, count: { $size: '$students' } } },
  ]);

  const countMap = Object.fromEntries(memberCounts.map((m) => [String(m._id), m.count]));

  return courses.map((c) => {
    const obj = c.toObject();
    obj.totalStudents = countMap[String(c._id)] ?? 0;
    return obj;
  });
}

export async function getById(id, isAdmin = false) {
  const filter = isAdmin ? { _id: id } : { _id: id, ...PUBLIC_FILTER };
  const course = await Course.findOne(filter).populate('teacher', 'name avatar subject experience bio achievements');
  if (!course) throw new AppError('Course not found', 404);
  return course;
}

export async function create(data) {
  const course = await Course.create(data);
  return course;
}

export async function update(id, data) {
  const course = await Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!course) throw new AppError('Course not found', 404);
  return course;
}

export async function remove(id) {
  const course = await Course.findByIdAndDelete(id);
  if (!course) throw new AppError('Course not found', 404);
}

export async function setPublished(id, isPublished) {
  const course = await Course.findByIdAndUpdate(id, { isPublished }, { new: true });
  if (!course) throw new AppError('Course not found', 404);
  return course;
}

export async function setActive(id, isActive) {
  const course = await Course.findByIdAndUpdate(id, { isActive }, { new: true });
  if (!course) throw new AppError('Course not found', 404);
  return course;
}
