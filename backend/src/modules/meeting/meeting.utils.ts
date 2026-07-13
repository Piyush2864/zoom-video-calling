import { Types } from 'mongoose';
import { IMeeting } from './meeting.model';
import { MeetingRole } from '../../config/constants';

export function idToString(value: Types.ObjectId | { _id: Types.ObjectId } | string): string {
  if (typeof value === 'string') return value;
  if (value instanceof Types.ObjectId) return value.toString();
  return value._id.toString();
}

export function isHostOrCoHost(meeting: IMeeting, userId: string): boolean {
  if (idToString(meeting.host) === userId) return true;
  const participant = meeting.participants.find((p) => p.user.toString() === userId);
  return participant?.role === MeetingRole.CO_HOST;
}
