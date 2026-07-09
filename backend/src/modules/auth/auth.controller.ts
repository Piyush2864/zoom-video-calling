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
  res.status(201).json(
    new ApiResponse('Signup successful. Please check your email to verify your account.', {
      user,
      accessToken: tokens.accessToken,
    })
  );
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.login(req.body);

  if (result.twoFactorRequired) {
    return res
      .status(200)
      .json(new ApiResponse('Two-factor authentication required', {
        twoFactorRequired: true,
        tempToken: result.tempToken,
      }));
  }

  res.cookie(REFRESH_COOKIE_NAME, result.tokens.refreshToken, refreshCookieOptions);
  res.status(200).json(
    new ApiResponse('Login successful', {
      twoFactorRequired: false,
      user: result.user,
      accessToken: result.tokens.accessToken,
    })
  );
});

export const googleLogin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { idToken } = req.body;
  const result = await authService.googleLogin(idToken);

  if (result.twoFactorRequired) {
    return res
      .status(200)
      .json(new ApiResponse('Two-factor authentication required', {
        twoFactorRequired: true,
        tempToken: result.tempToken,
      }));
  }

  res.cookie(REFRESH_COOKIE_NAME, result.tokens.refreshToken, refreshCookieOptions);
  res.status(200).json(
    new ApiResponse('Google login successful', {
      twoFactorRequired: false,
      user: result.user,
      accessToken: result.tokens.accessToken,
    })
  );
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


export const verifyEmail = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.verifyEmail(req.body.token);
  res.status(200).json(new ApiResponse('Email verified successfully'));
});

export const resendVerification = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.resendVerificationEmail(req.body.email);
  res
    .status(200)
    .json(new ApiResponse('If that account exists and is unverified, a new link has been sent'));
});


export const forgotPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.forgotPassword(req.body.email);
  res
    .status(200)
    .json(new ApiResponse('If that email exists, a password reset link has been sent'));
});

export const resetPassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  res
    .status(200)
    .json(new ApiResponse('Password reset successful. Please log in with your new password.'));
});


export const setupTwoFactor = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await authService.setupTwoFactor(req.user.userId, req.user.email);
  res.status(200).json(new ApiResponse('Scan this QR code with your authenticator app', result));
});

export const confirmTwoFactor = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const result = await authService.confirmTwoFactor(req.user.userId, req.body.code);
  res
    .status(200)
    .json(
      new ApiResponse(
        'Two-factor authentication enabled. Save these backup codes somewhere safe — they will not be shown again.',
        result
      )
    );
});

export const disableTwoFactor = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await authService.disableTwoFactor(req.user.userId, req.body.password);
  res.status(200).json(new ApiResponse('Two-factor authentication disabled'));
});

export const verifyTwoFactorLogin = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { tempToken, code } = req.body;
  const { user, tokens } = await authService.verifyTwoFactorLogin(tempToken, code);
  res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, refreshCookieOptions);
  res.status(200).json(new ApiResponse('Login successful', { user, accessToken: tokens.accessToken }));
});
