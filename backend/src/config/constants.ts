import { env } from './env';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  domain: env.COOKIE_DOMAIN,
  maxAge: 7 * 24 * 60 * 60 * 1000, 
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

export enum MeetingType {
  INSTANT = 'instant',
  SCHEDULED = 'scheduled',
  RECURRING = 'recurring',
  PERSONAL = 'personal',
}

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  ONGOING = 'ongoing',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export enum ParticipantStatus {
  WAITING = 'waiting',
  ADMITTED = 'admitted',
  DENIED = 'denied',
  LEFT = 'left',
  REMOVED = 'removed',
}

export enum RecurrenceFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export const EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;

export const PASSWORD_RESET_EXPIRY_MS = 15 * 60 * 1000;

export const TWO_FACTOR_BACKUP_CODE_COUNT = 8;
