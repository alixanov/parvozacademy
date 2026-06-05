import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './vacancies.controller.js';

const router = Router();

const adminOnly = [authenticate, authorize('admin')];
const optionalAuth = (req, _res, next) => {
  // Try to authenticate but don't fail if no token
  const header = req.headers.authorization;
  if (!header) return next();
  authenticate(req, _res, next);
};

const vacBody = [
  body('title').notEmpty().withMessage('Title required'),
  body('description').notEmpty().withMessage('Description required'),
  body('type').isIn(['full-time', 'part-time', 'internship']).withMessage('Invalid type'),
];

// Public (with optional auth to detect admin)
router.get('/', optionalAuth, ctrl.list);
router.get('/:id', optionalAuth, param('id').isMongoId(), validate, ctrl.detail);
router.post('/:id/apply', [
  param('id').isMongoId(),
  body('name').notEmpty().withMessage('Name required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('resumeUrl').isURL().withMessage('resumeUrl must be valid URL'),
], validate, ctrl.apply);

// Admin
router.post('/', adminOnly, vacBody, validate, ctrl.create);
router.put('/:id', adminOnly, param('id').isMongoId(), validate, ctrl.update);
router.delete('/:id', adminOnly, param('id').isMongoId(), validate, ctrl.remove);
router.get('/:id/applications', adminOnly, param('id').isMongoId(), validate, ctrl.applications);
router.patch('/:id/applications/:appId', adminOnly, [
  param('id').isMongoId(),
  param('appId').isMongoId(),
  body('status').isIn(['pending', 'reviewed', 'accepted', 'rejected']).withMessage('Invalid status'),
], validate, ctrl.updateAppStatus);

export default router;
