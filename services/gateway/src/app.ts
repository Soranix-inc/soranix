import * as http from 'node:http';

import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express, type ErrorRequestHandler } from 'express';
import helmet from 'helmet';

import { initializeTracing } from '@packages/tracing';

import { corsConfig } from './config/cors.config.js';
import { gatewayErrorHandler, notFoundMiddleware } from './middleware/error.middleware.js';
import { requestLoggingMiddleware } from './middleware/logging.middleware.js';
import { authMiddleware } from './middleware/auth.middleware.js';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware.js';
import { ServiceProxy } from './proxy/service-proxy.js';
import { validateServiceRegistry } from './proxy/service-registry.js';

const gateway_app: Express = express();

initializeTracing();

gateway_app.use(helmet());

gateway_app.use(cors(corsConfig));

gateway_app.use(bodyParser.json());
gateway_app.use(bodyParser.urlencoded({ extended: true }));
gateway_app.use(cookieParser() as any);

gateway_app.use(requestLoggingMiddleware);

validateServiceRegistry();

gateway_app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'gateway',
    timestamp: new Date().toISOString(),
  });
});

ServiceProxy.setupProxy(gateway_app, authMiddleware, rateLimitMiddleware);

gateway_app.use(notFoundMiddleware);

gateway_app.use(gatewayErrorHandler as any);

const server = http.createServer(gateway_app);

export { gateway_app, server };
