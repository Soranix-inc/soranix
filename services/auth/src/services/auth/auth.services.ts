import axios from 'axios';

import { systemLogger } from '@packages/logging';

import { securityConfig } from '../../config/security.config.js';
import { SignupRequest, LoginRequest, AuthResponse } from '../../types/auth-types.js';
import { DeviceService } from '../device/device.service.js';
import { SessionService } from '../session/session.service.js';
import { TokenService } from '../token/token.service.js';

/**
 * Stateless Auth Service
 * - Calls Users Service API for user data
 * - Uses Redis for sessions/tokens
 * - No database access
 */
export class AuthService {
  private tokenService: TokenService;
  private sessionService: SessionService;
  private deviceService: DeviceService;
  private usersServiceUrl: string;

  constructor() {
    this.tokenService = new TokenService();
    this.sessionService = new SessionService();
    this.deviceService = new DeviceService();
    this.usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://localhost:3001';
  }

  /**
   * Signup - delegates to Users Service
   */
  async signup(request: SignupRequest): Promise<{ success: boolean; message: string }> {
    try {
      // Call Users Service API to create user
      const response = await axios.post(`${this.usersServiceUrl}/api/v1/users/register`, {
        email: request.email,
        password: request.password,
        firstName: request.firstName,
        lastName: request.lastName,
        phoneNumber: request.phoneNumber,
      });

      systemLogger.info('User registered via Users Service', {
        email: request.email,
      });

      return {
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
      };
    } catch (error) {
      systemLogger.error('Signup failed', {
        email: request.email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Login - validates with Users Service, creates session
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    try {
      // Validate credentials with Users Service
      const response = await axios.post(`${this.usersServiceUrl}/api/v1/users/validate`, {
        email: request.email,
        password: request.password,
      });

      const user = response.data.user;

      if (!response.data.success) {
        throw new Error(response.data.error || 'Invalid credentials');
      }

      // Create session in Redis
      const sessionId = await this.sessionService.createSession(user.id, request.deviceInfo);

      // Generate tokens
      const accessToken = this.tokenService.generateAccessToken({
        userId: user.id,
        email: user.email,
        sessionId,
        deviceId: request.deviceInfo.deviceId,
        roles: user.roles || ['user'],
      });

      const refreshToken = await this.tokenService.generateRefreshToken(
        user.id,
        sessionId,
        request.deviceInfo.deviceId
      );

      systemLogger.info('Login successful', {
        userId: user.id,
        sessionId,
      });

      // Get session for response
      const session = await this.sessionService.getSession(sessionId);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          emailVerified: user.emailVerified,
          mfaEnabled: user.mfaEnabled,
        },
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: this.parseExpiry(securityConfig.accessTokenExpiry),
        },
        session: {
          sessionId: session!.sessionId,
          expiresAt: session!.expiresAt,
        },
      };
    } catch (error) {
      systemLogger.error('Login failed', {
        email: request.email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Logout - revokes session and tokens
   */
  async logout(sessionId: string): Promise<void> {
    try {
      // Revoke session from Redis
      await this.sessionService.revokeSession(sessionId);

      // Revoke all refresh tokens for this session
      await this.tokenService.revokeSessionTokens(sessionId);

      systemLogger.info('Logout successful', { sessionId });
    } catch (error) {
      systemLogger.error('Logout failed', {
        sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Logout all - revokes all user sessions
   */
  async logoutAll(userId: string): Promise<void> {
    try {
      // Revoke all sessions
      await this.sessionService.revokeAllUserSessions(userId);

      systemLogger.info('All sessions logged out', { userId });
    } catch (error) {
      systemLogger.error('Logout all failed', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Verify email - delegates to Users Service
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.usersServiceUrl}/api/v1/users/verify-email`, {
        token,
      });

      return response.data.success;
    } catch (error) {
      systemLogger.error('Email verification failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Request password reset - delegates to Users Service
   */
  async forgotPassword(email: string): Promise<void> {
    try {
      await axios.post(`${this.usersServiceUrl}/api/v1/users/forgot-password`, {
        email,
      });

      systemLogger.info('Password reset requested', { email });
    } catch (error) {
      systemLogger.error('Forgot password failed', {
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw to prevent email enumeration
    }
  }

  /**
   * Reset password - delegates to Users Service
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.usersServiceUrl}/api/v1/users/reset-password`, {
        token,
        newPassword,
      });

      return response.data.success;
    } catch (error) {
      systemLogger.error('Password reset failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiryString: string): number {
    const match = expiryString.match(/^(\d+)([smhd])$/);
    if (!match) return 900; // Default 15 minutes

    const [, value, unit] = match;
    const seconds = {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    }[unit as 's' | 'm' | 'h' | 'd'];

    return parseInt(value) * seconds;
  }
}
