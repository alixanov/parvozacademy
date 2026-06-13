import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './enrollment.controller.js';

const router    = Router();
const adminOnly = [authenticate, authorize('admin')];

/* ── Публичный маршрут: подача заявки ────────────────────────────────────── */
const submitBody = [
  body('fullName').notEmpty().trim().withMessage('fullName required'),
  body('phone').notEmpty().trim().withMessage('phone required'),
  body('course').isMongoId().withMessage('course must be ObjectId'),
  body('tariffKey').notEmpty().trim().withMessage('tariffKey required'),
  body('amount').isNumeric({ min: 0 }).withMessage('amount must be a positive number'),
  body('receiptUrl').isURL().withMessage('receiptUrl must be a valid URL'),
];

router.post('/', optionalAuthenticate, submitBody, validate, ctrl.submit);

/* ── Мои заявки (студент) ────────────────────────────────────────────────── */
router.get('/my', authenticate, ctrl.myApplications);

/* ── Маршруты только для Admin ───────────────────────────────────────────── */
router.get('/',    adminOnly, ctrl.list);
router.get('/:id', adminOnly, param('id').isMongoId(), validate, ctrl.detail);

router.patch(
  '/:id/approve',
  adminOnly,
  param('id').isMongoId(),
  body('groupId').optional().isMongoId().withMessage('groupId must be ObjectId'),
  validate,
  ctrl.approve,
);

router.patch(
  '/:id/reject',
  adminOnly,
  param('id').isMongoId(),
  body('reason').optional().trim(),
  validate,
  ctrl.reject,
);

export default router;
