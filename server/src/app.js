import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { rateLimit } from 'express-rate-limit';

// ─── Route modules ────────────────────────────────────────────────────────────
import authRoutes        from './modules/auth/auth.routes.js';
import usersRoutes       from './modules/users/users.routes.js';
import coursesRoutes     from './modules/courses/courses.routes.js';
import modulesRoutes     from './modules/modules/modules.routes.js';
import lessonsRoutes     from './modules/lessons/lessons.routes.js';
import groupsRoutes      from './modules/groups/groups.routes.js';
import attendanceRoutes  from './modules/attendance/attendance.routes.js';
import homeworkRoutes    from './modules/homework/homework.routes.js';
import testsRoutes       from './modules/tests/tests.routes.js';
import paymentsRoutes    from './modules/payments/payments.routes.js';
import notifRoutes       from './modules/notifications/notifications.routes.js';
import vacanciesRoutes   from './modules/vacancies/vacancies.routes.js';
import settingsRoutes    from './modules/settings/settings.routes.js';
import reviewsRoutes     from './modules/reviews/reviews.routes.js';
import uploadsRoutes     from './modules/uploads/uploads.routes.js';
import dashboardRoutes   from './modules/dashboard/dashboard.routes.js';
import tariffRoutes      from './modules/tariffs/tariffs.routes.js';
import enrollmentRoutes  from './modules/enrollment/enrollment.routes.js';
import sessionsRoutes    from './modules/sessions/sessions.routes.js';
import teacherRoutes     from './modules/teacher/teacher.routes.js';
import packagesRoutes    from './modules/packages/packages.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const IS_PROD    = process.env.NODE_ENV === 'production';

// client/dist relative to repo root — works whether cwd is /app or /app/server
// Prefer resolve() with __dirname for ESM reliability in Railway containers
const CLIENT_DIST = resolve(__dirname, '../../client/dist');

const app = express();
const API = '/api/v1';

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
  // Allow inline scripts/styles for React SPA served in production
  contentSecurityPolicy: IS_PROD ? false : undefined,
}));

// ─── CORS ─────────────────────────────────────────────────────────────────────
// In production: frontend is served from the SAME origin → no cross-origin API
// calls, so CORS is only needed if someone calls the API from another domain.
// We still allow CLIENT_URL env var for cases like a separate frontend deploy.
const allowedOrigins = [
  ...(process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
    : []),
  'https://www.parvoz-academy.uz',
  'https://parvoz-academy.uz',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, mobile, same-origin in prod)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use(`${API}/auth`,        authRoutes);
app.use(`${API}/users`,       usersRoutes);
app.use(`${API}/courses`,     coursesRoutes);
app.use(`${API}/modules`,     modulesRoutes);
app.use(`${API}/lessons`,     lessonsRoutes);
app.use(`${API}/groups`,      groupsRoutes);
app.use(`${API}/attendance`,  attendanceRoutes);
app.use(`${API}/homework`,    homeworkRoutes);
app.use(`${API}/tests`,       testsRoutes);
app.use(`${API}/payments`,    paymentsRoutes);
app.use(`${API}/notifications`, notifRoutes);
app.use(`${API}/vacancies`,   vacanciesRoutes);
app.use(`${API}/settings`,    settingsRoutes);
app.use(`${API}/reviews`,     reviewsRoutes);
app.use(`${API}/uploads`,     uploadsRoutes);
app.use(`${API}/dashboard`,     dashboardRoutes);
app.use(`${API}/tariff-plans`,          tariffRoutes);
app.use(`${API}/enrollment-applications`, enrollmentRoutes);
app.use(`${API}/sessions`,               sessionsRoutes);
app.use(`${API}/teacher`,                teacherRoutes);
app.use(`${API}/packages`,               packagesRoutes);

// ─── Static frontend (production, single-service mode only) ──────────────────
// When deployed as backend-only (separate frontend service), client/dist won't
// exist — we skip static serving automatically so only the API is exposed.
if (IS_PROD && existsSync(join(CLIENT_DIST, 'index.html'))) {
  app.use(express.static(CLIENT_DIST));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path === '/health') {
      return res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
    }
    res.sendFile(join(CLIENT_DIST, 'index.html'), (err) => {
      if (err) {
        console.error('[SPA] sendFile error:', err.message, '| dist:', CLIENT_DIST);
        next(err);
      }
    });
  });
} else {
  app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
  });
}

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

export default app;
