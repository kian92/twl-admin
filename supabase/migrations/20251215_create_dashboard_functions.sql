-- Dashboard helper functions for admin analytics

-- Function to get overall dashboard metrics
create or replace function public.admin_dashboard_metrics(start_date date default null)
returns table (
  total_revenue numeric,
  total_bookings integer,
  active_users integer,
  total_experiences integer
)
language sql
security definer
set search_path = public as $$
  with filtered_bookings as (
    select *
    from public.bookings
    where (start_date is null) or (booking_date >= start_date)
  )
  select
    coalesce(sum(case when booking_status = 'confirmed' then total_cost else 0 end), 0) as total_revenue,
    coalesce(count(*), 0)::integer as total_bookings,
    (
      select coalesce(count(distinct email), 0)::integer
      from public.customer_profiles
      where status = 'active'
    ) as active_users,
    (
      select coalesce(count(*), 0)::integer
      from public.experiences
    ) as total_experiences
  from filtered_bookings;
$$;

-- Function to get booking trend over time
create or replace function public.booking_trend(months integer default 6)
returns table (
  month text,
  booking_count integer
)
language sql
security definer
set search_path = public as $$
  select
    to_char(date_trunc('month', booking_date), 'Mon YYYY') as month,
    count(*)::integer as booking_count
  from public.bookings
  where booking_date >= date_trunc('month', current_date) - ((months - 1) * interval '1 month')
  group by date_trunc('month', booking_date)
  order by date_trunc('month', booking_date);
$$;

-- Function to get revenue trend over time
create or replace function public.revenue_trend(months integer default 6)
returns table (
  month text,
  revenue numeric
)
language sql
security definer
set search_path = public as $$
  select
    to_char(date_trunc('month', booking_date), 'Mon YYYY') as month,
    coalesce(sum(total_cost), 0) as revenue
  from public.bookings
  where booking_date >= date_trunc('month', current_date) - ((months - 1) * interval '1 month')
  group by date_trunc('month', booking_date)
  order by date_trunc('month', booking_date);
$$;

-- Function to get top destinations by booking count
create or replace function public.top_destinations(limit_val integer default 4)
returns table (
  country text,
  booking_count integer,
  revenue numeric
)
language sql
security definer
set search_path = public as $$
  select
    coalesce(e.country, 'Unknown') as country,
    count(distinct b.id)::integer as booking_count,
    coalesce(sum(b.total_cost), 0) as revenue
  from public.bookings b
  left join public.booking_items bi on bi.booking_id = b.id
  left join public.experiences e on e.id = bi.experience_id
  group by coalesce(e.country, 'Unknown')
  order by booking_count desc
  limit limit_val;
$$;
