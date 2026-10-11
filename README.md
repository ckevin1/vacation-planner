# Vacation Planner

A local-first proof of concept for organizing trips, destinations, itinerary records, optional activities, and traveler information.

## Architecture

- `apps/client`: responsive React + Vite TypeScript browser client. The browser-first client is intentionally usable on narrow mobile viewports and can later be wrapped with Expo/Capacitor without moving domain logic.
- `apps/api`: Fastify TypeScript API with a repository boundary around SQLite. `better-sqlite3` is used for a simple local relational database and the schema is intentionally portable to PostgreSQL.
- `packages/shared`: Zod schemas and shared category contracts used by the API and client.
- `apps/api/src/db.ts`: idempotent database initialization. Data is stored in `apps/api/data` at runtime.

The POC uses a local user identifier, stable UUIDs, and timestamps. API calls are centralized in `apps/client/src/api.ts`. An offline queue or conflict resolver can be introduced behind this abstraction later without changing UI components.

## Run locally

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. The API health endpoint is at `http://localhost:4000/health`.

## Checks

```powershell
npm test
npm run typecheck
npm run build
```

The first vertical slice covers trip CRUD, destinations, day-by-day planning, and generic itinerary records. The follow-on UI covers category labels and confirmation references, optional activity filtering/randomization, and loyalty records. Live providers, authentication, maps, and true offline synchronization remain intentionally deferred.
