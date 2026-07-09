import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion: number;
}

export interface TwoFactorTempPayload {
  userId: string;
  purpose: '2fa-login';
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}


export function generateTwoFactorTempToken(userId: string): string {
  const payload: TwoFactorTempPayload = { userId, purpose: '2fa-login' };
  const options: SignOptions = {
    expiresIn: env.JWT_TWO_FACTOR_EXPIRY as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, env.JWT_TWO_FACTOR_SECRET, options);
}

export function verifyTwoFactorTempToken(token: string): TwoFactorTempPayload {
  const payload = jwt.verify(token, env.JWT_TWO_FACTOR_SECRET) as TwoFactorTempPayload;
  if (payload.purpose !== '2fa-login') {
    throw new Error('Invalid token purpose');
  }
  return payload;
}
