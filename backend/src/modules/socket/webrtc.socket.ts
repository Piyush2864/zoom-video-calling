import { Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  IOServer,
} from '../../config/socket';
import { logger } from '../../utils/logger';
import { meetingRoomName } from '../socket/room.util';
import * as presence from '../socket/presence.socket';

type AuthSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

function verifyBothInRoom(meetingId: string, socketIdA: string, socketIdB: string): boolean {
  const participants = presence.getParticipants(meetingId);
  const ids = new Set(participants.map((p) => p.socketId));
  return ids.has(socketIdA) && ids.has(socketIdB);
}

export function registerWebRTCHandlers(io: IOServer, socket: AuthSocket): void {
  socket.on('webrtc:offer', ({ meetingId, toSocketId, sdp }) => {
    if (!verifyBothInRoom(meetingId, socket.id, toSocketId)) {
      return socket.emit('webrtc:error', { message: 'Peer is not in this meeting room' });
    }
    io.to(toSocketId).emit('webrtc:offer', { meetingId, fromSocketId: socket.id, sdp });
  });

  socket.on('webrtc:answer', ({ meetingId, toSocketId, sdp }) => {
    if (!verifyBothInRoom(meetingId, socket.id, toSocketId)) {
      return socket.emit('webrtc:error', { message: 'Peer is not in this meeting room' });
    }
    io.to(toSocketId).emit('webrtc:answer', { meetingId, fromSocketId: socket.id, sdp });
  });

  socket.on('webrtc:ice-candidate', ({ meetingId, toSocketId, candidate }) => {
    if (!verifyBothInRoom(meetingId, socket.id, toSocketId)) {
      return socket.emit('webrtc:error', { message: 'Peer is not in this meeting room' });
    }
    io.to(toSocketId).emit('webrtc:ice-candidate', { meetingId, fromSocketId: socket.id, candidate });
  });

  socket.on('media:state-change', ({ meetingId, audioEnabled, videoEnabled }) => {
    const userId = socket.data.user.userId;
    const isInRoom = presence.getParticipants(meetingId).some((p) => p.socketId === socket.id);

    if (!isInRoom) {
      return socket.emit('meeting:error', { message: 'You are not in this meeting room' });
    }

    socket.to(meetingRoomName(meetingId)).emit('media:state-changed', {
      meetingId,
      userId,
      socketId: socket.id,
      audioEnabled,
      videoEnabled,
    });
  });

  socket.on('disconnect', () => {
    logger.info(`Socket ${socket.id} disconnected — any active peer connections will time out client-side`);
  });
}
