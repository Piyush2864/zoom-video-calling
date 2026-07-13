"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const constants_1 = require("../../config/constants");
const settingsSchema = new mongoose_1.Schema({
    defaultCameraOn: { type: Boolean, default: true },
    defaultMicOn: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
}, { _id: false });
const userSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    avatar: { type: String },
    avatarPublicId: { type: String },
    provider: {
        type: String,
        enum: Object.values(constants_1.AuthProvider),
        default: constants_1.AuthProvider.LOCAL,
    },
    googleId: { type: String, index: true, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    settings: { type: settingsSchema, default: () => ({}) },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorTempSecret: { type: String, select: false },
    twoFactorBackupCodes: { type: [String], select: false, default: undefined },
}, { timestamps: true });
exports.User = (0, mongoose_1.model)('User', userSchema);
