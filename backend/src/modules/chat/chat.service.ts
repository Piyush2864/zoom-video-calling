import { ChatRepository } from './chat.repository';
import { MeetingRepository } from '../meeting/meeting.repository';
import { idToString } from '../meeting/meeting.utils';
import { ApiError } from '../../utils/apiError';
import { cloudinary } from '../../config/cloudinary';
import { IChatMessage } from './chat.model';
import { ChatAttachmentDTO, SafeChatMessage, SendMessageInput } from './chat.types';

const CHAT_ATTACHMENT_FOLDER = 'zoom-clone/chat-attachments';
const DEFAULT_HISTORY_LIMIT = 50;
const MAX_HISTORY_LIMIT = 100;

export class ChatService {
  private repo = new ChatRepository();
  private meetingRepo = new MeetingRepository();

  private toSafeMessage(message: IChatMessage): SafeChatMessage {
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

  private async assertMeetingAccess(meetingId: string, userId: string): Promise<void> {
    const meeting = await this.meetingRepo.findById(meetingId);
    if (!meeting) throw ApiError.notFound('Meeting not found');

    const isHost = idToString(meeting.host) === userId;
    const isParticipant = meeting.participants.some((p) => p.user.toString() === userId);
    if (!isHost && !isParticipant) {
      throw ApiError.forbidden('You do not have access to this meeting');
    }
  }

  async uploadAttachment(
    meetingId: string,
    userId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    fileSize: number
  ): Promise<ChatAttachmentDTO> {
    await this.assertMeetingAccess(meetingId, userId);

    const base64 = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(base64, {
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

  async sendMessage(senderId: string, input: SendMessageInput): Promise<SafeChatMessage> {
    await this.assertMeetingAccess(input.meetingId, senderId);

    if (!input.content && !input.attachment) {
      throw ApiError.badRequest('A message needs either text content or an attachment');
    }

    if (input.recipientId) {
      await this.assertMeetingAccess(input.meetingId, input.recipientId);
    }

    const message = await this.repo.create({
      meeting: input.meetingId as unknown as IChatMessage['meeting'],
      sender: senderId as unknown as IChatMessage['sender'],
      recipient: input.recipientId as unknown as IChatMessage['recipient'],
      content: input.content,
      attachment: input.attachment,
    });

    return this.toSafeMessage(message);
  }

  async getHistory(
    meetingId: string,
    userId: string,
    before?: string,
    limit?: number
  ): Promise<SafeChatMessage[]> {
    await this.assertMeetingAccess(meetingId, userId);

    const cursor = before ? new Date(before) : new Date();
    const cappedLimit = Math.min(limit || DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT);

    const messages = await this.repo.findVisibleHistory(meetingId, userId, cursor, cappedLimit);
    return messages.map((m) => this.toSafeMessage(m)).reverse();
  }

  async searchMessages(meetingId: string, userId: string, query: string): Promise<SafeChatMessage[]> {
    await this.assertMeetingAccess(meetingId, userId);
    const messages = await this.repo.searchVisibleMessages(meetingId, userId, query);
    return messages.map((m) => this.toSafeMessage(m));
  }
}
