import * as http from 'node:http';

import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';

import { initializeTracing } from '@packages/tracing';

import RootModules from './services/root/root.modules';

const payments_app: Express = express();
const root = new RootModules();

// Middleware
payments_app.use(cors());
payments_app.use(helmet());
payments_app.use(bodyParser.json());
payments_app.use(bodyParser.urlencoded({ extended: true }));

// Routes
payments_app.use(`/api/v1`, root.routes());

// Health check endpoint
payments_app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'payments',
    timestamp: new Date().toISOString(),
  });
});

// Initialize tracing (must be done first)
initializeTracing();

const server = http.createServer(payments_app);

export { payments_app, server };



