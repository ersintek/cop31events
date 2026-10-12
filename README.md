# COP31 Events

Independent COP31 event directory extracted from Eventise. It contains a standalone NestJS API, Next.js directory/editor and a PostgreSQL schema limited to COP31 records.

## Local setup

1. Copy `.env.example` to `.env`, then set the two editor secrets.
2. Start PostgreSQL (or use an existing server) with the `DATABASE_URL` in `.env`.
3. Run `npm install`, `npm run db:generate`, `npm run db:migrate`, then `npm run db:seed`.
4. Start `npm run dev:api` and `npm run dev:web` in separate terminals.

The checked-in `data/cop31-events.json` is the source-project local export used for the initial seed. The seed is idempotent and preserves event IDs, slugs and timestamps.
