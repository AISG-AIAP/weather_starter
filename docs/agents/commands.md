# Commands and validation

Run these commands from the repository root.

## Common commands

```bash
npm install                 # Install root and workspace dependencies
npm run dev                 # Express + Vite middleware through Portless
npm run build               # Type-check/build frontend, then compile backend
npm start                   # Serve compiled backend and frontend/dist
npm test                    # Run all backend Vitest tests once
npm run test:watch          # Run tests in watch mode
npm run format              # Format the repo with Prettier
npm run format:check        # Verify formatting without writing
npm run doctor              # Check /health and /api/locations on a running app
npm run reset               # Delete the local SQLite DB, WAL, and SHM files
npm run db:generate         # Generate a migration after schema changes
npm run db:migrate          # Apply committed migrations
```

The default development URL is `http://weather-starter.localhost:1355`. `npm run doctor` defaults to the production-style server at `http://127.0.0.1:3000`. To check the Portless development server, run:

```bash
WEATHER_STARTER_URL=http://weather-starter.localhost:1355 npm run doctor
```

`npm start` expects build output, so run `npm run build` first.

## Narrow checks

```bash
npx vitest run backend/src/weather.test.ts
npx vitest run backend/src/routes/locations.test.ts
npm run build -w frontend
npm run build -w backend
npx prettier --check backend/src frontend/src
```

## Lint status

There is no configured lint command. ESLint packages are installed, but the repository has no ESLint config or `lint` script. Do not report `npm run lint` as passing. Use `npm run build` for TypeScript validation and Prettier for formatting until linting is configured.

`npm run reset` is destructive: it removes the configured SQLite database and its sidecar files.
