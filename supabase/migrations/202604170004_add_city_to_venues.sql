alter table if exists public.venues
add column if not exists city text;

create index if not exists venues_city_idx on public.venues(city);
