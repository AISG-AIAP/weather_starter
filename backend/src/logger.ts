import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import pino from 'pino';

const logPath =
  process.env.LOG_FILE_PATH ??
  join(process.cwd(), 'backend', 'logs', 'app.log');

if (process.env.NODE_ENV !== 'test') {
  mkdirSync(join(logPath, '..'), { recursive: true });
}

const stream =
  process.env.NODE_ENV === 'test'
    ? undefined
    : pino.multistream([
        { stream: process.stdout },
        { stream: pino.destination({ dest: logPath, sync: false }) },
      ]);

export const logger = pino(
  {
    level:
      process.env.LOG_LEVEL ??
      (process.env.NODE_ENV === 'test' ? 'silent' : 'info'),
    base: {
      service: 'weather-starter',
    },
  },
  stream,
);
