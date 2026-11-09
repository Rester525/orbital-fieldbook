-- Bind every upload to the identity whose local fieldbook it contains.
-- An auth-session change while a request is acquiring its JWT must fail closed.
create function public.save_fieldbook(p_user_id uuid, p_expected_revision bigint, p_state jsonb)
returns bigint language plpgsql security invoker set search_path = '' as $$
declare next_revision bigint;
begin
  if auth.uid() is null or p_user_id is distinct from auth.uid() then
    raise exception 'Account changed; reload before syncing' using errcode = '42501';
  end if;
  if p_state is null or pg_catalog.jsonb_typeof(p_state) <> 'object' or pg_catalog.octet_length(p_state::text) > 2000000 then
    raise exception 'Invalid or oversized fieldbook' using errcode = '22023';
  end if;
  if p_expected_revision = 0 then
    insert into public.user_fieldbooks(user_id,state,revision) values(p_user_id,p_state,1)
    on conflict(user_id) do nothing returning revision into next_revision;
  elsif p_expected_revision > 0 then
    update public.user_fieldbooks set state=p_state,revision=revision+1,updated_at=now()
      where user_id=p_user_id and revision=p_expected_revision returning revision into next_revision;
  end if;
  if next_revision is null then raise exception 'stale_revision' using errcode = 'P0001';end if;
  return next_revision;
end;
$$;
revoke all on function public.save_fieldbook(uuid,bigint,jsonb) from public, anon;
grant execute on function public.save_fieldbook(uuid,bigint,jsonb) to authenticated;
-- Older cached clients must update; their unsynced work stays local.
revoke all on function public.save_fieldbook(bigint,jsonb) from public, anon, authenticated;
