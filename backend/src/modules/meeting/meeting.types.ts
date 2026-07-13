import { MeetingType, MeetingStatus, MeetingRole, ParticipantStatus } from '../../config/constants';

export interface CreateInstantMeetingInput {
  title?: string;
}

export interface ScheduleMeetingInput {
  title: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  password?: string;
  waitingRoomEnabled?: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    endDate?: string;
  };
}

export interface JoinMeetingInput {
  meetingCode: string;
  password?: string;
}

export interface SafeParticipant {
  userId: string;
  role: MeetingRole;
  status: ParticipantStatus;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface SafeMeeting {
  id: string;
  title: string;
  hostId: string;
  meetingCode: string;
  type: MeetingType;
  status: MeetingStatus;
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  isRecurring: boolean;
  isPersonalRoom: boolean;
  isLocked: boolean;
  isRecording: boolean;
  hasPassword: boolean;
  settings: {
    waitingRoomEnabled: boolean;
    muteOnEntry: boolean;
    allowParticipantScreenShare: boolean;
    allowChat: boolean;
  };
  participants: SafeParticipant[];
}

export type JoinMeetingResult =
  | { admitted: true; meeting: SafeMeeting; role: MeetingRole }
  | { admitted: false; waiting: true };
