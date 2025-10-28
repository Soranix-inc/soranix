import { Router } from 'express';

import { AuthModule } from '../auth/auth.modules.js';

/**
 * Root Module
 * Aggregates all service modules for the auth service
 */
class RootModules {
  private readonly router: Router;
  private authModule: AuthModule;

  constructor() {
    this.router = Router();
    this.authModule = new AuthModule();
  }

  async initialize(): Promise<void> {
    await this.authModule.initialize();
  }

  routes(): Router {
    this.router.use('/auth', this.authModule.getRouter());
    return this.router;
  }
}
export default RootModules;
