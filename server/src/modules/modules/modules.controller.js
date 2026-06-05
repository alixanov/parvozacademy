import * as svc from './modules.service.js';
import { success, created } from '../../utils/response.utils.js';

export const list = async (req, res, next) => {
  try {
    const modules = await svc.getByCourse(req.query.course);
    success(res, modules);
  } catch (e) { next(e); }
};

export const detail = async (req, res, next) => {
  try {
    const mod = await svc.getById(req.params.id);
    success(res, mod);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const mod = await svc.create(req.body);
    created(res, mod, 'Module created');
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const mod = await svc.update(req.params.id, req.body);
    success(res, mod, 'Module updated');
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id);
    success(res, null, 'Module deleted');
  } catch (e) { next(e); }
};
