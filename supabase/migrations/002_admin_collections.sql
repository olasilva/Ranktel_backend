create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  data jsonb not null
);

create table if not exists public.outreach (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  data jsonb not null
);

create unique index if not exists products_slug_idx on public.products ((data->>'slug'));
create index if not exists outreach_created_at_idx on public.outreach (created_at desc);
alter table public.products enable row level security;
alter table public.outreach enable row level security;
