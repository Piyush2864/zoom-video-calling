import { Schema, model, Document } from 'mongoose';
import { AuthProvider } from '../../config/constants';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; 
  avatar?: string;
  provider: AuthProvider;
  googleId?: string;
  isEmailVerified: boolean;
  tokenVersion: number; 
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    avatar: { type: String },
    provider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
    },
    googleId: { type: String, index: true, sparse: true },
    isEmailVerified: { type: Boolean, default: false },
    tokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', userSchema);
