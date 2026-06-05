import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import * as ctrl        from './dashboard.controller.js';

const router = Router();

router.get('/admin',   authenticate, authorize('admin'),              ctrl.adminDashboard);
router.get('/teacher', authenticate, authorize('admin', 'teacher'),   ctrl.teacherDashboard);
router.get('/student', authenticate, authorize('admin', 'student'),   ctrl.studentDashboard);

export default router;
