create extension if not exists pgcrypto;

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  main_image_url text,
  images text[] default '{}',
  map_embed_url text,
  category text not null default 'KTV',
  address text,
  price text,
  country text,
  phone text,
  hours text,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists venues_status_idx on public.venues(status);
create index if not exists venues_country_idx on public.venues(country);
create index if not exists venues_category_idx on public.venues(category);
create index if not exists venues_created_at_idx on public.venues(created_at desc);
