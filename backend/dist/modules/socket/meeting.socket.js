"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMeetingHandlers = registerMeetingHandlers;
const meeting_repository_1 = require("../meeting/meeting.repository");
const meeting_utils_1 = require("../meeting/meeting.utils");
const constants_1 = require("../../config/constants");
const logger_1 = require("../../utils/logger");
const room_util_1 = require("./room.util");
const presence = __importStar(require("../socket/presence.socket"));
const meetingRepo = new meeting_repository_1.MeetingRepository();
function registerMeetingHandlers(io, socket) {
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
            if (meeting.status !== constants_1.MeetingStatus.ONGOING) {
                return socket.emit('meeting:error', { message: 'This meeting is not ongoing' });
            }
            const isHost = (0, meeting_utils_1.idToString)(meeting.host) === userId;
            const participant = meeting.participants.find((p) => p.user.toString() === userId);
            const isAdmitted = isHost || participant?.status === constants_1.ParticipantStatus.ADMITTED;
            if (!isAdmitted) {
                return socket.emit('meeting:error', {
                    message: 'You have not been admitted to this meeting yet',
                });
            }
            socket.join((0, room_util_1.meetingRoomName)(meetingId));
            presence.addParticipant(meetingId, socket.id, userId);
            socket.emit('meeting:joined', {
                meetingId,
                participants: presence.getParticipants(meetingId),
            });
            socket.to((0, room_util_1.meetingRoomName)(meetingId)).emit('meeting:participant-joined', {
                meetingId,
                userId,
                socketId: socket.id,
            });
            logger_1.logger.info(`Socket ${socket.id} (user ${userId}) joined room for meeting ${meetingId}`);
        }
        catch (error) {
            logger_1.logger.error('meeting:join failed', { error, meetingId, userId });
            socket.emit('meeting:error', { message: 'Failed to join meeting room' });
        }
    });
    socket.on('meeting:leave', (payload) => {
        if (payload?.meetingId)
            leaveMeetingRoom(socket, payload.meetingId);
    });
    socket.on('disconnect', () => {
        const meetingIds = presence.getMeetingsForSocket(socket.id);
        meetingIds.forEach((meetingId) => leaveMeetingRoom(socket, meetingId));
    });
}
function leaveMeetingRoom(socket, meetingId) {
    const userId = socket.data.user?.userId;
    socket.leave((0, room_util_1.meetingRoomName)(meetingId));
    presence.removeParticipant(meetingId, socket.id);
    socket.to((0, room_util_1.meetingRoomName)(meetingId)).emit('meeting:participant-left', {
        meetingId,
        userId,
        socketId: socket.id,
    });
    logger_1.logger.info(`Socket ${socket.id} (user ${userId}) left room for meeting ${meetingId}`);
}
