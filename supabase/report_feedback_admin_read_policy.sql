alter table public.report_feedback enable row level security;

grant select on table public.report_feedback to authenticated;

drop policy if exists "admins read feedback for their village reports" on public.report_feedback;
create policy "admins read feedback for their village reports"
on public.report_feedback
for select
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  and exists (
    select 1
    from public.reports as report
    where report.id = report_feedback.report_id
      and report.village_id::text = (auth.jwt() -> 'app_metadata' ->> 'village_id')
  )
);
