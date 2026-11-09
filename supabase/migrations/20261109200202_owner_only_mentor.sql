-- Disable shared-code enrollment, including previously cached clients.
update public.mentor_activation_secrets set enabled = false;
create or replace function public.redeem_mentor_code(p_code text)
returns jsonb language sql security invoker set search_path = '' as $$
  select pg_catalog.jsonb_build_object('ok',false,'reason','unavailable');
$$;
revoke all on function public.redeem_mentor_code(text) from public, anon, authenticated;

-- Provision the designated email privately, never in public assets or migrations.
create table public.mentor_owner_settings (
  singleton boolean primary key default true check (singleton),
  allowed_email text not null check (allowed_email = lower(btrim(allowed_email)) and length(allowed_email) > 3),
  user_id uuid unique references auth.users(id) on delete restrict
);
alter table public.mentor_owner_settings enable row level security;
revoke all on public.mentor_owner_settings from public, anon, authenticated;
-- Old code-based grants are no longer sufficient for owner access.
update public.mentor_accounts set revoked_at = coalesce(revoked_at, now());

create or replace function public.mentor_access_status()
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  actor_email text;
  designation public.mentor_owner_settings%rowtype;
begin
  select lower(btrim(u.email)) into actor_email from auth.users u
    where u.id = actor and u.email_confirmed_at is not null
      and u.deleted_at is null and not u.is_anonymous
      and (u.banned_until is null or u.banned_until <= now());
  if actor_email is null then return pg_catalog.jsonb_build_object('is_mentor',false); end if;
  select * into designation from public.mentor_owner_settings where singleton for update;
  if not found then return pg_catalog.jsonb_build_object('is_mentor',false); end if;
  if designation.user_id is null then
    if actor_email <> designation.allowed_email then
      return pg_catalog.jsonb_build_object('is_mentor',false);
    end if;
    update public.mentor_owner_settings set user_id = actor where singleton;
    designation.user_id := actor;
    insert into public.mentor_accounts(user_id) values(actor) on conflict(user_id) do nothing;
  end if;
  return pg_catalog.jsonb_build_object('is_mentor', designation.user_id = actor and exists (
    select 1 from public.mentor_accounts m where m.user_id = actor and m.revoked_at is null
  ));
end;
$$;
revoke all on function public.mentor_access_status() from public, anon;
grant execute on function public.mentor_access_status() to authenticated;
