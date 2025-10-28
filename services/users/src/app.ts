import * as http from 'node:http';

import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';

import { systemLogger } from '@packages/logging';
import { initializeTracing } from '@packages/tracing';

import { eventBus } from './events/event-bus';
import RootModules from './services/root/root.modules';

const users_app: Express = express();
const root = new RootModules();

// Middleware
users_app.use(cors());
users_app.use(helmet());
users_app.use(bodyParser.json());
users_app.use(bodyParser.urlencoded({ extended: true }));

// Routes
users_app.use(`/api/v1`, root.routes());

// Health check endpoint
users_app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'users',
    timestamp: new Date().toISOString(),
    eventBus: eventBus.isReady() ? 'connected' : 'disconnected',
  });
});

// Initialize tracing (must be done first)
initializeTracing();

// Initialize event bus
eventBus.initialize().catch((error) => {
  systemLogger.error('Failed to initialize event bus', {
    error: error instanceof Error ? error.message : String(error),
  });
});

const server = http.createServer(users_app);

export { users_app, server };
