import { verifyAccess, verifyRefresh } from '../utils/jwt.utils.js';
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

/**
 * For video/file streaming endpoints.
 * Accepts: Bearer header, ?token= query param (access token), or refreshToken cookie.
 * Uses JWT-only validation (no DB lookup) for low overhead on Range requests.
 */
export const authenticateVideo = (req, _res, next) => {
  // 1. Access token via header or query param
  const accessToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : req.query.token;

  if (accessToken) {
    try {
      const payload = verifyAccess(accessToken);
      req.user = { _id: payload.id, role: payload.role };
      return next();
    } catch { /* try refresh cookie */ }
  }

  // 2. Refresh token cookie (httpOnly, same-origin — valid for 7 days)
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    try {
      const payload = verifyRefresh(refreshToken);
      req.user = { _id: payload.id, role: payload.role };
      return next();
    } catch { /* fall through */ }
  }

  return next(new AppError('Not authenticated', 401));
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
