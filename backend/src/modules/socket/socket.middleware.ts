import { Socket } from 'socket.io';
import { verifyAccessToken } from '../../utils/jwt';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '../../config/socket';

type AuthSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;


export function socketAuthMiddleware(socket: AuthSocket, next: (err?: Error) => void): void {
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.headers?.authorization?.startsWith('Bearer ')
      ? socket.handshake.headers.authorization.split(' ')[1]
      : undefined);

  if (!token) {
    return next(new Error('Authentication token missing'));
  }

  try {
    const payload = verifyAccessToken(token);
    socket.data.user = payload;
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
}
