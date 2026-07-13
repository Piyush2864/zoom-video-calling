"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoFactorDisableSchema = exports.twoFactorLoginVerifySchema = exports.twoFactorVerifySetupSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.resendVerificationSchema = exports.verifyEmailSchema = exports.googleLoginSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
const validators_1 = require("../../utils/validators");
exports.signupSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        email: zod_1.z.string().email('Invalid email address'),
        password: validators_1.passwordSchema,
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.googleLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        idToken: zod_1.z.string().min(1, 'Google idToken is required'),
    }),
});
exports.verifyEmailSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, 'Verification token is required'),
    }),
});
exports.resendVerificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
    }),
});
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
    }),
});
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, 'Reset token is required'),
        newPassword: validators_1.passwordSchema,
    }),
});
exports.twoFactorVerifySetupSchema = zod_1.z.object({
    body: zod_1.z.object({
        code: zod_1.z.string().length(6, 'Code must be 6 digits'),
    }),
});
exports.twoFactorLoginVerifySchema = zod_1.z.object({
    body: zod_1.z.object({
        tempToken: zod_1.z.string().min(1, 'tempToken is required'),
        code: zod_1.z.string().min(6, 'Code is required'),
    }),
});
exports.twoFactorDisableSchema = zod_1.z.object({
    body: zod_1.z.object({
        password: zod_1.z.string().min(1, 'Current password is required to disable 2FA'),
    }),
});
