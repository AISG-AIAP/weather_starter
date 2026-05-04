import { spawn } from 'node:child_process';

const child = spawn(
  'portless',
  ['run', '--name', 'weather-starter', 'tsx', 'watch', 'backend/src/server.ts'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORTLESS_HTTPS: process.env.PORTLESS_HTTPS ?? '0',
      PORTLESS_PORT: process.env.PORTLESS_PORT ?? '1355',
    },
  },
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
