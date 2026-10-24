# AGENTS.md

Weather Starter is a TypeScript npm-workspaces app that saves Singapore locations and displays weather snapshots from data.gov.sg through an Express/SQLite backend and React/Vite frontend.

Run repository commands from the root; database and migration paths depend on `process.cwd()`.

Read only the guidance relevant to the task:

- [Commands and validation](docs/agents/commands.md) — setup, development, build, formatting, health checks, and database scripts.
- [Architecture](docs/agents/architecture.md) — runtime composition and cross-layer data flow.
- [Backend](docs/agents/backend.md) — API behavior, weather-provider integration, persistence, logging, and migrations.
- [Frontend](docs/agents/frontend.md) — state, API access, response types, components, and map behavior.
- [Testing](docs/agents/testing.md) — Vitest structure, isolation, mocks, and expected checks.
- [TypeScript conventions](docs/agents/typescript.md) — ESM imports, strict typing, and layer boundaries.
