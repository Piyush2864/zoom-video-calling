 import { User } from './user.model';
import { UpdateSettingsInput } from './user.types';

export class UserRepository {
  findById(id: string) {
    return User.findById(id).exec();
  }

  findByIdWithPassword(id: string) {
    return User.findById(id).select('+password').exec();
  }

  findPublicById(id: string) {
    return User.findById(id).select('name avatar').exec();
  }

  updateName(id: string, name: string) {
    return User.findByIdAndUpdate(id, { name }, { new: true }).exec();
  }

  updateAvatar(id: string, avatarUrl: string, avatarPublicId: string) {
    return User.findByIdAndUpdate(id, { avatar: avatarUrl, avatarPublicId }, { new: true }).exec();
  }

  removeAvatar(id: string) {
    return User.findByIdAndUpdate(
      id,
      { $unset: { avatar: '', avatarPublicId: '' } },
      { new: true }
    ).exec();
  }

  updateSettings(id: string, settings: UpdateSettingsInput) {
    const update: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(settings)) {
      if (value !== undefined) update[`settings.${key}`] = value;
    }
    return User.findByIdAndUpdate(id, { $set: update }, { new: true }).exec();
  }

  updatePassword(id: string, hashedPassword: string) {
    return User.findByIdAndUpdate(id, { password: hashedPassword }).exec();
  }

  incrementTokenVersion(id: string) {
    return User.findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } }).exec();
  }

  deleteById(id: string) {
    return User.findByIdAndDelete(id).exec();
  }
}
