import * as svc from './settings.service.js';
import { success } from '../../utils/response.utils.js';

export const get = async (req, res, next) => {
  try {
    const settings = await svc.get();
    success(res, settings);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const settings = await svc.update(req.body, req.user._id);
    success(res, settings, 'Settings updated');
  } catch (e) { next(e); }
};
