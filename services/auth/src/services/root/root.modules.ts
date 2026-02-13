import { Router } from 'express';

import { AuthModule } from '../auth/auth.modules.js';
import { NodePgDatabase } from 'drizzle-orm/node-postgres/driver.js';
import * as schemas from '../../db/schema/index.js';
import { Pool } from 'pg';

/**
 * Root Module
 * Aggregates all service modules for the auth service
 */
class RootModules {
  private readonly router: Router;
  private authModule: AuthModule;


  constructor(db: NodePgDatabase<typeof schemas>& {$client: Pool}) {
    this.router = Router();
    this.authModule = new AuthModule(db);
    this.initializeRoutes();
  }

  async initializeRoutes(): Promise<void> {
    this.router.use('/auth', this.authModule.routes.routes());
  }

  routes(): Router {
    return this.router;
  }
}
export default RootModules;
