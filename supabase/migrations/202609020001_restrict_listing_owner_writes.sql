-- The original "owners manage listing drafts" policy on public.listings
-- granted owners full select/insert/update/delete on their own listings.
-- The app only ever inserts a listing once (on submission) and reads it
-- back; it never updates or deletes a listing row as the owner. Because
-- Postgres RLS policies are permissive (OR'd together), that broad grant
-- let a seller call the update/delete API directly against their own
-- listing to change `status` (e.g. self-approve or self-publish, bypassing
-- admin review), or edit the locked ATTOM `asset_details`/asking price
-- after submission. Replace it with owner select + insert only. Staff
-- retain their own update policy from 202608250002_admin_review_policies.sql.

drop policy if exists "owners manage listing drafts" on public.listings;

create policy "owners view own listings"
on public.listings for select
using (auth.uid() = owner_id);

create policy "owners create own listings"
on public.listings for insert
with check (auth.uid() = owner_id);
