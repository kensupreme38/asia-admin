alter table if exists public.venues
add column if not exists map_embed_url text;
