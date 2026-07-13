export interface ChatAttachmentDTO {
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface SendMessageInput {
  meetingId: string;
  recipientId?: string;
  content?: string;
  attachment?: ChatAttachmentDTO;
}

export interface SafeChatMessage {
  id: string;
  meetingId: string;
  senderId: string;
  recipientId?: string;
  content?: string;
  attachment?: ChatAttachmentDTO;
  createdAt: Date;
}
