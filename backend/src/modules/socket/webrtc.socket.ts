import { Socket } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  IOServer,
} from '../../config/socket';
import { logger } from '../../utils/logger';
import { meetingRoomName } from './room.util';
import * as presence from '../socket/presence.socket';

type AuthSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Mesh signaling relay: every peer connects directly to every other peer, and this
 * server only forwards SDP offers/answers and ICE candidates between them — it never
 * touches the media itself. Fine for small meetings; a mesh gets expensive on
 * bandwidth/CPU per client as participant count grows (each client uploads its stream
 * N-1 times). Beyond ~6-8 participants, this should route through an SFU (e.g.
 * mediasoup, LiveKit) instead — worth flagging now since the signaling shape here
 * would need to change (offers/answers go to/from the SFU, not peer-to-peer).
 */

// both the sender and the intended recipient must currently be tracked as present
// in that meeting's room — prevents relaying signals to/from sockets outside it
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

  // broadcasts mic/camera on-off so other peers can update their UI (the actual
  // enable/disable happens client-side on the local MediaStreamTrack)
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
