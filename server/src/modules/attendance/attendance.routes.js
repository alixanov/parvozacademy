import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './attendance.controller.js';

const router = Router();
router.use(authenticate);

const teacherAdmin = authorize('admin', 'teacher');

// GET /attendance?group=:id&date=:date — single sheet
router.get('/', teacherAdmin, [
  query('group').isMongoId().withMessage('group must be a valid ObjectId'),
  query('date').isISO8601().withMessage('date must be a valid ISO date'),
], validate, ctrl.byGroupDate);

// GET /attendance/group/:groupId — paginated list for a group
router.get('/group/:groupId', teacherAdmin, param('groupId').isMongoId(), validate, ctrl.byGroup);

// GET /attendance/student/:studentId — all sheets for a student
router.get('/student/:studentId', param('studentId').isMongoId(), validate, ctrl.byStudent);

// GET /attendance/student/:studentId/stats?groupId=:id
router.get('/student/:studentId/stats', param('studentId').isMongoId(), query('groupId').isMongoId(), validate, ctrl.studentStats);

// POST /attendance — mark attendance
router.post('/', teacherAdmin, [
  body('groupId').isMongoId().withMessage('groupId required'),
  body('date').isISO8601().withMessage('date must be ISO'),
  body('records').isArray({ min: 1 }).withMessage('records[] required'),
  body('records.*.student').isMongoId().withMessage('records[].student must be ObjectId'),
  body('records.*.status').isIn(['present', 'absent', 'late', 'excused']).withMessage('Invalid status'),
], validate, ctrl.mark);

export default router;
