import { Server } from 'socket.io';
import { verifyAccess } from '../utils/jwt.utils.js';

let io;

export function initSocket(httpServer) {
  const IS_PROD = process.env.NODE_ENV === 'production';

  // In production the frontend is served from the same origin,
  // so no cross-origin WebSocket is needed.
  // In development allow all configured localhost ports + CLIENT_URL.
  const prodOrigins = [
    ...(process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
      : []),
    'https://www.parvoz-academy.uz',
    'https://parvoz-academy.uz',
  ].filter(Boolean);

  const corsOrigins = IS_PROD
    ? (prodOrigins.length ? prodOrigins : true)
    : [
        ...prodOrigins,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
      ].filter(Boolean);

  io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = verifyAccess(token);
      socket.userId = payload.id ?? payload._id ?? payload.sub;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    if (socket.userId) socket.join(`user:${socket.userId}`);
    socket.on('disconnect', () => {});
  });

  return io;
}

// Use in services: getIO().to(`user:${id}`).emit(...)
export function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}
