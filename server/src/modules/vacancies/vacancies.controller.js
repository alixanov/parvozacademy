import * as svc from './vacancies.service.js';
import { success, created } from '../../utils/response.utils.js';

export const list = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const { subject } = req.query;
    const items = await svc.getAll({ activeOnly: !isAdmin, subject });
    success(res, items);
  } catch (e) { next(e); }
};

export const detail = async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'admin';
    const vacancy = await svc.getById(req.params.id, isAdmin);
    success(res, vacancy);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const vacancy = await svc.create(req.body);
    created(res, vacancy, 'Vacancy created');
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const vacancy = await svc.update(req.params.id, req.body);
    success(res, vacancy, 'Vacancy updated');
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await svc.remove(req.params.id);
    success(res, null, 'Vacancy deleted');
  } catch (e) { next(e); }
};

export const apply = async (req, res, next) => {
  try {
    const app = await svc.apply(req.params.id, req.body);
    created(res, app, 'Application submitted');
  } catch (e) { next(e); }
};

export const applications = async (req, res, next) => {
  try {
    const list = await svc.getApplications(req.params.id);
    success(res, list);
  } catch (e) { next(e); }
};

export const updateAppStatus = async (req, res, next) => {
  try {
    const app = await svc.updateApplicationStatus(req.params.id, req.params.appId, req.body.status);
    success(res, app, 'Application status updated');
  } catch (e) { next(e); }
};
