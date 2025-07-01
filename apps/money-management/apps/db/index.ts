import { envs } from "@/constants";
import { DataSource } from "typeorm";

export default new DataSource({
	type: "postgres",
	host: envs.SQL_DATABASE_HOST,
	port: envs.SQL_DATABASE_PORT,
	username: envs.SQL_DATABASE_USERNAME,
	password: envs.SQL_DATABASE_PASSWORD,
	database: envs.SQL_DATABASE_NAME,
	synchronize: false,
	logging: true,
	entities: [],
	subscribers: [],
	migrations: ["/migrations/*.ts"],
});
