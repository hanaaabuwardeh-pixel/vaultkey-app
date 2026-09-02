-- "staff review all listings" and "staff update listing review status"
-- both subquery public.profiles to check the caller's role. Evaluating
-- either policy's USING clause requires the calling role to have SELECT
-- on public.profiles -- but only `authenticated` was ever granted that,
-- not `anon`. So an anonymous request against public.listings fails with
-- "permission denied for table profiles" instead of returning the rows
-- it should be able to see (published listings with a qualified
-- valuation), even after the recursion fix in
-- 202609020002_fix_listing_valuation_policy_recursion.sql.
--
-- Fix it the same way: check staff membership through a SECURITY DEFINER
-- function so the caller never needs direct SELECT on profiles. This does
-- not change who counts as staff or grant anon any new visibility into
-- profiles -- it only changes how the staff check is evaluated.

create or replace function public.current_user_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles staff
    where staff.id = auth.uid()
      and staff.role in ('admin', 'analyst')
  );
$$;

revoke all on function public.current_user_is_staff() from public;
grant execute on function public.current_user_is_staff() to anon, authenticated;

drop policy if exists "staff review all listings" on public.listings;
create policy "staff review all listings"
on public.listings for select
using (public.current_user_is_staff());

drop policy if exists "staff update listing review status" on public.listings;
create policy "staff update listing review status"
on public.listings for update
using (public.current_user_is_staff())
with check (public.current_user_is_staff());
