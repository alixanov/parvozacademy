import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import * as ctrl        from './settings.controller.js';

const router = Router();

// Public — academy info available to everyone
router.get('/', ctrl.get);

// Admin only — update
router.put('/', authenticate, authorize('admin'), ctrl.update);

export default router;
