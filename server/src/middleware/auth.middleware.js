import { verifyAccess } from '../utils/jwt.utils.js';
import { AppError } from '../utils/response.utils.js';
import { User } from '../models/index.js';

export const authenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new AppError('Not authenticated', 401);

    const token = header.slice(7);
    const payload = verifyAccess(token);

    const user = await User.findById(payload.id);
    if (!user || !user.isActive) throw new AppError('User not found or deactivated', 401);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Invalid or expired token', 401));
    }
    next(err);
  }
};

/** Устанавливает req.user если токен есть, но не блокирует если токена нет */
export const optionalAuthenticate = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) return next(); // нет токена — продолжаем как публичный

    const token = header.slice(7);
    const payload = verifyAccess(token);
    const user = await User.findById(payload.id);
    if (user?.isActive) req.user = user;
  } catch {
    // невалидный токен — просто игнорируем, продолжаем как публичный
  }
  next();
};
