-- VaultKey independent valuation router foundation.
-- Sellers provide the asking price and asset facts only. They never provide or edit market value.

do $$ begin
  create type public.valuation_run_status as enum ('queued', 'running', 'completed', 'failed', 'needs_data');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.valuation_tier as enum ('vault_pick', 'qualified', 'not_qualified', 'low_confidence', 'appraisal_required');
exception when duplicate_object then null;
end $$;

create table if not exists public.valuation_runs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  status public.valuation_run_status not null default 'queued',
  asset_class public.asset_class not null,
  asset_snapshot jsonb not null default '{}'::jsonb,
  required_source_count integer not null default 2 check (required_source_count >= 1),
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.valuation_estimates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.valuation_runs(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  provider text not null,
  provider_reference text,
  methodology text not null,
  market_value_cents bigint not null check (market_value_cents > 0),
  confidence numeric(5,2) not null check (confidence between 0 and 100),
  evidence jsonb not null default '{}'::jsonb,
  raw_response jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  unique (run_id, provider, methodology)
);

create table if not exists public.valuation_consensus (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null unique references public.valuation_runs(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  conservative_value_cents bigint not null check (conservative_value_cents > 0),
  median_value_cents bigint not null check (median_value_cents > 0),
  source_count integer not null check (source_count >= 1),
  confidence numeric(5,2) not null check (confidence between 0 and 100),
  discount_percent numeric(6,2) not null,
  tier public.valuation_tier not null,
  qualification_status public.qualification_status not null,
  explanation jsonb not null default '{}'::jsonb,
  calculated_at timestamptz not null default now()
);

create table if not exists public.valuation_provider_registry (
  provider text primary key,
  asset_classes public.asset_class[] not null,
  enabled boolean not null default false,
  priority integer not null default 100,
  configuration jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.valuation_provider_registry (provider, asset_classes, priority, configuration)
values
  ('attom', array['residential','multifamily']::public.asset_class[], 10, '{"purpose":"property facts, AVM and comparable sales"}'),
  ('clear_capital', array['residential','multifamily']::public.asset_class[], 20, '{"purpose":"independent AVM or appraisal"}'),
  ('regrid', array['land']::public.asset_class[], 10, '{"purpose":"parcel, zoning and land facts"}'),
  ('commercial_comps', array['multifamily','commercial']::public.asset_class[], 10, '{"purpose":"sale and lease comparables"}'),
  ('income_approach', array['multifamily','commercial','business']::public.asset_class[], 20, '{"purpose":"NOI, cap-rate or cash-flow valuation"}'),
  ('verified_financials', array['business']::public.asset_class[], 10, '{"purpose":"verified revenue, SDE, EBITDA and tax-return inputs"}'),
  ('county_records', array['residential','multifamily','commercial','land']::public.asset_class[], 50, '{"purpose":"public-record fallback and fact verification"}')
on conflict (provider) do nothing;

create or replace function public.vaultkey_qualification(
  asking_price_cents bigint,
  conservative_value_cents bigint,
  confidence numeric,
  source_count integer,
  required_source_count integer default 2
)
returns table (
  discount_percent numeric,
  tier public.valuation_tier,
  qualification_status public.qualification_status
)
language sql
immutable
as $$
  select
    round(((conservative_value_cents - asking_price_cents)::numeric / conservative_value_cents::numeric) * 100, 2),
    case
      when confidence < 70 or source_count < required_source_count then 'low_confidence'::public.valuation_tier
      when asking_price_cents <= conservative_value_cents * 0.80 then 'vault_pick'::public.valuation_tier
      when asking_price_cents <= conservative_value_cents * 0.85 then 'qualified'::public.valuation_tier
      else 'not_qualified'::public.valuation_tier
    end,
    case
      when confidence < 70 or source_count < required_source_count then 'low_confidence'::public.qualification_status
      when asking_price_cents <= conservative_value_cents * 0.85 then 'qualified'::public.qualification_status
      else 'does_not_qualify'::public.qualification_status
    end;
$$;

alter table public.valuation_runs enable row level security;
alter table public.valuation_estimates enable row level security;
alter table public.valuation_consensus enable row level security;
alter table public.valuation_provider_registry enable row level security;

drop policy if exists "owners read valuation runs" on public.valuation_runs;
create policy "owners read valuation runs"
on public.valuation_runs for select
using (exists (
  select 1 from public.listings l
  where l.id = listing_id and l.owner_id = auth.uid()
));

drop policy if exists "valuation consensus follows listing access" on public.valuation_consensus;
create policy "valuation consensus follows listing access"
on public.valuation_consensus for select
using (exists (
  select 1 from public.listings l
  where l.id = listing_id and (l.owner_id = auth.uid() or l.status = 'published')
));

-- No client insert/update/delete policies are created for runs, estimates, consensus,
-- or provider configuration. Only trusted server code using the service role may write.
comment on table public.valuation_estimates is
  'Immutable third-party valuation evidence. Never writable by sellers.';
comment on table public.valuation_consensus is
  'VaultKey conservative consensus. 15% qualifies; 20% earns Vault Pick.';
