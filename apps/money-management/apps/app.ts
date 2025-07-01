require("reflect-metadata");
require("module-alias/register");

import { RootModule } from "@/modules";
import compression from "compression";
import cookie from "cookie-parser";
import cors from "cors";
import express from "express";
import limit from "express-rate-limit";
import slow from "express-slow-down";
import http from "http";
import ip from "ip";
import { winstonLogger } from "./config";
import { envs } from "./constants";
import { AppDataSource } from "./db";
import { errorHandler } from "./middlewares/handler";

const root = new RootModule(AppDataSource);

const app = express();

const server = http.createServer(app);

const PORT = envs.PORT;

const address = ip.address();

app.use(compression());

app.use(
	slow({
		windowMs: 15 * 60 * 1000,
		delayAfter: 5,
		delayMs: (hits) => hits * 100,
	})
);

app.use(
	cors({
		credentials: true,
		origin: envs.ALLOWED_ORIGINS.split(","),
	})
);

app.use(express.json({ limit: envs.JSON_LIMIT }));

app.use(express.urlencoded({ extended: true }));

app.use(cookie());

app.use(
	limit({
		windowMs: 15 * 60 * 1000,
		limit: 100,
		standardHeaders: "draft-8",
		legacyHeaders: false,
	})
);

app.use(root.routes());

app.use(errorHandler);

server.on("listening", function () {
	winstonLogger.info(
		`SERVER ACTIVE ON http://${address}:${PORT} & http://localhost:${PORT}`
	);
});

server.listen(PORT);
