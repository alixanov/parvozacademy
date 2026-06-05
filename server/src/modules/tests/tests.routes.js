import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './tests.controller.js';

const router = Router();

// Public — no auth required
router.get('/public/placement', ctrl.listPlacement);

router.use(authenticate);

const teacherAdmin = authorize('admin', 'teacher');
const studentOnly  = authorize('student');

const testBody = [
  body('title').notEmpty().withMessage('Title required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be positive integer'),
  body('type').isIn(['lesson', 'module', 'placement', 'final']).withMessage('Invalid type'),
];

// Tests CRUD
router.get('/', ctrl.list);
router.get('/:id', param('id').isMongoId(), validate, ctrl.detail);
router.post('/', teacherAdmin, testBody, validate, ctrl.create);
router.put('/:id', teacherAdmin, param('id').isMongoId(), validate, ctrl.update);
router.delete('/:id', teacherAdmin, param('id').isMongoId(), validate, ctrl.remove);
router.patch('/:id/publish', teacherAdmin, param('id').isMongoId(), validate, ctrl.publish);

// Questions
router.get('/:id/questions', param('id').isMongoId(), validate, ctrl.questions);
router.post('/:id/questions', teacherAdmin, [
  param('id').isMongoId(),
  body('question').notEmpty().withMessage('question text required'),
  body('order').isInt({ min: 1 }).optional(),
], validate, ctrl.addQuestion);
router.put('/:id/questions/:qId', teacherAdmin, [param('id').isMongoId(), param('qId').isMongoId()], validate, ctrl.updateQuestion);
router.delete('/:id/questions/:qId', teacherAdmin, [param('id').isMongoId(), param('qId').isMongoId()], validate, ctrl.deleteQuestion);

// Student actions
router.post('/:id/start', studentOnly, param('id').isMongoId(), validate, ctrl.start);
router.post('/:id/submit', studentOnly, [
  param('id').isMongoId(),
  body('answers').isArray().withMessage('answers must be array'),
], validate, ctrl.submit);
router.get('/:id/my-result', studentOnly, param('id').isMongoId(), validate, ctrl.myResult);

// Results (teacher/admin)
router.get('/:id/results', teacherAdmin, param('id').isMongoId(), validate, ctrl.results);
router.get('/student/:studentId/results', teacherAdmin, param('studentId').isMongoId(), validate, ctrl.studentResults);

export default router;
