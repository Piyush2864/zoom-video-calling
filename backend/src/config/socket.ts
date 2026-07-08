import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from './env';
import { logger } from '../utils/logger';

let io: Server;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });


  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.io not initialized yet');
  return io;
}
