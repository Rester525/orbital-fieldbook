-- HISTORICAL: only for the original activation migration before owner_only_mentor.
-- For the current deployment use mentor-owner-live.sql instead.
-- Execute as postgres against the intended project. All fixture data rolls back.
-- No real account, roster, or production activation secret is returned.
begin;
select pg_catalog.set_config('app.mentor_test_a',pg_catalog.gen_random_uuid()::text,true);
select pg_catalog.set_config('app.mentor_test_b',pg_catalog.gen_random_uuid()::text,true);
select pg_catalog.set_config('app.mentor_test_unconfirmed',pg_catalog.gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,is_anonymous,raw_user_meta_data)
select current_setting('app.mentor_test_a')::uuid,'mentor-test-'||current_setting('app.mentor_test_a')||'@example.invalid',now(),false,'{}'::jsonb
union all select current_setting('app.mentor_test_b')::uuid,'mentor-test-'||current_setting('app.mentor_test_b')||'@example.invalid',now(),false,'{"role":"mentor"}'::jsonb
union all select current_setting('app.mentor_test_unconfirmed')::uuid,'mentor-test-'||current_setting('app.mentor_test_unconfirmed')||'@example.invalid',null,false,'{}'::jsonb;
insert into public.mentor_activation_secrets(singleton,code_hash,enabled,failed_attempts,window_started)
values(true,extensions.crypt('fixture-mentor-code',extensions.gen_salt('bf',4)),true,0,now())
on conflict(singleton) do update set code_hash=excluded.code_hash,enabled=true,expires_at=null,failed_attempts=0,window_started=now();

set local role anon;
do $$begin
  begin perform public.redeem_mentor_code('fixture-mentor-code');raise exception 'anon redemption unexpectedly permitted';exception when insufficient_privilege then null;end;
  begin perform public.mentor_access_status();raise exception 'anon role query unexpectedly permitted';exception when insufficient_privilege then null;end;
end$$;
reset role;
select pg_catalog.set_config('request.jwt.claim.sub',current_setting('app.mentor_test_a'),true);
set local role authenticated;
do $$begin
  if public.mentor_access_status() is distinct from '{"is_mentor":false}'::jsonb then raise exception 'initial status incorrect';end if;
  begin perform 1 from public.mentor_activation_secrets;raise exception 'secret table exposed';exception when insufficient_privilege then null;end;
  begin insert into public.mentor_accounts(user_id) values(auth.uid());raise exception 'self role escalation allowed';exception when insufficient_privilege then null;end;
  if public.redeem_mentor_code('wrong')->>'reason' is distinct from 'invalid' then raise exception 'wrong code accepted';end if;
  if public.redeem_mentor_code('fixture-mentor-code')->>'ok' is distinct from 'true' then raise exception 'correct code denied';end if;
  if public.mentor_access_status() is distinct from '{"is_mentor":true}'::jsonb then raise exception 'grant readback failed';end if;
end$$;
reset role;
select pg_catalog.set_config('request.jwt.claim.sub',current_setting('app.mentor_test_b'),true);
set local role authenticated;
do $$begin
  if public.mentor_access_status() is distinct from '{"is_mentor":false}'::jsonb then raise exception 'peer grant or forged metadata leaked';end if;
  for i in 1..5 loop
    if public.redeem_mentor_code('wrong')->>'reason' is distinct from 'invalid' then raise exception 'invalid attempt behavior incorrect';end if;
  end loop;
  if public.redeem_mentor_code('fixture-mentor-code')->>'reason' is distinct from 'rate_limited' then raise exception 'account limiter bypassed';end if;
end$$;
reset role;
do $$begin
  if (select failed_attempts from public.mentor_activation_attempts where user_id=current_setting('app.mentor_test_b')::uuid) is distinct from 5 then raise exception 'failed attempt counter rolled back';end if;
end$$;
update public.mentor_activation_attempts set window_started=now()-interval '16 minutes' where user_id=current_setting('app.mentor_test_b')::uuid;
update public.mentor_activation_secrets set failed_attempts=30,window_started=now() where singleton;
set local role authenticated;
do $$begin
  if public.redeem_mentor_code('fixture-mentor-code')->>'reason' is distinct from 'rate_limited' then raise exception 'global limiter bypassed';end if;
end$$;
reset role;
update public.mentor_activation_secrets set window_started=now()-interval '16 minutes' where singleton;
set local role authenticated;
do $$begin
  if public.redeem_mentor_code('fixture-mentor-code')->>'ok' is distinct from 'true' then raise exception 'limiter did not recover after window';end if;
end$$;
reset role;
update public.mentor_accounts set revoked_at=now() where user_id=current_setting('app.mentor_test_a')::uuid;
select pg_catalog.set_config('request.jwt.claim.sub',current_setting('app.mentor_test_a'),true);
set local role authenticated;
do $$begin
  if public.mentor_access_status() is distinct from '{"is_mentor":false}'::jsonb then raise exception 'revoked role still active';end if;
  if public.redeem_mentor_code('fixture-mentor-code')->>'reason' is distinct from 'revoked' then raise exception 'revoked user regranted self';end if;
end$$;
reset role;
select pg_catalog.set_config('request.jwt.claim.sub',current_setting('app.mentor_test_unconfirmed'),true);
set local role authenticated;
do $$begin
  if public.redeem_mentor_code('fixture-mentor-code')->>'reason' is distinct from 'auth_required' then raise exception 'unconfirmed user accepted';end if;
end$$;
reset role;
update auth.users set email_confirmed_at=now() where id=current_setting('app.mentor_test_unconfirmed')::uuid;
update public.mentor_activation_secrets set expires_at=now()-interval '1 minute' where singleton;
set local role authenticated;
do $$begin
  if public.redeem_mentor_code('fixture-mentor-code')->>'reason' is distinct from 'unavailable' then raise exception 'expired code accepted';end if;
end$$;
reset role;
update public.mentor_activation_secrets set expires_at=null,enabled=false where singleton;
set local role authenticated;
do $$begin
  if public.redeem_mentor_code('fixture-mentor-code')->>'reason' is distinct from 'unavailable' then raise exception 'disabled code accepted';end if;
end$$;
reset role;
rollback;
select 'mentor activation SQL assertions passed; fixtures rolled back' as result;
