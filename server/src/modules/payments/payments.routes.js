import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './payments.controller.js';

const router = Router();
router.use(authenticate);

const adminOnly = authorize('admin');

const payBody = [
  body('student').isMongoId().withMessage('student must be ObjectId'),
  body('group').isMongoId().withMessage('group must be ObjectId'),
  body('amount').isNumeric({ min: 0 }).withMessage('amount must be positive number'),
  body('month').matches(/^\d{4}-\d{2}$/).withMessage('month must be YYYY-MM format'),
  body('dueDate').isISO8601().withMessage('dueDate must be ISO date'),
];

// Admin
router.get('/', adminOnly, ctrl.list);
router.get('/summary', adminOnly, ctrl.summary);
router.post('/', adminOnly, payBody, validate, ctrl.create);
router.patch('/:id/confirm', adminOnly, [
  param('id').isMongoId(),
  body('paidAmount').isNumeric({ min: 0 }).withMessage('paidAmount must be positive'),
  body('paymentMethod').isIn(['cash', 'card', 'transfer', 'online']).withMessage('Invalid payment method'),
], validate, ctrl.confirm);

// Admin — generate monthly debt records for a student/group (idempotent)
router.post('/generate', adminOnly, [
  body('studentId').isMongoId().withMessage('studentId must be ObjectId'),
  body('groupId').isMongoId().withMessage('groupId must be ObjectId'),
], validate, ctrl.generate);

// Student — course-progress summary (must be before /me to avoid route conflict)
router.get('/me/progress', authorize('student'), ctrl.myProgress);

// Student — own payments
router.get('/me', authorize('student'), ctrl.myPayments);

// Student — upload receipt for a specific payment (debt → pending)
router.patch(
  '/:id/upload-receipt',
  authorize('student'),
  [
    param('id').isMongoId().withMessage('id must be ObjectId'),
    body('receiptUrl').isURL().withMessage('receiptUrl must be a valid URL'),
  ],
  validate,
  ctrl.uploadReceipt,
);

export default router;
