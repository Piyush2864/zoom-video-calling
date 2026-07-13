import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { env } from './env';
import { registerSocketHandlers } from '../modules/socket/index';

export interface SocketData {
  user: { userId: string; email: string };
}

export interface PresenceEntry {
  socketId: string;
  userId: string;
}

export interface SDPPayload {
  type: 'offer' | 'answer' | 'pranswer' | 'rollback';
  sdp?: string;
}

export interface ICECandidatePayload {
  candidate: string;
  sdpMLineIndex?: number | null;
  sdpMid?: string | null;
  usernameFragment?: string | null;
}

export interface ChatAttachmentPayload {
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface ClientToServerEvents {
  'meeting:join': (payload: { meetingId: string }) => void;
  'meeting:leave': (payload: { meetingId: string }) => void;
  'webrtc:offer': (payload: { meetingId: string; toSocketId: string; sdp: SDPPayload }) => void;
  'webrtc:answer': (payload: { meetingId: string; toSocketId: string; sdp: SDPPayload }) => void;
  'webrtc:ice-candidate': (payload: {
    meetingId: string;
    toSocketId: string;
    candidate: ICECandidatePayload;
  }) => void;
  'media:state-change': (payload: {
    meetingId: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
  }) => void;
  'chat:send': (payload: {
    meetingId: string;
    recipientId?: string;
    content?: string;
    attachment?: ChatAttachmentPayload;
  }) => void;
  'chat:typing': (payload: { meetingId: string; recipientId?: string; isTyping: boolean }) => void;
  'host:mute-all': (payload: { meetingId: string }) => void;
  'host:remove-participant': (payload: { meetingId: string; targetUserId: string }) => void;
  'host:lock-meeting': (payload: { meetingId: string; locked: boolean }) => void;
  'host:toggle-recording': (payload: { meetingId: string; recording: boolean }) => void;
  'host:assign-co-host': (payload: { meetingId: string; targetUserId: string }) => void;
}

export interface ServerToClientEvents {
  'meeting:joined': (payload: { meetingId: string; participants: PresenceEntry[] }) => void;
  'meeting:participant-joined': (payload: {
    meetingId: string;
    userId: string;
    socketId: string;
  }) => void;
  'meeting:participant-left': (payload: {
    meetingId: string;
    userId: string;
    socketId: string;
  }) => void;
  'meeting:error': (payload: { message: string }) => void;
  'webrtc:offer': (payload: { meetingId: string; fromSocketId: string; sdp: SDPPayload }) => void;
  'webrtc:answer': (payload: { meetingId: string; fromSocketId: string; sdp: SDPPayload }) => void;
  'webrtc:ice-candidate': (payload: {
    meetingId: string;
    fromSocketId: string;
    candidate: ICECandidatePayload;
  }) => void;
  'webrtc:error': (payload: { message: string }) => void;
  'media:state-changed': (payload: {
    meetingId: string;
    userId: string;
    socketId: string;
    audioEnabled: boolean;
    videoEnabled: boolean;
  }) => void;
  'chat:message': (payload: {
    id: string;
    meetingId: string;
    senderId: string;
    recipientId?: string;
    content?: string;
    attachment?: ChatAttachmentPayload;
    createdAt: string;
  }) => void;
  'chat:typing': (payload: { meetingId: string; userId: string; isTyping: boolean }) => void;
  'chat:error': (payload: { message: string }) => void;
  'host:force-mute': (payload: { meetingId: string }) => void;
  'host:removed': (payload: { meetingId: string; reason: string }) => void;
  'host:participant-removed': (payload: { meetingId: string; userId: string }) => void;
  'host:lock-changed': (payload: { meetingId: string; locked: boolean }) => void;
  'host:recording-changed': (payload: { meetingId: string; recording: boolean }) => void;
  'host:co-host-assigned': (payload: { meetingId: string; userId: string }) => void;
  'host:error': (payload: { message: string }) => void;
}

export type InterServerEvents = Record<string, never>;

export type IOServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

let io: IOServer;

export function initSocket(server: HttpServer): IOServer {
  io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(server, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  registerSocketHandlers(io);

  return io;
}

export function getIO(): IOServer {
  if (!io) throw new Error('Socket.io not initialized yet');
  return io;
}
