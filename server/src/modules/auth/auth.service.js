import { User, RefreshToken } from '../../models/index.js';
import { signAccess, signRefresh, verifyRefresh } from '../../utils/jwt.utils.js';
import { AppError } from '../../utils/response.utils.js';

const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Normalize UZ phone to +998XXXXXXXXX
function _normalizePhone(raw = '') {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return raw.trim(); // pass through unknown format
}

export const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: REFRESH_TTL_MS,
  path: '/',
};

function issueTokens(user) {
  const payload = { id: user._id, role: user.role };
  return {
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload),
  };
}

async function saveRefreshToken(userId, token) {
  await RefreshToken.create({
    token,
    user: userId,
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });
}

export async function register({ name, email, password, phone }) {
  const normalized = _normalizePhone(phone);
  if (await User.findOne({ phone: normalized })) throw new AppError('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan', 409);
  if (email && await User.findOne({ email })) throw new AppError('Bu email allaqachon ro\'yxatdan o\'tgan', 409);

  const user = await User.create({ name, email: email || undefined, password, phone: normalized });
  const { accessToken, refreshToken } = issueTokens(user);
  await saveRefreshToken(user._id, refreshToken);

  return { user, accessToken, refreshToken };
}

export async function login({ phone, password }) {
  // Normalize: strip spaces, dashes; ensure +998 prefix
  const normalized = _normalizePhone(phone);
  const user = await User.findOne({ phone: normalized }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Telefon raqam yoki parol noto\'g\'ri', 401);
  }
  if (!user.isActive) throw new AppError('Account is deactivated', 403);

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  const { accessToken, refreshToken } = issueTokens(user);
  await saveRefreshToken(user._id, refreshToken);

  return { user, accessToken, refreshToken };
}

export async function logout(incomingToken) {
  if (incomingToken) {
    await RefreshToken.deleteOne({ token: incomingToken });
  }
}

export async function refresh(incomingToken) {
  if (!incomingToken) throw new AppError('Refresh token missing', 401);

  try {
    verifyRefresh(incomingToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const stored = await RefreshToken.findOne({ token: incomingToken }).populate('user');
  if (!stored?.user) throw new AppError('Session expired — please log in again', 401);
  if (!stored.user.isActive) throw new AppError('Account deactivated', 403);

  const accessToken = signAccess({ id: stored.user._id, role: stored.user.role });
  return { accessToken, user: stored.user };
}
