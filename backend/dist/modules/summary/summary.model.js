"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AISummary = void 0;
const mongoose_1 = require("mongoose");
const aiSummarySchema = new mongoose_1.Schema({
    meeting: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Meeting', required: true, unique: true, index: true },
    generatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    summary: { type: String, required: true },
    keyPoints: { type: [String], default: [] },
    actionItems: { type: [String], default: [] },
    sourceType: { type: String, enum: ['chat', 'transcript'], required: true },
    aiModel: { type: String, required: true },
}, { timestamps: true });
exports.AISummary = (0, mongoose_1.model)('AISummary', aiSummarySchema);
