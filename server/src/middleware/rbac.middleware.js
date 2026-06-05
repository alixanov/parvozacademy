import { AppError } from '../utils/response.utils.js';

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));
  if (!roles.includes(req.user.role)) return next(new AppError('Forbidden', 403));
  next();
};
