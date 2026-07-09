"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const qrcode_1 = __importDefault(require("qrcode"));
const authenticator_1 = __importDefault(require("otplib/authenticator"));
const google_auth_library_1 = require("google-auth-library");
const auth_repository_1 = require("./auth.repository");
const apiError_1 = require("../../utils/apiError");
const jwt_1 = require("../../utils/jwt");
const env_1 = require("../../config/env");
const constants_1 = require("../../config/constants");
const mail_queue_1 = require("../../jobs/mail.queue");
const googleClient = new google_auth_library_1.OAuth2Client(env_1.env.GOOGLE_CLIENT_ID);
function hashToken(rawToken) {
    return crypto_1.default.createHash('sha256').update(rawToken).digest('hex');
}
function generateRawToken() {
    return crypto_1.default.randomBytes(32).toString('hex');
}
class AuthService {
    constructor() {
        this.repo = new auth_repository_1.AuthRepository();
    }
    toSafeUser(user) {
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
    issueTokens(user) {
        const accessToken = (0, jwt_1.generateAccessToken)({ userId: user.id, email: user.email });
        const refreshToken = (0, jwt_1.generateRefreshToken)({
            userId: user.id,
            tokenVersion: user.tokenVersion,
        });
        return { accessToken, refreshToken };
    }
    async sendVerificationEmail(user) {
        const rawToken = generateRawToken();
        const expires = new Date(Date.now() + constants_1.EMAIL_VERIFICATION_EXPIRY_MS);
        await this.repo.setEmailVerificationToken(user.id, hashToken(rawToken), expires);
        const verifyUrl = `${env_1.env.CLIENT_URL}/verify-email?token=${rawToken}`;
        await (0, mail_queue_1.enqueueVerificationEmail)(user.email, user.name, verifyUrl);
    }
    async signup(input) {
        const existing = await this.repo.findByEmail(input.email);
        if (existing)
            throw apiError_1.ApiError.conflict('An account with this email already exists');
        const hashedPassword = await bcryptjs_1.default.hash(input.password, 12);
        const user = await this.repo.createLocalUser({ ...input, password: hashedPassword });
        await this.sendVerificationEmail(user);
        return { user: this.toSafeUser(user), tokens: this.issueTokens(user) };
    }
    async login(input) {
        const user = await this.repo.findByEmail(input.email, true);
        if (!user || !user.password) {
            // covers: user not found, OR user signed up via Google and has no password
            throw apiError_1.ApiError.unauthorized('Invalid email or password');
        }
        const isValid = await bcryptjs_1.default.compare(input.password, user.password);
        if (!isValid)
            throw apiError_1.ApiError.unauthorized('Invalid email or password');
        if (user.twoFactorEnabled) {
            return { twoFactorRequired: true, tempToken: (0, jwt_1.generateTwoFactorTempToken)(user.id) };
        }
        return { twoFactorRequired: false, user: this.toSafeUser(user), tokens: this.issueTokens(user) };
    }
    /**
     * Frontend uses Google Identity Services to get an ID token, then sends it here.
     * We verify it server-side with Google's library — never trust a client-decoded token.
     */
    async googleLogin(idToken) {
        const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: env_1.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            throw apiError_1.ApiError.unauthorized('Invalid Google token');
        }
        const { sub: googleId, email, name, picture } = payload;
        let user = await this.repo.findByGoogleId(googleId);
        if (!user) {
            // check if an account with this email already exists (signed up locally before)
            const existingByEmail = await this.repo.findByEmail(email);
            if (existingByEmail) {
                user = await this.repo.linkGoogleAccount(existingByEmail.id, googleId, picture);
            }
            else {
                user = await this.repo.createGoogleUser({
                    name: name || email.split('@')[0],
                    email,
                    googleId,
                    avatar: picture,
                });
            }
        }
        if (!user)
            throw apiError_1.ApiError.internal('Failed to create or link Google account');
        if (user.twoFactorEnabled) {
            return { twoFactorRequired: true, tempToken: (0, jwt_1.generateTwoFactorTempToken)(user.id) };
        }
        return { twoFactorRequired: false, user: this.toSafeUser(user), tokens: this.issueTokens(user) };
    }
    async refresh(token) {
        let payload;
        try {
            payload = (0, jwt_1.verifyRefreshToken)(token);
        }
        catch {
            throw apiError_1.ApiError.unauthorized('Invalid or expired refresh token');
        }
        const user = await this.repo.findById(payload.userId);
        if (!user)
            throw apiError_1.ApiError.unauthorized('User no longer exists');
        // if tokenVersion mismatches, refresh token was issued before a logout-all / password change
        if (user.tokenVersion !== payload.tokenVersion) {
            throw apiError_1.ApiError.unauthorized('Refresh token has been revoked');
        }
        return this.issueTokens(user);
    }
    async logout(userId) {
        // bumping tokenVersion invalidates every refresh token issued so far
        await this.repo.incrementTokenVersion(userId);
    }
    // --- Email verification ---
    async verifyEmail(rawToken) {
        const user = await this.repo.findByEmailVerificationHash(hashToken(rawToken));
        if (!user)
            throw apiError_1.ApiError.badRequest('Verification link is invalid or has expired');
        await this.repo.markEmailVerified(user.id);
    }
    async resendVerificationEmail(email) {
        const user = await this.repo.findByEmail(email);
        if (!user || user.isEmailVerified)
            return; // don't leak account existence/state
        await this.sendVerificationEmail(user);
    }
    // --- Password reset (no auth middleware — user isn't logged in) ---
    async forgotPassword(email) {
        const user = await this.repo.findByEmail(email);
        if (!user)
            return; // don't leak whether the email exists
        const rawToken = generateRawToken();
        const expires = new Date(Date.now() + constants_1.PASSWORD_RESET_EXPIRY_MS);
        await this.repo.setPasswordResetToken(user.id, hashToken(rawToken), expires);
        const resetUrl = `${env_1.env.CLIENT_URL}/reset-password?token=${rawToken}`;
        await (0, mail_queue_1.enqueuePasswordResetEmail)(user.email, user.name, resetUrl);
    }
    async resetPassword(rawToken, newPassword) {
        const user = await this.repo.findByPasswordResetHash(hashToken(rawToken));
        if (!user)
            throw apiError_1.ApiError.badRequest('Reset link is invalid or has expired');
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        await this.repo.updatePassword(user.id, hashedPassword);
        await this.repo.clearPasswordResetToken(user.id);
        await this.repo.incrementTokenVersion(user.id); // invalidate old sessions
    }
    // --- Two-factor authentication (TOTP) ---
    async setupTwoFactor(userId, email) {
        const secret = authenticator_1.default.generateSecret();
        await this.repo.setTwoFactorTempSecret(userId, secret);
        const otpauthUrl = authenticator_1.default.keyuri(email, env_1.env.APP_NAME, secret);
        const qrCodeDataUrl = await qrcode_1.default.toDataURL(otpauthUrl);
        return { qrCodeDataUrl, secret };
    }
    async confirmTwoFactor(userId, code) {
        const user = await this.repo.findByIdWithTwoFactor(userId);
        if (!user || !user.twoFactorTempSecret) {
            throw apiError_1.ApiError.badRequest('No 2FA setup in progress. Start setup again.');
        }
        const isValid = authenticator_1.default.verify({ token: code, secret: user.twoFactorTempSecret });
        if (!isValid)
            throw apiError_1.ApiError.unauthorized('Invalid authenticator code');
        const rawBackupCodes = Array.from({ length: constants_1.TWO_FACTOR_BACKUP_CODE_COUNT }, () => crypto_1.default.randomBytes(5).toString('hex').toUpperCase());
        const hashedBackupCodes = rawBackupCodes.map(hashToken);
        await this.repo.enableTwoFactor(userId, user.twoFactorTempSecret, hashedBackupCodes);
        return { backupCodes: rawBackupCodes };
    }
    async disableTwoFactor(userId, password) {
        const user = await this.repo.findByIdWithPassword(userId);
        if (!user || !user.password) {
            throw apiError_1.ApiError.badRequest('Password-based verification unavailable for this account');
        }
        const isValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isValid)
            throw apiError_1.ApiError.unauthorized('Incorrect password');
        await this.repo.disableTwoFactor(userId);
    }
    async verifyTwoFactorLogin(tempToken, code) {
        let payload;
        try {
            payload = (0, jwt_1.verifyTwoFactorTempToken)(tempToken);
        }
        catch {
            throw apiError_1.ApiError.unauthorized('2FA session expired, please log in again');
        }
        const user = await this.repo.findByIdWithTwoFactor(payload.userId);
        if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
            throw apiError_1.ApiError.unauthorized('2FA is not enabled for this account');
        }
        const isValidTotp = authenticator_1.default.verify({ token: code, secret: user.twoFactorSecret });
        if (!isValidTotp) {
            // fall back to checking backup codes
            const hashedInput = hashToken(code.toUpperCase());
            const backupCodes = user.twoFactorBackupCodes || [];
            const matchIndex = backupCodes.indexOf(hashedInput);
            if (matchIndex === -1)
                throw apiError_1.ApiError.unauthorized('Invalid authentication code');
            // consume the used backup code so it can't be reused
            const remaining = [...backupCodes];
            remaining.splice(matchIndex, 1);
            await this.repo.consumeBackupCode(user.id, remaining);
        }
        return { user: this.toSafeUser(user), tokens: this.issueTokens(user) };
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map