export interface GenerateSummaryInput {
  transcript?: string; 
}

export interface SafeAISummary {
  id: string;
  meetingId: string;
  generatedBy: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  sourceType: 'chat' | 'transcript';
  aiModel: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeminiSummaryResult {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}
