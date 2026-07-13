import { Schema, model, Document, Types } from 'mongoose';

export interface IAISummary extends Document {
  meeting: Types.ObjectId;
  generatedBy: Types.ObjectId; 
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sourceType: 'chat' | 'transcript';
  aiModel: string; 
  createdAt: Date;
  updatedAt: Date;
}

const aiSummarySchema = new Schema<IAISummary>(
  {
    meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true, unique: true, index: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    summary: { type: String, required: true },
    keyPoints: { type: [String], default: [] },
    actionItems: { type: [String], default: [] },
    sourceType: { type: String, enum: ['chat', 'transcript'], required: true },
    aiModel: { type: String, required: true },
  },
  { timestamps: true }
);

export const AISummary = model<IAISummary>('AISummary', aiSummarySchema);
