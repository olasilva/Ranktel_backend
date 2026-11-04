create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  data jsonb not null
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  data jsonb not null
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  data jsonb not null
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists reviews_created_at_idx on public.reviews (created_at desc);
create index if not exists subscribers_email_idx on public.subscribers ((data->>'email'));

alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.subscribers enable row level security;
