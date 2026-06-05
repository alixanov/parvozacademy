import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../../middleware/validate.middleware.js';
import * as ctrl from './auth.controller.js';

const router = Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Ism kiritilishi shart'),
    body('phone').trim().notEmpty().withMessage('Telefon raqam kiritilishi shart'),
    body('password').isLength({ min: 6 }).withMessage('Parol kamida 6 ta belgidan iborat bo\'lishi kerak'),
    body('email').optional({ nullable: true }).isEmail().normalizeEmail().withMessage('Email noto\'g\'ri'),
  ],
  validate,
  ctrl.register,
);

router.post(
  '/login',
  [
    body('phone').trim().notEmpty().withMessage('Telefon raqam kiritilishi shart'),
    body('password').notEmpty().withMessage('Parol kiritilishi shart'),
  ],
  validate,
  ctrl.login,
);

router.post('/logout', ctrl.logout);
router.post('/refresh', ctrl.refresh);

export default router;
