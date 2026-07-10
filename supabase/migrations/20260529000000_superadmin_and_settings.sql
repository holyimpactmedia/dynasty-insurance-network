-- ============================================================================
-- Dynasty Lead Pipeline — super admin role + app settings
-- ----------------------------------------------------------------------------
-- Adds a third role tier ('superadmin') and a key/value settings table that
-- the super admin controls from the in-app Settings panel. The first feature
-- flag is `projections_enabled`, which gates the Projections dashboard.
--
-- A super admin is a strict superset of admin: every place that checks
-- `is_admin()` (leads RLS, the dashboard gate) treats a superadmin as an
-- admin too, so the Settings panel does not cost them access to anything else.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Role: allow 'superadmin' alongside the existing 'agent' / 'admin'.
-- ----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('agent', 'admin', 'superadmin'));

-- is_admin now returns true for super admins as well, so a super admin keeps
-- every admin capability (reading leads, reaching the dashboard).
create or replace function public.is_admin(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role in ('admin', 'superadmin')
  );
$$;

-- Exact super-admin check, used to gate the Settings panel and settings writes.
create or replace function public.is_superadmin(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'superadmin'
  );
$$;

grant execute on function public.is_admin(uuid)      to authenticated;
grant execute on function public.is_superadmin(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- app_settings — small key/value store for super-admin-controlled flags.
-- value is jsonb so a flag can hold a boolean, number, or richer config later.
-- ----------------------------------------------------------------------------
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

drop trigger if exists app_settings_set_updated_at on public.app_settings;
create trigger app_settings_set_updated_at
  before update on public.app_settings
  for each row execute function public.set_updated_at();

-- Seed the Projections flag (enabled by default). Idempotent.
insert into public.app_settings (key, value)
values ('projections_enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- Internal cutover control. Deliberately not exposed in the Settings UI.
insert into public.app_settings (key, value)
values ('lead_intake_paused', 'false'::jsonb)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- Row Level Security
--   read:  any authenticated user (the nav + page guards need to read flags)
--   write: super admins only (the service role bypasses RLS as usual)
-- ----------------------------------------------------------------------------
alter table public.app_settings enable row level security;

drop policy if exists app_settings_authenticated_select on public.app_settings;
create policy app_settings_authenticated_select on public.app_settings
  for select to authenticated using (true);

drop policy if exists app_settings_superadmin_write on public.app_settings;
create policy app_settings_superadmin_write on public.app_settings
  for all to authenticated
  using (public.is_superadmin(auth.uid()))
  with check (public.is_superadmin(auth.uid()));

-- ----------------------------------------------------------------------------
-- Promote the designated super admin. Safe to run repeatedly; only affects the
-- row if that user has already signed up (the signup trigger creates the
-- profile). If they have not signed up yet, run this again after they do.
-- ----------------------------------------------------------------------------
update public.profiles
set role = 'superadmin'
where email = 'holyimpactmedia@gmail.com';
