import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { systemLogger } from '@packages/logging';

import * as schema from './schema.js';

let db: ReturnType<typeof drizzle> | null = null;
let pool: Pool | null = null;

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase() first.');
  }
  return pool;
}

export async function initializeDatabase(): Promise<void> {
  try {
    const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/soranix_users';

    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();

    db = drizzle(pool, { schema });

    systemLogger.info('Database connection established', {
      host: new URL(connectionString).hostname,
      database: new URL(connectionString).pathname.slice(1),
    });
  } catch (error) {
    systemLogger.error('Failed to initialize database', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
    systemLogger.info('Database connection closed');
  }
}
