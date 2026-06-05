import { Module } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';

export async function getByCourse(courseId) {
  return Module.find({ course: courseId }).sort('order');
}

export async function getById(id) {
  const mod = await Module.findById(id);
  if (!mod) throw new AppError('Module not found', 404);
  return mod;
}

export async function create(data) {
  if (!data.order) {
    const count = await Module.countDocuments({ course: data.course });
    data.order = count + 1;
  }
  return Module.create(data);
}

export async function update(id, data) {
  const mod = await Module.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!mod) throw new AppError('Module not found', 404);
  return mod;
}

export async function remove(id) {
  const mod = await Module.findByIdAndDelete(id);
  if (!mod) throw new AppError('Module not found', 404);
}
