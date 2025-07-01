import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { envs } from '@/constants';
import * as schema from './schema';

const pool = new Pool({ connectionString: envs.DATABASE_URL });
export const db = drizzle(pool, {
  schema,
});
