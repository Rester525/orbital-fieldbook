-- One private, revisioned fieldbook per authenticated user.
create table public.user_fieldbooks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null check (jsonb_typeof(state) = 'object' and octet_length(state::text) <= 2000000),
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);

alter table public.user_fieldbooks enable row level security;
revoke all on public.user_fieldbooks from anon;
grant select, insert, update on public.user_fieldbooks to authenticated;

create policy "owner can read fieldbook" on public.user_fieldbooks
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "owner can create fieldbook" on public.user_fieldbooks
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "owner can update fieldbook" on public.user_fieldbooks
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Compare-and-swap prevents a stale device silently overwriting newer cloud work.
create function public.save_fieldbook(p_expected_revision bigint, p_state jsonb)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare next_revision bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' or octet_length(p_state::text) > 2000000 then
    raise exception 'Invalid or oversized fieldbook' using errcode = '22023';
  end if;
  if p_expected_revision = 0 then
    insert into public.user_fieldbooks(user_id, state, revision)
    values (auth.uid(), p_state, 1)
    on conflict (user_id) do nothing returning revision into next_revision;
  elsif p_expected_revision > 0 then
    update public.user_fieldbooks
       set state = p_state, revision = revision + 1, updated_at = now()
     where user_id = auth.uid() and revision = p_expected_revision
    returning revision into next_revision;
  end if;
  if next_revision is null then raise exception 'stale_revision' using errcode = '40001'; end if;
  return next_revision;
end;
$$;
revoke all on function public.save_fieldbook(bigint, jsonb) from public, anon;
grant execute on function public.save_fieldbook(bigint, jsonb) to authenticated;
