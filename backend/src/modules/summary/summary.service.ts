import { SummaryRepository } from './summary.repository';
import { MeetingRepository } from '../meeting/meeting.repository';
import { ChatRepository } from '../chat/chat.repository';
import { idToString } from '../meeting/meeting.utils';
import { ApiError } from '../../utils/apiError';
import { getGeminiModel } from '../../config/gemini';
import { env } from '../../config/env';
import { MeetingStatus } from '../../config/constants';
import { IAISummary } from './summary.model';
import { GenerateSummaryInput, SafeAISummary, GeminiSummaryResult } from './summary.types';

const MAX_TRANSCRIPT_CHARS = 30000;

export class SummaryService {
  private repo = new SummaryRepository();
  private meetingRepo = new MeetingRepository();
  private chatRepo = new ChatRepository();

  private toSafeSummary(doc: IAISummary): SafeAISummary {
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

  private async buildTranscriptFromChat(meetingId: string): Promise<string> {
    const messages = await this.chatRepo.findPublicTranscript(meetingId);

    if (messages.length === 0) {
      throw ApiError.badRequest(
        'This meeting has no chat messages to summarize. Pass a transcript manually if you have one from another source.'
      );
    }

    const lines = messages.map((m) => {
      const senderName = (m.sender as unknown as { name?: string })?.name || 'Unknown';
      const text = m.content || (m.attachment ? `[shared a file: ${m.attachment.fileName}]` : '');
      return `${senderName}: ${text}`;
    });

    return lines.join('\n');
  }

  private buildPrompt(transcript: string): string {
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

  private parseGeminiResponse(rawText: string): GeminiSummaryResult {
    const cleaned = rawText.replace(/```json\s*|```/g, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      return {
        summary: typeof parsed.summary === 'string' ? parsed.summary : cleaned,
        keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.filter((k: unknown) => typeof k === 'string') : [],
        actionItems: Array.isArray(parsed.actionItems)
          ? parsed.actionItems.filter((a: unknown) => typeof a === 'string')
          : [],
      };
    } catch {
      return { summary: cleaned, keyPoints: [], actionItems: [] };
    }
  }

  async generateSummary(
    meetingId: string,
    hostId: string,
    input: GenerateSummaryInput
  ): Promise<SafeAISummary> {
    const meeting = await this.meetingRepo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');
    if (idToString(meeting.host) !== hostId) {
      throw ApiError.forbidden('Only the host can generate a meeting summary');
    }
    if (meeting.status !== MeetingStatus.ENDED) {
      throw ApiError.badRequest('The meeting must have ended before generating a summary');
    }

    const sourceType: 'chat' | 'transcript' = input.transcript ? 'transcript' : 'chat';
    const transcriptRaw = input.transcript || (await this.buildTranscriptFromChat(meetingId));
    const transcript = transcriptRaw.slice(0, MAX_TRANSCRIPT_CHARS);

    const model = getGeminiModel();
    let result: GeminiSummaryResult;

    try {
      const response = await model.generateContent(this.buildPrompt(transcript));
      result = this.parseGeminiResponse(response.response.text());
    } catch {
      throw ApiError.internal('Failed to generate summary. Please try again in a moment.');
    }

    const saved = await this.repo.upsert(meetingId, {
      generatedBy: hostId as unknown as IAISummary['generatedBy'],
      summary: result.summary,
      keyPoints: result.keyPoints,
      actionItems: result.actionItems,
      sourceType,
      aiModel: env.GEMINI_MODEL,
    });

    return this.toSafeSummary(saved);
  }

  async getSummary(meetingId: string, userId: string): Promise<SafeAISummary> {
    const meeting = await this.meetingRepo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');

    const isHost = idToString(meeting.host) === userId;
    const isParticipant = meeting.participants.some((p) => p.user.toString() === userId);
    if (!isHost && !isParticipant) {
      throw ApiError.forbidden('You do not have access to this meeting');
    }

    const summary = await this.repo.findByMeeting(meetingId);
    if (!summary) throw ApiError.notFound('No summary has been generated for this meeting yet');

    return this.toSafeSummary(summary);
  }

  async deleteSummary(meetingId: string, hostId: string): Promise<void> {
    const meeting = await this.meetingRepo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');
    if (idToString(meeting.host) !== hostId) {
      throw ApiError.forbidden('Only the host can delete the meeting summary');
    }

    await this.repo.deleteByMeeting(meetingId);
  }
}
