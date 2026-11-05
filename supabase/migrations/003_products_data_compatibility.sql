-- Migration 002 uses a JSON document for product overrides. Explicitly add it
-- for databases where public.products already existed before that migration.
alter table public.products
  add column if not exists data jsonb;

create unique index if not exists products_slug_idx
  on public.products ((data->>'slug'))
  where data is not null;
