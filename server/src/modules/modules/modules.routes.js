import { Router } from 'express';
import { param, body, query } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './modules.controller.js';

const router = Router();
const adminOrTeacher = [authenticate, authorize('admin', 'teacher')];

const modBody = [
  body('title.uz').notEmpty().withMessage('Uzbek title required'),
  body('course').isMongoId().withMessage('Course must be a valid ObjectId'),
];

router.get('/', authenticate, query('course').isMongoId(), validate, ctrl.list);
router.get('/:id', authenticate, param('id').isMongoId(), validate, ctrl.detail);
router.post('/', adminOrTeacher, modBody, validate, ctrl.create);
router.put('/:id', adminOrTeacher, param('id').isMongoId(), validate, ctrl.update);
router.delete('/:id', adminOrTeacher, param('id').isMongoId(), validate, ctrl.remove);

export default router;
