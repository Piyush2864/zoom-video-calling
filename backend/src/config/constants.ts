import { env } from './env';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  domain: env.COOKIE_DOMAIN,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

export enum MeetingRole {
  HOST = 'host',
  CO_HOST = 'co-host',
  PARTICIPANT = 'participant',
}
