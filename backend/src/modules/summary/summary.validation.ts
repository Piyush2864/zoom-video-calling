import { z } from 'zod';

export const generateSummarySchema = z.object({
  params: z.object({
    meetingId: z.string().min(1),
  }),
  body: z.object({
    transcript: z.string().min(1).max(50000).optional(),
  }),
});

export const summaryMeetingParamSchema = z.object({
  params: z.object({
    meetingId: z.string().min(1),
  }),
});
