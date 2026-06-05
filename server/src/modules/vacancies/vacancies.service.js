import { Vacancy } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';

export async function getAll({ activeOnly = true, subject, type } = {}) {
  const filter = {};
  if (activeOnly) filter.isActive = true;
  if (subject) filter.subject = subject;
  if (type) filter.type = type;
  return Vacancy.find(filter, '-applications').sort({ createdAt: -1 });
}

export async function getById(id, includeApplications = false) {
  const projection = includeApplications ? '' : '-applications';
  const vacancy = await Vacancy.findById(id, projection);
  if (!vacancy) throw new AppError('Vacancy not found', 404);
  return vacancy;
}

export async function create(data) {
  return Vacancy.create(data);
}

export async function update(id, data) {
  const vacancy = await Vacancy.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!vacancy) throw new AppError('Vacancy not found', 404);
  return vacancy;
}

export async function remove(id) {
  const vacancy = await Vacancy.findByIdAndDelete(id);
  if (!vacancy) throw new AppError('Vacancy not found', 404);
}

export async function apply(vacancyId, { name, email, phone, resumeUrl, resumePublicId, coverLetter }) {
  const vacancy = await Vacancy.findById(vacancyId);
  if (!vacancy) throw new AppError('Vacancy not found', 404);
  if (!vacancy.isActive) throw new AppError('This vacancy is closed', 400);

  const already = vacancy.applications.find((a) => a.email === email);
  if (already) throw new AppError('You have already applied', 409);

  vacancy.applications.push({ name, email, phone, resumeUrl, resumePublicId, coverLetter });
  await vacancy.save();
  return vacancy.applications[vacancy.applications.length - 1];
}

export async function getApplications(vacancyId) {
  const vacancy = await Vacancy.findById(vacancyId, 'applications');
  if (!vacancy) throw new AppError('Vacancy not found', 404);
  return vacancy.applications.sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));
}

export async function updateApplicationStatus(vacancyId, appId, status) {
  const vacancy = await Vacancy.findById(vacancyId);
  if (!vacancy) throw new AppError('Vacancy not found', 404);

  const app = vacancy.applications.id(appId);
  if (!app) throw new AppError('Application not found', 404);

  app.status = status;
  await vacancy.save();
  return app;
}
