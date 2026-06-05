import 'dotenv/config';
import { createServer } from 'http';
import { existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { initSocket } from './src/config/socket.js';

const PORT     = process.env.PORT || 5000;
const IS_PROD  = process.env.NODE_ENV === 'production';
const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ─── Boot diagnostics ─────────────────────────────────────────────────────────
if (IS_PROD) {
  const distPath = resolve(__dirname, '../client/dist');
  console.log('[BOOT] cwd          :', process.cwd());
  console.log('[BOOT] __dirname    :', __dirname);
  console.log('[BOOT] client/dist  :', distPath);
  console.log('[BOOT] dist exists  :', existsSync(distPath));
  if (existsSync(distPath)) {
    try {
      const entries = readdirSync(distPath);
      console.log('[BOOT] dist contents:', entries.join(', '));
    } catch (e) {
      console.log('[BOOT] dist read err:', e.message);
    }
  }
}

async function bootstrap() {
  await connectDB();

  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

bootstrap();
