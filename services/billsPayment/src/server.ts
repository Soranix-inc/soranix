import chalk from 'chalk';
import dotenv from 'dotenv';

import { systemLogger } from '@packages/logging';

import { server } from './app';

dotenv.config();

const PORT = process.env.PORT || 5003;

server.listen(PORT, () => {
  console.log(
    `${chalk.green.bold('Connected')} Bills Payment Server running on ${chalk.yellow.bold(
      process.env.NODE_ENV
    )} on ${chalk.blue.bold(PORT)}`
  );
  systemLogger.info(`Bills Payment Server running on ${PORT}`);
});



