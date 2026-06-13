import { Package, PackageAccess, User, TariffPlan, Group, GroupMember } from '../../models/index.js';
import { AppError } from '../../utils/response.utils.js';
import * as notifSvc from '../notifications/notifications.service.js';

/* ── helpers ──────────────────────────────────────────────────────────────── */

function assertOwner(pkg, teacherId) {
  if (String(pkg.teacher._id ?? pkg.teacher) !== String(teacherId)) {
    throw new AppError('Ruxsat berilmagan', 403);
  }
}

/* assertTeacherPermission removed — only admin creates packages now */

/* ── CRUD ─────────────────────────────────────────────────────────────────── */

/**
 * Create a new package (admin only).
 * Admin must specify the `teacher` field.
 */
export async function create(data, requestingUser) {
  if (requestingUser.role !== 'admin') {
    throw new AppError('Paket yaratish faqat admin uchun. Admin bilan bog\'laning.', 403);
  }
  if (!data.teacher) {
    throw new AppError('O\'qituvchini tanlang', 400);
  }

  const pkg = await Package.create({
    title:       data.title,
    description: data.description ?? { uz: '', ru: '' },
    teacher:     data.teacher,
    course:      data.course ?? undefined,
    tariffPlan:  data.tariffPlan ?? null,
    price: {
      amount:   data.price?.amount ?? data.priceAmount ?? 0,
      currency: data.price?.currency ?? data.currency ?? 'UZS',
    },
    thumbnail: data.thumbnail ?? '',
    status:    'draft',
    modules:   [],
  });

  // Link package back to TariffPlan so pricing page shows it
  if (data.tariffPlan) {
    await TariffPlan.findByIdAndUpdate(data.tariffPlan, { $set: { package: pkg._id } });
  }

  return pkg;
}

/**
 * List published packages for public / students.
 */
export async function listPublished({ page = 1, limit = 20, course } = {}) {
  const filter = { status: 'published' };
  if (course) filter.course = course;

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    Package.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('teacher', 'name avatar')
      .populate('course',  'title subject')
      .select('-modules.file.publicId'),
    Package.countDocuments(filter),
  ]);

  return { docs, total, page, pages: Math.ceil(total / limit) };
}

/**
 * List all packages — admin only.
 */
export async function listAll({ page = 1, limit = 30, status, teacher } = {}) {
  const filter = {};
  if (status)  filter.status  = status;
  if (teacher) filter.teacher = teacher;

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    Package.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('teacher', 'name avatar')
      .populate('course',  'title subject'),
    Package.countDocuments(filter),
  ]);

  return { docs, total, page, pages: Math.ceil(total / limit) };
}

/**
 * List packages created by the requesting teacher.
 */
export async function listByTeacher(teacherId) {
  const docs = await Package.find({ teacher: teacherId })
    .sort({ createdAt: -1 })
    .populate('course', 'title subject');
  return docs;
}

/**
 * Get a single package.
 * - Public: only published packages
 * - Teacher/Admin: can see their own draft/archived
 * - Student: only published (access check happens separately)
 */
export async function getById(id, requestingUser) {
  const pkg = await Package.findById(id)
    .populate('teacher', 'name avatar subject')
    .populate('course',  'title subject');

  if (!pkg) throw new AppError('Paket topilmadi', 404);

  const isOwner = requestingUser &&
    (requestingUser.role === 'admin' ||
     String(pkg.teacher._id ?? pkg.teacher) === String(requestingUser._id));

  if (!isOwner && pkg.status !== 'published') {
    throw new AppError('Paket topilmadi', 404);
  }

  return pkg;
}

/**
 * Update package metadata (owner or admin).
 */
export async function update(id, data, requestingUser) {
  const pkg = await Package.findById(id);
  if (!pkg) throw new AppError('Paket topilmadi', 404);

  if (requestingUser.role !== 'admin') assertOwner(pkg, requestingUser._id);

  const allowed = ['title', 'description', 'price', 'thumbnail', 'course', 'teacher'];
  allowed.forEach((key) => {
    if (data[key] !== undefined) pkg[key] = data[key];
  });
  // Flat price fields support
  if (data.priceAmount !== undefined) pkg.price.amount   = data.priceAmount;
  if (data.currency   !== undefined)  pkg.price.currency = data.currency;

  await pkg.save();
  return pkg;
}

/**
 * Publish or un-publish a package (owner or admin).
 * Validates at least 1 module before publishing.
 */
export async function setStatus(id, status, requestingUser) {
  const pkg = await Package.findById(id);
  if (!pkg) throw new AppError('Paket topilmadi', 404);

  if (requestingUser.role !== 'admin') assertOwner(pkg, requestingUser._id);

  if (status === 'published' && pkg.modules.length === 0) {
    throw new AppError('Paketni nashr etish uchun kamida 1 ta modul kerak', 400);
  }

  pkg.status = status;
  await pkg.save();

  // Keep TariffPlan.package in sync
  if (pkg.tariffPlan) {
    await TariffPlan.findByIdAndUpdate(pkg.tariffPlan, { $set: { package: pkg._id } });
  }

  return pkg;
}

