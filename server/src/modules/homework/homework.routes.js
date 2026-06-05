import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './homework.controller.js';

const router = Router();
router.use(authenticate);

const teacherAdmin = authorize('admin', 'teacher');

const hwBody = [
  body('title').notEmpty().withMessage('Title required'),
  body('lesson').isMongoId().withMessage('Lesson must be ObjectId'),
  body('group').isMongoId().withMessage('Group must be ObjectId'),
  body('dueDate').isISO8601().withMessage('dueDate must be ISO date'),
];

// List homework for a group (all roles)
router.get('/', query('group').isMongoId(), validate, ctrl.list);
router.get('/:id', param('id').isMongoId(), validate, ctrl.detail);

// Teacher / Admin CRUD
router.post('/', teacherAdmin, hwBody, validate, ctrl.create);
router.put('/:id', teacherAdmin, param('id').isMongoId(), validate, ctrl.update);
router.delete('/:id', teacherAdmin, param('id').isMongoId(), validate, ctrl.remove);

// Submissions
router.get('/:id/submissions', teacherAdmin, param('id').isMongoId(), validate, ctrl.submissions);
router.get('/:id/my-submission', authorize('student'), param('id').isMongoId(), validate, ctrl.mySubmission);
router.post('/:id/submit', authorize('student'), [
  param('id').isMongoId(),
  body('groupId').isMongoId().withMessage('groupId required'),
], validate, ctrl.submit);
router.put('/submissions/:subId/grade', teacherAdmin, param('subId').isMongoId(), [
  body('score').isNumeric().withMessage('score must be numeric'),
], validate, ctrl.grade);

export default router;
