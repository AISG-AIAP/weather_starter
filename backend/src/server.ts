import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { locationsRouter } from './routes/locations.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT ?? 3000);

const app = express();
app.use(express.json());

app.get('/health', (_request, response) => {
  response.json({ status: 'healthy' });
});

app.use('/api', locationsRouter);

if (isProduction) {
  const staticPath = resolve(__dirname, '..', '..', 'frontend', 'dist');
  app.use(express.static(staticPath));
  app.get('*', (_request, response) => {
    response.sendFile(resolve(staticPath, 'index.html'));
  });
} else {
  const { createServer } = await import('vite');
  const vite = await createServer({
    root: resolve(__dirname, '..', '..', 'frontend'),
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ detail: 'Internal server error' });
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Weather Starter listening on http://127.0.0.1:${port}`);
});
