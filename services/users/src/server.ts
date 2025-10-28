import chalk from 'chalk';
import dotenv from 'dotenv';

import { systemLogger } from '@packages/logging';

import { server } from './app';

dotenv.config();

const PORT = process.env.PORT || 5002;

server.listen(PORT, () => {
  console.log(
    `${chalk.green.bold('Connected')} Users Server running on ${chalk.yellow.bold(
      process.env.NODE_ENV
    )} on ${chalk.blue.bold(PORT)}`
  );
  systemLogger.info(`Users Server running on ${PORT}`);
});
