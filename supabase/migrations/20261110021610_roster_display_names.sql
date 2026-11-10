-- Display-only signup names; metadata never grants mentor access.
create or replace function public.mentor_team_roster(p_offset integer default 0, p_limit integer default 50)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  result jsonb;
begin
  if public.mentor_access_status()->>'is_mentor' is distinct from 'true' then
    raise exception 'Mentor access required' using errcode = '42501';
  end if;
  if p_offset is null or p_offset < 0 or p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception 'Invalid roster page' using errcode = '22023';
  end if;
  with eligible as materialized (
    select u.id as user_id, u.email,
      case when pg_catalog.jsonb_typeof(u.raw_user_meta_data->'display_name') = 'string'
        and pg_catalog.char_length(pg_catalog.btrim(u.raw_user_meta_data->>'display_name', E' \t\n\r')) between 1 and 80
        then pg_catalog.btrim(u.raw_user_meta_data->>'display_name', E' \t\n\r') else null end as display_name,
      u.created_at, u.last_sign_in_at, u.id = actor as is_mentor
    from auth.users u
    where u.last_sign_in_at is not null and u.email_confirmed_at is not null
      and u.deleted_at is null and not u.is_anonymous
  ), page as materialized (
    select e.*, f.state, f.updated_at as last_synced_at,
      coalesce(f.state->'schemaVersion' = '1'::jsonb
        and pg_catalog.jsonb_typeof(f.state->'missions') = 'object'
        and pg_catalog.jsonb_typeof(f.state->'attempts') = 'array',false) as has_progress
    from (select * from eligible order by created_at, user_id offset p_offset limit p_limit) e
    left join public.user_fieldbooks f on f.user_id = e.user_id
  ), members as (
    select p.user_id, p.email, p.display_name, p.created_at, p.last_sign_in_at, p.is_mentor,
      p.last_synced_at, p.has_progress,
      case when p.has_progress then weekly.completed_weeks end as completed_weeks,
      case when p.has_progress then weekly.completed_steps end as completed_steps,
      case when p.has_progress then practice.practice_attempts end as practice_attempts,
      case when p.has_progress then practice.mcq_attempts end as mcq_attempts,
      case when p.has_progress then practice.mcq_correct end as mcq_correct
    from page p
    cross join lateral (
      select count(*) filter (where m.value->'steps' = '[true,true,true,true]'::jsonb) as completed_weeks,
        coalesce(sum(case when pg_catalog.jsonb_typeof(m.value->'steps') = 'array'
          then (select count(*) from pg_catalog.generate_series(0,3) i where m.value->'steps'->i = 'true'::jsonb)
          else 0 end),0) as completed_steps
      from pg_catalog.jsonb_each(case when p.has_progress then p.state->'missions' else '{}'::jsonb end) m
      where m.key ~ '^([1-9]|10|11)$'
        and case when pg_catalog.jsonb_typeof(m.value->'steps') = 'array' then
          pg_catalog.jsonb_array_length(m.value->'steps') = 4 and not exists (
            select 1 from pg_catalog.jsonb_array_elements(m.value->'steps') step
            where pg_catalog.jsonb_typeof(step) <> 'boolean'
          ) else false end
    ) weekly
    cross join lateral (
      select count(*) as practice_attempts,
        count(*) filter (where a.value->'correct' in ('true'::jsonb,'false'::jsonb)) as mcq_attempts,
        count(*) filter (where a.value->'correct' = 'true'::jsonb) as mcq_correct
      from pg_catalog.jsonb_array_elements(case when p.has_progress then p.state->'attempts' else '[]'::jsonb end) a
      where pg_catalog.jsonb_typeof(a.value) = 'object'
        and pg_catalog.jsonb_typeof(a.value->'questionId') = 'string'
        and pg_catalog.jsonb_typeof(a.value->'lessonId') = 'string'
        and pg_catalog.jsonb_typeof(a.value->'correct') in ('boolean','null')
    ) practice
  )
  select pg_catalog.jsonb_build_object(
    'total',(select count(*) from eligible),
    'members',coalesce((select pg_catalog.jsonb_agg(pg_catalog.to_jsonb(m) order by m.created_at,m.user_id) from members m),'[]'::jsonb),
    'fetched_at',pg_catalog.statement_timestamp()
  ) into result;
  return result;
end;
$$;
revoke all on function public.mentor_team_roster(integer,integer) from public, anon;
grant execute on function public.mentor_team_roster(integer,integer) to authenticated;
