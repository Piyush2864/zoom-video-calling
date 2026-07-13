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
exports.registerWebRTCHandlers = registerWebRTCHandlers;
const logger_1 = require("../../utils/logger");
const room_util_1 = require("../socket/room.util");
const presence = __importStar(require("../socket/presence.socket"));
function verifyBothInRoom(meetingId, socketIdA, socketIdB) {
    const participants = presence.getParticipants(meetingId);
    const ids = new Set(participants.map((p) => p.socketId));
    return ids.has(socketIdA) && ids.has(socketIdB);
}
function registerWebRTCHandlers(io, socket) {
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
    socket.on('media:state-change', ({ meetingId, audioEnabled, videoEnabled }) => {
        const userId = socket.data.user.userId;
        const isInRoom = presence.getParticipants(meetingId).some((p) => p.socketId === socket.id);
        if (!isInRoom) {
            return socket.emit('meeting:error', { message: 'You are not in this meeting room' });
        }
        socket.to((0, room_util_1.meetingRoomName)(meetingId)).emit('media:state-changed', {
            meetingId,
            userId,
            socketId: socket.id,
            audioEnabled,
            videoEnabled,
        });
    });
    socket.on('disconnect', () => {
        logger_1.logger.info(`Socket ${socket.id} disconnected — any active peer connections will time out client-side`);
    });
}
