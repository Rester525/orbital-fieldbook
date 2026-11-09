-- Rollback-only regression for cross-account token changes during cloud upload.
begin;
select set_config('app.sync_a',gen_random_uuid()::text,true);
select set_config('app.sync_b',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,is_anonymous)
select current_setting('app.sync_a')::uuid,'sync-fixture-'||current_setting('app.sync_a')||'@example.invalid',now(),false
union all select current_setting('app.sync_b')::uuid,'sync-fixture-'||current_setting('app.sync_b')||'@example.invalid',now(),false;
insert into public.user_fieldbooks(user_id,state,revision) values(current_setting('app.sync_a')::uuid,'{"marker":"A"}',1),(current_setting('app.sync_b')::uuid,'{"marker":"B"}',1);
select set_config('request.jwt.claim.sub',current_setting('app.sync_b'),true);
set local role authenticated;
do $$begin
 begin perform public.save_fieldbook(current_setting('app.sync_a')::uuid,1,'{"marker":"private A"}');raise exception 'cross-account write allowed';exception when insufficient_privilege then null;end;
 if (select state->>'marker' from public.user_fieldbooks where user_id=auth.uid()) is distinct from 'B' then raise exception 'B overwritten with A data';end if;
 begin perform public.save_fieldbook(1,'{"marker":"legacy"}');raise exception 'unbound legacy write allowed';exception when insufficient_privilege then null;end;
 if public.save_fieldbook(current_setting('app.sync_b')::uuid,1,'{"marker":"B2"}') <> 2 then raise exception 'matching-account write failed';end if;
 begin perform public.save_fieldbook(current_setting('app.sync_b')::uuid,1,'{"marker":"stale"}');raise exception 'stale revision accepted';exception when sqlstate 'P0001' then if sqlerrm <> 'stale_revision' then raise;end if;end;
end$$;
reset role;
do $$begin if (select state->>'marker' from public.user_fieldbooks where user_id=current_setting('app.sync_a')::uuid) is distinct from 'A' then raise exception 'source account changed';end if;end$$;
select 'Identity-bound sync: cross-account and legacy denial, matching account success, stale revision denial passed' as result;
rollback;
