drop policy if exists "staff review all listings" on public.listings;
create policy "staff review all listings"
on public.listings
for select
using (
  exists (
    select 1
    from public.profiles staff
    where staff.id = auth.uid()
      and staff.role in ('admin', 'analyst')
  )
);

drop policy if exists "staff update listing review status" on public.listings;
create policy "staff update listing review status"
on public.listings
for update
using (
  exists (
    select 1
    from public.profiles staff
    where staff.id = auth.uid()
      and staff.role in ('admin', 'analyst')
  )
)
with check (
  exists (
    select 1
    from public.profiles staff
    where staff.id = auth.uid()
      and staff.role in ('admin', 'analyst')
  )
);
