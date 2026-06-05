import * as svc from './notifications.service.js';
import { success, created, paginated } from '../../utils/response.utils.js';

export const list = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await svc.getForUser(req.user._id, { page: +page || 1, limit: +limit || 20 });
    paginated(res, result.items, { total: result.total, unread: result.unread, page: result.page, pages: result.pages });
  } catch (e) { next(e); }
};

export const markRead = async (req, res, next) => {
  try {
    const notif = await svc.markRead(req.params.id, req.user._id);
    success(res, notif, 'Marked as read');
  } catch (e) { next(e); }
};

export const markAllRead = async (req, res, next) => {
  try {
    await svc.markAllRead(req.user._id);
    success(res, null, 'All marked as read');
  } catch (e) { next(e); }
};

export const send = async (req, res, next) => {
  try {
    const { title, message, type, category, target, link, metadata } = req.body;
    const docs = await svc.send({ senderId: req.user._id, title, message, type, category, target, link, metadata });
    created(res, { count: docs.length }, `Notification sent to ${docs.length} recipient(s)`);
  } catch (e) { next(e); }
};

export const deleteNotif = async (req, res, next) => {
  try {
    await svc.deleteOne(req.params.id, req.user._id);
    success(res, null, 'Notification deleted');
  } catch (e) { next(e); }
};
