# Panchayat Tourism Intelligence System

An administrator dashboard for monitoring tourism-related issues in a panchayat. The current implementation includes authenticated admin access, a live issue registry, status summaries, a Supabase Realtime-backed heatmap, and a seven-day reports chart.

## Run locally

```bash
cp .env.example .env.local
npm install
npm run dev
```

Fill the two environment variables with the project URL and a rotated Supabase anonymous key. Create Supabase Auth users with `app_metadata.role` set to `admin` before signing in. The login form accepts a village name and maps it to the Supabase Auth identifier `<normalized-village-name>@panchayat.local`; for example, `Balli` uses `balli@panchayat.local`. Create or provision the Auth user with that identifier and a password. The expected `issues` fields are `id`, `citizen_name`, `type`, `status`, `created_at`, `latitude`, `longitude`, and optional `severity`.

## Brief cross-check

| Brief item | Status |
| --- | --- |
| Admin monitoring dashboard | Built; registry, summary cards and read-only detail panel are present. |
| Real-time heatmap | Built in the UI; enable the `issues` table in Supabase Realtime and apply RLS. |
| Category/status filtering | Partly built; the dashboard sorts but has no citizen-facing report filters. |
| Geotagged citizen report flow | Not built. |
| Queue-based report ingestion | Not built. |
| Geo-clustering and deduplication | Not built. |
| Time-series analytics pipeline | Partly built; a seven-day client view exists, not a pipeline. |
| Priority scoring | Not built. |
| Hotspot prediction and similar-issue AI | Not built. |

See [Supabase security setup](supabase/SECURITY_SETUP.md) for the mandatory production-side controls and the RLS policy template.
