-- ============================================================================
-- Dynasty Lead Pipeline — baseline schema
-- ----------------------------------------------------------------------------
-- Single source of truth for tables, the authorization model, and RLS.
-- Greenfield: the project had no tables before this migration.
-- Apply with `supabase db push` (or the Management API). Future schema
-- changes are new, separately-numbered migration files — never edit this one.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- leads — the lead pass-through record (funnel intake -> TCPA -> marketplace)
-- ----------------------------------------------------------------------------
create table if not exists public.leads (
  id                    uuid primary key default gen_random_uuid(),
  reference_number      text unique not null,
  first_name            text not null,
  last_name             text not null,
  email                 text not null,
  phone                 text,
  age                   integer,
  state                 text,
  income_range          text,
  household_size        text,
  qualifying_event      text,
  priorities            text,
  tcpa_consent          boolean not null default false,
  tcpa_consent_at       timestamptz,
  trusted_form_cert_url text,
  funnel_type           text default 'private_health',
  utm_source            text,
  utm_medium            text,
  utm_campaign          text,
  ip_address            text,
  quiz_answers          jsonb,
  status                text not null default 'new',
  ai_score              integer,
  ai_score_reasons      text[],
  predicted_close_rate  numeric,
  ai_scored_at          timestamptz,
  sell_price            numeric not null default 28,
  usha_status           text check (usha_status in ('pending','sent','failed')),
  usha_sent_at          timestamptz,
  usha_lead_id          text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- updated_at maintenance, shared by every table below.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- profiles — one row per auth user; the authorization source of truth.
-- `role` is writable ONLY by the service role / SQL. Never by the app.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  first_name text,
  last_name  text,
  role       text not null default 'agent' check (role in ('agent','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-provision a profile for every new auth user (always role 'agent').
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: users that already existed before this migration get a profile,
-- otherwise the trigger (insert-only) would never give them one and the
-- dashboard would lock everyone out.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- Recursion-safe admin check. SECURITY DEFINER runs the body with the
-- function owner's rights, so an RLS policy on `profiles` may call this
-- without re-triggering that same policy. search_path is pinned to prevent
-- search-path hijacking.
create or replace function public.is_admin(uid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'admin'
  );
$$;

grant execute on function public.is_admin(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- email_suppressions — CAN-SPAM unsubscribe list (written by /api/unsubscribe)
-- ----------------------------------------------------------------------------
create table if not exists public.email_suppressions (
  email         text primary key,
  source        text,
  suppressed_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Indexes — every column the dashboard filters or sorts on.
-- (reference_number already has an index from its UNIQUE constraint.)
-- ----------------------------------------------------------------------------
create index if not exists idx_leads_email      on public.leads (email);
create index if not exists idx_leads_created_at on public.leads (created_at desc);
create index if not exists idx_leads_usha_status on public.leads (usha_status);
create index if not exists idx_leads_funnel_type on public.leads (funnel_type);

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
alter table public.leads enable row level security;
alter table public.profiles enable row level security;
alter table public.email_suppressions enable row level security;

-- leads: public funnels may insert; only admins may read; the service role
-- (used by API routes) bypasses RLS entirely.
drop policy if exists leads_public_insert on public.leads;
create policy leads_public_insert on public.leads
  for insert to anon, authenticated with check (true);

drop policy if exists leads_admin_select on public.leads;
create policy leads_admin_select on public.leads
  for select to authenticated using (public.is_admin(auth.uid()));

-- profiles: a user sees their own row; admins see all. No client-side writes
-- at all — role is set only by the service role / SQL.
drop policy if exists profiles_self_or_admin_select on public.profiles;
create policy profiles_self_or_admin_select on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin(auth.uid()));

-- email_suppressions: no anon/authenticated policy => only the service role
-- (which bypasses RLS) can touch it.

-- ----------------------------------------------------------------------------
-- Realtime — the admin dashboard subscribes to leads inserts/updates.
-- Without adding the table to the publication the subscription silently
-- never fires.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'leads'
  ) then
    alter publication supabase_realtime add table public.leads;
  end if;
end
$$;
