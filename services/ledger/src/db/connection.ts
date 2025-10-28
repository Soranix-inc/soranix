import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import { systemLogger } from '@packages/logging';

import * as schema from './schema/index.js';

const { Pool } = pg;

let db: ReturnType<typeof drizzle> | null = null;
let pool: pg.Pool | null = null;

export function getDatabase() {
  if (!db) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    pool = new Pool({
      connectionString,
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      systemLogger.error('Unexpected database pool error', {
        error: err.message,
      });
    });

    db = drizzle(pool, { schema });

    systemLogger.info('Database connection established', {
      database: connectionString.split('@')[1], // Don't log credentials
    });
  }

  return db;
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    systemLogger.info('Database connection closed');
  }
}

// Export for use in other files
export { schema };
