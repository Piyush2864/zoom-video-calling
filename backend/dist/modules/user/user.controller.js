"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.changePassword = exports.updateSettings = exports.removeAvatar = exports.uploadAvatar = exports.updateProfile = exports.getPublicProfile = exports.getMe = void 0;
const user_service_1 = require("./user.service");
const asyncHandler_1 = require("../../utils/asyncHandler");
const apiResponse_1 = require("../../utils/apiResponse");
const apiError_1 = require("../../utils/apiError");
const constants_1 = require("../../config/constants");
const userService = new user_service_1.UserService();
exports.getMe = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const profile = await userService.getProfile(req.user.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Profile fetched', profile));
});
exports.getPublicProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    const profile = await userService.getPublicProfile(req.params.id);
    res.status(200).json(new apiResponse_1.ApiResponse('User fetched', profile));
});
exports.updateProfile = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const profile = await userService.updateProfile(req.user.userId, req.body);
    res.status(200).json(new apiResponse_1.ApiResponse('Profile updated', profile));
});
exports.uploadAvatar = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    if (!req.file)
        throw apiError_1.ApiError.badRequest('No image file provided');
    const profile = await userService.uploadAvatar(req.user.userId, req.file.buffer, req.file.mimetype);
    res.status(200).json(new apiResponse_1.ApiResponse('Avatar updated', profile));
});
exports.removeAvatar = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const profile = await userService.removeAvatar(req.user.userId);
    res.status(200).json(new apiResponse_1.ApiResponse('Avatar removed', profile));
});
exports.updateSettings = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const profile = await userService.updateSettings(req.user.userId, req.body);
    res.status(200).json(new apiResponse_1.ApiResponse('Settings updated', profile));
});
exports.changePassword = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.user.userId, currentPassword, newPassword);
    res.status(200).json(new apiResponse_1.ApiResponse('Password changed. Please log in again on other devices.'));
});
exports.deleteAccount = (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user)
        throw apiError_1.ApiError.unauthorized();
    await userService.deleteAccount(req.user.userId, req.body.password);
    res.clearCookie(constants_1.REFRESH_COOKIE_NAME, { ...constants_1.refreshCookieOptions, maxAge: undefined });
    res.status(200).json(new apiResponse_1.ApiResponse('Account deleted'));
});
