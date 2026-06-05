import { Router } from 'express';
import { param, body } from 'express-validator';
import { authenticate }  from '../../middleware/auth.middleware.js';
import { authorize }     from '../../middleware/rbac.middleware.js';
import { validate }      from '../../middleware/validate.middleware.js';
import * as ctrl         from './tariffs.controller.js';

const router    = Router();
const adminOnly = [authenticate, authorize('admin')];

const planBody = [
  body('key').notEmpty().withMessage('key required').matches(/^[a-z0-9_-]+$/).withMessage('key: lowercase letters, digits, _ or - only'),
  body('name.ru').notEmpty().withMessage('name.ru required'),
  body('defaultPrice').isNumeric().withMessage('defaultPrice must be a number'),
];

// GET /tariff-plans/public  — публично, только активные (для страницы цен)
router.get('/public', ctrl.listPublic);

// GET /tariff-plans   — все тарифы (admin)
router.get('/', ctrl.list);

// POST /tariff-plans  — только admin
router.post('/', adminOnly, planBody, validate, ctrl.create);

// PUT /tariff-plans/:key  — только admin
router.put(
  '/:key',
  adminOnly,
  param('key').notEmpty().withMessage('key required'),
  validate,
  ctrl.update,
);

// DELETE /tariff-plans/:key  — только admin
router.delete(
  '/:key',
  adminOnly,
  param('key').notEmpty().withMessage('key required'),
  validate,
  ctrl.remove,
);

export default router;
