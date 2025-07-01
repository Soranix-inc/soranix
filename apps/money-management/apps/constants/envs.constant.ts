import dotenv from "dotenv";
import { CONSTANTS } from "./type.constant";

dotenv.config({ path: process.env.ENV_FILE as string });

export const envs: CONSTANTS = {
	ENV_FILE: (process.env.ENV_FILE as string) ?? "",
	LOG_PATH: (process.env.LOG_PATH as string) ?? "",
	NODE_ENV: (process.env.NODE_ENV as any) ?? "development",
	PORT: isNaN(Number(process.env.PORT)) ? 5500 : Number(process.env.PORT),
	DATABASE_URL: (process.env.DATABASE_URL as string) ?? "",
	REDIS_URL: (process.env.REDIS_URL as string) ?? "",
	ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS as string) ?? "",
	JSON_LIMIT: (process.env.JSON_LIMIT as string) ?? "",
	SQL_DATABASE_URI: (process.env.SQL_DATABASE_URI as string) ?? "",
	SQL_DATABASE_TYPE: (process.env.SQL_DATABASE_TYPE as string) ?? "",
	SQL_DATABASE_HOST: (process.env.SQL_DATABASE_HOST as string) ?? "",
	SQL_DATABASE_PORT: Number(process.env.SQL_DATABASE_PORT) ?? 5432,
	SQL_DATABASE_USERNAME: (process.env.SQL_DATABASE_USERNAME as string) ?? "",
	SQL_DATABASE_PASSWORD: (process.env.SQL_DATABASE_PASSWORD as string) ?? "",
	SQL_DATABASE_NAME: (process.env.SQL_DATABASE_NAME as string) ?? "",
};
