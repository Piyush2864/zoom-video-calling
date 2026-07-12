import { z } from 'zod';
import { passwordSchema } from '../../utils/validators';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  }),
});

export const updateSettingsSchema = z.object({
  body: z.object({
    defaultCameraOn: z.boolean().optional(),
    defaultMicOn: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    language: z.string().min(2).max(10).optional(),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
  }),
});

export const deleteAccountSchema = z.object({
  body: z.object({
    password: z.string().min(1).optional(), 
  }),
});
