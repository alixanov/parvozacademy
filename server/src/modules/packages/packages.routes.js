import { Router } from 'express';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware.js';
import { authorize }                          from '../../middleware/rbac.middleware.js';
import * as ctrl                              from './packages.controller.js';

const router = Router();

/* ── Public / optional auth ── */
// GET /packages            — list published
router.get('/',               optionalAuthenticate, ctrl.listPublished);

// GET /packages/admin       — admin: all packages
router.get('/admin',          authenticate, authorize('admin'), ctrl.listAll);

// GET /packages/my          — teacher: own packages
router.get('/my',             authenticate, authorize('teacher', 'admin'), ctrl.listMine);

// GET /packages/my-access   — student: purchased packages
router.get('/my-access',      authenticate, authorize('student'), ctrl.listMyAccess);

// Teacher permission management (admin only)
router.patch('/teacher-permission/:teacherId', authenticate, authorize('admin'), ctrl.setTeacherPermission);

/* ── Package detail (public if published, otherwise owner/admin) ── */
router.get('/:id',            optionalAuthenticate, ctrl.detail);

/* ── Package CRUD (teacher / admin) ── */
router.post('/',              authenticate, authorize('teacher', 'admin'), ctrl.create);
router.patch('/:id',          authenticate, authorize('teacher', 'admin'), ctrl.update);
router.delete('/:id',         authenticate, authorize('teacher', 'admin'), ctrl.remove);
router.patch('/:id/status',   authenticate, authorize('teacher', 'admin'), ctrl.changeStatus);

/* ── Module management ── */
router.post('/:id/modules',               authenticate, authorize('teacher', 'admin'), ctrl.addModule);
router.patch('/:id/modules/reorder',      authenticate, authorize('teacher', 'admin'), ctrl.reorderModules);
router.patch('/:id/modules/:idx',         authenticate, authorize('teacher', 'admin'), ctrl.updateModule);
router.delete('/:id/modules/:idx',        authenticate, authorize('teacher', 'admin'), ctrl.removeModule);

/* ── Access management ── */
router.get('/:id/access/check',           authenticate, authorize('student'), ctrl.checkAccess);
router.get('/:id/students',               authenticate, authorize('teacher', 'admin'), ctrl.getStudents);
router.post('/:id/access',                authenticate, authorize('admin'), ctrl.grantAccess);
router.delete('/:id/access/:studentId',   authenticate, authorize('admin'), ctrl.revokeAccess);

export default router;
