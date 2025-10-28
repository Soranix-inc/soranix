import { Request, Response } from 'express';

import { cookieConfig } from '../../config/security.config.js';
import { SignupRequest, LoginRequest } from '../../types/auth-types.js';
import { DeviceService } from '../device/device.service.js';
import { SessionService } from '../session/session.service.js';
import { TokenService } from '../token/token.service.js';

import { AuthService } from './auth.services.js';

/**
 * Stateless Auth Controllers
 * Minimal logic, delegates to Users Service
 */
export class AuthControllers {
  private authService: AuthService;
  private tokenService: TokenService;
  private sessionService: SessionService;
  private deviceService: DeviceService;

  constructor() {
    this.authService = new AuthService();
    this.tokenService = new TokenService();
    this.sessionService = new SessionService();
    this.deviceService = new DeviceService();
  }

  /**
   * POST /auth/signup
   */
  signup = async (req: Request, res: Response): Promise<void> => {
    try {
      const signupData: SignupRequest = req.body;

      if (!signupData.email || !signupData.password || !signupData.firstName || !signupData.lastName) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
        return;
      }

      const result = await this.authService.signup(signupData);

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      });
    }
  };

  /**
   * POST /auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      const deviceInfo = this.deviceService.parseDeviceInfo(
        req.headers['user-agent'] || '',
        req.ip || req.socket.remoteAddress || ''
      );

      const loginRequest: LoginRequest = {
        email,
        password,
        deviceInfo,
      };

      const result = await this.authService.login(loginRequest);

      // Set HTTP-only cookies
      res.cookie(cookieConfig.accessTokenName, result.tokens.accessToken, {
        httpOnly: true,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        maxAge: result.tokens.expiresIn * 1000,
        domain: cookieConfig.domain,
      });

      res.cookie(cookieConfig.refreshTokenName, result.tokens.refreshToken, {
        httpOnly: true,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: cookieConfig.domain,
      });

      res.status(200).json({
        success: true,
        user: result.user,
        session: result.session,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
    }
  };

  /**
   * POST /auth/logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies[cookieConfig.refreshTokenName];

      if (!refreshToken) {
        res.status(400).json({ success: false, error: 'No active session' });
        return;
      }

      const { payload } = await this.tokenService.verifyRefreshToken(refreshToken);
      await this.authService.logout(payload.sessionId);

      res.clearCookie(cookieConfig.accessTokenName);
      res.clearCookie(cookieConfig.refreshTokenName);

      res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Logout failed' });
    }
  };

  /**
   * POST /auth/refresh
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const oldRefreshToken = req.cookies[cookieConfig.refreshTokenName];

      if (!oldRefreshToken) {
        res.status(401).json({ success: false, error: 'No refresh token' });
        return;
      }

      const newRefreshToken = await this.tokenService.rotateRefreshToken(oldRefreshToken);
      const { payload } = await this.tokenService.verifyRefreshToken(newRefreshToken);

      const newAccessToken = this.tokenService.generateAccessToken({
        userId: payload.userId,
        email: '', // Would get from users service if needed
        sessionId: payload.sessionId,
        deviceId: payload.deviceId,
        roles: ['user'],
      });

      await this.sessionService.updateActivity(payload.sessionId);

      res.cookie(cookieConfig.accessTokenName, newAccessToken, {
        httpOnly: true,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        maxAge: 15 * 60 * 1000,
        domain: cookieConfig.domain,
      });

      res.cookie(cookieConfig.refreshTokenName, newRefreshToken, {
        httpOnly: true,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        domain: cookieConfig.domain,
      });

      res.status(200).json({ success: true, message: 'Tokens refreshed' });
    } catch (error) {
      res.clearCookie(cookieConfig.accessTokenName);
      res.clearCookie(cookieConfig.refreshTokenName);

      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      });
    }
  };

  /**
   * POST /auth/forgot-password
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ success: false, error: 'Email is required' });
        return;
      }

      await this.authService.forgotPassword(email);

      res.status(200).json({
        success: true,
        message: 'If an account exists, a reset link has been sent.',
      });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Request failed' });
    }
  };

  /**
   * POST /auth/reset-password
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        res.status(400).json({ success: false, error: 'Token and password required' });
        return;
      }

      const success = await this.authService.resetPassword(token, newPassword);

      if (!success) {
        res.status(400).json({ success: false, error: 'Invalid or expired token' });
        return;
      }

      res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
      res.status(400).json({ success: false, error: 'Password reset failed' });
    }
  };

  /**
   * GET /auth/verify-email/:token
   */
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.params;

      const success = await this.authService.verifyEmail(token);

      if (!success) {
        res.status(400).json({ success: false, error: 'Invalid or expired token' });
        return;
      }

      res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Verification failed' });
    }
  };

  /**
   * GET /auth/sessions
   */
  getSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const sessions = await this.sessionService.getUserActiveSessions(userId);

      res.status(200).json({ success: true, sessions });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to get sessions' });
    }
  };

  /**
   * DELETE /auth/sessions/:sessionId
   */
  revokeSession = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const session = await this.sessionService.getSession(sessionId);
      if (!session || session.userId !== userId) {
        res.status(403).json({ success: false, error: 'Forbidden' });
        return;
      }

      await this.sessionService.revokeSession(sessionId);
      await this.tokenService.revokeSessionTokens(sessionId);

      res.status(200).json({ success: true, message: 'Session revoked' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to revoke session' });
    }
  };

  /**
   * DELETE /auth/sessions/all
   */
  revokeAllSessions = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      await this.authService.logoutAll(userId);

      res.clearCookie(cookieConfig.accessTokenName);
      res.clearCookie(cookieConfig.refreshTokenName);

      res.status(200).json({ success: true, message: 'All sessions revoked' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to revoke all sessions' });
    }
  };
}
