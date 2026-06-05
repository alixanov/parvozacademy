import * as usersService from './users.service.js';
import { success, paginated } from '../../utils/response.utils.js';

// Public — active teachers only, no auth required
export async function getPublic(req, res, next) {
  try {
    const result = await usersService.getAll({ limit: 100, role: 'teacher' });
    const teachers = result.users.filter((u) => u.isActive);
    paginated(res, teachers, { total: teachers.length, page: 1, pages: 1 });
  } catch (err) { next(err); }
}

export async function getMe(req, res, next) {
  try {
    const user = await usersService.getMe(req.user._id);
    success(res, user);
  } catch (err) { next(err); }
}

export async function updateProfile(req, res, next) {
  try {
    const user = await usersService.updateProfile(req.user._id, req.body);
    success(res, user, 'Profile updated');
  } catch (err) { next(err); }
}

export async function getAll(req, res, next) {
  try {
    const { page, limit, role, search } = req.query;
    const result = await usersService.getAll({
      page: Number(page) || 1,
      limit: Number(limit) || 50,
      role,
      search,
    });
    paginated(res, result.users, {
      total: result.total,
      page: result.page,
      pages: result.pages,
    });
  } catch (err) { next(err); }
}

export async function createUser(req, res, next) {
  try {
    const user = await usersService.createUser(req.body);
    success(res, user, 'User created', 201);
  } catch (err) { next(err); }
}

export async function updateUser(req, res, next) {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);
    success(res, user, 'User updated');
  } catch (err) { next(err); }
}

export async function deleteUser(req, res, next) {
  try {
    await usersService.deleteUser(req.params.id, req.user._id);
    success(res, null, 'User deleted');
  } catch (err) { next(err); }
}

export async function setActive(req, res, next) {
  try {
    const user = await usersService.setActive(req.params.id, req.body.isActive);
    success(res, user, 'User status updated');
  } catch (err) { next(err); }
}
