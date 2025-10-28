import * as http from 'node:http';

import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';

import { systemLogger } from '@packages/logging';
import { initializeTracing } from '@packages/tracing';

import { eventBus } from './events/event-bus.js';
import RootModules from './services/root/root.modules.js';

const ledger_app: Express = express();
const root = new RootModules();

// Middleware
ledger_app.use(cors());
ledger_app.use(helmet());
ledger_app.use(bodyParser.json());
ledger_app.use(bodyParser.urlencoded({ extended: true }));

// Routes
ledger_app.use('/api/v1', root.routes());

// Health check endpoint
ledger_app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ledger',
    timestamp: new Date().toISOString(),
    eventBus: eventBus.isReady() ? 'connected' : 'disconnected',
  });
});

// Initialize tracing
initializeTracing();

// Initialize event bus
eventBus.initialize().catch((error) => {
  systemLogger.error('Failed to initialize event bus', {
    error: error instanceof Error ? error.message : String(error),
  });
});

const server = http.createServer(ledger_app);

export { ledger_app, server };
