import * as authService from './auth.service.js';
import { success, created } from '../../utils/response.utils.js';

export async function register(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body);
    res.cookie('refreshToken', refreshToken, authService.REFRESH_COOKIE_OPTS);
    created(res, { user, accessToken }, 'Registered successfully');
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    res.cookie('refreshToken', refreshToken, authService.REFRESH_COOKIE_OPTS);
    success(res, { user, accessToken }, 'Login successful');
  } catch (err) { next(err); }
}

export async function logout(req, res, next) {
  try {
    await authService.logout(req.cookies?.refreshToken);
    res.clearCookie('refreshToken', { httpOnly: true, path: '/' });
    success(res, null, 'Logged out');
  } catch (err) { next(err); }
}

export async function refresh(req, res, next) {
  try {
    const { accessToken, user } = await authService.refresh(req.cookies?.refreshToken);
    success(res, { accessToken, user });
  } catch (err) { next(err); }
}
