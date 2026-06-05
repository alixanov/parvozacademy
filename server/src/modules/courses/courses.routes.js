import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate, optionalAuthenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './courses.controller.js';

const router = Router();
const adminOnly = [authenticate, authorize('admin')];
const adminOrTeacher = [authenticate, authorize('admin', 'teacher')];

const courseBody = [
  body('title.uz').notEmpty().withMessage('Uzbek title required'),
  body('subject').notEmpty().withMessage('Subject required'),
  body('level').isIn(['beginner', 'intermediate', 'advanced']).withMessage('Invalid level'),
  body('price.amount').optional().isNumeric().withMessage('Price must be numeric'),
  body('teacher').isMongoId().withMessage('Teacher must be a valid ObjectId'),
];

// Public (с опциональной авторизацией — admin видит все курсы)
router.get('/', optionalAuthenticate, ctrl.list);

// Teacher — own courses (must be before /:id)
router.get('/mine', adminOrTeacher, ctrl.mine);

router.get('/:id',  param('id').isMongoId(), validate, ctrl.detail);

// Admin
router.post('/',              adminOnly, courseBody, validate, ctrl.create);
router.put('/:id',            adminOnly, param('id').isMongoId(), validate, ctrl.update);
router.delete('/:id',         adminOnly, param('id').isMongoId(), validate, ctrl.remove);
router.patch('/:id/publish',   adminOnly, param('id').isMongoId(), validate, ctrl.publish);
router.patch('/:id/activate',  adminOnly, param('id').isMongoId(), validate, ctrl.activate);

export default router;
