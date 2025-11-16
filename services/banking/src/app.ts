import * as http from 'node:http';

import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';

import { initializeTracing } from '@packages/tracing';

import RootModules from './services/root/root.modules';

const banking_app: Express = express();
const root = new RootModules();

// Middleware
banking_app.use(cors());
banking_app.use(helmet());
banking_app.use(bodyParser.json());
banking_app.use(bodyParser.urlencoded({ extended: true }));

// Routes
banking_app.use(`/api/v1`, root.routes());

// Health check endpoint
banking_app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'banking',
    timestamp: new Date().toISOString(),
  });
});

// Initialize tracing (must be done first)
initializeTracing();

const server = http.createServer(banking_app);

export { banking_app, server };

