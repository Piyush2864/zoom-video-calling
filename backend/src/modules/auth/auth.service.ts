import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { authenticator } from 'otplib';
import { OAuth2Client } from 'google-auth-library';
import { AuthRepository } from './auth.repository';
import { ApiError } from '../../utils/apiError';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTwoFactorTempToken,
  verifyTwoFactorTempToken,
} from '../../utils/jwt';
import { env } from '../../config/env';
import {
  EMAIL_VERIFICATION_EXPIRY_MS,
  PASSWORD_RESET_EXPIRY_MS,
  TWO_FACTOR_BACKUP_CODE_COUNT,
} from '../../config/constants';
import { enqueueVerificationEmail, enqueuePasswordResetEmail } from '../../jobs/mail.queue';
import {
  SignupInput,
  LoginInput,
  AuthTokens,
  SafeUser,
  LoginResult,
  TwoFactorSetupResult,
  TwoFactorConfirmResult,
} from './auth.types';
import { IUser } from '../user/user.model';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function generateRawToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export class AuthService {
  private repo = new AuthRepository();

  private toSafeUser(user: IUser): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
      isEmailVerified: user.isEmailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }

  private issueTokens(user: IUser): AuthTokens {
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenVersion: user.tokenVersion,
    });
    return { accessToken, refreshToken };
  }

  private async sendVerificationEmail(user: IUser): Promise<void> {
    const rawToken = generateRawToken();
    const expires = new Date(Date.now() + EMAIL_VERIFICATION_EXPIRY_MS);
    await this.repo.setEmailVerificationToken(user.id, hashToken(rawToken), expires);

    const verifyUrl = `${env.CLIENT_URL}/verify-email?token=${rawToken}`;
    await enqueueVerificationEmail(user.email, user.name, verifyUrl);
  }

  async signup(input: SignupInput): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) throw ApiError.conflict('An account with this email already exists');

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const user = await this.repo.createLocalUser({ ...input, password: hashedPassword });

    await this.sendVerificationEmail(user);

    return { user: this.toSafeUser(user), tokens: this.issueTokens(user) };
  }

  async login(input: LoginInput): Promise<LoginResult> {
    const user = await this.repo.findByEmail(input.email, true);
    if (!user || !user.password) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isValid = await bcrypt.compare(input.password, user.password);
    if (!isValid) throw ApiError.unauthorized('Invalid email or password');

    if (user.twoFactorEnabled) {
      return { twoFactorRequired: true, tempToken: generateTwoFactorTempToken(user.id) };
    }

    return { twoFactorRequired: false, user: this.toSafeUser(user), tokens: this.issueTokens(user) };
  }

  async googleLogin(idToken: string): Promise<LoginResult> {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw ApiError.unauthorized('Invalid Google token');
    }

    const { sub: googleId, email, name, picture } = payload;

    let user = await this.repo.findByGoogleId(googleId);

    if (!user) {
      const existingByEmail = await this.repo.findByEmail(email);
      if (existingByEmail) {
        user = await this.repo.linkGoogleAccount(existingByEmail.id, googleId, picture);
      } else {
        user = await this.repo.createGoogleUser({
          name: name || email.split('@')[0],
          email,
          googleId,
          avatar: picture,
        });
      }
    }

    if (!user) throw ApiError.internal('Failed to create or link Google account');

    if (user.twoFactorEnabled) {
      return { twoFactorRequired: true, tempToken: generateTwoFactorTempToken(user.id) };
    }

    return { twoFactorRequired: false, user: this.toSafeUser(user), tokens: this.issueTokens(user) };
  }

  async refresh(token: string): Promise<AuthTokens> {
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const user = await this.repo.findById(payload.userId);
    if (!user) throw ApiError.unauthorized('User no longer exists');

    if (user.tokenVersion !== payload.tokenVersion) {
      throw ApiError.unauthorized('Refresh token has been revoked');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.repo.incrementTokenVersion(userId);
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const user = await this.repo.findByEmailVerificationHash(hashToken(rawToken));
    if (!user) throw ApiError.badRequest('Verification link is invalid or has expired');
    await this.repo.markEmailVerified(user.id);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.repo.findByEmail(email);
    if (!user || user.isEmailVerified) return;
    await this.sendVerificationEmail(user);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.repo.findByEmail(email);
    if (!user) return;

    const rawToken = generateRawToken();
    const expires = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MS);
    await this.repo.setPasswordResetToken(user.id, hashToken(rawToken), expires);

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}`;
    await enqueuePasswordResetEmail(user.email, user.name, resetUrl);
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    const user = await this.repo.findByPasswordResetHash(hashToken(rawToken));
    if (!user) throw ApiError.badRequest('Reset link is invalid or has expired');

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.repo.updatePassword(user.id, hashedPassword);
    await this.repo.clearPasswordResetToken(user.id);
    await this.repo.incrementTokenVersion(user.id);
  }

  async setupTwoFactor(userId: string, email: string): Promise<TwoFactorSetupResult> {
    const secret = authenticator.generateSecret();
    await this.repo.setTwoFactorTempSecret(userId, secret);

    const otpauthUrl = authenticator.keyuri(email, env.APP_NAME, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return { qrCodeDataUrl, secret };
  }

  async confirmTwoFactor(userId: string, code: string): Promise<TwoFactorConfirmResult> {
    const user = await this.repo.findByIdWithTwoFactor(userId);
    if (!user || !user.twoFactorTempSecret) {
      throw ApiError.badRequest('No 2FA setup in progress. Start setup again.');
    }

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorTempSecret });
    if (!isValid) throw ApiError.unauthorized('Invalid authenticator code');

    const rawBackupCodes = Array.from({ length: TWO_FACTOR_BACKUP_CODE_COUNT }, () =>
      crypto.randomBytes(5).toString('hex').toUpperCase()
    );
    const hashedBackupCodes = rawBackupCodes.map(hashToken);

    await this.repo.enableTwoFactor(userId, user.twoFactorTempSecret, hashedBackupCodes);

    return { backupCodes: rawBackupCodes };
  }

  async disableTwoFactor(userId: string, password: string): Promise<void> {
    const user = await this.repo.findByIdWithPassword(userId);
    if (!user || !user.password) {
      throw ApiError.badRequest('Password-based verification unavailable for this account');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw ApiError.unauthorized('Incorrect password');

    await this.repo.disableTwoFactor(userId);
  }

  async verifyTwoFactorLogin(
    tempToken: string,
    code: string
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    let payload;
    try {
      payload = verifyTwoFactorTempToken(tempToken);
    } catch {
      throw ApiError.unauthorized('2FA session expired, please log in again');
    }

    const user = await this.repo.findByIdWithTwoFactor(payload.userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw ApiError.unauthorized('2FA is not enabled for this account');
    }

    const isValidTotp = authenticator.verify({ token: code, secret: user.twoFactorSecret });

    if (!isValidTotp) {
      const hashedInput = hashToken(code.toUpperCase());
      const backupCodes = user.twoFactorBackupCodes || [];
      const matchIndex = backupCodes.indexOf(hashedInput);

      if (matchIndex === -1) throw ApiError.unauthorized('Invalid authentication code');

      const remaining = [...backupCodes];
      remaining.splice(matchIndex, 1);
      await this.repo.consumeBackupCode(user.id, remaining);
    }

    return { user: this.toSafeUser(user), tokens: this.issueTokens(user) };
  }
}
