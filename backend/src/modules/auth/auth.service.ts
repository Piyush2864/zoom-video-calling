import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { AuthRepository } from './auth.repository';
import { ApiError } from '../../utils/apiError';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { env } from '../../config/env';
import { AuthProvider } from '../../config/constants';
import { SignupInput, LoginInput, AuthTokens, SafeUser } from './auth.types';
import { IUser } from '../user/user.model';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export class AuthService {
  private repo = new AuthRepository();

  private toSafeUser(user: IUser): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      provider: user.provider,
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

  async signup(input: SignupInput): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const existing = await this.repo.findByEmail(input.email);
    if (existing) throw ApiError.conflict('An account with this email already exists');

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const user = await this.repo.createLocalUser({ ...input, password: hashedPassword });

    return { user: this.toSafeUser(user), tokens: this.issueTokens(user) };
  }

  async login(input: LoginInput): Promise<{ user: SafeUser; tokens: AuthTokens }> {
    const user = await this.repo.findByEmail(input.email, true);
    if (!user || !user.password) {
      // covers: user not found, OR user signed up via Google and has no password
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isValid = await bcrypt.compare(input.password, user.password);
    if (!isValid) throw ApiError.unauthorized('Invalid email or password');

    return { user: this.toSafeUser(user), tokens: this.issueTokens(user) };
  }

  /**
   * Frontend uses Google Identity Services to get an ID token, then sends it here.
   * We verify it server-side with Google's library — never trust a client-decoded token.
   */
  async googleLogin(idToken: string): Promise<{ user: SafeUser; tokens: AuthTokens }> {
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
      // check if an account with this email already exists (signed up locally before)
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

    return { user: this.toSafeUser(user), tokens: this.issueTokens(user) };
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

    // if tokenVersion mismatches, refresh token was issued before a logout-all / password change
    if (user.tokenVersion !== payload.tokenVersion) {
      throw ApiError.unauthorized('Refresh token has been revoked');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    // bumping tokenVersion invalidates every refresh token issued so far
    await this.repo.incrementTokenVersion(userId);
  }

  async forgotPassword(email: string): Promise<{ resetToken: string } | null> {
    const user = await this.repo.findByEmail(email);
    if (!user) return null; // don't leak whether the email exists

    const resetToken = crypto.randomBytes(32).toString('hex');
    // TODO: hash + store resetToken with expiry (e.g. separate PasswordReset collection or
    // fields on User), then email the raw token to the user via a mail queue job.
    return { resetToken };
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.repo.updatePassword(userId, hashedPassword);
    await this.repo.incrementTokenVersion(userId); // invalidate old sessions
  }
}
