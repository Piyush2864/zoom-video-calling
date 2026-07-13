"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatSearchQuerySchema = exports.chatHistoryQuerySchema = exports.chatMeetingParamSchema = void 0;
const zod_1 = require("zod");
exports.chatMeetingParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        meetingId: zod_1.z.string().min(1),
    }),
});
exports.chatHistoryQuerySchema = zod_1.z.object({
    params: zod_1.z.object({
        meetingId: zod_1.z.string().min(1),
    }),
    query: zod_1.z.object({
        before: zod_1.z.string().datetime().optional(), // cursor: fetch messages older than this timestamp
        limit: zod_1.z
            .string()
            .regex(/^\d+$/)
            .optional()
            .transform((v) => (v ? Number(v) : undefined)),
    }),
});
exports.chatSearchQuerySchema = zod_1.z.object({
    params: zod_1.z.object({
        meetingId: zod_1.z.string().min(1),
    }),
    query: zod_1.z.object({
        q: zod_1.z.string().min(1, 'Search query is required'),
    }),
});
