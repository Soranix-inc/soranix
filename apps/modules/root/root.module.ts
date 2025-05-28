import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import express from 'express';

export class RootModule<T extends Record<string, any>> {
  private readonly router: express.Router;
  constructor(
    private readonly db: NodePgDatabase<T> & {
      $client: Pool;
    }
  ) {
    this.router = express.Router();
  }

  routes = () => {
    return this.router;
  };
}
