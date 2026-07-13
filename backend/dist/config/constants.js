"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TWO_FACTOR_BACKUP_CODE_COUNT = exports.PASSWORD_RESET_EXPIRY_MS = exports.EMAIL_VERIFICATION_EXPIRY_MS = exports.RecurrenceFrequency = exports.ParticipantStatus = exports.MeetingStatus = exports.MeetingType = exports.MeetingRole = exports.AuthProvider = exports.refreshCookieOptions = exports.REFRESH_COOKIE_NAME = void 0;
const env_1 = require("./env");
exports.REFRESH_COOKIE_NAME = 'refreshToken';
exports.refreshCookieOptions = {
    httpOnly: true,
    secure: env_1.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: env_1.env.COOKIE_DOMAIN,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
};
var AuthProvider;
(function (AuthProvider) {
    AuthProvider["LOCAL"] = "local";
    AuthProvider["GOOGLE"] = "google";
})(AuthProvider || (exports.AuthProvider = AuthProvider = {}));
var MeetingRole;
(function (MeetingRole) {
    MeetingRole["HOST"] = "host";
    MeetingRole["CO_HOST"] = "co-host";
    MeetingRole["PARTICIPANT"] = "participant";
})(MeetingRole || (exports.MeetingRole = MeetingRole = {}));
var MeetingType;
(function (MeetingType) {
    MeetingType["INSTANT"] = "instant";
    MeetingType["SCHEDULED"] = "scheduled";
    MeetingType["RECURRING"] = "recurring";
    MeetingType["PERSONAL"] = "personal";
})(MeetingType || (exports.MeetingType = MeetingType = {}));
var MeetingStatus;
(function (MeetingStatus) {
    MeetingStatus["SCHEDULED"] = "scheduled";
    MeetingStatus["ONGOING"] = "ongoing";
    MeetingStatus["ENDED"] = "ended";
    MeetingStatus["CANCELLED"] = "cancelled";
})(MeetingStatus || (exports.MeetingStatus = MeetingStatus = {}));
var ParticipantStatus;
(function (ParticipantStatus) {
    ParticipantStatus["WAITING"] = "waiting";
    ParticipantStatus["ADMITTED"] = "admitted";
    ParticipantStatus["DENIED"] = "denied";
    ParticipantStatus["LEFT"] = "left";
    ParticipantStatus["REMOVED"] = "removed";
})(ParticipantStatus || (exports.ParticipantStatus = ParticipantStatus = {}));
var RecurrenceFrequency;
(function (RecurrenceFrequency) {
    RecurrenceFrequency["DAILY"] = "daily";
    RecurrenceFrequency["WEEKLY"] = "weekly";
    RecurrenceFrequency["MONTHLY"] = "monthly";
})(RecurrenceFrequency || (exports.RecurrenceFrequency = RecurrenceFrequency = {}));
exports.EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;
exports.PASSWORD_RESET_EXPIRY_MS = 15 * 60 * 1000;
exports.TWO_FACTOR_BACKUP_CODE_COUNT = 8;
