import * as http from 'node:http';

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';

import { systemLogger } from '@packages/logging';
import { initializeTracing } from '@packages/tracing';

import { connectRedis } from './config/redis.config.js';
import { eventBus } from './events/event-bus.js';
import RootModules from './services/root/root.modules.js';
import { db } from './db/connection.js';

const auth_app: Express = express();
const root = new RootModules(db);

auth_app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
auth_app.use(bodyParser.json());
auth_app.use(bodyParser.urlencoded({ extended: true }));
auth_app.use(cookieParser() as any);

auth_app.use(`${process.env.BASE_PATH}`, root.routes());

auth_app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'auth',
    timestamp: new Date().toISOString(),
    eventBus: eventBus.isReady() ? 'connected' : 'disconnected',
  });
});

initializeTracing();

connectRedis().catch((error) => {
  systemLogger.error('Failed to connect to Redis', {
    error: error instanceof Error ? error.message : String(error),
  });
});



eventBus.initialize().catch((error) => {
  systemLogger.error('Failed to initialize event bus', {
    error: error instanceof Error ? error.message : String(error),
  });
});

const server = http.createServer(auth_app);

export { auth_app, server };
