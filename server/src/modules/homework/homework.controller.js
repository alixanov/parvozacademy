import * as svc from './homework.service.js';
import { success, created } from '../../utils/response.utils.js';

// ─── Homework ─────────────────────────────────────────────────────────────────

export const list = async (req, res, next) => {
  try {
    const items = await svc.getByGroup(req.query.group);
    success(res, items);
  } catch (e) { next(e); }
};

export const detail = async (req, res, next) => {
  try {
    const hw = await svc.getById(req.params.id);
    success(res, hw);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const hw = await svc.create({ ...req.body, teacher: req.user._id });
    created(res, hw, 'Homework created');
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const hw = await svc.update(req.params.id, req.body);
    success(res, hw, 'Homework updated');
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id);
    success(res, null, 'Homework deleted');
  } catch (e) { next(e); }
};

// ─── Submissions ─────────────────────────────────────────────────────────────

export const submissions = async (req, res, next) => {
  try {
    const list = await svc.getSubmissions(req.params.id);
    success(res, list);
  } catch (e) { next(e); }
};

export const mySubmission = async (req, res, next) => {
  try {
    const sub = await svc.getMySubmission(req.params.id, req.user._id);
    success(res, sub);
  } catch (e) { next(e); }
};

export const submit = async (req, res, next) => {
  try {
    const sub = await svc.submit(req.params.id, req.user._id, req.body.groupId, req.body);
    created(res, sub, 'Homework submitted');
  } catch (e) { next(e); }
};

export const grade = async (req, res, next) => {
  try {
    const sub = await svc.grade(req.params.subId, { ...req.body, gradedBy: req.user._id });
    success(res, sub, 'Submission graded');
  } catch (e) { next(e); }
};
