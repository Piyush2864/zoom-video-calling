"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const meeting_repository_1 = require("./meeting.repository");
const apiError_1 = require("../../utils/apiError");
const constants_1 = require("../../config/constants");
const meeting_utils_1 = require("./meeting.utils");
function generateMeetingCode() {
    const digits = crypto_1.default.randomInt(100000000, 999999999).toString();
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 9)}`;
}
class MeetingService {
    constructor() {
        this.repo = new meeting_repository_1.MeetingRepository();
    }
    toSafeParticipant(p) {
        return {
            userId: p.user.toString(),
            role: p.role,
            status: p.status,
            joinedAt: p.joinedAt,
            leftAt: p.leftAt,
        };
    }
    toSafeMeeting(meeting) {
        return {
            id: meeting.id,
            title: meeting.title,
            hostId: (0, meeting_utils_1.idToString)(meeting.host),
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
    async generateUniqueMeetingCode() {
        for (let attempt = 0; attempt < 5; attempt++) {
            const code = generateMeetingCode();
            const existing = await this.repo.findByMeetingCode(code);
            if (!existing)
                return code;
        }
        throw apiError_1.ApiError.internal('Could not generate a unique meeting code, please try again');
    }
    assertIsHost(meeting, userId) {
        if ((0, meeting_utils_1.idToString)(meeting.host) !== userId) {
            throw apiError_1.ApiError.forbidden('Only the host can perform this action');
        }
    }
    assertIsHostOrCoHost(meeting, userId) {
        if (!(0, meeting_utils_1.isHostOrCoHost)(meeting, userId)) {
            throw apiError_1.ApiError.forbidden('Only the host or a co-host can perform this action');
        }
    }
    async createInstantMeeting(hostId, input) {
        const meetingCode = await this.generateUniqueMeetingCode();
        const meeting = await this.repo.create({
            title: input.title || 'Instant Meeting',
            host: hostId,
            meetingCode,
            type: constants_1.MeetingType.INSTANT,
            status: constants_1.MeetingStatus.ONGOING,
            actualStartTime: new Date(),
            participants: [
                {
                    user: hostId,
                    role: constants_1.MeetingRole.HOST,
                    status: constants_1.ParticipantStatus.ADMITTED,
                    joinedAt: new Date(),
                },
            ],
        });
        return this.toSafeMeeting(meeting);
    }
    async scheduleMeeting(hostId, input) {
        const meetingCode = await this.generateUniqueMeetingCode();
        const passwordHash = input.password ? await bcryptjs_1.default.hash(input.password, 10) : undefined;
        const meeting = await this.repo.create({
            title: input.title,
            host: hostId,
            meetingCode,
            passwordHash,
            type: input.recurrence ? constants_1.MeetingType.RECURRING : constants_1.MeetingType.SCHEDULED,
            status: constants_1.MeetingStatus.SCHEDULED,
            scheduledStartTime: new Date(input.scheduledStartTime),
            scheduledEndTime: new Date(input.scheduledEndTime),
            isRecurring: Boolean(input.recurrence),
            recurrence: input.recurrence
                ? {
                    frequency: input.recurrence.frequency,
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
    async getOrCreatePersonalRoom(hostId) {
        let meeting = await this.repo.findPersonalRoomByHost(hostId);
        if (!meeting) {
            const meetingCode = await this.generateUniqueMeetingCode();
            meeting = await this.repo.create({
                title: 'Personal Meeting Room',
                host: hostId,
                meetingCode,
                type: constants_1.MeetingType.PERSONAL,
                status: constants_1.MeetingStatus.SCHEDULED,
                isPersonalRoom: true,
            });
        }
        return this.toSafeMeeting(meeting);
    }
    async startMeeting(meetingId, hostId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        this.assertIsHost(meeting, hostId);
        if (meeting.status === constants_1.MeetingStatus.ENDED || meeting.status === constants_1.MeetingStatus.CANCELLED) {
            throw apiError_1.ApiError.badRequest('This meeting has already ended or was cancelled');
        }
        meeting.status = constants_1.MeetingStatus.ONGOING;
        meeting.actualStartTime = new Date();
        const hostParticipant = meeting.participants.find((p) => p.user.toString() === hostId);
        if (hostParticipant) {
            hostParticipant.status = constants_1.ParticipantStatus.ADMITTED;
            hostParticipant.joinedAt = new Date();
        }
        else {
            meeting.participants.push({
                user: hostId,
                role: constants_1.MeetingRole.HOST,
                status: constants_1.ParticipantStatus.ADMITTED,
                joinedAt: new Date(),
            });
        }
        await this.repo.save(meeting);
        return this.toSafeMeeting(meeting);
    }
    async joinMeeting(userId, meetingCode, password) {
        const meeting = await this.repo.findByMeetingCode(meetingCode);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Invalid meeting code');
        if (meeting.status === constants_1.MeetingStatus.ENDED || meeting.status === constants_1.MeetingStatus.CANCELLED) {
            throw apiError_1.ApiError.badRequest('This meeting has ended');
        }
        if (meeting.status !== constants_1.MeetingStatus.ONGOING) {
            throw apiError_1.ApiError.badRequest('The host has not started this meeting yet');
        }
        if (meeting.passwordHash) {
            if (!password)
                throw apiError_1.ApiError.badRequest('This meeting requires a password');
            const isValid = await bcryptjs_1.default.compare(password, meeting.passwordHash);
            if (!isValid)
                throw apiError_1.ApiError.unauthorized('Incorrect meeting password');
        }
        const isHost = (0, meeting_utils_1.idToString)(meeting.host) === userId;
        const participant = meeting.participants.find((p) => p.user.toString() === userId);
        if (meeting.isLocked && !isHost && !participant) {
            throw apiError_1.ApiError.forbidden('The host has locked this meeting to new participants');
        }
        if (participant?.status === constants_1.ParticipantStatus.REMOVED) {
            throw apiError_1.ApiError.forbidden('You have been removed from this meeting by the host');
        }
        if (isHost) {
            if (!participant) {
                meeting.participants.push({
                    user: userId,
                    role: constants_1.MeetingRole.HOST,
                    status: constants_1.ParticipantStatus.ADMITTED,
                    joinedAt: new Date(),
                });
            }
            else {
                participant.status = constants_1.ParticipantStatus.ADMITTED;
                participant.joinedAt = new Date();
            }
            await this.repo.save(meeting);
            return { admitted: true, meeting: this.toSafeMeeting(meeting), role: constants_1.MeetingRole.HOST };
        }
        if (meeting.participants.length >= meeting.maxParticipants) {
            throw apiError_1.ApiError.badRequest('This meeting is full');
        }
        if (participant && participant.status === constants_1.ParticipantStatus.ADMITTED) {
            participant.joinedAt = new Date();
            await this.repo.save(meeting);
            return { admitted: true, meeting: this.toSafeMeeting(meeting), role: participant.role };
        }
        if (participant && participant.status === constants_1.ParticipantStatus.DENIED) {
            throw apiError_1.ApiError.forbidden('The host has denied your entry to this meeting');
        }
        if (meeting.settings.waitingRoomEnabled) {
            if (!participant) {
                meeting.participants.push({
                    user: userId,
                    role: constants_1.MeetingRole.PARTICIPANT,
                    status: constants_1.ParticipantStatus.WAITING,
                });
            }
            else {
                participant.status = constants_1.ParticipantStatus.WAITING;
            }
            await this.repo.save(meeting);
            return { admitted: false, waiting: true };
        }
        if (!participant) {
            meeting.participants.push({
                user: userId,
                role: constants_1.MeetingRole.PARTICIPANT,
                status: constants_1.ParticipantStatus.ADMITTED,
                joinedAt: new Date(),
            });
        }
        else {
            participant.status = constants_1.ParticipantStatus.ADMITTED;
            participant.joinedAt = new Date();
        }
        await this.repo.save(meeting);
        return { admitted: true, meeting: this.toSafeMeeting(meeting), role: constants_1.MeetingRole.PARTICIPANT };
    }
    async admitParticipant(meetingId, hostId, participantUserId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        this.assertIsHost(meeting, hostId);
        const participant = meeting.participants.find((p) => p.user.toString() === participantUserId);
        if (!participant)
            throw apiError_1.ApiError.notFound('Participant not found in waiting room');
        participant.status = constants_1.ParticipantStatus.ADMITTED;
        participant.joinedAt = new Date();
        await this.repo.save(meeting);
        return this.toSafeMeeting(meeting);
    }
    async denyParticipant(meetingId, hostId, participantUserId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        this.assertIsHost(meeting, hostId);
        const participant = meeting.participants.find((p) => p.user.toString() === participantUserId);
        if (!participant)
            throw apiError_1.ApiError.notFound('Participant not found in waiting room');
        participant.status = constants_1.ParticipantStatus.DENIED;
        await this.repo.save(meeting);
        return this.toSafeMeeting(meeting);
    }
    async leaveMeeting(meetingId, userId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        const participant = meeting.participants.find((p) => p.user.toString() === userId);
        if (!participant)
            throw apiError_1.ApiError.notFound('You are not part of this meeting');
        participant.status = constants_1.ParticipantStatus.LEFT;
        participant.leftAt = new Date();
        await this.repo.save(meeting);
    }
    async endMeeting(meetingId, hostId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        this.assertIsHost(meeting, hostId);
        meeting.status = constants_1.MeetingStatus.ENDED;
        meeting.actualEndTime = new Date();
        const now = new Date();
        meeting.participants.forEach((p) => {
            if (p.status === constants_1.ParticipantStatus.ADMITTED) {
                p.status = constants_1.ParticipantStatus.LEFT;
                p.leftAt = now;
            }
        });
        await this.repo.save(meeting);
        return this.toSafeMeeting(meeting);
    }
    async cancelMeeting(meetingId, hostId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        this.assertIsHost(meeting, hostId);
        if (meeting.status !== constants_1.MeetingStatus.SCHEDULED) {
            throw apiError_1.ApiError.badRequest('Only a meeting that has not started yet can be cancelled');
        }
        meeting.status = constants_1.MeetingStatus.CANCELLED;
        await this.repo.save(meeting);
    }
    async getMeetingById(meetingId, userId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        const isHost = (0, meeting_utils_1.idToString)(meeting.host) === userId;
        const isParticipant = meeting.participants.some((p) => p.user.toString() === userId);
        if (!isHost && !isParticipant) {
            throw apiError_1.ApiError.forbidden('You do not have access to this meeting');
        }
        return this.toSafeMeeting(meeting);
    }
    async listUpcoming(userId) {
        const meetings = await this.repo.findUpcomingForUser(userId);
        return meetings.map((m) => this.toSafeMeeting(m));
    }
    async listHistory(userId) {
        const meetings = await this.repo.findHistoryForUser(userId);
        return meetings.map((m) => this.toSafeMeeting(m));
    }
    async removeParticipant(meetingId, actingUserId, targetUserId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        this.assertIsHostOrCoHost(meeting, actingUserId);
        if ((0, meeting_utils_1.idToString)(meeting.host) === targetUserId) {
            throw apiError_1.ApiError.badRequest('The host cannot be removed from their own meeting');
        }
        const participant = meeting.participants.find((p) => p.user.toString() === targetUserId);
        if (!participant || participant.status !== constants_1.ParticipantStatus.ADMITTED) {
            throw apiError_1.ApiError.notFound('This participant is not currently in the meeting');
        }
        participant.status = constants_1.ParticipantStatus.REMOVED;
        participant.leftAt = new Date();
        await this.repo.save(meeting);
        return this.toSafeMeeting(meeting);
    }
    async setLocked(meetingId, hostId, locked) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        this.assertIsHost(meeting, hostId);
        meeting.isLocked = locked;
        await this.repo.save(meeting);
        return this.toSafeMeeting(meeting);
    }
    async setRecording(meetingId, hostId, recording) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        this.assertIsHost(meeting, hostId);
        meeting.isRecording = recording;
        await this.repo.save(meeting);
        return this.toSafeMeeting(meeting);
    }
    async assignCoHost(meetingId, hostId, targetUserId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        this.assertIsHost(meeting, hostId);
        if ((0, meeting_utils_1.idToString)(meeting.host) === targetUserId) {
            throw apiError_1.ApiError.badRequest('The host is already in charge of this meeting');
        }
        const participant = meeting.participants.find((p) => p.user.toString() === targetUserId);
        if (!participant || participant.status !== constants_1.ParticipantStatus.ADMITTED) {
            throw apiError_1.ApiError.notFound('This participant is not currently in the meeting');
        }
        participant.role = constants_1.MeetingRole.CO_HOST;
        await this.repo.save(meeting);
        return this.toSafeMeeting(meeting);
    }
    async revokeCoHost(meetingId, hostId, targetUserId) {
        const meeting = await this.repo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        this.assertIsHost(meeting, hostId);
        const participant = meeting.participants.find((p) => p.user.toString() === targetUserId);
        if (!participant || participant.role !== constants_1.MeetingRole.CO_HOST) {
            throw apiError_1.ApiError.notFound('This participant is not currently a co-host');
        }
        participant.role = constants_1.MeetingRole.PARTICIPANT;
        await this.repo.save(meeting);
        return this.toSafeMeeting(meeting);
    }
}
exports.MeetingService = MeetingService;
