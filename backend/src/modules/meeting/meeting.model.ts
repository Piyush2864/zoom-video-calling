import { Schema, model, Document, Types } from 'mongoose';
import {
  MeetingType,
  MeetingStatus,
  ParticipantStatus,
  MeetingRole,
  RecurrenceFrequency,
} from '../../config/constants';

export interface IParticipant {
  user: Types.ObjectId;
  role: MeetingRole;
  status: ParticipantStatus;
  joinedAt?: Date;
  leftAt?: Date;
}

export interface IRecurrenceRule {
  frequency: RecurrenceFrequency;
  daysOfWeek?: number[];
  endDate?: Date;
}

export interface IMeetingSettings {
  waitingRoomEnabled: boolean;
  muteOnEntry: boolean;
  allowParticipantScreenShare: boolean;
  allowChat: boolean;
}

export interface IMeeting extends Document {
  title: string;
  host: Types.ObjectId;
  meetingCode: string;
  passwordHash?: string;
  type: MeetingType;
  status: MeetingStatus;

  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;

  isRecurring: boolean;
  recurrence?: IRecurrenceRule;

  isPersonalRoom: boolean;
  isLocked: boolean;
  isRecording: boolean;

  settings: IMeetingSettings;
  participants: IParticipant[];
  maxParticipants: number;

  createdAt: Date;
  updatedAt: Date;
}

const recurrenceSchema = new Schema<IRecurrenceRule>(
  {
    frequency: { type: String, enum: Object.values(RecurrenceFrequency), required: true },
    daysOfWeek: { type: [Number], default: undefined },
    endDate: { type: Date },
  },
  { _id: false }
);

const settingsSchema = new Schema<IMeetingSettings>(
  {
    waitingRoomEnabled: { type: Boolean, default: true },
    muteOnEntry: { type: Boolean, default: true },
    allowParticipantScreenShare: { type: Boolean, default: false },
    allowChat: { type: Boolean, default: true },
  },
  { _id: false }
);

const participantSchema = new Schema<IParticipant>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: Object.values(MeetingRole), default: MeetingRole.PARTICIPANT },
    status: {
      type: String,
      enum: Object.values(ParticipantStatus),
      default: ParticipantStatus.WAITING,
    },
    joinedAt: { type: Date },
    leftAt: { type: Date },
  },
  { _id: false }
);

const meetingSchema = new Schema<IMeeting>(
  {
    title: { type: String, required: true, trim: true },
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    meetingCode: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, select: false },
    type: { type: String, enum: Object.values(MeetingType), required: true },
    status: {
      type: String,
      enum: Object.values(MeetingStatus),
      default: MeetingStatus.SCHEDULED,
    },

    scheduledStartTime: { type: Date },
    scheduledEndTime: { type: Date },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },

    isRecurring: { type: Boolean, default: false },
    recurrence: { type: recurrenceSchema },

    isPersonalRoom: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    isRecording: { type: Boolean, default: false },

    settings: { type: settingsSchema, default: () => ({}) },
    participants: { type: [participantSchema], default: [] },
    maxParticipants: { type: Number, default: 100 },
  },
  { timestamps: true }
);

meetingSchema.index(
  { host: 1, isPersonalRoom: 1 },
  { unique: true, partialFilterExpression: { isPersonalRoom: true } }
);

export const Meeting = model<IMeeting>('Meeting', meetingSchema);
