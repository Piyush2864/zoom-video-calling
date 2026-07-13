import { z } from 'zod';

export const chatMeetingParamSchema = z.object({
  params: z.object({
    meetingId: z.string().min(1),
  }),
});

export const chatHistoryQuerySchema = z.object({
  params: z.object({
    meetingId: z.string().min(1),
  }),
  query: z.object({
    before: z.string().datetime().optional(),
    limit: z
      .string()
      .regex(/^\d+$/)
      .optional()
      .transform((v) => (v ? Number(v) : undefined)),
  }),
});

export const chatSearchQuerySchema = z.object({
  params: z.object({
    meetingId: z.string().min(1),
  }),
  query: z.object({
    q: z.string().min(1, 'Search query is required'),
  }),
});
