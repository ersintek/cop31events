# COP31 Events

Independent COP31 event directory extracted from Eventise. It contains a standalone NestJS API, Next.js directory/editor and a PostgreSQL schema limited to COP31 records.

## Local setup

1. Copy `.env.example` to `.env`, then set the two editor secrets.
2. Start PostgreSQL (or use an existing server) with the `DATABASE_URL` in `.env`.
3. Run `npm install`, `npm run db:generate`, `npm run db:migrate`, then `npm run db:seed`.
4. Start `npm run dev:api` and `npm run dev:web` in separate terminals.

The checked-in `data/cop31-events.json` provides the initial event records. The seed creates missing slugs and leaves existing records untouched, so it is safe to run on API restarts.

## Dokploy deployment

Connect this repository to Dokploy as a **Docker Compose** source and select the root `compose.yaml`. The stack runs the public Next.js site, the NestJS API and PostgreSQL. Attach `events.cop31radar.com` to the `web` service on port `3001`; the API and database stay private on the Compose network.

Set these variables in Dokploy's project environment before the first deployment:

- `PUBLIC_APP_URL` and `WEB_ORIGIN`: the same public HTTPS URL, for example `https://events.cop31radar.com`.
- `POSTGRES_PASSWORD`: a long random hexadecimal password (hex avoids URL encoding problems in `DATABASE_URL`).
- `COP31_EDITOR_PASSWORD`: a strong password for `/cop31/editor`.
- `COP31_EDITOR_KEY`: a separate long random secret shared by the web and API services.
- `DEPO_SSO_ORIGIN`: the COP31Radar origin, normally `https://cop31radar.com`.
- `DEPO_SSO_CLIENT_SECRET`: a random secret shared with the COP31Radar Cloudflare Worker for one-time SSO code exchange.
- `COP31_EVENTS_SESSION_SECRET`: a separate random secret of at least 32 characters, set to the same value on the Dokploy web and API services. The web service signs the session and the API verifies it for saved-event requests.

For production SSO, configure the exact callback `https://events.cop31radar.com/api/session/sso/callback` in the COP31Radar Worker allowlist. Store the same `DEPO_SSO_CLIENT_SECRET` value as the Cloudflare Worker secret `EVENTS_SSO_CLIENT_SECRET` and the Dokploy web-service variable. The event-site session secret is separate from the SSO exchange secret and stays only in Dokploy. Deploy both sides together after adding these settings.

The API waits for PostgreSQL, applies Prisma migrations, and seeds only missing starter records before it starts. The seed does not overwrite records later edited in the COP31 editor. PostgreSQL data persists in the named `cop31_postgres_data` volume; configure backups in Dokploy before relying on the deployment.

Dokploy can run the Compose app health check at `/api/health`. For the editor, open `https://events.cop31radar.com/cop31/editor` and use `COP31_EDITOR_PASSWORD`.
