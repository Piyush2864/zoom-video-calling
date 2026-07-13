import { Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  IOServer,
} from '../../config/socket';
import { ChatService } from '../chat/chat.service';
import { logger } from '../../utils/logger';
import { meetingRoomName } from './room.util';
import * as presence from '../socket/presence.socket';

type AuthSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const chatService = new ChatService();

export function registerChatHandlers(io: IOServer, socket: AuthSocket): void {
  socket.on('chat:send', async (payload) => {
    const userId = socket.data.user.userId;

    try {
      const message = await chatService.sendMessage(userId, {
        meetingId: payload.meetingId,
        recipientId: payload.recipientId,
        content: payload.content,
        attachment: payload.attachment,
      });

      const outgoing = {
        id: message.id,
        meetingId: message.meetingId,
        senderId: message.senderId,
        recipientId: message.recipientId,
        content: message.content,
        attachment: message.attachment,
        createdAt: message.createdAt.toISOString(),
      };

      if (message.recipientId) {
        const senderSocketIds = presence.getSocketIdsForUser(message.meetingId, message.senderId);
        const recipientSocketIds = presence.getSocketIdsForUser(message.meetingId, message.recipientId);
        [...senderSocketIds, ...recipientSocketIds].forEach((socketId) => {
          io.to(socketId).emit('chat:message', outgoing);
        });
      } else {
        io.to(meetingRoomName(message.meetingId)).emit('chat:message', outgoing);
      }
    } catch (error) {
      logger.error('chat:send failed', { error, userId, meetingId: payload.meetingId });
      const message = error instanceof Error ? error.message : 'Failed to send message';
      socket.emit('chat:error', { message });
    }
  });

  socket.on('chat:typing', ({ meetingId, recipientId, isTyping }) => {
    const userId = socket.data.user.userId;

    if (recipientId) {
      const recipientSocketIds = presence.getSocketIdsForUser(meetingId, recipientId);
      recipientSocketIds.forEach((socketId) => {
        io.to(socketId).emit('chat:typing', { meetingId, userId, isTyping });
      });
    } else {
      socket.to(meetingRoomName(meetingId)).emit('chat:typing', { meetingId, userId, isTyping });
    }
  });
}
