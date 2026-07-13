import { PresenceEntry } from '../../config/socket';


const roomParticipants = new Map<string, Map<string, string>>();

const socketMeetings = new Map<string, Set<string>>();

export function addParticipant(meetingId: string, socketId: string, userId: string): void {
  if (!roomParticipants.has(meetingId)) roomParticipants.set(meetingId, new Map());
  roomParticipants.get(meetingId)!.set(socketId, userId);

  if (!socketMeetings.has(socketId)) socketMeetings.set(socketId, new Set());
  socketMeetings.get(socketId)!.add(meetingId);
}

export function removeParticipant(meetingId: string, socketId: string): void {
  roomParticipants.get(meetingId)?.delete(socketId);
  if (roomParticipants.get(meetingId)?.size === 0) roomParticipants.delete(meetingId);

  socketMeetings.get(socketId)?.delete(meetingId);
  if (socketMeetings.get(socketId)?.size === 0) socketMeetings.delete(socketId);
}

export function getParticipants(meetingId: string): PresenceEntry[] {
  const room = roomParticipants.get(meetingId);
  if (!room) return [];
  return Array.from(room.entries()).map(([socketId, userId]) => ({ socketId, userId }));
}

export function getMeetingsForSocket(socketId: string): string[] {
  return Array.from(socketMeetings.get(socketId) || []);
}
