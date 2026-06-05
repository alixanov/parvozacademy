import { User } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';

const PROFILE_FIELDS = ['name', 'phone', 'address', 'telegram', 'dateOfBirth'];

function _normalizePhone(raw = '') {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return raw.trim();
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function updateProfile(userId, updates) {
  const filtered = {};
  PROFILE_FIELDS.forEach((k) => {
    if (updates[k] !== undefined) filtered[k] = updates[k];
  });

  const user = await User.findByIdAndUpdate(userId, filtered, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function getAll({ page = 1, limit = 50, role, search } = {}) {
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { name:   { $regex: search, $options: 'i' } },
    { nameUz: { $regex: search, $options: 'i' } },
    { nameRu: { $regex: search, $options: 'i' } },
    { phone:  { $regex: search, $options: 'i' } },
  ];

  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return { users, total, page, pages: Math.ceil(total / limit) };
}

export async function createUser({ name, nameUz, nameRu, phone, email, password, role, subject, experience, bio, salary, color }) {
  const normalized = _normalizePhone(phone);
  if (await User.findOne({ phone: normalized })) {
    throw new AppError('Bu telefon raqam allaqachon ro\'yxatdan o\'tgan', 409);
  }
  if (email && await User.findOne({ email })) {
    throw new AppError('Bu email allaqachon ro\'yxatdan o\'tgan', 409);
  }

  const user = await User.create({
    name:   nameUz || name,   // primary = Uzbek name
    nameUz: nameUz || name,
    nameRu: nameRu || undefined,
    phone: normalized,
    email: email || undefined,
    password,
    passwordPlain: password,  // store plain text for admin view
    role: role || 'student',
    subject,
    experience: experience ? Number(experience) : undefined,
    bio,
    salary: salary ? Number(salary) : undefined,
    color:  color || undefined,
    isActive: true,
  });
  return user;
}

export async function updateUser(userId, updates) {
  const allowed = ['name', 'nameUz', 'nameRu', 'phone', 'email', 'subject', 'experience', 'bio', 'isActive', 'salary', 'address', 'telegram', 'color'];

  // Keep name in sync with nameUz when nameUz is updated
  if (updates.nameUz) updates.name = updates.nameUz;
  const filtered = {};
  allowed.forEach((k) => { if (updates[k] !== undefined) filtered[k] = updates[k]; });

  if (filtered.phone) filtered.phone = _normalizePhone(filtered.phone);

  if (updates.password && updates.password.length >= 6) {
    const user = await User.findById(userId).select('+password');
    if (!user) throw new AppError('User not found', 404);
    user.password      = updates.password;
    user.passwordPlain = updates.password;  // keep plain-text in sync
    Object.assign(user, filtered);
    await user.save();
    return User.findById(userId);
  }

  const user = await User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function deleteUser(userId, requesterId) {
  if (String(userId) === String(requesterId)) throw new AppError('Cannot delete yourself', 400);
  const user = await User.findByIdAndDelete(userId);
  if (!user) throw new AppError('User not found', 404);
  return user;
}

export async function setActive(userId, isActive) {
  const user = await User.findByIdAndUpdate(userId, { isActive }, { new: true });
  if (!user) throw new AppError('User not found', 404);
  return user;
}
