import { SecurityConfig } from '../types/auth-types.js';

/**
 * Security Configuration
 * Centralized security settings for the auth service
 */

export const securityConfig: SecurityConfig = {
  // Token expiry
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m', // 15 minutes
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d', // 7 days

  // Session
  sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '1800000'), // 30 minutes in ms
  maxActiveSessions: parseInt(process.env.MAX_ACTIVE_SESSIONS || '3'), // Max 3 sessions

  // Password requirements
  passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '12'),
  passwordRequirements: {
    uppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',
    lowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false',
    numbers: process.env.PASSWORD_REQUIRE_NUMBERS !== 'false',
    special: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',
  },

  // Account lockout
  maxFailedAttempts: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5'), // 5 attempts
  lockoutDuration: parseInt(process.env.LOCKOUT_DURATION || '1800000'), // 30 minutes in ms

  // Rate limiting
  rateLimit: {
    login: {
      max: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '5'),
      windowMs: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW || '60000'), // 1 minute
    },
    signup: {
      max: parseInt(process.env.RATE_LIMIT_SIGNUP_MAX || '3'),
      windowMs: parseInt(process.env.RATE_LIMIT_SIGNUP_WINDOW || '3600000'), // 1 hour
    },
    forgotPassword: {
      max: parseInt(process.env.RATE_LIMIT_FORGOT_MAX || '3'),
      windowMs: parseInt(process.env.RATE_LIMIT_FORGOT_WINDOW || '3600000'), // 1 hour
    },
  },
};

// JWT configuration
export const jwtConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'your-access-token-secret-change-this',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-change-this',
  issuer: process.env.JWT_ISSUER || 'soranix-auth',
  audience: process.env.JWT_AUDIENCE || 'soranix-platform',
};

// Cookie configuration
export const cookieConfig = {
  accessTokenName: 'soranix_access_token',
  refreshTokenName: 'soranix_refresh_token',
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict' as const,
  domain: process.env.COOKIE_DOMAIN, // Optional: .soranix.com for subdomains
};

// Email configuration
export const emailConfig = {
  verificationTokenExpiry: parseInt(process.env.EMAIL_VERIFICATION_EXPIRY || '86400000'), // 24 hours
  resetTokenExpiry: parseInt(process.env.PASSWORD_RESET_EXPIRY || '3600000'), // 1 hour
};

// Device trust configuration
export const deviceConfig = {
  trustDuration: parseInt(process.env.DEVICE_TRUST_DURATION || '2592000000'), // 30 days in ms
};

// Password history
export const passwordHistoryConfig = {
  keepLastNPasswords: parseInt(process.env.PASSWORD_HISTORY_COUNT || '5'), // Keep last 5 passwords
};

