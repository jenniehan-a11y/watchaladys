-- Run this in Supabase SQL Editor to create the restaurants table

create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null,
  neighborhood text not null,
  category text not null,
  status text not null check (status in ('want_to_go', 'visited')),
  naver_map_url text,
  instagram_url text,
  memo text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS but allow all operations (public access, no auth)
alter table restaurants enable row level security;

create policy "Allow all select" on restaurants for select using (true);
create policy "Allow all insert" on restaurants for insert with check (true);
create policy "Allow all update" on restaurants for update using (true);
create policy "Allow all delete" on restaurants for delete using (true);

-- Auto-update updated_at on row changes
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger restaurants_updated_at
  before update on restaurants
  for each row execute function update_updated_at();
