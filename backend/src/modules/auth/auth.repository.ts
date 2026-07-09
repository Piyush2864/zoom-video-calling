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

  findByIdWithPassword(id: string) {
    return User.findById(id).select('+password').exec();
  }

  findByIdWithTwoFactor(id: string) {
    return User.findById(id)
      .select('+twoFactorSecret +twoFactorTempSecret +twoFactorBackupCodes')
      .exec();
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


  setEmailVerificationToken(userId: string, tokenHash: string, expires: Date) {
    return User.findByIdAndUpdate(userId, {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: expires,
    }).exec();
  }

  findByEmailVerificationHash(tokenHash: string) {
    return User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    })
      .select('+emailVerificationTokenHash +emailVerificationExpires')
      .exec();
  }

  markEmailVerified(userId: string) {
    return User.findByIdAndUpdate(userId, {
      isEmailVerified: true,
      $unset: { emailVerificationTokenHash: '', emailVerificationExpires: '' },
    }).exec();
  }


  setPasswordResetToken(userId: string, tokenHash: string, expires: Date) {
    return User.findByIdAndUpdate(userId, {
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: expires,
    }).exec();
  }

  findByPasswordResetHash(tokenHash: string) {
    return User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    })
      .select('+passwordResetTokenHash +passwordResetExpires')
      .exec();
  }

  clearPasswordResetToken(userId: string) {
    return User.findByIdAndUpdate(userId, {
      $unset: { passwordResetTokenHash: '', passwordResetExpires: '' },
    }).exec();
  }


  setTwoFactorTempSecret(userId: string, secret: string) {
    return User.findByIdAndUpdate(userId, { twoFactorTempSecret: secret }).exec();
  }

  enableTwoFactor(userId: string, secret: string, hashedBackupCodes: string[]) {
    return User.findByIdAndUpdate(userId, {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: hashedBackupCodes,
      $unset: { twoFactorTempSecret: '' },
    }).exec();
  }

  disableTwoFactor(userId: string) {
    return User.findByIdAndUpdate(userId, {
      twoFactorEnabled: false,
      $unset: { twoFactorSecret: '', twoFactorTempSecret: '', twoFactorBackupCodes: '' },
    }).exec();
  }

  consumeBackupCode(userId: string, remainingHashedCodes: string[]) {
    return User.findByIdAndUpdate(userId, {
      twoFactorBackupCodes: remainingHashedCodes,
    }).exec();
  }
}
