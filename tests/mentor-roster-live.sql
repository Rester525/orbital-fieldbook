-- Owner-only team roster integration/security checks. All fixtures roll back.
begin;
select set_config('app.roster_before',(select count(*)::text from auth.users u where u.last_sign_in_at is not null and u.email_confirmed_at is not null and not u.is_anonymous and u.deleted_at is null),true);
do $$declare k text;begin foreach k in array array['owner','progress','unsynced','malformed','never','unconfirmed','anonymous','deleted'] loop perform set_config('app.roster_'||k,gen_random_uuid()::text,true);end loop;end$$;
insert into auth.users(id,email,created_at,last_sign_in_at,email_confirmed_at,is_anonymous,deleted_at,raw_user_meta_data)
select current_setting('app.roster_'||k)::uuid,'roster-fixture-'||current_setting('app.roster_'||k)||'@example.invalid','2000-01-01'::timestamptz,
 case when k='never' then null else now() end,case when k='unconfirmed' then null else now() end,k='anonymous',case when k='deleted' then now() else null end,'{"role":"mentor"}'::jsonb
from unnest(array['owner','progress','unsynced','malformed','never','unconfirmed','anonymous','deleted']) k;
update public.mentor_owner_settings set allowed_email='roster-fixture-'||current_setting('app.roster_owner')||'@example.invalid',user_id=null;
insert into public.user_fieldbooks(user_id,state) values
(current_setting('app.roster_progress')::uuid,'{"schemaVersion":1,"missions":{"1":{"steps":[true,true,true,true],"evidence":"PRIVATE_SENTINEL"},"2":{"steps":[true,false,true,false]},"3":{"steps":[true,true,true,true,false]},"11":{"steps":true},"12":{"steps":[true,true,true,true]}},"attempts":[{"questionId":"q1","lessonId":"l1","correct":true},{"questionId":"q2","lessonId":"l2","correct":false},{"questionId":"q3","lessonId":"l3","correct":null},7,{"correct":"yes"}],"notes":["PRIVATE_SENTINEL"],"exam":{"answers":{"q":"PRIVATE_SENTINEL"}}}'::jsonb),
(current_setting('app.roster_malformed')::uuid,'{"schemaVersion":1,"missions":[],"attempts":{}}'::jsonb);
select set_config('request.jwt.claim.sub',current_setting('app.roster_owner'),true);
set local role authenticated;
do $$declare r jsonb;m jsonb;begin
 r:=public.mentor_team_roster(0,100);
 if (r->>'total')::int <> current_setting('app.roster_before')::int+4 then raise exception 'eligibility total incorrect';end if;
 if r::text like '%PRIVATE_SENTINEL%' then raise exception 'private fieldbook content leaked';end if;
 select value into m from jsonb_array_elements(r->'members') where value->>'user_id'=current_setting('app.roster_progress');
 if m->>'completed_weeks' is distinct from '1' or m->>'completed_steps' is distinct from '6' or m->>'practice_attempts' is distinct from '3' or m->>'mcq_attempts' is distinct from '2' or m->>'mcq_correct' is distinct from '1' then raise exception 'progress summary incorrect';end if;
 if exists(select 1 from jsonb_object_keys(m) k where k not in ('user_id','email','created_at','last_sign_in_at','is_mentor','last_synced_at','has_progress','completed_weeks','completed_steps','practice_attempts','mcq_attempts','mcq_correct')) then raise exception 'unexpected private fields';end if;
 select value into m from jsonb_array_elements(r->'members') where value->>'user_id'=current_setting('app.roster_unsynced');
 if m->>'has_progress' is distinct from 'false' or m->'completed_weeks' is distinct from 'null'::jsonb or m->'last_synced_at' is distinct from 'null'::jsonb then raise exception 'unsynced progress fabricated';end if;
 select value into m from jsonb_array_elements(r->'members') where value->>'user_id'=current_setting('app.roster_malformed');
 if m->>'has_progress' is distinct from 'false' or m->'completed_weeks' is distinct from 'null'::jsonb then raise exception 'malformed progress not handled';end if;
 if jsonb_array_length(public.mentor_team_roster(0,1)->'members') <> 1 then raise exception 'page limit ignored';end if;
 if public.mentor_team_roster(0,1)->'members' = public.mentor_team_roster(1,1)->'members' then raise exception 'offset ignored';end if;
 if jsonb_array_length(public.mentor_team_roster(100000,1)->'members') <> 0 then raise exception 'past-end page not empty';end if;
 begin perform public.mentor_team_roster(-1,50);raise exception 'negative offset allowed';exception when invalid_parameter_value then null;end;
 begin perform public.mentor_team_roster(0,101);raise exception 'oversized page allowed';exception when invalid_parameter_value then null;end;
 if exists(select 1 from public.user_fieldbooks where user_id=current_setting('app.roster_progress')::uuid) then raise exception 'mentor can read another raw fieldbook';end if;
end$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('app.roster_progress'),true);
set local role authenticated;
do $$begin begin perform public.mentor_team_roster();raise exception 'student or forged metadata gained roster';exception when insufficient_privilege then null;end;end$$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('app.roster_unconfirmed'),true);
set local role authenticated;
do $$begin begin perform public.mentor_team_roster();raise exception 'unconfirmed account gained roster';exception when insufficient_privilege then null;end;end$$;
reset role;
set local role anon;
do $$begin begin perform public.mentor_team_roster();raise exception 'anonymous roster allowed';exception when insufficient_privilege then null;end;end$$;
reset role;
update public.mentor_accounts set revoked_at=now() where user_id=current_setting('app.roster_owner')::uuid;
select set_config('request.jwt.claim.sub',current_setting('app.roster_owner'),true);
set local role authenticated;
do $$begin begin perform public.mentor_team_roster();raise exception 'revoked owner gained roster';exception when insufficient_privilege then null;end;end$$;
reset role;
select 'Team roster authorization, summary, privacy and pagination assertions passed; fixtures rolled back' as result;
rollback;
