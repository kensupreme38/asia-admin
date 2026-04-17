-- Optional: allow the public (anon) site to read active venues without using the service role in API routes.
-- Apply in Supabase SQL editor if you prefer RLS + anon read instead of server-side service role.

alter table if exists public.venues enable row level security;

drop policy if exists "venues_select_active_public" on public.venues;
create policy "venues_select_active_public"
on public.venues
for select
to anon, authenticated
using (status = 'active');
