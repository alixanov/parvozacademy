import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validate.middleware.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize } from '../../middleware/rbac.middleware.js';
import * as ctrl from './users.controller.js';

const router = Router();

// ── Public (no auth) ─────────────────────────────────────────
router.get('/public', ctrl.getPublic);

router.use(authenticate);

// Any authenticated user
router.get('/me', ctrl.getMe);
router.patch('/me', ctrl.updateProfile);

// Admin only
router.get('/', authorize('admin'), ctrl.getAll);

router.post(
  '/',
  authorize('admin'),
  [
    body('name').if(body('nameUz').not().exists()).trim().notEmpty().withMessage('Ism kiritilishi shart'),
    body('phone').trim().notEmpty().withMessage('Telefon kiritilishi shart'),
    body('password').isLength({ min: 6 }).withMessage('Parol kamida 6 ta belgi'),
    body('role').isIn(['admin', 'teacher', 'student']).withMessage('Role noto\'g\'ri'),
  ],
  validate,
  ctrl.createUser,
);

router.patch('/:id', authorize('admin'), ctrl.updateUser);
router.delete('/:id', authorize('admin'), ctrl.deleteUser);
router.patch('/:id/active', authorize('admin'), ctrl.setActive);

export default router;
