alter table public.profiles
  add column username text not null,
  add constraint profiles_username_valid check (
    username = btrim(username)
    and char_length(username) between 3 and 20
    and username ~ '^[A-Za-z0-9][A-Za-z0-9_]{2,19}$'
  );

create unique index profiles_username_lower_unique
  on public.profiles (lower(username));

grant insert (id, username) on table public.profiles
  to authenticated;

grant update (username) on table public.profiles
  to authenticated;

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
