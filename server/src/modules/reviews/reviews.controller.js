import * as svc from './reviews.service.js';
import { success, created, paginated } from '../../utils/response.utils.js';

export const listPublic = async (req, res, next) => {
  try {
    const { page, limit, courseId } = req.query;
    const result = await svc.getPublished({
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      courseId,
    });
    paginated(res, result.reviews, { total: result.total, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

export const listAdmin = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;
    const result = await svc.getAll({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    });
    paginated(res, result.reviews, { total: result.total, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

export const submit = async (req, res, next) => {
  try {
    const review = await svc.create(req.body);
    created(res, review, 'Review submitted — awaiting moderation');
  } catch (e) { next(e); }
};

export const moderate = async (req, res, next) => {
  try {
    const review = await svc.setStatus(req.params.id, req.body.status, req.user._id);
    success(res, review, `Review ${req.body.status}`);
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id);
    success(res, null, 'Review deleted');
  } catch (e) { next(e); }
};
