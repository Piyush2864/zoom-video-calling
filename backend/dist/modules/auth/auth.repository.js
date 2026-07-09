"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const user_model_1 = require("../user/user.model");
const constants_1 = require("../../config/constants");
class AuthRepository {
    findByEmail(email, withPassword = false) {
        const query = user_model_1.User.findOne({ email: email.toLowerCase() });
        if (withPassword)
            query.select('+password');
        return query.exec();
    }
    findByGoogleId(googleId) {
        return user_model_1.User.findOne({ googleId }).exec();
    }
    findById(id) {
        return user_model_1.User.findById(id).exec();
    }
    findByIdWithPassword(id) {
        return user_model_1.User.findById(id).select('+password').exec();
    }
    findByIdWithTwoFactor(id) {
        return user_model_1.User.findById(id)
            .select('+twoFactorSecret +twoFactorTempSecret +twoFactorBackupCodes')
            .exec();
    }
    createLocalUser(data) {
        return user_model_1.User.create({
            ...data,
            email: data.email.toLowerCase(),
            provider: constants_1.AuthProvider.LOCAL,
        });
    }
    createGoogleUser(data) {
        return user_model_1.User.create({
            ...data,
            email: data.email.toLowerCase(),
            provider: constants_1.AuthProvider.GOOGLE,
            isEmailVerified: true,
        });
    }
    linkGoogleAccount(userId, googleId, avatar) {
        return user_model_1.User.findByIdAndUpdate(userId, { googleId, ...(avatar ? { avatar } : {}) }, { new: true }).exec();
    }
    incrementTokenVersion(userId) {
        return user_model_1.User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { new: true }).exec();
    }
    updatePassword(userId, hashedPassword) {
        return user_model_1.User.findByIdAndUpdate(userId, { password: hashedPassword }).exec();
    }
    setEmailVerificationToken(userId, tokenHash, expires) {
        return user_model_1.User.findByIdAndUpdate(userId, {
            emailVerificationTokenHash: tokenHash,
            emailVerificationExpires: expires,
        }).exec();
    }
    findByEmailVerificationHash(tokenHash) {
        return user_model_1.User.findOne({
            emailVerificationTokenHash: tokenHash,
            emailVerificationExpires: { $gt: new Date() },
        })
            .select('+emailVerificationTokenHash +emailVerificationExpires')
            .exec();
    }
    markEmailVerified(userId) {
        return user_model_1.User.findByIdAndUpdate(userId, {
            isEmailVerified: true,
            $unset: { emailVerificationTokenHash: '', emailVerificationExpires: '' },
        }).exec();
    }
    setPasswordResetToken(userId, tokenHash, expires) {
        return user_model_1.User.findByIdAndUpdate(userId, {
            passwordResetTokenHash: tokenHash,
            passwordResetExpires: expires,
        }).exec();
    }
    findByPasswordResetHash(tokenHash) {
        return user_model_1.User.findOne({
            passwordResetTokenHash: tokenHash,
            passwordResetExpires: { $gt: new Date() },
        })
            .select('+passwordResetTokenHash +passwordResetExpires')
            .exec();
    }
    clearPasswordResetToken(userId) {
        return user_model_1.User.findByIdAndUpdate(userId, {
            $unset: { passwordResetTokenHash: '', passwordResetExpires: '' },
        }).exec();
    }
    setTwoFactorTempSecret(userId, secret) {
        return user_model_1.User.findByIdAndUpdate(userId, { twoFactorTempSecret: secret }).exec();
    }
    enableTwoFactor(userId, secret, hashedBackupCodes) {
        return user_model_1.User.findByIdAndUpdate(userId, {
            twoFactorEnabled: true,
            twoFactorSecret: secret,
            twoFactorBackupCodes: hashedBackupCodes,
            $unset: { twoFactorTempSecret: '' },
        }).exec();
    }
    disableTwoFactor(userId) {
        return user_model_1.User.findByIdAndUpdate(userId, {
            twoFactorEnabled: false,
            $unset: { twoFactorSecret: '', twoFactorTempSecret: '', twoFactorBackupCodes: '' },
        }).exec();
    }
    consumeBackupCode(userId, remainingHashedCodes) {
        return user_model_1.User.findByIdAndUpdate(userId, {
            twoFactorBackupCodes: remainingHashedCodes,
        }).exec();
    }
}
exports.AuthRepository = AuthRepository;
//# sourceMappingURL=auth.repository.js.map