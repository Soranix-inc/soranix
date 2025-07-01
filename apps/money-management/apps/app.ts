require("reflect-metadata");
require("module-alias/register");

import express from "express";
import compression from "compression";
import cors from "cors";
import slow from "express-slow-down";
import limit from "express-rate-limit";
import cookie from "cookie-parser";
import http from "http";
import ip from "ip";
import { winstonLogger } from "./config";
import { RootModule } from "@/modules";
import { db } from "./db";
import { envs } from "./constants";
import { errorHandler } from "./handler";

const root = new RootModule(db);

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