/**
 * Delete a package (owner or admin). Also removes all access records.
 */
export async function remove(id, requestingUser) {
  const pkg = await Package.findById(id);
  if (!pkg) throw new AppError('Paket topilmadi', 404);

  if (requestingUser.role !== 'admin') assertOwner(pkg, requestingUser._id);

  await PackageAccess.deleteMany({ package: id });
  await pkg.deleteOne();
  return { deleted: true };
}

/* ── Module management ────────────────────────────────────────────────────── */

/**
 * Add a module to a package.
 */
export async function addModule(id, moduleData, requestingUser) {
  const pkg = await Package.findById(id);
  if (!pkg) throw new AppError('Paket topilmadi', 404);

  if (requestingUser.role !== 'admin') assertOwner(pkg, requestingUser._id);

  const order = pkg.modules.length + 1;
  pkg.modules.push({
    order,
    title:       moduleData.title ?? { uz: `Modul ${order}`, ru: `Модуль ${order}` },
    description: moduleData.description ?? '',
    file:        moduleData.file   ?? {},
    link:        moduleData.link      ?? '',
    videoUrl:    moduleData.videoUrl  ?? '',
    videoFile:   moduleData.videoFile ?? '',
    quiz:        moduleData.quiz ?? [],
    isPublished: true,
  });

  await pkg.save();

  // Notify all admins that a new module was added — they review and publish
  try {
    const admins = await User.find({ role: 'admin' });
    const teacherName = requestingUser.name ?? 'O\'qituvchi';
    const pkgTitle = pkg.title?.uz ?? pkg.title?.ru ?? 'Paket';
    for (const admin of admins) {
      await notifSvc.send({
        senderId:  requestingUser._id,
        title:     '📦 Yangi modul qo\'shildi',
        message:   `${teacherName} "${pkgTitle}" paketiga yangi modul qo'shdi. Ko'rib chiqing va nashr qiling.`,
        type:      'info',
        category:  'package',
        target:    { userId: admin._id },
        metadata:  { packageId: pkg._id },
      });
    }
  } catch (_) { /* notification failure must not break the main flow */ }

  return pkg;
}

/**
 * Update an existing module by index.
 */
export async function updateModule(id, moduleIdx, moduleData, requestingUser) {
  const pkg = await Package.findById(id);
  if (!pkg) throw new AppError('Paket topilmadi', 404);

  if (requestingUser.role !== 'admin') assertOwner(pkg, requestingUser._id);

  const idx = Number(moduleIdx);
  if (idx < 0 || idx >= pkg.modules.length) throw new AppError('Modul topilmadi', 404);

  const mod = pkg.modules[idx];
  const updatable = ['title', 'description', 'file', 'link', 'videoUrl', 'videoFile', 'isPublished', 'order', 'quiz'];
  updatable.forEach((key) => {
    if (moduleData[key] !== undefined) mod[key] = moduleData[key];
  });

  pkg.markModified('modules');
  await pkg.save();
  return pkg;
}

/**
 * Remove a module by index.
 */
export async function removeModule(id, moduleIdx, requestingUser) {
  const pkg = await Package.findById(id);
  if (!pkg) throw new AppError('Paket topilmadi', 404);

  if (requestingUser.role !== 'admin') assertOwner(pkg, requestingUser._id);

  const idx = Number(moduleIdx);
  if (idx < 0 || idx >= pkg.modules.length) throw new AppError('Modul topilmadi', 404);

  pkg.modules.splice(idx, 1);
  // Re-order
  pkg.modules.forEach((m, i) => { m.order = i + 1; });

  pkg.markModified('modules');
  await pkg.save();
  return pkg;
}

/**
 * Reorder modules via an array of module _id strings.
 */
export async function reorderModules(id, orderedIds, requestingUser) {
  const pkg = await Package.findById(id);
  if (!pkg) throw new AppError('Paket topilmadi', 404);

  if (requestingUser.role !== 'admin') assertOwner(pkg, requestingUser._id);

  const modMap = Object.fromEntries(pkg.modules.map((m) => [String(m._id), m]));
  const reordered = orderedIds.map((oid, i) => {
    const m = modMap[oid];
    if (m) m.order = i + 1;
    return m;
  }).filter(Boolean);

  pkg.modules = reordered;
  pkg.markModified('modules');
  await pkg.save();
  return pkg;
}

/* ── Access management ────────────────────────────────────────────────────── */

/**
 * Admin grants a student access to a package.
 * Side-effects:
 *   1. Upserts PackageAccess record
 *   2. Auto-creates (or reuses) the package's linked Group (type: individual_package)
 *   3. Adds student to that group
 *   4. Notifies the student
 *   5. Notifies all admins about the new purchase
 */
