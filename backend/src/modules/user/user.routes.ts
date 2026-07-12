import { Router } from 'express';
import * as userController from './user.controller';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { uploadAvatar } from '../../middlewares/upload.middleware';
import {
  updateProfileSchema,
  updateSettingsSchema,
  changePasswordSchema,
  deleteAccountSchema,
} from './user.validation';

const router = Router();

router.use(authMiddleware); 

router.get('/me', userController.getMe);
router.patch('/me', validate(updateProfileSchema), userController.updateProfile);
router.patch('/me/settings', validate(updateSettingsSchema), userController.updateSettings);
router.patch('/me/password', validate(changePasswordSchema), userController.changePassword);
router.delete('/me', validate(deleteAccountSchema), userController.deleteAccount);

router.post('/me/avatar', uploadAvatar, userController.uploadAvatar);
router.delete('/me/avatar', userController.removeAvatar);

router.get('/:id', userController.getPublicProfile);

export default router;
