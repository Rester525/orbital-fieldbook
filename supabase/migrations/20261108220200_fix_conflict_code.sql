-- P0001 is a normal application conflict; SQLSTATE 40001 invites automatic
-- serialization retries by gateways and can hang a stale client request.
create or replace function public.save_fieldbook(p_expected_revision bigint, p_state jsonb)
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
  if next_revision is null then raise exception 'stale_revision' using errcode = 'P0001'; end if;
  return next_revision;
end;
$$;
