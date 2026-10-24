# TypeScript conventions

Read this file when changing TypeScript source or moving responsibilities between modules.

- The repository uses ESM through `"type": "module"`.
- Backend source imports local modules with `.js` extensions because it compiles with `moduleResolution: "NodeNext"`.
- Both workspaces use TypeScript strict mode. Parse untrusted HTTP and provider payloads defensively rather than asserting their shape.
- Keep HTTP concerns in routes, provider normalization and geospatial selection in `weather.ts`, persistence in `db.ts`, and frontend network calls in `frontend/src/api.ts`.
- Avoid weakening types with `any`; prefer boundary-specific interfaces, `unknown`, and narrowing.
