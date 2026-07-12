export interface SafeUserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  settings: {
    defaultCameraOn: boolean;
    defaultMicOn: boolean;
    emailNotifications: boolean;
    language: string;
  };
  createdAt: Date;
}

export interface PublicUserProfile {
  id: string;
  name: string;
  avatar?: string;
}

export interface UpdateProfileInput {
  name?: string;
}

export interface UpdateSettingsInput {
  defaultCameraOn?: boolean;
  defaultMicOn?: boolean;
  emailNotifications?: boolean;
  language?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}
