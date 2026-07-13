import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware';
import {
  signupSchema,
  loginSchema,
  googleLoginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  twoFactorVerifySetupSchema,
  twoFactorLoginVerifySchema,
  twoFactorDisableSchema,
} from './auth.validation';

const router = Router();

router.post('/signup', authRateLimiter, validate(signupSchema), authController.signup);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/google', authRateLimiter, validate(googleLoginSchema), authController.googleLogin);
router.post('/refresh', authController.refresh);
router.post('/logout', authMiddleware, authController.logout);

router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
router.post(
  '/resend-verification',
  authRateLimiter,
  validate(resendVerificationSchema),
  authController.resendVerification
);

router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

router.post('/2fa/setup', authMiddleware, authController.setupTwoFactor);
router.post(
  '/2fa/confirm',
  authMiddleware,
  validate(twoFactorVerifySetupSchema),
  authController.confirmTwoFactor
);
router.post(
  '/2fa/disable',
  authMiddleware,
  validate(twoFactorDisableSchema),
  authController.disableTwoFactor
);

router.post(
  '/2fa/login-verify',
  authRateLimiter,
  validate(twoFactorLoginVerifySchema),
  authController.verifyTwoFactorLogin
);

export default router;
