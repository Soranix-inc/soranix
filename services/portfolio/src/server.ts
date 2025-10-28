import chalk from 'chalk';
import dotenv from 'dotenv';

import { systemLogger } from '@packages/logging';

import { server } from './app';

dotenv.config();

const PORT = process.env.PORT || 5006;

server.listen(PORT, () => {
  console.log(
    `${chalk.green.bold('Connected')} Portfolio Server running on ${chalk.yellow.bold(
      process.env.NODE_ENV
    )} on ${chalk.blue.bold(PORT)}`
  );
  systemLogger.info(`Portfolio Server running on ${PORT}`);
});
