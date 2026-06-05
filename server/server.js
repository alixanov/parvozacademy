import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import { connectDB } from './src/config/db.js';
import { initSocket } from './src/config/socket.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  await connectDB();

  const httpServer = createServer(app);
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  });
}

bootstrap();
