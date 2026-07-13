"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccountSchema = exports.changePasswordSchema = exports.updateSettingsSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const validators_1 = require("../../utils/validators");
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters').optional(),
    }),
});
exports.updateSettingsSchema = zod_1.z.object({
    body: zod_1.z.object({
        defaultCameraOn: zod_1.z.boolean().optional(),
        defaultMicOn: zod_1.z.boolean().optional(),
        emailNotifications: zod_1.z.boolean().optional(),
        language: zod_1.z.string().min(2).max(10).optional(),
    }),
});
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: validators_1.passwordSchema,
    }),
});
exports.deleteAccountSchema = zod_1.z.object({
    body: zod_1.z.object({
        password: zod_1.z.string().min(1).optional(),
    }),
});
