import { Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  IOServer,
} from '../../config/socket';
import { socketAuthMiddleware } from './socket.middleware';
import { registerMeetingHandlers } from './meeting.socket';
import { registerWebRTCHandlers } from './webrtc.socket';
import { registerChatHandlers } from './chat.socket';
import { registerHostControlHandlers } from './host-controls.socket';
import { logger } from '../../utils/logger';

type AuthSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function registerSocketHandlers(io: IOServer): void {
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: AuthSocket) => {
    logger.info(`Socket connected: ${socket.id} (user ${socket.data.user.userId})`);

    registerMeetingHandlers(io, socket);
    registerWebRTCHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerHostControlHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });
}
