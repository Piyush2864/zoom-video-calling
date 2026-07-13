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
exports.registerHostControlHandlers = registerHostControlHandlers;
const meeting_service_1 = require("../meeting/meeting.service");
const logger_1 = require("../../utils/logger");
const room_util_1 = require("./room.util");
const presence = __importStar(require("../socket/presence.socket"));
const meetingService = new meeting_service_1.MeetingService();
function handleError(socket, error, fallback) {
    const message = error instanceof Error ? error.message : fallback;
    socket.emit('host:error', { message });
}
function registerHostControlHandlers(io, socket) {
    socket.on('host:mute-all', ({ meetingId }) => {
        socket.to((0, room_util_1.meetingRoomName)(meetingId)).emit('host:force-mute', { meetingId });
    });
    socket.on('host:remove-participant', async ({ meetingId, targetUserId }) => {
        try {
            await meetingService.removeParticipant(meetingId, socket.data.user.userId, targetUserId);
            const targetSocketIds = presence.getSocketIdsForUser(meetingId, targetUserId);
            targetSocketIds.forEach((socketId) => {
                const targetSocket = io.sockets.sockets.get(socketId);
                if (!targetSocket)
                    return;
                targetSocket.emit('host:removed', { meetingId, reason: 'Removed by the host' });
                targetSocket.leave((0, room_util_1.meetingRoomName)(meetingId));
                presence.removeParticipant(meetingId, socketId);
            });
            io.to((0, room_util_1.meetingRoomName)(meetingId)).emit('host:participant-removed', {
                meetingId,
                userId: targetUserId,
            });
        }
        catch (error) {
            logger_1.logger.error('host:remove-participant failed', { error, meetingId, targetUserId });
            handleError(socket, error, 'Failed to remove participant');
        }
    });
    socket.on('host:lock-meeting', async ({ meetingId, locked }) => {
        try {
            await meetingService.setLocked(meetingId, socket.data.user.userId, locked);
            io.to((0, room_util_1.meetingRoomName)(meetingId)).emit('host:lock-changed', { meetingId, locked });
        }
        catch (error) {
            logger_1.logger.error('host:lock-meeting failed', { error, meetingId });
            handleError(socket, error, 'Failed to update lock state');
        }
    });
    socket.on('host:toggle-recording', async ({ meetingId, recording }) => {
        try {
            await meetingService.setRecording(meetingId, socket.data.user.userId, recording);
            io.to((0, room_util_1.meetingRoomName)(meetingId)).emit('host:recording-changed', { meetingId, recording });
        }
        catch (error) {
            logger_1.logger.error('host:toggle-recording failed', { error, meetingId });
            handleError(socket, error, 'Failed to update recording state');
        }
    });
    socket.on('host:assign-co-host', async ({ meetingId, targetUserId }) => {
        try {
            await meetingService.assignCoHost(meetingId, socket.data.user.userId, targetUserId);
            io.to((0, room_util_1.meetingRoomName)(meetingId)).emit('host:co-host-assigned', {
                meetingId,
                userId: targetUserId,
            });
        }
        catch (error) {
            logger_1.logger.error('host:assign-co-host failed', { error, meetingId, targetUserId });
            handleError(socket, error, 'Failed to assign co-host');
        }
    });
}
