import { Review, Course } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';

export async function getPublished({ page = 1, limit = 10, courseId } = {}) {
  const filter = { isPublished: true, status: 'approved' };
  if (courseId) filter.course = courseId;

  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('course', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return { reviews, total, page, pages: Math.ceil(total / limit) };
}

export async function getAll({ page = 1, limit = 20, status } = {}) {
  const filter = {};
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('course', 'title')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  return { reviews, total, page, pages: Math.ceil(total / limit) };
}

export async function create({ name, avatar, role, courseId, rating, text }) {
  return Review.create({
    author: { name, avatar: avatar || '', role: role || 'student' },
    course: courseId || null,
    rating,
    text,
  });
}

export async function setStatus(id, status, adminId) {
  const review = await Review.findById(id);
  if (!review) throw new AppError('Review not found', 404);

  review.status      = status;
  review.isPublished = status === 'approved';
  review.reviewedBy  = adminId;
  review.reviewedAt  = new Date();

  await review.save();

  // Update course average rating if linked
  if (review.course && status === 'approved') {
    await _recalcCourseRating(review.course);
  }

  return review;
}

export async function remove(id) {
  const review = await Review.findByIdAndDelete(id);
  if (!review) throw new AppError('Review not found', 404);
  if (review.course) await _recalcCourseRating(review.course);
}

async function _recalcCourseRating(courseId) {
  const agg = await Review.aggregate([
    { $match: { course: courseId, status: 'approved' } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const avg   = agg[0]?.avg   ?? 0;
  const count = agg[0]?.count ?? 0;
  await Course.findByIdAndUpdate(courseId, {
    'rating.average': parseFloat(avg.toFixed(1)),
    'rating.count':   count,
  });
}
