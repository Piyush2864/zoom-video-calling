import { Router } from 'express';
import * as authController from './auth.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware';
import {
  signupSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';

const router = Router();

router.post('/signup', authRateLimiter, validate(signupSchema), authController.signup);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post(
  '/google',
  authRateLimiter,
  validate(googleLoginSchema),
  authController.googleLogin
);
router.post('/refresh', authController.refresh);
router.post('/logout', authMiddleware, authController.logout);
router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  authMiddleware,
  validate(resetPasswordSchema),
  authController.resetPassword
);

export default router;
