import { Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  IOServer,
} from '../../config/socket';
import { MeetingRepository } from '../meeting/meeting.repository';
import { idToString } from '../meeting/meeting.utils';
import { MeetingStatus, ParticipantStatus } from '../../config/constants';
import { logger } from '../../utils/logger';
import { meetingRoomName } from './room.util';
import * as presence from '../socket/presence.socket';

type AuthSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const meetingRepo = new MeetingRepository();

export function registerMeetingHandlers(io: IOServer, socket: AuthSocket): void {
  socket.on('meeting:join', async (payload) => {
    const { meetingId } = payload || {};
    const userId = socket.data.user.userId;

    try {
      if (!meetingId) {
        return socket.emit('meeting:error', { message: 'meetingId is required' });
      }

      const meeting = await meetingRepo.findById(meetingId);
      if (!meeting) {
        return socket.emit('meeting:error', { message: 'Meeting not found' });
      }
      if (meeting.status !== MeetingStatus.ONGOING) {
        return socket.emit('meeting:error', { message: 'This meeting is not ongoing' });
      }

      const isHost = idToString(meeting.host) === userId;
      const participant = meeting.participants.find((p) => p.user.toString() === userId);
      const isAdmitted = isHost || participant?.status === ParticipantStatus.ADMITTED;

      if (!isAdmitted) {
        return socket.emit('meeting:error', {
          message: 'You have not been admitted to this meeting yet',
        });
      }

      socket.join(meetingRoomName(meetingId));
      presence.addParticipant(meetingId, socket.id, userId);


      socket.emit('meeting:joined', {
        meetingId,
        participants: presence.getParticipants(meetingId),
      });

    
      socket.to(meetingRoomName(meetingId)).emit('meeting:participant-joined', {
        meetingId,
        userId,
        socketId: socket.id,
      });

      logger.info(`Socket ${socket.id} (user ${userId}) joined room for meeting ${meetingId}`);
    } catch (error) {
      logger.error('meeting:join failed', { error, meetingId, userId });
      socket.emit('meeting:error', { message: 'Failed to join meeting room' });
    }
  });

  socket.on('meeting:leave', (payload) => {
    if (payload?.meetingId) leaveMeetingRoom(socket, payload.meetingId);
  });

  socket.on('disconnect', () => {
    const meetingIds = presence.getMeetingsForSocket(socket.id);
    meetingIds.forEach((meetingId) => leaveMeetingRoom(socket, meetingId));
  });
}

function leaveMeetingRoom(socket: AuthSocket, meetingId: string): void {
  const userId = socket.data.user?.userId;

  socket.leave(meetingRoomName(meetingId));
  presence.removeParticipant(meetingId, socket.id);

  socket.to(meetingRoomName(meetingId)).emit('meeting:participant-left', {
    meetingId,
    userId,
    socketId: socket.id,
  });

  logger.info(`Socket ${socket.id} (user ${userId}) left room for meeting ${meetingId}`);
}
