import { Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  IOServer,
} from '../../config/socket';
import { MeetingService } from '../meeting/meeting.service';
import { logger } from '../../utils/logger';
import { meetingRoomName } from './room.util';
import * as presence from '../socket/presence.socket';

type AuthSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const meetingService = new MeetingService();

function handleError(socket: AuthSocket, error: unknown, fallback: string): void {
  const message = error instanceof Error ? error.message : fallback;
  socket.emit('host:error', { message });
}

export function registerHostControlHandlers(io: IOServer, socket: AuthSocket): void {
  socket.on('host:mute-all', ({ meetingId }) => {
    socket.to(meetingRoomName(meetingId)).emit('host:force-mute', { meetingId });
  });

  socket.on('host:remove-participant', async ({ meetingId, targetUserId }) => {
    try {
      await meetingService.removeParticipant(meetingId, socket.data.user.userId, targetUserId);

      const targetSocketIds = presence.getSocketIdsForUser(meetingId, targetUserId);
      targetSocketIds.forEach((socketId) => {
        const targetSocket = io.sockets.sockets.get(socketId);
        if (!targetSocket) return;
        targetSocket.emit('host:removed', { meetingId, reason: 'Removed by the host' });
        targetSocket.leave(meetingRoomName(meetingId));
        presence.removeParticipant(meetingId, socketId);
      });

      io.to(meetingRoomName(meetingId)).emit('host:participant-removed', {
        meetingId,
        userId: targetUserId,
      });
    } catch (error) {
      logger.error('host:remove-participant failed', { error, meetingId, targetUserId });
      handleError(socket, error, 'Failed to remove participant');
    }
  });

  socket.on('host:lock-meeting', async ({ meetingId, locked }) => {
    try {
      await meetingService.setLocked(meetingId, socket.data.user.userId, locked);
      io.to(meetingRoomName(meetingId)).emit('host:lock-changed', { meetingId, locked });
    } catch (error) {
      logger.error('host:lock-meeting failed', { error, meetingId });
      handleError(socket, error, 'Failed to update lock state');
    }
  });

  socket.on('host:toggle-recording', async ({ meetingId, recording }) => {
    try {
      await meetingService.setRecording(meetingId, socket.data.user.userId, recording);
      io.to(meetingRoomName(meetingId)).emit('host:recording-changed', { meetingId, recording });
    } catch (error) {
      logger.error('host:toggle-recording failed', { error, meetingId });
      handleError(socket, error, 'Failed to update recording state');
    }
  });

  socket.on('host:assign-co-host', async ({ meetingId, targetUserId }) => {
    try {
      await meetingService.assignCoHost(meetingId, socket.data.user.userId, targetUserId);
      io.to(meetingRoomName(meetingId)).emit('host:co-host-assigned', {
        meetingId,
        userId: targetUserId,
      });
    } catch (error) {
      logger.error('host:assign-co-host failed', { error, meetingId, targetUserId });
      handleError(socket, error, 'Failed to assign co-host');
    }
  });
}
