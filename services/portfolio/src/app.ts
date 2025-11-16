import * as http from 'node:http';

import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';

import { initializeTracing } from '@packages/tracing';

import RootModules from './services/root/root.modules';

const portfolio_app: Express = express();
const root = new RootModules();

// Middleware
portfolio_app.use(cors());
portfolio_app.use(helmet());
portfolio_app.use(bodyParser.json());
portfolio_app.use(bodyParser.urlencoded({ extended: true }));

// Routes
portfolio_app.use(`/api/v1`, root.routes());

// Health check endpoint
portfolio_app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'portfolio',
    timestamp: new Date().toISOString(),
  });
});

// Initialize tracing (must be done first)
initializeTracing();

const server = http.createServer(portfolio_app);

export { portfolio_app, server };

