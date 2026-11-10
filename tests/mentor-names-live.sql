-- Display-name metadata is display-only; all fixtures and designation roll back.
begin;
select set_config('app.names_owner',gen_random_uuid()::text,true);
select set_config('app.names_student',gen_random_uuid()::text,true);
insert into auth.users(id,email,created_at,last_sign_in_at,email_confirmed_at,is_anonymous,raw_user_meta_data)
select current_setting('app.names_'||k)::uuid,'names-fixture-'||current_setting('app.names_'||k)||'@example.invalid','0001-01-01'::timestamptz,now(),now(),false,
 case when k='owner' then '{}'::jsonb else '{"display_name":"  Alex Rivera  ","role":"mentor","private":"UNSHARED_METADATA"}'::jsonb end
from unnest(array['owner','student']) k;
update public.mentor_owner_settings set allowed_email='names-fixture-'||current_setting('app.names_owner')||'@example.invalid',user_id=null;
select set_config('request.jwt.claim.sub',current_setting('app.names_owner'),true);
set local role authenticated;
do $$declare r jsonb;m jsonb;begin
 r:=public.mentor_team_roster(0,100);
 select value into m from jsonb_array_elements(r->'members') where value->>'user_id'=current_setting('app.names_student');
 if m->>'display_name' is distinct from 'Alex Rivera' then raise exception 'name not returned and trimmed';end if;
 if m->>'is_mentor' is distinct from 'false' then raise exception 'metadata elevated student';end if;
 if r::text like '%UNSHARED_METADATA%' then raise exception 'unrelated metadata leaked';end if;
 select value into m from jsonb_array_elements(r->'members') where value->>'user_id'=current_setting('app.names_owner');
 if m->'display_name' is distinct from 'null'::jsonb then raise exception 'missing name not nullable';end if;
end$$;
reset role;
do $$declare v jsonb;r jsonb;m jsonb;begin
 foreach v in array array['null'::jsonb,'123'::jsonb,'true'::jsonb,'[]'::jsonb,'{}'::jsonb,to_jsonb('   '::text),to_jsonb(repeat('x',81))] loop
  update auth.users set raw_user_meta_data=jsonb_build_object('display_name',v) where id=current_setting('app.names_student')::uuid;
  r:=public.mentor_team_roster(0,100);
  select value into m from jsonb_array_elements(r->'members') where value->>'user_id'=current_setting('app.names_student');
  if m->'display_name' is distinct from 'null'::jsonb then raise exception 'malformed name not null';end if;
 end loop;
end$$;
select set_config('request.jwt.claim.sub',current_setting('app.names_student'),true);
set local role authenticated;
do $$begin begin perform public.mentor_team_roster();raise exception 'student gained roster';exception when insufficient_privilege then null;end;end$$;
reset role;
set local role anon;
do $$begin begin perform public.mentor_team_roster();raise exception 'anonymous gained roster';exception when insufficient_privilege then null;end;end$$;
reset role;
select 'Display names, malformed metadata, privacy and authorization passed; fixtures rolled back' as result;
rollback;
