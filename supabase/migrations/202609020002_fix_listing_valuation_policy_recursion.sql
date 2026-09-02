-- public.listings' "public can discover qualified published listings" policy
-- subqueries public.valuations, and public.valuations' "valuation outputs
-- are readable with listing" policy subqueries public.listings back. Since
-- both tables have RLS enabled, each subquery re-evaluates the other
-- table's policies, which re-enters the first table's policy, and so on.
-- Postgres detects this and raises "infinite recursion detected in policy
-- for relation listings" -- on every select against public.listings, for
-- every role, including listing owners and staff. That breaks the app's
-- own listing reads (My Vault, the admin review queue), not just public
-- discovery.
--
-- Break the cycle by checking qualification through a SECURITY DEFINER
-- function that reads valuations directly. Because the function owner
-- owns public.valuations (created in the same migration flow) and
-- FORCE ROW LEVEL SECURITY was never set on it, the function's internal
-- query bypasses valuations' RLS entirely, so it never re-enters
-- listings' policy. This only changes how that one policy is evaluated;
-- it grants no new access.

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
