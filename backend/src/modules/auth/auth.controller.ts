import { Response } from 'express';
import { AuthService } from './auth.service';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/apiResponse';
import { ApiError } from '../../utils/apiError';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from '../../config/constants';
import { AuthRequest } from '../../middlewares/auth.middleware';

const authService = new AuthService();

export const signup = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { user, tokens } = await authService.signup(req.body);
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);
  res
    .status(201)
    .json(new ApiResponse('Signup successful', { user, accessToken: tokens.accessToken }));
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { user, tokens } = await authService.login(req.body);
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);
  res.status(200).json(new ApiResponse('Login successful', { user, accessToken: tokens.accessToken }));
});

export const googleLogin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { idToken } = req.body;
  const { user, tokens } = await authService.googleLogin(idToken);
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);
  res
    .status(200)
    .json(new ApiResponse('Google login successful', { user, accessToken: tokens.accessToken }));
});

export const refresh = asyncHandler(async (req: AuthRequest, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) throw ApiError.unauthorized('Refresh token missing');

  const tokens = await authService.refresh(token);
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);
  res.status(200).json(new ApiResponse('Token refreshed', { accessToken: tokens.accessToken }));
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (req.user?.userId) {
    await authService.logout(req.user.userId);
  }
  res.clearCookie(REFRESH_COOKIE_NAME, { ...refreshCookieOptions, maxAge: undefined });
  res.status(200).json(new ApiResponse('Logged out successfully'));
});

export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.forgotPassword(req.body.email);
  // always return a generic message regardless of whether the email exists
  res
    .status(200)
    .json(new ApiResponse('If that email exists, a password reset link has been sent'));
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user?.userId) throw ApiError.unauthorized();
  await authService.resetPassword(req.user.userId, req.body.newPassword);
  res.status(200).json(new ApiResponse('Password reset successful'));
});
