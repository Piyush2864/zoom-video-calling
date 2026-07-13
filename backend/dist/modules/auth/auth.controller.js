"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyTwoFactorLogin = exports.disableTwoFactor = exports.confirmTwoFactor = exports.setupTwoFactor = exports.resetPassword = exports.forgotPassword = exports.resendVerification = exports.verifyEmail = exports.logout = exports.refresh = exports.googleLogin = exports.login = exports.signup = void 0;
const auth_service_1 = require("./auth.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../utils/apiError");
const constants_1 = require("../../config/constants");
const authService = new auth_service_1.AuthService();
exports.signup = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { user, tokens } = await authService.signup(req.body);
    res.cookie(constants_1.REFRESH_COOKIE_NAME, tokens.refreshToken, constants_1.refreshCookieOptions);
    res.status(201).json(new apiResponse_1.ApiResponse('Signup successful. Please check your email to verify your account.', {
        user,
        accessToken: tokens.accessToken,
    }));
});
exports.login = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const result = await authService.login(req.body);
    if (result.twoFactorRequired) {
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse('Two-factor authentication required', {
            twoFactorRequired: true,
            tempToken: result.tempToken,
        }));
    }
    res.cookie(constants_1.REFRESH_COOKIE_NAME, result.tokens.refreshToken, constants_1.refreshCookieOptions);
    res.status(200).json(new apiResponse_1.ApiResponse('Login successful', {
        twoFactorRequired: false,
        user: result.user,
        accessToken: result.tokens.accessToken,
    }));
});
exports.googleLogin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { idToken } = req.body;
    const result = await authService.googleLogin(idToken);
    if (result.twoFactorRequired) {
        return res
            .status(200)
            .json(new apiResponse_1.ApiResponse('Two-factor authentication required', {
            twoFactorRequired: true,
            tempToken: result.tempToken,
        }));
    }
    res.cookie(constants_1.REFRESH_COOKIE_NAME, result.tokens.refreshToken, constants_1.refreshCookieOptions);
    res.status(200).json(new apiResponse_1.ApiResponse('Google login successful', {
        twoFactorRequired: false,
        user: result.user,
        accessToken: result.tokens.accessToken,
    }));
});
exports.refresh = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const token = req.cookies?.[constants_1.REFRESH_COOKIE_NAME];
    if (!token)
        throw apiError_1.ApiError.unauthorized('Refresh token missing');
    const tokens = await authService.refresh(token);
    res.cookie(constants_1.REFRESH_COOKIE_NAME, tokens.refreshToken, constants_1.refreshCookieOptions);
    res.status(200).json(new apiResponse_1.ApiResponse('Token refreshed', { accessToken: tokens.accessToken }));
});
exports.logout = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (req.user?.userId) {
        await authService.logout(req.user.userId);
    }
    res.clearCookie(constants_1.REFRESH_COOKIE_NAME, { ...constants_1.refreshCookieOptions, maxAge: undefined });
    res.status(200).json(new apiResponse_1.ApiResponse('Logged out successfully'));
});
exports.verifyEmail = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.verifyEmail(req.body.token);
    res.status(200).json(new apiResponse_1.ApiResponse('Email verified successfully'));
});
exports.resendVerification = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.resendVerificationEmail(req.body.email);
    res
        .status(200)
        .json(new apiResponse_1.ApiResponse('If that account exists and is unverified, a new link has been sent'));
});
exports.forgotPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.forgotPassword(req.body.email);
    res
        .status(200)
        .json(new apiResponse_1.ApiResponse('If that email exists, a password reset link has been sent'));
});
exports.resetPassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    res
        .status(200)
        .json(new apiResponse_1.ApiResponse('Password reset successful. Please log in with your new password.'));
});
exports.setupTwoFactor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const result = await authService.setupTwoFactor(req.user.userId, req.user.email);
    res.status(200).json(new apiResponse_1.ApiResponse('Scan this QR code with your authenticator app', result));
});
exports.confirmTwoFactor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const result = await authService.confirmTwoFactor(req.user.userId, req.body.code);
    res
        .status(200)
        .json(new apiResponse_1.ApiResponse('Two-factor authentication enabled. Save these backup codes somewhere safe — they will not be shown again.', result));
});
exports.disableTwoFactor = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    await authService.disableTwoFactor(req.user.userId, req.body.password);
    res.status(200).json(new apiResponse_1.ApiResponse('Two-factor authentication disabled'));
});
exports.verifyTwoFactorLogin = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const { tempToken, code } = req.body;
    const { user, tokens } = await authService.verifyTwoFactorLogin(tempToken, code);
    res.cookie(constants_1.REFRESH_COOKIE_NAME, tokens.refreshToken, constants_1.refreshCookieOptions);
    res.status(200).json(new apiResponse_1.ApiResponse('Login successful', { user, accessToken: tokens.accessToken }));
});
