import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { systemLogger } from '@packages/logging';

import * as schema from './schema';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'payments_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  systemLogger.info('Connected to Payments database');
});

pool.on('error', (err) => {
  systemLogger.error('Unexpected database error', { error: err.message });
  process.exit(-1);
});

export const db = drizzle(pool, { schema });
export { pool };



