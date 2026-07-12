import { Schema, model, Document } from 'mongoose';
import { AuthProvider } from '../../config/constants';

export interface IUserSettings {
  defaultCameraOn: boolean;
  defaultMicOn: boolean;
  emailNotifications: boolean;
  language: string;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; 
  avatar?: string;
  avatarPublicId?: string; 
  provider: AuthProvider;
  googleId?: string;
  isEmailVerified: boolean;
  tokenVersion: number; 
  settings: IUserSettings;

  
  emailVerificationTokenHash?: string;
  emailVerificationExpires?: Date;

 
  passwordResetTokenHash?: string;
  passwordResetExpires?: Date;

 
  twoFactorEnabled: boolean;
  twoFactorSecret?: string; 
  twoFactorTempSecret?: string; 
  twoFactorBackupCodes?: string[]; 

  createdAt: Date;
  updatedAt: Date;
}

const settingsSchema = new Schema<IUserSettings>(
  {
    defaultCameraOn: { type: Boolean, default: true },
    defaultMicOn: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    language: { type: String, default: 'en' },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    avatar: { type: String },
    avatarPublicId: { type: String },
    provider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
    },
    googleId: { type: String, index: true, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
    settings: { type: settingsSchema, default: () => ({}) },

    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorTempSecret: { type: String, select: false },
    twoFactorBackupCodes: { type: [String], select: false, default: undefined },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
