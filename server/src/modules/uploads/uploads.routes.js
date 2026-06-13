import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../../middleware/auth.middleware.js';
import {
  uploadImageRoute, uploadDocumentRoute, uploadVideoRoute,
  uploadReceiptRoute, viewFileRoute, presignFileRoute,
} from './uploads.controller.js';

const router = Router();

/**
 * POST /api/v1/uploads/receipt  — публичный (без auth)
 * Используется при подаче заявки на зачисление (клиент ещё не зарегистрирован).
 * Rate-limit: 10 запросов / 15 мин с одного IP.
 */
router.post(
  '/receipt',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: 'Too many receipt uploads' }),
  uploadReceiptRoute,
);

/**
 * GET /api/v1/uploads/presign?key=receipts/xxx.pdf  — any authenticated user
 * Returns a 1-hour presigned URL for a private T3 object.
 */
router.get('/presign', authenticate, presignFileRoute);

/**
 * GET /api/v1/uploads/view?key=receipts/xxx.png  — any authenticated user
 * Proxies private T3 objects to the browser (images, PDFs).
 */
router.get('/view', authenticate, viewFileRoute);

// All other upload routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/uploads/image?type=avatar|course|lesson|other
 * Accepts: multipart/form-data, field name: "file"
 * Max size: 5 MB
 */
router.post('/image', uploadImageRoute);

/**
 * POST /api/v1/uploads/document?type=homework|resume|other
 * Accepts: multipart/form-data, field name: "file"
 * Max size: 20 MB
 */
router.post('/document', uploadDocumentRoute);

/**
 * POST /api/v1/uploads/video?type=lesson
 * Accepts: multipart/form-data, field name: "file"
 * Max size: 500 MB
 */
router.post('/video', uploadVideoRoute);

export default router;
