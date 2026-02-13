import chalk from 'chalk';
import dotenv from 'dotenv';

import { systemLogger } from '@packages/logging';

import { server } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 6002;

server.listen(PORT, () => {
  console.log(
    `${chalk.green.bold('Connected')} Ledger Server running on ${chalk.yellow.bold(
      process.env.NODE_ENV
    )} on ${chalk.blue.bold(PORT)}`
  );
  systemLogger.info(`Ledger Server running on ${PORT}`);
});



