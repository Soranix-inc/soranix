/**
 * Authentication Types
 * Shared types used across auth service
 */

// Token payloads
export interface AccessTokenPayload {
  userId: string;
  email: string;
  sessionId: string;
  deviceId: string;
  roles: string[];
  type: 'access';
}

export interface RefreshTokenPayload {
  userId: string;
  sessionId: string;
  deviceId: string;
  tokenFamily: string;
  type: 'refresh';
}

// API request types
export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo: DeviceInfo;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

// Device information
export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  userAgent: string;
  ipAddress: string;
}

// Location information
export interface LocationInfo {
  ipAddress: string;
  country?: string;
  city?: string;
}

// Auth response types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

export interface AuthResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
  };
  tokens: AuthTokens;
  session: {
    sessionId: string;
    expiresAt: Date;
  };
}

export interface LoginResult {
  success: boolean;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
  };
  requiresMfa?: boolean;
  mfaMethod?: 'totp' | 'sms' | 'email';
  sessionId?: string;
  error?: string;
}

// Session types
export interface SessionData {
  sessionId: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  browser?: string;
  os?: string;
  ipAddress: string;
  country?: string;
  city?: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

// Security types
export interface SecurityConfig {
  // Token expiry
  accessTokenExpiry: string; // e.g., '15m'
  refreshTokenExpiry: string; // e.g., '7d'

  // Session
  sessionTimeout: number; // milliseconds
  maxActiveSessions: number;

  // Password
  passwordMinLength: number;
  passwordRequirements: {
    uppercase: boolean;
    lowercase: boolean;
    numbers: boolean;
    special: boolean;
  };

  // Account lockout
  maxFailedAttempts: number;
  lockoutDuration: number; // milliseconds

  // Rate limiting
  rateLimit: {
    login: { max: number; windowMs: number };
    signup: { max: number; windowMs: number };
    forgotPassword: { max: number; windowMs: number };
  };
}

// Password validation result
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
}

// MFA types
export interface MfaSetupResponse {
  secret: string;
  qrCode: string; // Base64 QR code image
  backupCodes: string[];
}

export interface MfaVerifyRequest {
  code: string;
  backupCode?: boolean;
}

