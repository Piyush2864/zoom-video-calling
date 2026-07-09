export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: string;
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
}


export type LoginResult =
  | { twoFactorRequired: false; user: SafeUser; tokens: AuthTokens }
  | { twoFactorRequired: true; tempToken: string };

export interface TwoFactorSetupResult {
  qrCodeDataUrl: string;
  secret: string; 
}

export interface TwoFactorConfirmResult {
  backupCodes: string[]; 
}
