import * as http from 'node:http';

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';

import { systemLogger } from '@packages/logging';
import { initializeTracing } from '@packages/tracing';

import { connectRedis } from './config/redis.config.js';
import { eventBus } from './events/event-bus.js';
import RootModules from './services/root/root.modules.js';

const auth_app: Express = express();
const root = new RootModules();

// Middleware
auth_app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true, // Important for cookies!
  })
);
auth_app.use(bodyParser.json());
auth_app.use(bodyParser.urlencoded({ extended: true }));
auth_app.use(cookieParser()); // Parse cookies

// Routes
auth_app.use(`/api/v1`, root.routes());

// Health check endpoint
auth_app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'auth',
    timestamp: new Date().toISOString(),
    eventBus: eventBus.isReady() ? 'connected' : 'disconnected',
  });
});

// Initialize tracing (must be done first)
initializeTracing();

// Initialize Redis connection
connectRedis().catch((error) => {
  systemLogger.error('Failed to connect to Redis', {
    error: error instanceof Error ? error.message : String(error),
  });
});

// Initialize root modules
root.initialize().catch((error) => {
  systemLogger.error('Failed to initialize root modules', {
    error: error instanceof Error ? error.message : String(error),
  });
});

// Initialize event bus
eventBus.initialize().catch((error) => {
  systemLogger.error('Failed to initialize event bus', {
    error: error instanceof Error ? error.message : String(error),
  });
});

const server = http.createServer(auth_app);

export { auth_app, server };
