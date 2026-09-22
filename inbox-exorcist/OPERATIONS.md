# Operations

## Runtime

- Next.js App Router on Vercel.
- Node runtime for API routes.
- Supabase Postgres via REST store when configured.
- In-memory mode is degraded and local-only.

## Health

`GET /api/health` reports:

- Google OAuth configured
- Security secrets configured
- Storage mode
- Payment feature flag
- Degraded state

## Verification

Run `npm run verify` before release. Do not call the app production-ready unless Gmail OAuth credentials, Supabase credentials, and live Gmail smoke tests have passed.

## Background Jobs

The MVP is request-driven. Ongoing protection can be added with Vercel Cron to refresh filters and rescan recent headers after launch. Cron must use the same storage and audit-event path.
