import { Response } from 'express';
import { UserService } from './user.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from '../../config/constants';

const userService = new UserService();

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const profile = await userService.getProfile(req.user.userId);
  res.status(200).json(new ApiResponse('Profile fetched', profile));
});

export const getPublicProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const profile = await userService.getPublicProfile(req.params.id);
  res.status(200).json(new ApiResponse('User fetched', profile));
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const profile = await userService.updateProfile(req.user.userId, req.body);
  res.status(200).json(new ApiResponse('Profile updated', profile));
});

export const uploadAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!req.file) throw ApiError.badRequest('No image file provided');

  const profile = await userService.uploadAvatar(req.user.userId, req.file.buffer, req.file.mimetype);
  res.status(200).json(new ApiResponse('Avatar updated', profile));
});

export const removeAvatar = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const profile = await userService.removeAvatar(req.user.userId);
  res.status(200).json(new ApiResponse('Avatar removed', profile));
});

export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const profile = await userService.updateSettings(req.user.userId, req.body);
  res.status(200).json(new ApiResponse('Settings updated', profile));
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const { currentPassword, newPassword } = req.body;
  await userService.changePassword(req.user.userId, currentPassword, newPassword);
  res.status(200).json(new ApiResponse('Password changed. Please log in again on other devices.'));
});

export const deleteAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await userService.deleteAccount(req.user.userId, req.body.password);
  res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: undefined });
  res.status(200).json(new ApiResponse('Account deleted'));
});
