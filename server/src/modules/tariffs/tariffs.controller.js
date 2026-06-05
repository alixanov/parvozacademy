import * as svc from './tariffs.service.js';
import { success, created } from '../../utils/response.utils.js';

/* Публичный список — только активные тарифы (для страницы цен) */
export const listPublic = async (req, res, next) => {
  try {
    const plans = await svc.getPublicPlans();
    success(res, plans);
  } catch (e) { next(e); }
};

/* Полный список — для admin-панели */
export const list = async (req, res, next) => {
  try {
    const plans = await svc.getAll();
    success(res, plans);
  } catch (e) { next(e); }
};

export const create = async (req, res, next) => {
  try {
    const plan = await svc.createPlan(req.body);
    created(res, plan, 'Tariff plan created');
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const plan = await svc.updatePlan(req.params.key, req.body);
    success(res, plan, 'Tariff plan updated');
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    await svc.deletePlan(req.params.key);
    success(res, null, 'Tariff plan deleted');
  } catch (e) { next(e); }
};
