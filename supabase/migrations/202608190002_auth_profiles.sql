create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role public.user_role;
begin
  requested_role := case new.raw_user_meta_data ->> 'role'
    when 'seller' then 'seller'::public.user_role
    when 'agent' then 'agent'::public.user_role
    else 'buyer'::public.user_role
  end;

  insert into public.profiles (id, role, full_name, phone)
  values (
    new.id,
    requested_role,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create policy "users can create own profile"
on public.profiles for insert
with check (auth.uid() = id);

grant usage on schema public to anon, authenticated;
grant select on public.listings, public.valuations to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.listings to authenticated;
