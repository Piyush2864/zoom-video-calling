import { Schema, model, Document, Types } from 'mongoose';

export interface IChatAttachment {
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
}

export interface IChatMessage extends Document {
  meeting: Types.ObjectId;
  sender: Types.ObjectId;
  recipient?: Types.ObjectId;
  content?: string;
  attachment?: IChatAttachment;
  createdAt: Date;
}

const attachmentSchema = new Schema<IChatAttachment>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
  },
  { _id: false }
);

const chatMessageSchema = new Schema<IChatMessage>(
  {
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User' },
    content: { type: String, trim: true, maxlength: 4000 },
    attachment: { type: attachmentSchema },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

chatMessageSchema.index({ meeting: 1, createdAt: -1 });

export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);
