import { User } from '../user/user.model';
import { AuthProvider } from '../../config/constants';

export class AuthRepository {
  findByEmail(email: string, withPassword = false) {
    const query = User.findOne({ email: email.toLowerCase() });
    if (withPassword) query.select('+password');
    return query.exec();
  }

  findByGoogleId(googleId: string) {
    return User.findOne({ googleId }).exec();
  }

  findById(id: string) {
    return User.findById(id).exec();
  }

  createLocalUser(data: { name: string; email: string; password: string }) {
    return User.create({
      ...data,
      email: data.email.toLowerCase(),
      provider: AuthProvider.LOCAL,
    });
  }

  createGoogleUser(data: { name: string; email: string; googleId: string; avatar?: string }) {
    return User.create({
      ...data,
      email: data.email.toLowerCase(),
      provider: AuthProvider.GOOGLE,
      isEmailVerified: true,
    });
  }

  linkGoogleAccount(userId: string, googleId: string, avatar?: string) {
    return User.findByIdAndUpdate(
      userId,
      { googleId, ...(avatar ? { avatar } : {}) },
      { new: true }
    ).exec();
  }

  incrementTokenVersion(userId: string) {
    return User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { new: true }).exec();
  }

  updatePassword(userId: string, hashedPassword: string) {
    return User.findByIdAndUpdate(userId, { password: hashedPassword }).exec();
  }
}
