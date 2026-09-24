# Supabase security setup

The previous UI queried an `admin_logins` table from the browser with an admin ID and plaintext password. Do not retain that flow. A browser can always inspect and change `localStorage`, so it must never be used as an authorization decision.

## Required before release

1. Rotate the project anonymous key that was committed previously. Store the replacement in the deployment environment as `VITE_SUPABASE_ANON_KEY` and set `VITE_SUPABASE_URL`; use `.env.local` only for local development.
2. Create administrator accounts in **Supabase Auth** and disable public sign-up for this portal. Require confirmed email and MFA for administrators.
3. Give each administrator server-controlled app metadata. Do this in the Supabase dashboard or an Admin API running on a trusted server, never from this app:

   ```json
   { "role": "admin", "village_name": "Balli", "village_id": "<uuid>" }
   ```

4. Enable Row Level Security (RLS) on every exposed table. The client’s admin-route check is only a user-experience guard; RLS is the actual protection.
5. Remove browser access to the legacy `admin_logins` table after all admin accounts have been migrated to Supabase Auth. Password values in that table should be deleted after a safe migration and password reset.

## Provisioning multiple villages

Create one row per village. The generated `id` is the value to place in the administrator's `app_metadata.village_id`:

```sql
create table if not exists public.villages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

insert into public.villages (name)
values ('Balli'), ('Cansaulim')
on conflict (name) do nothing;

select id, name from public.villages order by name;
```

For each Auth user, update the metadata from the SQL editor after creating the user in **Authentication > Users**. Replace the email and village name for each administrator:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object(
    'role', 'admin',
    'village_name', 'Balli',
    'village_id', (select id::text from public.villages where name = 'Balli')
  )
where email = 'balli@panchayat.local';
```

Repeat the update for another user, for example `cansaulim@panchayat.local` and `Cansaulim`. Make sure every row in `public.issues` has the matching `village_id`; the frontend and the RLS policies both use that value to isolate dashboards.

## Issue-table policy template

Adapt `village_id` to the actual column name and type before running this in the Supabase SQL editor. This gives signed-in administrators access only to their own panchayat’s records. It deliberately grants no anonymous read access.

```sql
alter table public.issues enable row level security;

drop policy if exists "admins read only their village issues" on public.issues;
create policy "admins read only their village issues"
on public.issues
for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and village_id::text = (auth.jwt() -> 'app_metadata' ->> 'village_id')
);

drop policy if exists "admins update only their village issues" on public.issues;
create policy "admins update only their village issues"
on public.issues
for update
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and village_id::text = (auth.jwt() -> 'app_metadata' ->> 'village_id')
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and village_id::text = (auth.jwt() -> 'app_metadata' ->> 'village_id')
);
```

Use a Supabase Edge Function (or another server endpoint) for future citizen report submissions. It should validate category, message length, coordinate bounds, media type/size, CAPTCHA or rate limits, deduplicate reports, enqueue the work, and insert with a service role. Do not make `issues` broadly writable from anonymous browsers.

## Hosting controls

Set HTTPS-only, Content-Security-Policy, Referrer-Policy, `X-Content-Type-Options: nosniff`, and clickjacking protection at the host/CDN. GitHub Pages cannot set custom response headers, so use a host/CDN with header controls before a production launch. Restrict Supabase Auth redirect URLs and allowed origins to the final site domain.
