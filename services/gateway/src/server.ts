import chalk from 'chalk';
import dotenv from 'dotenv';

import { systemLogger } from '@packages/logging';

import { server } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(
    `${chalk.green.bold('✓')} Gateway Server running on ${chalk.yellow.bold(
      process.env.NODE_ENV || 'development'
    )} on ${chalk.blue.bold(`http://localhost:${PORT}`)}`
  );
  systemLogger.info(`Gateway Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  systemLogger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    systemLogger.info('Gateway server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  systemLogger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    systemLogger.info('Gateway server closed');
    process.exit(0);
  });
});

