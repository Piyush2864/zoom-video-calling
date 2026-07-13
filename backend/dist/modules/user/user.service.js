"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_repository_1 = require("./user.repository");
const apiError_1 = require("../../utils/apiError");
const cloudinary_1 = require("../../config/cloudinary");
const AVATAR_FOLDER = 'zoom-clone/avatars';
class UserService {
    constructor() {
        this.repo = new user_repository_1.UserRepository();
    }
    toSafeProfile(user) {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            provider: user.provider,
            isEmailVerified: user.isEmailVerified,
            twoFactorEnabled: user.twoFactorEnabled,
            settings: {
                defaultCameraOn: user.settings.defaultCameraOn,
                defaultMicOn: user.settings.defaultMicOn,
                emailNotifications: user.settings.emailNotifications,
                language: user.settings.language,
            },
            createdAt: user.createdAt,
        };
    }
    async getProfile(userId) {
        const user = await this.repo.findById(userId);
        if (!user)
            throw apiError_1.ApiError.notFound('User not found');
        return this.toSafeProfile(user);
    }
    async getPublicProfile(userId) {
        const user = await this.repo.findPublicById(userId);
        if (!user)
            throw apiError_1.ApiError.notFound('User not found');
        return { id: user.id, name: user.name, avatar: user.avatar };
    }
    async updateProfile(userId, input) {
        if (input.name === undefined) {
            const user = await this.repo.findById(userId);
            if (!user)
                throw apiError_1.ApiError.notFound('User not found');
            return this.toSafeProfile(user);
        }
        const user = await this.repo.updateName(userId, input.name);
        if (!user)
            throw apiError_1.ApiError.notFound('User not found');
        return this.toSafeProfile(user);
    }
    async uploadAvatar(userId, fileBuffer, mimeType) {
        const existing = await this.repo.findById(userId);
        if (!existing)
            throw apiError_1.ApiError.notFound('User not found');
        const base64 = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
        const result = await cloudinary_1.cloudinary.uploader.upload(base64, {
            folder: AVATAR_FOLDER,
            public_id: userId,
            overwrite: true,
            transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
        });
        if (existing.avatarPublicId && existing.avatarPublicId !== result.public_id) {
            await cloudinary_1.cloudinary.uploader.destroy(existing.avatarPublicId).catch(() => undefined);
        }
        const updated = await this.repo.updateAvatar(userId, result.secure_url, result.public_id);
        if (!updated)
            throw apiError_1.ApiError.notFound('User not found');
        return this.toSafeProfile(updated);
    }
    async removeAvatar(userId) {
        const existing = await this.repo.findById(userId);
        if (!existing)
            throw apiError_1.ApiError.notFound('User not found');
        if (existing.avatarPublicId) {
            await cloudinary_1.cloudinary.uploader.destroy(existing.avatarPublicId).catch(() => undefined);
        }
        const updated = await this.repo.removeAvatar(userId);
        if (!updated)
            throw apiError_1.ApiError.notFound('User not found');
        return this.toSafeProfile(updated);
    }
    async updateSettings(userId, input) {
        const user = await this.repo.updateSettings(userId, input);
        if (!user)
            throw apiError_1.ApiError.notFound('User not found');
        return this.toSafeProfile(user);
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.repo.findByIdWithPassword(userId);
        if (!user || !user.password) {
            throw apiError_1.ApiError.badRequest('This account uses Google sign-in and has no password to change');
        }
        const isValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isValid)
            throw apiError_1.ApiError.unauthorized('Current password is incorrect');
        const hashed = await bcryptjs_1.default.hash(newPassword, 12);
        await this.repo.updatePassword(userId, hashed);
        await this.repo.incrementTokenVersion(userId); // invalidate other sessions
    }
    async deleteAccount(userId, password) {
        const user = await this.repo.findByIdWithPassword(userId);
        if (!user)
            throw apiError_1.ApiError.notFound('User not found');
        if (user.password) {
            if (!password)
                throw apiError_1.ApiError.badRequest('Password confirmation is required');
            const isValid = await bcryptjs_1.default.compare(password, user.password);
            if (!isValid)
                throw apiError_1.ApiError.unauthorized('Incorrect password');
        }
        if (user.avatarPublicId) {
            await cloudinary_1.cloudinary.uploader.destroy(user.avatarPublicId).catch(() => undefined);
        }
        await this.repo.deleteById(userId);
    }
}
exports.UserService = UserService;
