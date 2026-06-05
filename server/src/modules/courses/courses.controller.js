import * as svc from './courses.service.js';
import { success, created, paginated } from '../../utils/response.utils.js';

export const list = async (req, res, next) => {
  try {
    const { page, limit, subject, level, search } = req.query;
    const isAdmin = req.user?.role === 'admin';
    const result = await svc.getAll({ page: +page || 1, limit: +limit || 12, subject, level, search, showAll: isAdmin });
    paginated(res, result.courses, { total: result.total, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

export const mine = async (req, res, next) => {
  try {
    const courses = await svc.getMine(req.user._id);
    success(res, courses);
  } catch (e) { next(e); }
};

export const detail = async (req, res, next) => {
  try {
    const course = await svc.getById(req.params.id, req.user?.role === 'admin');
    success(res, course);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const course = await svc.create(req.body);
    created(res, course, 'Course created');
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const course = await svc.update(req.params.id, req.body);
    success(res, course, 'Course updated');
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id);
    success(res, null, 'Course deleted');
  } catch (e) { next(e); }
};

export const publish = async (req, res, next) => {
  try {
    const course = await svc.setPublished(req.params.id, req.body.isPublished ?? true);
    success(res, course, 'Course publish status updated');
  } catch (e) { next(e); }
};

export const activate = async (req, res, next) => {
  try {
    const course = await svc.setActive(req.params.id, req.body.isActive ?? true);
    success(res, course, 'Course active status updated');
  } catch (e) { next(e); }
};
