import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { MeetingRepository } from './meeting.repository';
import { ApiError } from '../../utils/apiError';
import {
  MeetingType,
  MeetingStatus,
  MeetingRole,
  ParticipantStatus,
  RecurrenceFrequency,
} from '../../config/constants';
import { IMeeting, IParticipant } from './meeting.model';
import { idToString, isHostOrCoHost } from './meeting.utils';
import {
  CreateInstantMeetingInput,
  ScheduleMeetingInput,
  SafeMeeting,
  SafeParticipant,
  JoinMeetingResult,
} from './meeting.types';

function generateMeetingCode(): string {
  const digits = crypto.randomInt(100000000, 999999999).toString();
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`;
}

export class MeetingService {
  private repo = new MeetingRepository();

  private toSafeParticipant(p: IParticipant): SafeParticipant {
    return {
      userId: p.user.toString(),
      role: p.role,
      status: p.status,
      joinedAt: p.joinedAt,
      leftAt: p.leftAt,
    };
  }

  private toSafeMeeting(meeting: IMeeting): SafeMeeting {
    return {
      id: meeting.id,
      title: meeting.title,
      hostId: idToString(meeting.host),
      meetingCode: meeting.meetingCode,
      type: meeting.type,
      status: meeting.status,
      scheduledStartTime: meeting.scheduledStartTime,
      scheduledEndTime: meeting.scheduledEndTime,
      actualStartTime: meeting.actualStartTime,
      actualEndTime: meeting.actualEndTime,
      isRecurring: meeting.isRecurring,
      isPersonalRoom: meeting.isPersonalRoom,
      isLocked: meeting.isLocked,
      isRecording: meeting.isRecording,
      hasPassword: Boolean(meeting.passwordHash),
      settings: {
        waitingRoomEnabled: meeting.settings.waitingRoomEnabled,
        muteOnEntry: meeting.settings.muteOnEntry,
        allowParticipantScreenShare: meeting.settings.allowParticipantScreenShare,
        allowChat: meeting.settings.allowChat,
      },
      participants: meeting.participants.map((p) => this.toSafeParticipant(p)),
    };
  }

  private async generateUniqueMeetingCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateMeetingCode();
      const existing = await this.repo.findByMeetingCode(code);
      if (!existing) return code;
    }
    throw ApiError.internal('Could not generate a unique meeting code, please try again');
  }

  private assertIsHost(meeting: IMeeting, userId: string) {
    if (idToString(meeting.host) !== userId) {
      throw ApiError.forbidden('Only the host can perform this action');
    }
  }

  private assertIsHostOrCoHost(meeting: IMeeting, userId: string) {
    if (!isHostOrCoHost(meeting, userId)) {
      throw ApiError.forbidden('Only the host or a co-host can perform this action');
    }
  }

  async createInstantMeeting(hostId: string, input: CreateInstantMeetingInput): Promise<SafeMeeting> {
    const meetingCode = await this.generateUniqueMeetingCode();

    const meeting = await this.repo.create({
      title: input.title || 'Instant Meeting',
      host: hostId as unknown as IMeeting['host'],
      meetingCode,
      type: MeetingType.INSTANT,
      status: MeetingStatus.ONGOING,
      actualStartTime: new Date(),
      participants: [
        {
          user: hostId as unknown as IParticipant['user'],
          role: MeetingRole.HOST,
          status: ParticipantStatus.ADMITTED,
          joinedAt: new Date(),
        },
      ],
    });

    return this.toSafeMeeting(meeting);
  }

  async scheduleMeeting(hostId: string, input: ScheduleMeetingInput): Promise<SafeMeeting> {
    const meetingCode = await this.generateUniqueMeetingCode();
    const passwordHash = input.password ? await bcrypt.hash(input.password, 10) : undefined;

    const meeting = await this.repo.create({
      title: input.title,
      host: hostId as unknown as IMeeting['host'],
      meetingCode,
      passwordHash,
      type: input.recurrence ? MeetingType.RECURRING : MeetingType.SCHEDULED,
      status: MeetingStatus.SCHEDULED,
      scheduledStartTime: new Date(input.scheduledStartTime),
      scheduledEndTime: new Date(input.scheduledEndTime),
      isRecurring: Boolean(input.recurrence),
      recurrence: input.recurrence
        ? {
            frequency: input.recurrence.frequency as RecurrenceFrequency,
            daysOfWeek: input.recurrence.daysOfWeek,
            endDate: input.recurrence.endDate ? new Date(input.recurrence.endDate) : undefined,
          }
        : undefined,
      settings: {
        waitingRoomEnabled: input.waitingRoomEnabled ?? true,
        muteOnEntry: true,
        allowParticipantScreenShare: false,
        allowChat: true,
      },
    });

    return this.toSafeMeeting(meeting);
  }

  async getOrCreatePersonalRoom(hostId: string): Promise<SafeMeeting> {
    let meeting = await this.repo.findPersonalRoomByHost(hostId);

    if (!meeting) {
      const meetingCode = await this.generateUniqueMeetingCode();
      meeting = await this.repo.create({
        title: 'Personal Meeting Room',
        host: hostId as unknown as IMeeting['host'],
        meetingCode,
        type: MeetingType.PERSONAL,
        status: MeetingStatus.SCHEDULED,
        isPersonalRoom: true,
      });
    }

    return this.toSafeMeeting(meeting);
  }

  async startMeeting(meetingId: string, hostId: string): Promise<SafeMeeting> {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');
    this.assertIsHost(meeting, hostId);

    if (meeting.status === MeetingStatus.ENDED || meeting.status === MeetingStatus.CANCELLED) {
      throw ApiError.badRequest('This meeting has already ended or was cancelled');
    }

    meeting.status = MeetingStatus.ONGOING;
    meeting.actualStartTime = new Date();

    const hostParticipant = meeting.participants.find((p) => p.user.toString() === hostId);
    if (hostParticipant) {
      hostParticipant.status = ParticipantStatus.ADMITTED;
      hostParticipant.joinedAt = new Date();
    } else {
      meeting.participants.push({
        user: hostId as unknown as IParticipant['user'],
        role: MeetingRole.HOST,
        status: ParticipantStatus.ADMITTED,
        joinedAt: new Date(),
      });
    }

    await this.repo.save(meeting);
    return this.toSafeMeeting(meeting);
  }

  async joinMeeting(userId: string, meetingCode: string, password?: string): Promise<JoinMeetingResult> {
    const meeting = await this.repo.findByMeetingCode(meetingCode);
    if (!meeting) throw ApiError.notFound('Invalid meeting code');

    if (meeting.status === MeetingStatus.ENDED || meeting.status === MeetingStatus.CANCELLED) {
      throw ApiError.badRequest('This meeting has ended');
    }
    if (meeting.status !== MeetingStatus.ONGOING) {
      throw ApiError.badRequest('The host has not started this meeting yet');
    }

    if (meeting.passwordHash) {
      if (!password) throw ApiError.badRequest('This meeting requires a password');
      const isValid = await bcrypt.compare(password, meeting.passwordHash);
      if (!isValid) throw ApiError.unauthorized('Incorrect meeting password');
    }

    const isHost = idToString(meeting.host) === userId;
    const participant = meeting.participants.find((p) => p.user.toString() === userId);

    if (meeting.isLocked && !isHost && !participant) {
      throw ApiError.forbidden('The host has locked this meeting to new participants');
    }

    if (participant?.status === ParticipantStatus.REMOVED) {
      throw ApiError.forbidden('You have been removed from this meeting by the host');
    }

    if (isHost) {
      if (!participant) {
        meeting.participants.push({
          user: userId as unknown as IParticipant['user'],
          role: MeetingRole.HOST,
          status: ParticipantStatus.ADMITTED,
          joinedAt: new Date(),
        });
      } else {
        participant.status = ParticipantStatus.ADMITTED;
        participant.joinedAt = new Date();
      }
      await this.repo.save(meeting);
      return { admitted: true, meeting: this.toSafeMeeting(meeting), role: MeetingRole.HOST };
    }

    if (meeting.participants.length >= meeting.maxParticipants) {
      throw ApiError.badRequest('This meeting is full');
    }

    if (participant && participant.status === ParticipantStatus.ADMITTED) {
      participant.joinedAt = new Date();
      await this.repo.save(meeting);
      return { admitted: true, meeting: this.toSafeMeeting(meeting), role: participant.role };
    }

    if (participant && participant.status === ParticipantStatus.DENIED) {
      throw ApiError.forbidden('The host has denied your entry to this meeting');
    }

    if (meeting.settings.waitingRoomEnabled) {
      if (!participant) {
        meeting.participants.push({
          user: userId as unknown as IParticipant['user'],
          role: MeetingRole.PARTICIPANT,
          status: ParticipantStatus.WAITING,
        });
      } else {
        participant.status = ParticipantStatus.WAITING;
      }
      await this.repo.save(meeting);
      return { admitted: false, waiting: true };
    }

    if (!participant) {
      meeting.participants.push({
        user: userId as unknown as IParticipant['user'],
        role: MeetingRole.PARTICIPANT,
        status: ParticipantStatus.ADMITTED,
        joinedAt: new Date(),
      });
    } else {
      participant.status = ParticipantStatus.ADMITTED;
      participant.joinedAt = new Date();
    }
    await this.repo.save(meeting);
    return { admitted: true, meeting: this.toSafeMeeting(meeting), role: MeetingRole.PARTICIPANT };
  }

  async admitParticipant(meetingId: string, hostId: string, participantUserId: string): Promise<SafeMeeting> {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');
    this.assertIsHost(meeting, hostId);

    const participant = meeting.participants.find((p) => p.user.toString() === participantUserId);
    if (!participant) throw ApiError.notFound('Participant not found in waiting room');

    participant.status = ParticipantStatus.ADMITTED;
    participant.joinedAt = new Date();

    await this.repo.save(meeting);
    return this.toSafeMeeting(meeting);
  }

  async denyParticipant(meetingId: string, hostId: string, participantUserId: string): Promise<SafeMeeting> {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');
    this.assertIsHost(meeting, hostId);

    const participant = meeting.participants.find((p) => p.user.toString() === participantUserId);
    if (!participant) throw ApiError.notFound('Participant not found in waiting room');

    participant.status = ParticipantStatus.DENIED;

    await this.repo.save(meeting);
    return this.toSafeMeeting(meeting);
  }

  async leaveMeeting(meetingId: string, userId: string): Promise<void> {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');

    const participant = meeting.participants.find((p) => p.user.toString() === userId);
    if (!participant) throw ApiError.notFound('You are not part of this meeting');

    participant.status = ParticipantStatus.LEFT;
    participant.leftAt = new Date();

    await this.repo.save(meeting);
  }

  async endMeeting(meetingId: string, hostId: string): Promise<SafeMeeting> {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');
    this.assertIsHost(meeting, hostId);

    meeting.status = MeetingStatus.ENDED;
    meeting.actualEndTime = new Date();

    const now = new Date();
    meeting.participants.forEach((p) => {
      if (p.status === ParticipantStatus.ADMITTED) {
        p.status = ParticipantStatus.LEFT;
        p.leftAt = now;
      }
    });

    await this.repo.save(meeting);
    return this.toSafeMeeting(meeting);
  }

  async cancelMeeting(meetingId: string, hostId: string): Promise<void> {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');
    this.assertIsHost(meeting, hostId);

    if (meeting.status !== MeetingStatus.SCHEDULED) {
      throw ApiError.badRequest('Only a meeting that has not started yet can be cancelled');
    }

    meeting.status = MeetingStatus.CANCELLED;
    await this.repo.save(meeting);
  }

  async getMeetingById(meetingId: string, userId: string): Promise<SafeMeeting> {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');

    const isHost = idToString(meeting.host) === userId;
    const isParticipant = meeting.participants.some((p) => p.user.toString() === userId);
    if (!isHost && !isParticipant) {
      throw ApiError.forbidden('You do not have access to this meeting');
    }

    return this.toSafeMeeting(meeting);
  }

  async listUpcoming(userId: string): Promise<SafeMeeting[]> {
    const meetings = await this.repo.findUpcomingForUser(userId);
    return meetings.map((m) => this.toSafeMeeting(m));
  }

  async listHistory(userId: string): Promise<SafeMeeting[]> {
    const meetings = await this.repo.findHistoryForUser(userId);
    return meetings.map((m) => this.toSafeMeeting(m));
  }

  async removeParticipant(meetingId: string, actingUserId: string, targetUserId: string): Promise<SafeMeeting> {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');
    this.assertIsHostOrCoHost(meeting, actingUserId);

    if (idToString(meeting.host) === targetUserId) {
      throw ApiError.badRequest('The host cannot be removed from their own meeting');
    }

    const participant = meeting.participants.find((p) => p.user.toString() === targetUserId);
    if (!participant || participant.status !== ParticipantStatus.ADMITTED) {
      throw ApiError.notFound('This participant is not currently in the meeting');
    }

    participant.status = ParticipantStatus.REMOVED;
    participant.leftAt = new Date();

    await this.repo.save(meeting);
    return this.toSafeMeeting(meeting);
  }

  async setLocked(meetingId: string, hostId: string, locked: boolean): Promise<SafeMeeting> {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');
    this.assertIsHost(meeting, hostId);

    meeting.isLocked = locked;
    await this.repo.save(meeting);
    return this.toSafeMeeting(meeting);
  }

  async setRecording(meetingId: string, hostId: string, recording: boolean): Promise<SafeMeeting> {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');
    this.assertIsHost(meeting, hostId);

    meeting.isRecording = recording;
    await this.repo.save(meeting);
    return this.toSafeMeeting(meeting);
  }

  async assignCoHost(meetingId: string, hostId: string, targetUserId: string): Promise<SafeMeeting> {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');
    this.assertIsHost(meeting, hostId);

    if (idToString(meeting.host) === targetUserId) {
      throw ApiError.badRequest('The host is already in charge of this meeting');
    }

    const participant = meeting.participants.find((p) => p.user.toString() === targetUserId);
    if (!participant || participant.status !== ParticipantStatus.ADMITTED) {
      throw ApiError.notFound('This participant is not currently in the meeting');
    }

    participant.role = MeetingRole.CO_HOST;
    await this.repo.save(meeting);
    return this.toSafeMeeting(meeting);
  }

  async revokeCoHost(meetingId: string, hostId: string, targetUserId: string): Promise<SafeMeeting> {
    const meeting = await this.repo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');
    this.assertIsHost(meeting, hostId);

    const participant = meeting.participants.find((p) => p.user.toString() === targetUserId);
    if (!participant || participant.role !== MeetingRole.CO_HOST) {
      throw ApiError.notFound('This participant is not currently a co-host');
    }

    participant.role = MeetingRole.PARTICIPANT;
    await this.repo.save(meeting);
    return this.toSafeMeeting(meeting);
  }
}
