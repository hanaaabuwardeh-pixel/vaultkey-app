alter table public.listings
  add column if not exists valuation_method text,
  add column if not exists valuation_status text not null default 'pending'
    check (valuation_status in ('pending', 'verified', 'rejected')),
  add column if not exists proof_status text not null default 'pending'
    check (proof_status in ('pending', 'verified', 'rejected')),
  add column if not exists proof_documents jsonb not null default '[]'::jsonb;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-proofs',
  'listing-proofs',
  false,
  15728640,
  array['application/pdf','image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owners upload listing proof" on storage.objects;
create policy "owners upload listing proof"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'listing-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "owners read listing proof" on storage.objects;
create policy "owners read listing proof"
on storage.objects for select to authenticated
using (
  bucket_id = 'listing-proofs'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_vaultkey_staff()
  )
);

create or replace function public.prevent_unverified_listing_publication()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'published'
     and (new.valuation_status <> 'verified' or new.proof_status <> 'verified') then
    raise exception 'Valuation and supporting documents must be verified before publication.';
  end if;
  return new;
end;
$$;

drop trigger if exists require_verified_listing_before_publish on public.listings;
create trigger require_verified_listing_before_publish
before insert or update of status on public.listings
for each row execute function public.prevent_unverified_listing_publication();
