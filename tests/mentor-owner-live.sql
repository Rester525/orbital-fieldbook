-- Postgres-only, rollback-only fixtures for the CURRENT owner-only model.
begin;
select set_config('app.owner_fixture',gen_random_uuid()::text,true);
select set_config('app.other_fixture',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,is_anonymous,raw_user_meta_data)
select current_setting('app.owner_fixture')::uuid,'owner-'||current_setting('app.owner_fixture')||'@example.invalid',null,false,'{}'::jsonb
union all select current_setting('app.other_fixture')::uuid,'other-'||current_setting('app.other_fixture')||'@example.invalid',now(),false,'{"role":"mentor"}'::jsonb;
update public.mentor_owner_settings set allowed_email='owner-'||current_setting('app.owner_fixture')||'@example.invalid',user_id=null;
select set_config('request.jwt.claim.sub',current_setting('app.other_fixture'),true);
set local role authenticated;
do $$begin
 if public.mentor_access_status() is distinct from '{"is_mentor":false}'::jsonb then raise exception 'nonowner or forged metadata accepted';end if;
 begin perform public.redeem_mentor_code('retired-code');raise exception 'redemption still available';exception when insufficient_privilege then null;end;
 begin perform 1 from public.mentor_owner_settings;raise exception 'owner designation exposed';exception when insufficient_privilege then null;end;
 begin insert into public.mentor_accounts(user_id) values(auth.uid());raise exception 'self escalation allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('app.owner_fixture'),true);
set local role authenticated;
do $$begin if public.mentor_access_status() is distinct from '{"is_mentor":false}'::jsonb then raise exception 'unconfirmed owner accepted';end if;end$$;
reset role;
update auth.users set email_confirmed_at=now() where id=current_setting('app.owner_fixture')::uuid;
set local role authenticated;
do $$begin if public.mentor_access_status() is distinct from '{"is_mentor":true}'::jsonb then raise exception 'confirmed owner not granted';end if;end$$;
reset role;
do $$begin if (select user_id from public.mentor_owner_settings where singleton) is distinct from current_setting('app.owner_fixture')::uuid then raise exception 'owner UUID not bound';end if;end$$;
-- Even a different verified email now matching the configured email cannot take a bound role.
update public.mentor_owner_settings set allowed_email='other-'||current_setting('app.other_fixture')||'@example.invalid';
select set_config('request.jwt.claim.sub',current_setting('app.other_fixture'),true);
set local role authenticated;
do $$begin if public.mentor_access_status() is distinct from '{"is_mentor":false}'::jsonb then raise exception 'owner UUID replaced';end if;end$$;
reset role;
update public.mentor_accounts set revoked_at=now() where user_id=current_setting('app.owner_fixture')::uuid;
select set_config('request.jwt.claim.sub',current_setting('app.owner_fixture'),true);
set local role authenticated;
do $$begin if public.mentor_access_status() is distinct from '{"is_mentor":false}'::jsonb then raise exception 'revoked owner restored';end if;end$$;
reset role;
set local role anon;
do $$begin
 begin perform public.mentor_access_status();raise exception 'anonymous role query allowed';exception when insufficient_privilege then null;end;
 begin perform public.redeem_mentor_code('retired-code');raise exception 'anonymous redemption allowed';exception when insufficient_privilege then null;end;
end$$;
reset role;
select 'owner-only permission assertions passed; rolling back fixtures' as result;
rollback;
