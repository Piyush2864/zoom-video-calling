"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TWO_FACTOR_BACKUP_CODE_COUNT = exports.PASSWORD_RESET_EXPIRY_MS = exports.EMAIL_VERIFICATION_EXPIRY_MS = exports.MeetingRole = exports.AuthProvider = exports.refreshCookieOptions = exports.REFRESH_COOKIE_NAME = void 0;
const env_1 = require("./env");
exports.REFRESH_COOKIE_NAME = 'refreshToken';
exports.refreshCookieOptions = {
    httpOnly: true,
    secure: env_1.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: env_1.env.COOKIE_DOMAIN,
    maxAge: 7 * 24 * 60 * 60 * 1000,
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
exports.EMAIL_VERIFICATION_EXPIRY_MS = 24 * 60 * 60 * 1000;
exports.PASSWORD_RESET_EXPIRY_MS = 15 * 60 * 1000;
exports.TWO_FACTOR_BACKUP_CODE_COUNT = 8;
//# sourceMappingURL=constants.js.map