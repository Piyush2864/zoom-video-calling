"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const chat_repository_1 = require("./chat.repository");
const meeting_repository_1 = require("../meeting/meeting.repository");
const meeting_utils_1 = require("../meeting/meeting.utils");
const apiError_1 = require("../../utils/apiError");
const cloudinary_1 = require("../../config/cloudinary");
const CHAT_ATTACHMENT_FOLDER = 'zoom-clone/chat-attachments';
const DEFAULT_HISTORY_LIMIT = 50;
const MAX_HISTORY_LIMIT = 100;
class ChatService {
    constructor() {
        this.repo = new chat_repository_1.ChatRepository();
        this.meetingRepo = new meeting_repository_1.MeetingRepository();
    }
    toSafeMessage(message) {
        return {
            id: message.id,
            meetingId: message.meeting.toString(),
            senderId: message.sender.toString(),
            recipientId: message.recipient?.toString(),
            content: message.content,
            attachment: message.attachment,
            createdAt: message.createdAt,
        };
    }
    async assertMeetingAccess(meetingId, userId) {
        const meeting = await this.meetingRepo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        const isHost = (0, meeting_utils_1.idToString)(meeting.host) === userId;
        const isParticipant = meeting.participants.some((p) => p.user.toString() === userId);
        if (!isHost && !isParticipant) {
            throw apiError_1.ApiError.forbidden('You do not have access to this meeting');
        }
    }
    async uploadAttachment(meetingId, userId, fileBuffer, fileName, mimeType, fileSize) {
        await this.assertMeetingAccess(meetingId, userId);
        const base64 = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        const result = await cloudinary_1.cloudinary.uploader.upload(base64, {
            folder: `${CHAT_ATTACHMENT_FOLDER}/${meetingId}`,
            resource_type: 'auto',
        });
        return {
            url: result.secure_url,
            publicId: result.public_id,
            fileName,
            fileType: mimeType,
            fileSize,
        };
    }
    async sendMessage(senderId, input) {
        await this.assertMeetingAccess(input.meetingId, senderId);
        if (!input.content && !input.attachment) {
            throw apiError_1.ApiError.badRequest('A message needs either text content or an attachment');
        }
        if (input.recipientId) {
            await this.assertMeetingAccess(input.meetingId, input.recipientId);
        }
        const message = await this.repo.create({
            meeting: input.meetingId,
            sender: senderId,
            recipient: input.recipientId,
            content: input.content,
            attachment: input.attachment,
        });
        return this.toSafeMessage(message);
    }
    async getHistory(meetingId, userId, before, limit) {
        await this.assertMeetingAccess(meetingId, userId);
        const cursor = before ? new Date(before) : new Date();
        const cappedLimit = Math.min(limit || DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT);
        const messages = await this.repo.findVisibleHistory(meetingId, userId, cursor, cappedLimit);
        return messages.map((m) => this.toSafeMessage(m)).reverse(); // oldest-first for display
    }
    async searchMessages(meetingId, userId, query) {
        await this.assertMeetingAccess(meetingId, userId);
        const messages = await this.repo.searchVisibleMessages(meetingId, userId, query);
        return messages.map((m) => this.toSafeMessage(m));
    }
}
exports.ChatService = ChatService;
