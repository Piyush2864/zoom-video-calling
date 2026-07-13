import bcrypt from 'bcryptjs';
import { UserRepository } from './user.repository';
import { ApiError } from '../../utils/apiError';
import { cloudinary } from '../../config/cloudinary';
import { IUser } from './user.model';
import {
  SafeUserProfile,
  PublicUserProfile,
  UpdateProfileInput,
  UpdateSettingsInput,
} from './user.types';

const AVATAR_FOLDER = 'zoom-clone/avatars';

export class UserService {
  private repo = new UserRepository();

  private toSafeProfile(user: IUser): SafeUserProfile {
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

  async getProfile(userId: string): Promise<SafeUserProfile> {
    const user = await this.repo.findById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return this.toSafeProfile(user);
  }

  async getPublicProfile(userId: string): Promise<PublicUserProfile> {
    const user = await this.repo.findPublicById(userId);
    if (!user) throw ApiError.notFound('User not found');
    return { id: user.id, name: user.name, avatar: user.avatar };
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<SafeUserProfile> {
    if (input.name === undefined) {
      const user = await this.repo.findById(userId);
      if (!user) throw ApiError.notFound('User not found');
      return this.toSafeProfile(user);
    }
    const user = await this.repo.updateName(userId, input.name);
    if (!user) throw ApiError.notFound('User not found');
    return this.toSafeProfile(user);
  }

  async uploadAvatar(userId: string, fileBuffer: Buffer, mimeType: string): Promise<SafeUserProfile> {
    const existing = await this.repo.findById(userId);
    if (!existing) throw ApiError.notFound('User not found');

    const base64 = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(base64, {
      folder: AVATAR_FOLDER,
      public_id: userId,
      overwrite: true,
      transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
    });

    if (existing.avatarPublicId && existing.avatarPublicId !== result.public_id) {
      await cloudinary.uploader.destroy(existing.avatarPublicId).catch(() => undefined);
    }

    const updated = await this.repo.updateAvatar(userId, result.secure_url, result.public_id);
    if (!updated) throw ApiError.notFound('User not found');
    return this.toSafeProfile(updated);
  }

  async removeAvatar(userId: string): Promise<SafeUserProfile> {
    const existing = await this.repo.findById(userId);
    if (!existing) throw ApiError.notFound('User not found');

    if (existing.avatarPublicId) {
      await cloudinary.uploader.destroy(existing.avatarPublicId).catch(() => undefined);
    }

    const updated = await this.repo.removeAvatar(userId);
    if (!updated) throw ApiError.notFound('User not found');
    return this.toSafeProfile(updated);
  }

  async updateSettings(userId: string, input: UpdateSettingsInput): Promise<SafeUserProfile> {
    const user = await this.repo.updateSettings(userId, input);
    if (!user) throw ApiError.notFound('User not found');
    return this.toSafeProfile(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repo.findByIdWithPassword(userId);
    if (!user || !user.password) {
      throw ApiError.badRequest(
        'This account uses Google sign-in and has no password to change'
      );
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw ApiError.unauthorized('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.repo.updatePassword(userId, hashed);
    await this.repo.incrementTokenVersion(userId);
  }

  async deleteAccount(userId: string, password?: string): Promise<void> {
    const user = await this.repo.findByIdWithPassword(userId);
    if (!user) throw ApiError.notFound('User not found');

    if (user.password) {
      if (!password) throw ApiError.badRequest('Password confirmation is required');
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) throw ApiError.unauthorized('Incorrect password');
    }
    

    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId).catch(() => undefined);
    }

    await this.repo.deleteById(userId);
    
  }
}
