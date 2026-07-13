"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryService = void 0;
const summary_repository_1 = require("./summary.repository");
const meeting_repository_1 = require("../meeting/meeting.repository");
const chat_repository_1 = require("../chat/chat.repository");
const meeting_utils_1 = require("../meeting/meeting.utils");
const apiError_1 = require("../../utils/apiError");
const gemini_1 = require("../../config/gemini");
const env_1 = require("../../config/env");
const constants_1 = require("../../config/constants");
const MAX_TRANSCRIPT_CHARS = 30000;
class SummaryService {
    constructor() {
        this.repo = new summary_repository_1.SummaryRepository();
        this.meetingRepo = new meeting_repository_1.MeetingRepository();
        this.chatRepo = new chat_repository_1.ChatRepository();
    }
    toSafeSummary(doc) {
        return {
            id: doc.id,
            meetingId: doc.meeting.toString(),
            generatedBy: doc.generatedBy.toString(),
            summary: doc.summary,
            keyPoints: doc.keyPoints,
            actionItems: doc.actionItems,
            sourceType: doc.sourceType,
            aiModel: doc.aiModel,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        };
    }
    async buildTranscriptFromChat(meetingId) {
        const messages = await this.chatRepo.findPublicTranscript(meetingId);
        if (messages.length === 0) {
            throw apiError_1.ApiError.badRequest('This meeting has no chat messages to summarize. Pass a transcript manually if you have one from another source.');
        }
        const lines = messages.map((m) => {
            const senderName = m.sender?.name || 'Unknown';
            const text = m.content || (m.attachment ? `[shared a file: ${m.attachment.fileName}]` : '');
            return `${senderName}: ${text}`;
        });
        return lines.join('\n');
    }
    buildPrompt(transcript) {
        return `You are summarizing the chat transcript of a video conferencing meeting. Read the conversation below and respond with ONLY valid JSON — no markdown formatting, no code fences, no commentary before or after — in exactly this shape:

{
  "summary": "a concise 2-4 sentence overview of what was discussed",
  "keyPoints": ["key discussion point 1", "key discussion point 2"],
  "actionItems": ["action item 1", "action item 2"]
}

If there are no clear action items, return an empty array for "actionItems". Keep keyPoints to at most 8 items.

Transcript:
${transcript}`;
    }
    parseGeminiResponse(rawText) {
        const cleaned = rawText.replace(/```json\s*|```/g, '').trim();
        try {
            const parsed = JSON.parse(cleaned);
            return {
                summary: typeof parsed.summary === 'string' ? parsed.summary : cleaned,
                keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.filter((k) => typeof k === 'string') : [],
                actionItems: Array.isArray(parsed.actionItems)
                    ? parsed.actionItems.filter((a) => typeof a === 'string')
                    : [],
            };
        }
        catch {
            return { summary: cleaned, keyPoints: [], actionItems: [] };
        }
    }
    async generateSummary(meetingId, hostId, input) {
        const meeting = await this.meetingRepo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        if ((0, meeting_utils_1.idToString)(meeting.host) !== hostId) {
            throw apiError_1.ApiError.forbidden('Only the host can generate a meeting summary');
        }
        if (meeting.status !== constants_1.MeetingStatus.ENDED) {
            throw apiError_1.ApiError.badRequest('The meeting must have ended before generating a summary');
        }
        const sourceType = input.transcript ? 'transcript' : 'chat';
        const transcriptRaw = input.transcript || (await this.buildTranscriptFromChat(meetingId));
        const transcript = transcriptRaw.slice(0, MAX_TRANSCRIPT_CHARS);
        const model = (0, gemini_1.getGeminiModel)();
        let result;
        try {
            const response = await model.generateContent(this.buildPrompt(transcript));
            result = this.parseGeminiResponse(response.response.text());
        }
        catch {
            throw apiError_1.ApiError.internal('Failed to generate summary. Please try again in a moment.');
        }
        const saved = await this.repo.upsert(meetingId, {
            generatedBy: hostId,
            summary: result.summary,
            keyPoints: result.keyPoints,
            actionItems: result.actionItems,
            sourceType,
            aiModel: env_1.env.GEMINI_MODEL,
        });
        return this.toSafeSummary(saved);
    }
    async getSummary(meetingId, userId) {
        const meeting = await this.meetingRepo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        const isHost = (0, meeting_utils_1.idToString)(meeting.host) === userId;
        const isParticipant = meeting.participants.some((p) => p.user.toString() === userId);
        if (!isHost && !isParticipant) {
            throw apiError_1.ApiError.forbidden('You do not have access to this meeting');
        }
        const summary = await this.repo.findByMeeting(meetingId);
        if (!summary)
            throw apiError_1.ApiError.notFound('No summary has been generated for this meeting yet');
        return this.toSafeSummary(summary);
    }
    async deleteSummary(meetingId, hostId) {
        const meeting = await this.meetingRepo.findById(meetingId);
        if (!meeting)
            throw apiError_1.ApiError.notFound('Meeting not found');
        if ((0, meeting_utils_1.idToString)(meeting.host) !== hostId) {
            throw apiError_1.ApiError.forbidden('Only the host can delete the meeting summary');
        }
        await this.repo.deleteByMeeting(meetingId);
    }
}
exports.SummaryService = SummaryService;
