"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summaryMeetingParamSchema = exports.generateSummarySchema = void 0;
const zod_1 = require("zod");
exports.generateSummarySchema = zod_1.z.object({
    params: zod_1.z.object({
        meetingId: zod_1.z.string().min(1),
    }),
    body: zod_1.z.object({
        transcript: zod_1.z.string().min(1).max(50000).optional(),
    }),
});
exports.summaryMeetingParamSchema = zod_1.z.object({
    params: zod_1.z.object({
        meetingId: zod_1.z.string().min(1),
    }),
});
