import { AppError } from '../utils/response.utils.js';

// Implemented in S02 — placeholder keeps app.js import-ready
export function errorHandler(err, req, res, _next) {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: err.message });
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ success: false, message: `${field} already exists` });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid ID format' });
  }

  const status = err instanceof AppError ? err.statusCode : 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
