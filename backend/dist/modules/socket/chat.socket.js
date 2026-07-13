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
exports.registerChatHandlers = registerChatHandlers;
const chat_service_1 = require("../chat/chat.service");
const logger_1 = require("../../utils/logger");
const room_util_1 = require("./room.util");
const presence = __importStar(require("../socket/presence.socket"));
const chatService = new chat_service_1.ChatService();
function registerChatHandlers(io, socket) {
    socket.on('chat:send', async (payload) => {
        const userId = socket.data.user.userId;
        try {
            const message = await chatService.sendMessage(userId, {
                meetingId: payload.meetingId,
                recipientId: payload.recipientId,
                content: payload.content,
                attachment: payload.attachment,
            });
            const outgoing = {
                id: message.id,
                meetingId: message.meetingId,
                senderId: message.senderId,
                recipientId: message.recipientId,
                content: message.content,
                attachment: message.attachment,
                createdAt: message.createdAt.toISOString(),
            };
            if (message.recipientId) {
                const senderSocketIds = presence.getSocketIdsForUser(message.meetingId, message.senderId);
                const recipientSocketIds = presence.getSocketIdsForUser(message.meetingId, message.recipientId);
                [...senderSocketIds, ...recipientSocketIds].forEach((socketId) => {
                    io.to(socketId).emit('chat:message', outgoing);
                });
            }
            else {
                io.to((0, room_util_1.meetingRoomName)(message.meetingId)).emit('chat:message', outgoing);
            }
        }
        catch (error) {
            logger_1.logger.error('chat:send failed', { error, userId, meetingId: payload.meetingId });
            const message = error instanceof Error ? error.message : 'Failed to send message';
            socket.emit('chat:error', { message });
        }
    });
    socket.on('chat:typing', ({ meetingId, recipientId, isTyping }) => {
        const userId = socket.data.user.userId;
        if (recipientId) {
            const recipientSocketIds = presence.getSocketIdsForUser(meetingId, recipientId);
            recipientSocketIds.forEach((socketId) => {
                io.to(socketId).emit('chat:typing', { meetingId, userId, isTyping });
            });
        }
        else {
            socket.to((0, room_util_1.meetingRoomName)(meetingId)).emit('chat:typing', { meetingId, userId, isTyping });
        }
    });
}
