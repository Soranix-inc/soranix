import express from 'express';

import { AuthControllers } from './auth.controllers.js';

/**
 * Auth Routes
 * Define all authentication endpoints
 */
export class AuthRoutes {
  private readonly router: express.Router;

  constructor(private readonly controllers: AuthControllers) {
    this.router = express.Router();
  }

  routes = () => {
    // Public routes (no authentication required)
    this.router.post('/signup', this.controllers.signup);
    this.router.post('/login', this.controllers.login);
    this.router.post('/logout', this.controllers.logout);
    this.router.post('/refresh', this.controllers.refresh);
    this.router.post('/forgot-password', this.controllers.forgotPassword);
    this.router.post('/reset-password', this.controllers.resetPassword);
    this.router.get('/verify-email/:token', this.controllers.verifyEmail);
    this.router.post('/resend-verification', this.controllers.resendVerification);

    // Protected routes (authentication handled by gateway)
    this.router.get('/sessions', this.controllers.getSessions);
    this.router.delete('/sessions/:sessionId', this.controllers.revokeSession);
    this.router.delete('/sessions/all', this.controllers.revokeAllSessions);
    this.router.get('/devices', this.controllers.getDevices);
    this.router.delete('/devices/:deviceId', this.controllers.removeDevice);

    return this.router;
  };
}
