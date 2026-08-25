create table if not exists public.listing_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  current_step integer not null default 1 check (current_step between 1 and 8),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.listing_drafts enable row level security;

drop policy if exists "owners manage listing drafts" on public.listing_drafts;
create policy "owners manage listing drafts"
on public.listing_drafts
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

grant select, insert, update, delete on public.listing_drafts to authenticated;

create index if not exists listing_drafts_owner_updated_idx
on public.listing_drafts (owner_id, updated_at desc);
