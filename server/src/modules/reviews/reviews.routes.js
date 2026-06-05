import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './reviews.controller.js';

const router = Router();

// Public — anyone can read published reviews
router.get('/', ctrl.listPublic);

// Public — anyone can submit a review (goes to pending queue)
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1–5'),
    body('text').isLength({ min: 10, max: 1000 }).withMessage('Text must be 10–1000 chars'),
  ],
  validate,
  ctrl.submit,
);

// Admin only
router.get('/admin',    authenticate, authorize('admin'), ctrl.listAdmin);
router.patch(
  '/:id/status',
  authenticate, authorize('admin'),
  param('id').isMongoId(),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  validate,
  ctrl.moderate,
);
router.delete(
  '/:id',
  authenticate, authorize('admin'),
  param('id').isMongoId(), validate,
  ctrl.remove,
);

export default router;
