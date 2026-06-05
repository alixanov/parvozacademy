import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './sessions.controller.js';

const router = Router();

const adminOrTeacher = [authenticate, authorize('admin', 'teacher')];
const authed         = [authenticate];

/* ── List ──────────────────────────────────────────────────────────────────── */
// GET /sessions?group=<id>
router.get(
  '/',
  authed,
  [query('group').isMongoId().withMessage('group must be a valid ObjectId')],
  validate,
  ctrl.listByGroup,
);

// GET /sessions/teacher  — teacher's own sessions (or admin views by teacherId)
router.get('/teacher', authed, ctrl.listByTeacher);

// GET /sessions/:id
router.get('/:id', authed, [param('id').isMongoId()], validate, ctrl.detail);

/* ── Generate sessions for a group ──────────────────────────────────────── */
// POST /sessions/generate/:groupId
router.post(
  '/generate/:groupId',
  adminOrTeacher,
  [param('groupId').isMongoId()],
  validate,
  ctrl.generate,
);

/* ── Create (admin only) ─────────────────────────────────────────────────── */
router.post(
  '/',
  [authenticate, authorize('admin')],
  [
    body('group').isMongoId(),
    body('teacher').isMongoId(),
    body('date').isISO8601(),
  ],
  validate,
  ctrl.create,
);

/* ── Update ─────────────────────────────────────────────────────────────── */
router.patch('/:id', adminOrTeacher, [param('id').isMongoId()], validate, ctrl.update);

/* ── Teacher actions ────────────────────────────────────────────────────── */

// POST /sessions/:id/link
router.post(
  '/:id/link',
  adminOrTeacher,
  [
    param('id').isMongoId(),
    body('url').isURL().withMessage('Valid URL required'),
    body('type').optional().isIn(['zoom', 'google_meet', 'youtube', 'telegram', 'other']),
  ],
  validate,
  ctrl.sendLink,
);

// PATCH /sessions/:id/complete
router.patch(
  '/:id/complete',
  adminOrTeacher,
  [param('id').isMongoId()],
  validate,
  ctrl.complete,
);

// PATCH /sessions/:id/cancel
router.patch(
  '/:id/cancel',
  [authenticate, authorize('admin')],
  [param('id').isMongoId()],
  validate,
  ctrl.cancel,
);

/* ── Materials ──────────────────────────────────────────────────────────── */
router.post(
  '/:id/materials',
  adminOrTeacher,
  [
    param('id').isMongoId(),
    body('materials').optional().isArray(),
  ],
  validate,
  ctrl.addMaterials,
);

router.delete(
  '/:id/materials/:idx',
  adminOrTeacher,
  [param('id').isMongoId()],
  validate,
  ctrl.removeMaterial,
);

/* ── Homework ────────────────────────────────────────────────────────────── */
router.post(
  '/:id/homework',
  adminOrTeacher,
  [
    param('id').isMongoId(),
    body('title').notEmpty().withMessage('Title required'),
    body('dueDate').isISO8601().withMessage('Valid dueDate required'),
  ],
  validate,
  ctrl.createHomework,
);

router.get('/:id/homework', authed, [param('id').isMongoId()], validate, ctrl.getHomework);

/* ── Attendance ──────────────────────────────────────────────────────────── */
router.get('/:id/attendance', authed, [param('id').isMongoId()], validate, ctrl.getAttendance);

export default router;
