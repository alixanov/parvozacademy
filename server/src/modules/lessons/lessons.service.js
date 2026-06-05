import { Lesson } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';

export async function getByModule(moduleId) {
  return Lesson.find({ module: moduleId }).sort('order');
}

export async function getById(id) {
  const lesson = await Lesson.findById(id);
  if (!lesson) throw new AppError('Lesson not found', 404);
  return lesson;
}

export async function create(data) {
  if (!data.order) {
    const count = await Lesson.countDocuments({ module: data.module });
    data.order = count + 1;
  }
  return Lesson.create(data);
}

export async function update(id, data) {
  const lesson = await Lesson.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!lesson) throw new AppError('Lesson not found', 404);
  return lesson;
}

export async function remove(id) {
  const lesson = await Lesson.findByIdAndDelete(id);
  if (!lesson) throw new AppError('Lesson not found', 404);
}
