import * as http from 'node:http';

import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';

import { initializeTracing } from '@packages/tracing';

import RootModules from './services/root/root.modules';

const billsPayment_app: Express = express();
const root = new RootModules();

// Middleware
billsPayment_app.use(cors());
billsPayment_app.use(helmet());
billsPayment_app.use(bodyParser.json());
billsPayment_app.use(bodyParser.urlencoded({ extended: true }));

// Routes
billsPayment_app.use(`/api/v1`, root.routes());

// Health check endpoint
billsPayment_app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'bills-payment',
    timestamp: new Date().toISOString(),
  });
});

// Initialize tracing (must be done first)
initializeTracing();

const server = http.createServer(billsPayment_app);

export { billsPayment_app, server };



