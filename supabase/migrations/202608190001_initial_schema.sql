create extension if not exists "pgcrypto";

create type public.user_role as enum ('buyer','seller','agent','admin','analyst');
create type public.asset_class as enum ('residential','multifamily','commercial','land','business');
create type public.qualification_status as enum ('pending','qualified','does_not_qualify','low_confidence','appraisal_required','disputed');
create type public.listing_status as enum ('draft','submitted','under_review','changes_required','rejected','approved','published','paused','sold','archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'buyer',
  full_name text,
  company_name text,
  phone text,
  identity_verified_at timestamptz,
  proof_of_funds_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  asset_class public.asset_class not null,
  subtype text not null,
  title text not null,
  description text,
  city text not null,
  state text not null,
  postal_code text,
  exact_address text,
  hide_exact_address boolean not null default true,
  asking_price_cents bigint not null check (asking_price_cents > 0),
  status public.listing_status not null default 'draft',
  asset_details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.valuations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  provider text not null,
  methodology text not null,
  market_value_cents bigint,
  confidence numeric(5,2),
  qualification_status public.qualification_status not null default 'pending',
  evidence jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now(),
  locked boolean not null default true
);

create table public.access_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  requester_id uuid not null references public.profiles(id),
  status text not null check (status in ('pending','approved','declined','expired','revoked')) default 'pending',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (listing_id, requester_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  status text not null check (status in ('access_request','active','sold','archived')) default 'access_request',
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.valuations enable row level security;
alter table public.access_requests enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "public can discover qualified published listings" on public.listings for select using (
  status = 'published' and exists (select 1 from public.valuations v where v.listing_id = id and v.qualification_status = 'qualified')
);
create policy "owners manage listing drafts" on public.listings for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
create policy "valuation outputs are readable with listing" on public.valuations for select using (exists (select 1 from public.listings l where l.id = listing_id and (l.status = 'published' or l.owner_id = auth.uid())));

comment on table public.valuations is 'Locked independent valuation outputs. Sellers must never update these records directly.';
