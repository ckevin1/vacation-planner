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

The current client is organized into an Overview, Destinations, Days In Motion, Optional Activities, and Travel Details workspace. Destinations explain their role and link naturally into day planning. Days In Motion supports timeline and daily pseudo-calendar views. Travel records use category-specific fields for lodging, airfare, ground transportation, transfers, and activities while retaining a shared base contract.

Each trip also has a Travelers page that is the source of truth for names, preferred names, contact information, and notes. Travelers can be selected on flight legs and other travel records; flight legs retain their own traveler and seat assignments.

Optional activities use an estimated duration but do not ask users to enter commute time; commute is reserved for a later location-aware calculation. The API uses explicit SQLite column lists for optional activities so schema changes cannot silently create positional value-count failures.

Live providers, authentication, traveler roster links, structured address persistence, maps, AI extraction, budgeting, expenses, photos, social publishing, and true offline synchronization remain deferred. The next foundation milestone should add travelers and structured locations before connecting an approval-based AI extraction workflow.
