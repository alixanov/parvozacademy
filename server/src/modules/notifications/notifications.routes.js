import { Router } from 'express';
import { body, param } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware.js';
import { authorize }    from '../../middleware/rbac.middleware.js';
import { validate }     from '../../middleware/validate.middleware.js';
import * as ctrl        from './notifications.controller.js';

const router = Router();
router.use(authenticate);

// Any authenticated user — their own notifications
router.get('/', ctrl.list);
router.patch('/:id/read', param('id').isMongoId(), validate, ctrl.markRead);
router.patch('/read-all', ctrl.markAllRead);
router.delete('/:id', param('id').isMongoId(), validate, ctrl.deleteNotif);

// Admin / Teacher can broadcast
router.post('/send', authorize('admin', 'teacher'), [
  body('title').notEmpty().withMessage('Title required'),
  body('message').notEmpty().withMessage('Message required'),
  body('target').notEmpty().withMessage('Target required'),
], validate, ctrl.send);

export default router;
