-- Mentor activation is separate from student class enrollment.
-- Provision only the activation hash privately after applying this migration.
create table public.mentor_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);
create table public.mentor_activation_secrets (
  singleton boolean primary key default true check (singleton),
  code_hash text not null,
  enabled boolean not null default false,
  expires_at timestamptz,
  window_started timestamptz not null default now(),
  failed_attempts integer not null default 0 check (failed_attempts >= 0)
);
create table public.mentor_activation_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started timestamptz not null default now(),
  failed_attempts integer not null default 0 check (failed_attempts >= 0)
);
alter table public.mentor_accounts enable row level security;
alter table public.mentor_activation_secrets enable row level security;
alter table public.mentor_activation_attempts enable row level security;
revoke all on public.mentor_accounts, public.mentor_activation_secrets, public.mentor_activation_attempts from public, anon, authenticated;

create function public.mentor_access_status()
returns jsonb language sql stable security definer set search_path = '' as $$
  select pg_catalog.jsonb_build_object('is_mentor', exists (
    select 1 from public.mentor_accounts m join auth.users u on u.id=m.user_id
    where m.user_id=auth.uid() and m.revoked_at is null
      and u.email_confirmed_at is not null and u.deleted_at is null
      and not u.is_anonymous and (u.banned_until is null or u.banned_until <= now())
  ));
$$;
revoke all on function public.mentor_access_status() from public, anon;
grant execute on function public.mentor_access_status() to authenticated;

create function public.redeem_mentor_code(p_code text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  moment timestamptz := pg_catalog.clock_timestamp();
  secret public.mentor_activation_secrets%rowtype;
  attempt public.mentor_activation_attempts%rowtype;
  existing public.mentor_accounts%rowtype;
begin
  if actor is null or not exists (
    select 1 from auth.users u where u.id=actor and u.email_confirmed_at is not null
      and not u.is_anonymous and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= moment)
  ) then return pg_catalog.jsonb_build_object('ok',false,'reason','auth_required'); end if;

  -- A revoked account cannot regrant itself access with the shared code.
  select * into existing from public.mentor_accounts where user_id=actor;
  if found then
    if existing.revoked_at is not null then
      return pg_catalog.jsonb_build_object('ok',false,'reason','revoked');
    end if;
    return pg_catalog.jsonb_build_object('ok',true);
  end if;

  -- Lock shared limiter first, then the account limiter, in a fixed order.
  select * into secret from public.mentor_activation_secrets where singleton for update;
  if not found or not secret.enabled or (secret.expires_at is not null and secret.expires_at <= moment) then
    return pg_catalog.jsonb_build_object('ok',false,'reason','unavailable');
  end if;
  if secret.window_started <= moment - interval '15 minutes' then
    update public.mentor_activation_secrets set window_started=moment,failed_attempts=0 where singleton;
    secret.failed_attempts := 0;
  end if;
  insert into public.mentor_activation_attempts(user_id) values(actor) on conflict(user_id) do nothing;
  select * into attempt from public.mentor_activation_attempts where user_id=actor for update;
  if attempt.window_started <= moment - interval '15 minutes' then
    update public.mentor_activation_attempts set window_started=moment,failed_attempts=0 where user_id=actor;
    attempt.failed_attempts := 0;
  end if;
  if attempt.failed_attempts >= 5 or secret.failed_attempts >= 30 then
    return pg_catalog.jsonb_build_object('ok',false,'reason','rate_limited');
  end if;

  -- Exact, case-sensitive comparison. No submitted code is stored or logged.
  if p_code is null or pg_catalog.octet_length(p_code) < 1 or pg_catalog.octet_length(p_code) > 128 then
    update public.mentor_activation_attempts set failed_attempts=failed_attempts+1 where user_id=actor;
    update public.mentor_activation_secrets set failed_attempts=failed_attempts+1 where singleton;
    return pg_catalog.jsonb_build_object('ok',false,'reason','invalid');
  end if;
  if extensions.crypt(p_code, secret.code_hash) is distinct from secret.code_hash then
    update public.mentor_activation_attempts set failed_attempts=failed_attempts+1 where user_id=actor;
    update public.mentor_activation_secrets set failed_attempts=failed_attempts+1 where singleton;
    -- Return rather than raise so failed-attempt counters commit.
    return pg_catalog.jsonb_build_object('ok',false,'reason','invalid');
  end if;
  insert into public.mentor_accounts(user_id) values(actor) on conflict(user_id) do nothing;
  -- Read back: an administrative revocation must win over concurrent enrollment.
  return pg_catalog.jsonb_build_object('ok',exists(
    select 1 from public.mentor_accounts where user_id=actor and revoked_at is null
  ));
end;
$$;
revoke all on function public.redeem_mentor_code(text) from public, anon;
grant execute on function public.redeem_mentor_code(text) to authenticated;