export async function grantAccess(packageId, studentId, grantedById, { paymentAmount = 0, note = '' } = {}) {
  const [pkg, student] = await Promise.all([
    Package.findById(packageId).populate('teacher', 'name'),
    User.findById(studentId),
  ]);
  if (!pkg)     throw new AppError('Paket topilmadi', 404);
  if (!student) throw new AppError('O\'quvchi topilmadi', 404);
  if (student.role !== 'student') throw new AppError('Faqat o\'quvchilarga kirishish mumkin', 400);

  const pkgTitle = pkg.title?.uz ?? pkg.title?.ru ?? 'Individual paket';

  // Upsert access record
  const access = await PackageAccess.findOneAndUpdate(
    { student: studentId, package: packageId },
    { $set: { status: 'active', grantedBy: grantedById, paymentAmount, note, revokedAt: null } },
    { upsert: true, new: true },
  );

  // Increment counter (idempotent — only when newly created)
  if (access.createdAt.getTime() === access.updatedAt?.getTime()) {
    await Package.updateOne({ _id: packageId }, { $inc: { purchaseCount: 1 } });
  }

  // ── Auto-create or reuse the package's linked group ───────────────────────
  try {
    let pkgGroup = await Group.findOne({ package: packageId });

    if (!pkgGroup) {
      const teacherId = pkg.teacher?._id ?? pkg.teacher;
      pkgGroup = await Group.create({
        name:        `${pkgTitle} — Inд. guruh`,
        course:      pkg.course ?? null,
        teacher:     teacherId,
        package:     packageId,
        type:        'individual_package',
        price:       { amount: 0, currency: 'UZS' },
        maxStudents: 9999,
        status:      'active',
        isActive:    true,
        startDate:   new Date(),
      });
    }

    // Add student to group (idempotent)
    const existingMember = await GroupMember.findOne({ group: pkgGroup._id, student: studentId });
    if (!existingMember) {
      await GroupMember.create({ group: pkgGroup._id, student: studentId });
    } else if (existingMember.status !== 'active') {
      existingMember.status   = 'active';
      existingMember.joinedAt = new Date();
      await existingMember.save();
    }
  } catch (groupErr) {
    throw new AppError(`Guruh yaratishda xato: ${groupErr.message}`, 500);
  }

  // ── Notify student ────────────────────────────────────────────────────────
  await notifSvc.send({
    senderId: grantedById,
    title:    '📦 Yangi paket ochildi!',
    message:  `Siz "${pkgTitle}" paketiga kirish huquqiga ega bo'ldingiz.`,
    type:     'success',
    category: 'payment',
    target:   { userId: studentId },
    metadata: { packageId },
  }).catch(() => {});

  // ── Notify all admins about the new purchase ──────────────────────────────
  try {
    const admins = await User.find({ role: 'admin' }, '_id');
    for (const admin of admins) {
      await notifSvc.send({
        senderId: studentId,
        title:    '🛒 Yangi xaridor!',
        message:  `${student.name ?? 'O\'quvchi'} "${pkgTitle}" paketini sotib oldi. To'lov: ${paymentAmount > 0 ? paymentAmount.toLocaleString() + ' UZS' : 'Bepul'}`,
        type:     'success',
        category: 'payment',
        target:   { userId: admin._id },
        metadata: { packageId, studentId },
      });
    }
  } catch (_) { /* notification failure must not break the main flow */ }

  return access;
}

/**
 * Revoke a student's access.
 */
export async function revokeAccess(packageId, studentId) {
  const access = await PackageAccess.findOneAndUpdate(
    { student: studentId, package: packageId },
    { $set: { status: 'revoked', revokedAt: new Date() } },
    { new: true },
  );
  if (!access) throw new AppError('Kirish huquqi topilmadi', 404);
  return access;
}

/**
 * Check if a student has active access to a package.
 */
export async function checkAccess(packageId, studentId) {
  const access = await PackageAccess.findOne({ package: packageId, student: studentId, status: 'active' });
  return { hasAccess: !!access, access: access ?? null };
}

/**
 * List all packages a student has access to.
 */
export async function getStudentPackages(studentId) {
  const accesses = await PackageAccess.find({ student: studentId, status: 'active' })
    .populate({
      path:     'package',
      populate: [
        { path: 'teacher', select: 'name avatar' },
        { path: 'course',  select: 'title subject' },
      ],
    })
    .sort({ createdAt: -1 });

  return accesses.map((a) => ({
    access:  a,
    package: a.package,
  }));
}

/**
 * List all students who have access to a package (admin/teacher view).
 */
export async function getPackageStudents(packageId, requestingUser) {
  const pkg = await Package.findById(packageId);
  if (!pkg) throw new AppError('Paket topilmadi', 404);

  if (requestingUser.role !== 'admin') assertOwner(pkg, requestingUser._id);

  return PackageAccess.find({ package: packageId })
    .populate('student', 'name phone avatar studentId')
    .sort({ createdAt: -1 });
}

/* ── Teacher permission ───────────────────────────────────────────────────── */

/**
 * Admin toggles teacher's canCreatePackages permission.
 */
export async function setTeacherPackagePermission(teacherId, enabled) {
  const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
  if (!teacher) throw new AppError('O\'qituvchi topilmadi', 404);

  teacher.canCreatePackages = !!enabled;
  await teacher.save();
  return { _id: teacher._id, name: teacher.name, canCreatePackages: teacher.canCreatePackages };
}
