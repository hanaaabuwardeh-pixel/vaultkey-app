-- Sellers were able to submit any asking price: the previous "owners
-- manage listing drafts" policy let an authenticated owner insert AND
-- update their own listings directly from the client with no server-side
-- check relating asking_price_cents to any independent valuation. VaultKey
-- requires every listing to be priced at least 10% below ATTOM's
-- estimated market value (fixed 10%/15%/20% tiers, or a "custom" discount
-- strictly greater than 20%). That can only be enforced by a trusted
-- server process that fetches its own ATTOM value and writes it alongside
-- the listing -- never by trusting a value the browser sends, and never
-- if the browser can write these columns directly afterward either. See
-- the property-data edge function's new `submit` action.

alter table public.listings
  add column if not exists market_value_cents bigint,
  add column if not exists discount_cents bigint,
  add column if not exists discount_percent numeric(6,2),
  add column if not exists pricing_tier text;

alter table public.listings
  drop constraint if exists listings_pricing_tier_check;
alter table public.listings
  add constraint listings_pricing_tier_check
  check (pricing_tier is null or pricing_tier in ('10_percent', '15_percent', '20_percent', 'custom', 'pending_valuation'));

comment on column public.listings.market_value_cents is
  'Authoritative ATTOM AVM value in cents, fetched and written server-side only by the property-data edge function. Never settable by clients.';
comment on column public.listings.discount_cents is
  'market_value_cents - asking_price_cents, server-computed at submission time.';
comment on column public.listings.discount_percent is
  'Server-computed discount percent below market_value_cents, rounded to 2 decimal places.';
comment on column public.listings.pricing_tier is
  '10_percent / 15_percent / 20_percent / custom / pending_valuation (ATTOM had no AVM for this property at submission time). Server-computed only.';

-- Listings may now only be created by the property-data edge function
-- (service role, after independently fetching ATTOM's value and
-- validating the submitted price against it). A direct client insert or
-- update policy would let a seller write any asking_price_cents /
-- market_value_cents / pricing_tier combination straight into the table,
-- defeating server-side validation entirely -- including after the fact,
-- on a listing that was validated correctly at submission time.
drop policy if exists "owners manage listing drafts" on public.listings;

create policy "owners view own listings"
on public.listings for select
using (auth.uid() = owner_id);

-- Found while testing this change, and fixed here because it directly
-- blocks the feature above: public.listings' "public can discover
-- qualified published listings" policy subqueries public.valuations, and
-- public.valuations' own read policy subqueries public.listings right
-- back. Since both tables have RLS enabled, evaluating either policy
-- re-enters the other, and Postgres raises "infinite recursion detected
-- in policy for relation listings" on ANY select against public.listings
-- -- including a seller reading their own listings in My Vault, which is
-- exactly where the new market_value_cents/discount_percent/pricing_tier
-- columns need to be visible. Break the cycle by checking qualification
-- through a SECURITY DEFINER function that reads valuations directly:
-- because the function owner owns public.valuations and FORCE ROW LEVEL
-- SECURITY was never set on it, its internal query bypasses valuations'
-- RLS and never re-enters listings' policy. This changes only how that
-- one policy is evaluated; it grants no new access.
create or replace function public.listing_has_qualified_valuation(target_listing_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.valuations v
    where v.listing_id = target_listing_id
      and v.qualification_status = 'qualified'
  );
$$;

revoke all on function public.listing_has_qualified_valuation(uuid) from public;
grant execute on function public.listing_has_qualified_valuation(uuid) to anon, authenticated;

drop policy if exists "public can discover qualified published listings" on public.listings;
create policy "public can discover qualified published listings"
on public.listings for select
using (
  status = 'published'
  and public.listing_has_qualified_valuation(id)
);
