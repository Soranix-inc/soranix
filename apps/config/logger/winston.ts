import { envs } from '@/constants';
import winston from 'winston';

const colorizer = winston.format.colorize();

export const winstonLogger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ level, message, timestamp }) => {
      const upperCaseLevel = level.toUpperCase();
      const coloredLevel = colorizer.colorize(level, upperCaseLevel);
      return `[${coloredLevel}] ${timestamp} ${message} `;
    })
  ),
  level: 'info',
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      format: winston.format.json(),
      level: 'info',
      dirname: envs.LOG_PATH,
      maxsize: 10240 * 10240,
    }),
  ],
});
