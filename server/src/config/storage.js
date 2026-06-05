import { S3Client } from '@aws-sdk/client-s3';

export const s3 = new S3Client({
  endpoint: process.env.T3_ENDPOINT,
  region: 'auto',
  credentials: {
    accessKeyId:     process.env.T3_ACCESS_KEY_ID,
    secretAccessKey: process.env.T3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export const BUCKET = process.env.T3_BUCKET;
