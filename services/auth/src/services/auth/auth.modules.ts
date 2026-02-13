import { Router } from 'express';

import { AuthControllers } from './auth.controllers.js';
import { AuthRoutes } from './auth.routes.js';
import { AuthService } from './auth.services.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres/driver.js';
import * as schemas from '../../db/schema/index.js';
import { Pool } from 'pg';

export class AuthModule {
  public authService: AuthService;
  public controllers: AuthControllers;
  public routes: AuthRoutes;

  constructor(private readonly db: NodePgDatabase<typeof schemas> & { $client: Pool }) {
    this.authService = new AuthService(this.db);
    this.controllers = new AuthControllers(this.authService);
    this.routes = new AuthRoutes(this.controllers);
  }
}
