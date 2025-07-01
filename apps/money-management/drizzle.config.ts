import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_FILE });

export default defineConfig({
  out: './drizzle',
  dialect: 'postgresql',
  schema: './apps/db/schema/index.ts',
  dbCredentials: {
    url: (process.env.DATABASE_URL as string) ?? '',
  },
});
