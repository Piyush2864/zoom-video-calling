import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';
import { logger } from './utils/logger';

async function bootstrap() {
  await connectDB();

  const server = http.createServer(app);

  initSocket(server); // attaches socket.io, sets up namespaces/middleware (added when we build the sockets layer)

  server.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { reason });
  });
}

bootstrap();
