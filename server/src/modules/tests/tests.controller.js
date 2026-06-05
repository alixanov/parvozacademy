import * as svc from './tests.service.js';
import { success, created } from '../../utils/response.utils.js';

// ─── Tests ────────────────────────────────────────────────────────────────────
export const list = async (req, res, next) => {
  try {
    const { groupId, courseId, type } = req.query;
    const showAll = req.user.role !== 'student'; // students only see published
    const tests = await svc.getAll({ groupId, courseId, type, isPublished: showAll ? null : true });
    success(res, tests);
  } catch (e) { next(e); }
};

export const detail = async (req, res, next) => {
  try {
    const test = await svc.getById(req.params.id);
    success(res, test);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const test = await svc.create({ ...req.body, teacher: req.user._id });
    created(res, test, 'Test created');
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const test = await svc.update(req.params.id, req.body);
    success(res, test, 'Test updated');
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id);
    success(res, null, 'Test deleted');
  } catch (e) { next(e); }
};

export const publish = async (req, res, next) => {
  try {
    const test = await svc.setPublished(req.params.id, req.body.isPublished ?? true);
    success(res, test, 'Test publish status updated');
  } catch (e) { next(e); }
};

// ─── Public placement tests ──────────────────────────────────────────────────
export const listPlacement = async (req, res, next) => {
  try {
    const data = await svc.getPlacementTests();
    success(res, data);
  } catch (e) { next(e); }
};

// ─── Questions ───────────────────────────────────────────────────────────────
export const questions = async (req, res, next) => {
  try {
    const qs = await svc.getQuestions(req.params.id);
    success(res, qs);
  } catch (e) { next(e); }
};

export const addQuestion = async (req, res, next) => {
  try {
    const q = await svc.addQuestion(req.params.id, req.body);
    created(res, q, 'Question added');
  } catch (e) { next(e); }
};

export const updateQuestion = async (req, res, next) => {
  try {
    const q = await svc.updateQuestion(req.params.qId, req.body);
    success(res, q, 'Question updated');
  } catch (e) { next(e); }
};

export const deleteQuestion = async (req, res, next) => {
  try {
    await svc.deleteQuestion(req.params.qId);
    success(res, null, 'Question deleted');
  } catch (e) { next(e); }
};

// ─── Results ─────────────────────────────────────────────────────────────────
export const start = async (req, res, next) => {
  try {
    const result = await svc.start(req.params.id, req.user._id, req.body.groupId);
    success(res, result, 'Test started');
  } catch (e) { next(e); }
};

export const submit = async (req, res, next) => {
  try {
    const result = await svc.submit(req.params.id, req.user._id, req.body.answers);
    success(res, result, 'Test submitted and graded');
  } catch (e) { next(e); }
};

export const results = async (req, res, next) => {
  try {
    const list = await svc.getResults(req.params.id);
    success(res, list);
  } catch (e) { next(e); }
};

export const myResult = async (req, res, next) => {
  try {
    const result = await svc.getMyResult(req.params.id, req.user._id);
    success(res, result);
  } catch (e) { next(e); }
};

export const studentResults = async (req, res, next) => {
  try {
    const list = await svc.getStudentResults(req.params.studentId);
    success(res, list);
  } catch (e) { next(e); }
};
