import { ChatMessage, IChatMessage } from './chat.model';
import { Types } from 'mongoose';

export class ChatRepository {
  create(data: Partial<IChatMessage>) {
    return ChatMessage.create(data);
  }

  findById(id: string) {
    return ChatMessage.findById(id).exec();
  }

  findVisibleHistory(meetingId: string, userId: string, before: Date, limit: number) {
    return ChatMessage.find({
      meeting: meetingId,
      createdAt: { $lt: before },
      $or: [
        { recipient: { $exists: false } },
        { sender: userId as unknown as Types.ObjectId },
        { recipient: userId as unknown as Types.ObjectId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  searchVisibleMessages(meetingId: string, userId: string, query: string) {
    return ChatMessage.find({
      meeting: meetingId,
      content: { $regex: query, $options: 'i' },
      $or: [
        { recipient: { $exists: false } },
        { sender: userId as unknown as Types.ObjectId },
        { recipient: userId as unknown as Types.ObjectId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }

  findPublicTranscript(meetingId: string, limit = 500) {
    return ChatMessage.find({
      meeting: meetingId,
      recipient: { $exists: false },
    })
      .sort({ createdAt: 1 })
      .limit(limit)
      .populate('sender', 'name')
      .exec();
  }
}
