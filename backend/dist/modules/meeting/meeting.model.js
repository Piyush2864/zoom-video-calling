"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Meeting = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
const recurrenceSchema = new mongoose_1.Schema({
    frequency: { type: String, enum: Object.values(constants_1.RecurrenceFrequency), required: true },
    daysOfWeek: { type: [Number], default: undefined },
    endDate: { type: Date },
}, { _id: false });
const settingsSchema = new mongoose_1.Schema({
    waitingRoomEnabled: { type: Boolean, default: true },
    muteOnEntry: { type: Boolean, default: true },
    allowParticipantScreenShare: { type: Boolean, default: false },
    allowChat: { type: Boolean, default: true },
}, { _id: false });
const participantSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: Object.values(constants_1.MeetingRole), default: constants_1.MeetingRole.PARTICIPANT },
    status: {
        type: String,
        enum: Object.values(constants_1.ParticipantStatus),
        default: constants_1.ParticipantStatus.WAITING,
    },
    joinedAt: { type: Date },
    leftAt: { type: Date },
}, { _id: false });
const meetingSchema = new mongoose_1.Schema({
    title: { type: String, required: true, trim: true },
    host: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    meetingCode: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, select: false },
    type: { type: String, enum: Object.values(constants_1.MeetingType), required: true },
    status: {
        type: String,
        enum: Object.values(constants_1.MeetingStatus),
        default: constants_1.MeetingStatus.SCHEDULED,
    },
    scheduledStartTime: { type: Date },
    scheduledEndTime: { type: Date },
    actualStartTime: { type: Date },
    actualEndTime: { type: Date },
    isRecurring: { type: Boolean, default: false },
    recurrence: { type: recurrenceSchema },
    isPersonalRoom: { type: Boolean, default: false },
    isLocked: { type: Boolean, default: false },
    isRecording: { type: Boolean, default: false },
    settings: { type: settingsSchema, default: () => ({}) },
    participants: { type: [participantSchema], default: [] },
    maxParticipants: { type: Number, default: 100 },
}, { timestamps: true });
meetingSchema.index({ host: 1, isPersonalRoom: 1 }, { unique: true, partialFilterExpression: { isPersonalRoom: true } });
exports.Meeting = (0, mongoose_1.model)('Meeting', meetingSchema);
