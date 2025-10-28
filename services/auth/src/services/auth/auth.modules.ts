import { Router } from 'express';

import { AuthControllers } from './auth.controllers.js';
import { AuthRoutes } from './auth.routes.js';

/**
 * Auth Module
 * Aggregates auth controllers and routes
 */
export class AuthModule {
  private controllers: AuthControllers;
  private routes: AuthRoutes;

  constructor() {
    this.controllers = new AuthControllers();
    this.routes = new AuthRoutes(this.controllers);
  }

  async initialize(): Promise<void> {
    await this.controllers.initialize();
  }

  getRouter(): Router {
    return this.routes.routes();
  }
}
