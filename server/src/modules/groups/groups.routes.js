import { Router } from 'express';
import { param, body } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './groups.controller.js';

const router = Router();
const adminOnly = [authenticate, authorize('admin')];
const authTeacherAdmin = [authenticate, authorize('admin', 'teacher')];

const groupBody = [
  body('name').notEmpty().withMessage('Name required'),
  body('course').isMongoId().withMessage('Course must be a valid ObjectId'),
  body('teacher').isMongoId().withMessage('Teacher must be a valid ObjectId'),
  // startDate is NOT required at creation — it is set automatically on activation
  body('startDate').optional().isISO8601().withMessage('startDate must be a valid date'),
  body('type').isIn(['offline', 'online', 'individual_offline', 'individual_online']).withMessage('Invalid type'),
  body('price.amount').isNumeric().withMessage('Price.amount must be numeric'),
];

router.get('/', authTeacherAdmin, ctrl.list);
// Student: get own groups. Must be before /:id to avoid param capture
router.get('/my', authenticate, ctrl.myGroups);
// Teacher/admin: get all students across teacher's groups
router.get('/my-students', authTeacherAdmin, ctrl.myStudents);
router.get('/:id', authTeacherAdmin, param('id').isMongoId(), validate, ctrl.detail);
router.get('/:id/members', authTeacherAdmin, param('id').isMongoId(), validate, ctrl.members);
// Full payment status per member — must be defined before /:id/members/:studentId
router.get('/:id/members/payments', authTeacherAdmin, param('id').isMongoId(), validate, ctrl.membersWithPayments);

router.post('/', adminOnly, groupBody, validate, ctrl.create);
router.put('/:id', adminOnly, param('id').isMongoId(), validate, ctrl.update);
router.patch('/:id/active', adminOnly, [param('id').isMongoId(), body('isActive').isBoolean()], validate, ctrl.setActive);
router.delete('/:id', adminOnly, param('id').isMongoId(), validate, ctrl.remove);

// Group lifecycle endpoints
router.patch('/:id/activate',  adminOnly, param('id').isMongoId(), validate, ctrl.activate);
router.patch('/:id/complete',  adminOnly, param('id').isMongoId(), validate, ctrl.complete);

router.post('/:id/members', adminOnly, [param('id').isMongoId(), body('studentId').isMongoId()], validate, ctrl.addMember);
router.delete('/:id/members/:studentId', adminOnly, [param('id').isMongoId(), param('studentId').isMongoId()], validate, ctrl.removeMember);

// Admin: manually grant / revoke lesson access for a student (override auto-block)
router.patch(
  '/:id/members/:studentId/access',
  adminOnly,
  [param('id').isMongoId(), param('studentId').isMongoId(), body('manualAccessGranted').isBoolean()],
  validate,
  ctrl.setMemberAccess
);

export default router;
