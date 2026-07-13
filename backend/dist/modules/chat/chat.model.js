"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatMessage = void 0;
const mongoose_1 = require("mongoose");
const attachmentSchema = new mongoose_1.Schema({
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
}, { _id: false });
const chatMessageSchema = new mongoose_1.Schema({
    meeting: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
    sender: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, trim: true, maxlength: 4000 },
    attachment: { type: attachmentSchema },
}, { timestamps: { createdAt: true, updatedAt: false } });
chatMessageSchema.index({ meeting: 1, createdAt: -1 });
exports.ChatMessage = (0, mongoose_1.model)('ChatMessage', chatMessageSchema);
