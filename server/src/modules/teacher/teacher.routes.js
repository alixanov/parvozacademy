import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './teacher.controller.js';

const router = Router();

// All teacher routes require authentication + teacher (or admin) role
router.use(authenticate, authorize('teacher', 'admin'));

/** GET /teacher/dashboard */
router.get('/dashboard', ctrl.dashboard);

/** GET /teacher/groups */
router.get('/groups', ctrl.groups);

/** GET /teacher/groups/:groupId/history */
router.get(
  '/groups/:groupId/history',
  [param('groupId').isMongoId()],
  validate,
  ctrl.groupHistory,
);

/** GET /teacher/groups/:groupId/attendance */
router.get(
  '/groups/:groupId/attendance',
  [param('groupId').isMongoId()],
  validate,
  ctrl.attendanceSummary,
);

export default router;
