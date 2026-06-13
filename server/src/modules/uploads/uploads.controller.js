import { uploadImage, uploadDocument, uploadVideo, uploadReceipt, handleUpload } from '../../middleware/upload.middleware.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3, BUCKET } from '../../config/storage.js';
import { AppError } from '../../utils/response.utils.js';

const FOLDER_MAP = {
  avatar:   'avatars',
  course:   'courses',
  lesson:   'lessons',
  homework: 'homework',
  resume:   'resumes',
  other:    'uploads',
};

/**
 * POST /api/v1/uploads/image?type=avatar|course|lesson|other
 * POST /api/v1/uploads/document?type=homework|resume|other
 * POST /api/v1/uploads/video?type=lesson|other
 *
 * Returns: { url, key }
 */
function makeHandler(multerMiddleware) {
  return [
    (req, res, next) => multerMiddleware(req, res, (err) => {
      if (err) return next(new AppError(err.message, err.status ?? 400));
      next();
    }),
    handleUpload(FOLDER_MAP[req?.query?.type] ?? 'uploads'),
    (req, res) => {
      if (!req.uploadedFile) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }
      res.status(200).json({ success: true, data: req.uploadedFile });
    },
  ];
}

// Build individual route handlers
export function uploadImageRoute(req, res, next) {
  uploadImage(req, res, (err) => {
    if (err) return next(new AppError(err.message, 400));
    const folder = FOLDER_MAP[req.query.type] ?? 'uploads';
    handleUpload(folder)(req, res, () => {
      if (!req.uploadedFile) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }
      res.status(200).json({ success: true, data: req.uploadedFile });
    });
  });
}

export function uploadDocumentRoute(req, res, next) {
  uploadDocument(req, res, (err) => {
    if (err) return next(new AppError(err.message, 400));
    const folder = FOLDER_MAP[req.query.type] ?? 'uploads';
    handleUpload(folder)(req, res, () => {
      if (!req.uploadedFile) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }
      res.status(200).json({ success: true, data: req.uploadedFile });
    });
  });
}

export function uploadVideoRoute(req, res, next) {
  uploadVideo(req, res, (err) => {
    if (err) return next(new AppError(err.message, 400));
    const folder = FOLDER_MAP[req.query.type] ?? 'lessons';
    handleUpload(folder)(req, res, () => {
      if (!req.uploadedFile) {
        return res.status(400).json({ success: false, message: 'No file provided' });
      }
      res.status(200).json({ success: true, data: req.uploadedFile });
    });
  });
}

/**
 * GET /api/v1/uploads/presign?key=receipts/xxx.pdf  — authenticated users
 * Returns a temporary presigned URL (1 hour) for a private T3 object.
 * Accepts either a bare key or a full T3 URL.
 */
export async function presignFileRoute(req, res, next) {
  try {
    let key = req.query.key ?? '';
    if (!key) return next(new AppError('key is required', 400));

    const prefix = `${process.env.T3_ENDPOINT}/${BUCKET}/`;
    if (key.startsWith(prefix)) key = key.slice(prefix.length);
    if (key.startsWith('http')) return next(new AppError('Invalid key', 400));

    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const url = await getSignedUrl(s3, command, { expiresIn: 21600 });
    res.json({ success: true, data: { url } });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/uploads/view?key=receipts/xxx.png  — authenticated users
 * Proxies a private T3 object to the client so it can be displayed in the browser.
 * Accepts either a bare key ("receipts/xxx.png") or a full T3 URL.
 */
export async function viewFileRoute(req, res, next) {
  try {
    let key = req.query.key ?? '';
    if (!key) return next(new AppError('key is required', 400));

    // Strip full URL prefix if passed (e.g. https://t3.storage.dev/parvoz-academy-lms/receipts/...)
    const prefix = `${process.env.T3_ENDPOINT}/${BUCKET}/`;
    if (key.startsWith(prefix)) key = key.slice(prefix.length);
    if (key.startsWith('http')) return next(new AppError('Invalid key', 400));

    const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));

    const ext = key.split('.').pop().toLowerCase();
    const mime = obj.ContentType
      || (ext === 'pdf' ? 'application/pdf' : `image/${ext === 'jpg' ? 'jpeg' : ext}`);

    res.set('Content-Type', mime);
    res.set('Cache-Control', 'private, max-age=3600');
    if (obj.ContentLength) res.set('Content-Length', String(obj.ContentLength));

    // Stream body to response
    const stream = obj.Body;
    stream.pipe(res);
    stream.on('error', next);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/uploads/receipt  — публичный (без auth)
 * Принимает изображение или PDF, сохраняет в папку receipts/.
 */
export function uploadReceiptRoute(req, res, next) {
  uploadReceipt(req, res, (err) => {
    if (err) return next(new AppError(err.message, 400));
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }
    handleUpload('receipts')(req, res, (uploadErr) => {
      if (uploadErr) return next(uploadErr);
      if (!req.uploadedFile) {
        return res.status(500).json({ success: false, message: 'File upload to storage failed' });
      }
      res.status(200).json({ success: true, data: req.uploadedFile });
    });
  });
}
