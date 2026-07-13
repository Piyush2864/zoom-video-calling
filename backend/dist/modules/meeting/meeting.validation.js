"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMeetingsQuerySchema = exports.setRecordingSchema = exports.setLockedSchema = exports.participantActionParamSchema = exports.waitingRoomActionSchema = exports.meetingIdParamSchema = exports.joinMeetingSchema = exports.scheduleMeetingSchema = exports.createInstantMeetingSchema = void 0;
const zod_1 = require("zod");
exports.createInstantMeetingSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1).max(100).optional(),
    }),
});
exports.scheduleMeetingSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        title: zod_1.z.string().min(1, 'Title is required').max(100),
        scheduledStartTime: zod_1.z.string().datetime('Invalid start time'),
        scheduledEndTime: zod_1.z.string().datetime('Invalid end time'),
        password: zod_1.z.string().min(4).max(50).optional(),
        waitingRoomEnabled: zod_1.z.boolean().optional(),
        recurrence: zod_1.z
            .object({
            frequency: zod_1.z.enum(['daily', 'weekly', 'monthly']),
            daysOfWeek: zod_1.z.array(zod_1.z.number().min(0).max(6)).optional(),
            endDate: zod_1.z.string().datetime().optional(),
        })
            .optional(),
    })
        .refine((data) => new Date(data.scheduledEndTime) > new Date(data.scheduledStartTime), {
        message: 'scheduledEndTime must be after scheduledStartTime',
        path: ['scheduledEndTime'],
    }),
});
exports.joinMeetingSchema = zod_1.z.object({
    body: zod_1.z.object({
        meetingCode: zod_1.z.string().min(1, 'Meeting code is required'),
        password: zod_1.z.string().optional(),
    }),
});
exports.meetingIdParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1),
    }),
});
exports.waitingRoomActionSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1),
        userId: zod_1.z.string().min(1),
    }),
});
exports.participantActionParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().min(1),
        userId: zod_1.z.string().min(1),
    }),
});
exports.setLockedSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
    body: zod_1.z.object({ locked: zod_1.z.boolean() }),
});
exports.setRecordingSchema = zod_1.z.object({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
    body: zod_1.z.object({ recording: zod_1.z.boolean() }),
});
exports.listMeetingsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        scope: zod_1.z.enum(['upcoming', 'history']).optional(),
    }),
});
