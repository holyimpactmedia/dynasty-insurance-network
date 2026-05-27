-- ============================================================================
-- Dynasty Lead Pipeline — dashboard aggregate RPCs
-- ----------------------------------------------------------------------------
-- Server-side aggregates so the dashboard does not pull whole tables into the
-- browser to count them. All are SECURITY INVOKER: they run as the calling
-- user and therefore respect the leads RLS policy (admins only).
-- Day/month boundaries are bucketed in the business timezone (America/New_York),
-- matching lib/time/ranges.ts.
-- ============================================================================

-- Last 7 calendar days of lead volume, bucketed by ET calendar day.
create or replace function public.get_daily_lead_counts()
returns table (day date, count bigint)
language sql security invoker stable set search_path = public as $$
  select
    (created_at at time zone 'America/New_York')::date as day,
    count(*)
  from public.leads
  where (created_at at time zone 'America/New_York')::date
        >= (now() at time zone 'America/New_York')::date - 6
  group by 1
  order by 1;
$$;

-- One-row pipeline snapshot for the dashboard stat cards.
-- Revenue is real: the sum of sell_price over leads actually sent to the
-- marketplace (usha_status = 'sent') — not a hardcoded per-lead constant.
create or replace function public.get_pipeline_stats()
returns table (
  total_leads        bigint,
  leads_today        bigint,
  leads_month        bigint,
  sent_count         bigint,
  sent_revenue       numeric,
  sent_revenue_month numeric,
  tcpa_verified      bigint
)
language sql security invoker stable set search_path = public as $$
  select
    count(*),
    count(*) filter (
      where created_at >= (date_trunc('day', now() at time zone 'America/New_York')
                           at time zone 'America/New_York')
    ),
    count(*) filter (
      where created_at >= (date_trunc('month', now() at time zone 'America/New_York')
                           at time zone 'America/New_York')
    ),
    count(*) filter (where usha_status = 'sent'),
    coalesce(sum(sell_price) filter (where usha_status = 'sent'), 0),
    coalesce(sum(sell_price) filter (
      where usha_status = 'sent'
        and created_at >= (date_trunc('month', now() at time zone 'America/New_York')
                           at time zone 'America/New_York')
    ), 0),
    count(*) filter (where tcpa_consent = true)
  from public.leads;
$$;

-- Per-funnel breakdown: leads received, leads sent to marketplace, revenue.
create or replace function public.get_funnel_breakdown()
returns table (
  funnel_type text,
  leads       bigint,
  sent        bigint,
  revenue     numeric
)
language sql security invoker stable set search_path = public as $$
  select
    coalesce(funnel_type, 'private_health') as funnel_type,
    count(*) as leads,
    count(*) filter (where usha_status = 'sent') as sent,
    coalesce(sum(sell_price) filter (where usha_status = 'sent'), 0) as revenue
  from public.leads
  group by 1
  order by 2 desc;
$$;

grant execute on function public.get_daily_lead_counts() to authenticated;
grant execute on function public.get_pipeline_stats()    to authenticated;
grant execute on function public.get_funnel_breakdown()  to authenticated;
