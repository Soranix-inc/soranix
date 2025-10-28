import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';

const { Pool } = pkg;
import { systemLogger } from '@packages/logging';

import * as schema from './schema/index.js';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'soranix_auth',
  max: parseInt(process.env.DB_POOL_SIZE || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });

// Test connection
pool.on('connect', () => {
  systemLogger.info('Database connection established');
});

pool.on('error', (err) => {
  systemLogger.error('Unexpected database error', { error: err.message });
});

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    systemLogger.info('Database connection test successful');
    return true;
  } catch (error) {
    systemLogger.error('Database connection test failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  await pool.end();
  systemLogger.info('Database connection pool closed');
}
