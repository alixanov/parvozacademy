import multer from 'multer';
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { s3, BUCKET } from '../config/storage.js';
import { AppError } from '../utils/response.utils.js';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES   = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];

const LIMITS = {
  image:    5  * 1024 * 1024,   // 5 MB
  document: 20 * 1024 * 1024,   // 20 MB
  video:    500 * 1024 * 1024,  // 500 MB
};

function buildMulter(allowedTypes, maxSize) {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSize },
    fileFilter: (_, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new AppError(`File type ${file.mimetype} is not allowed`, 415));
      }
    },
  });
}

/** Receipt uploader — accepts ANY file up to 20 MB (screenshots, HEIC, PDF, etc.) */
const receiptMulter = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: LIMITS.document },
  fileFilter: (_, file, cb) => {
    // Block only obviously wrong types (video, audio, executables)
    const blocked = /^(video\/|audio\/|application\/x-|application\/octet-stream$)/;
    // But if no type detected (octet-stream), accept anyway — let extension decide
    const isMissingType = !file.mimetype || file.mimetype === 'application/octet-stream';
    if (isMissingType || !blocked.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`File type ${file.mimetype} is not allowed for receipts`, 415));
    }
  },
});

export const uploadImage    = buildMulter(ALLOWED_IMAGE_TYPES, LIMITS.image).single('file');
export const uploadDocument = buildMulter([...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES], LIMITS.document).single('file');
export const uploadVideo    = buildMulter(ALLOWED_VIDEO_TYPES, LIMITS.video).single('file');
export const uploadAny      = buildMulter([...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES, ...ALLOWED_VIDEO_TYPES], LIMITS.video).single('file');
export const uploadReceipt  = receiptMulter.single('file');

/**
 * Upload a file buffer to T3 Storage.
 * Returns { url, key }.
 */
export async function uploadToS3(buffer, originalname, mimetype, folder = 'uploads') {
  const ext = path.extname(originalname).toLowerCase();
  const key = `${folder}/${uuidv4()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket:      BUCKET,
      Key:         key,
      Body:        buffer,
      ContentType: mimetype,
      ACL:         'public-read',
    })
  );

  const url = `${process.env.T3_ENDPOINT}/${BUCKET}/${key}`;
  return { url, key };
}

/**
 * Delete a file from T3 Storage by its key.
 */
export async function deleteFromS3(key) {
  if (!key) return;
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/**
 * Express middleware: uploads req.file to S3 and attaches
 * req.uploadedFile = { url, key } before calling next().
 */
export function handleUpload(folder = 'uploads') {
  return async (req, res, next) => {
    if (!req.file) return next();
    try {
      const result = await uploadToS3(req.file.buffer, req.file.originalname, req.file.mimetype, folder);
      req.uploadedFile = result;
      next();
    } catch (err) {
      next(err);
    }
  };
}
