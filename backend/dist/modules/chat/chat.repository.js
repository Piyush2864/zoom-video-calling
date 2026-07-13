"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRepository = void 0;
const chat_model_1 = require("./chat.model");
class ChatRepository {
    create(data) {
        return chat_model_1.ChatMessage.create(data);
    }
    findById(id) {
        return chat_model_1.ChatMessage.findById(id).exec();
    }
    findVisibleHistory(meetingId, userId, before, limit) {
        return chat_model_1.ChatMessage.find({
            meeting: meetingId,
            createdAt: { $lt: before },
            $or: [
                { recipient: { $exists: false } },
                { sender: userId },
                { recipient: userId },
            ],
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }
    searchVisibleMessages(meetingId, userId, query) {
        return chat_model_1.ChatMessage.find({
            meeting: meetingId,
            content: { $regex: query, $options: 'i' },
            $or: [
                { recipient: { $exists: false } },
                { sender: userId },
                { recipient: userId },
            ],
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .exec();
    }
    findPublicTranscript(meetingId, limit = 500) {
        return chat_model_1.ChatMessage.find({
            meeting: meetingId,
            recipient: { $exists: false },
        })
            .sort({ createdAt: 1 })
            .limit(limit)
            .populate('sender', 'name')
            .exec();
    }
}
exports.ChatRepository = ChatRepository;
