import { z } from 'zod';

export const createInstantMeetingSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(100).optional(),
  }),
});

export const scheduleMeetingSchema = z.object({
  body: z
    .object({
      title: z.string().min(1, 'Title is required').max(100),
      scheduledStartTime: z.string().datetime('Invalid start time'),
      scheduledEndTime: z.string().datetime('Invalid end time'),
      password: z.string().min(4).max(50).optional(),
      waitingRoomEnabled: z.boolean().optional(),
      recurrence: z
        .object({
          frequency: z.enum(['daily', 'weekly', 'monthly']),
          daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
          endDate: z.string().datetime().optional(),
        })
        .optional(),
    })
    .refine((data) => new Date(data.scheduledEndTime) > new Date(data.scheduledStartTime), {
      message: 'scheduledEndTime must be after scheduledStartTime',
      path: ['scheduledEndTime'],
    }),
});

export const joinMeetingSchema = z.object({
  body: z.object({
    meetingCode: z.string().min(1, 'Meeting code is required'),
    password: z.string().optional(),
  }),
});

export const meetingIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
});

export const waitingRoomActionSchema = z.object({
  params: z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
  }),
});

export const participantActionParamSchema = z.object({
  params: z.object({
    id: z.string().min(1),
    userId: z.string().min(1),
  }),
});

export const setLockedSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ locked: z.boolean() }),
});

export const setRecordingSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ recording: z.boolean() }),
});

export const listMeetingsQuerySchema = z.object({
  query: z.object({
    scope: z.enum(['upcoming', 'history']).optional(),
  }),
});
