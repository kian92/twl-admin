-- Admin portal schema for Supabase

-- Profiles for authenticated admin users (Auth.users must exist)
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('admin', 'manager', 'support')),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Travel experiences catalogue
create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location text not null,
  country text not null,
  duration text not null,
  price numeric not null,
  adult_price numeric not null,
  child_price numeric not null,
  available_from date,
  available_to date,
  min_group_size integer not null default 1,
  max_group_size integer not null default 15,
  category text not null,
  image_url text,
  rating numeric,
  review_count integer,
  description text,
  highlights text[],
  inclusions text[],
  cancellation_policy text,
  itinerary jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Customer bookings
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  booking_date date default current_date,
  travel_date date not null,
  status text not null check (status in ('pending', 'confirmed', 'cancelled')),
  total_cost numeric not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Experiences attached to each booking
create table if not exists public.booking_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  experience_id uuid references public.experiences(id),
  experience_title text not null,
  price numeric not null,
  quantity integer not null default 1,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Customer profiles (derived from auth or imported CRM)
create table if not exists public.customer_profiles (
  id uuid primary key,
  full_name text not null,
  email text not null unique,
  membership_tier text not null,
  points_balance integer not null default 0,
  total_bookings integer not null default 0,
  total_spent numeric not null default 0,
  status text not null default 'active',
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Membership tier configuration
create table if not exists public.membership_tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gradient_from text not null,
  gradient_to text not null,
  discount_rate numeric not null,
  referral_bonus_points integer not null,
  free_addons_value text,
  member_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Reward program configurable values
create table if not exists public.reward_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Bonus point campaigns
create table if not exists public.reward_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  multiplier numeric,
  status text not null default 'draft',
  ends_at date,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Dashboard helpers -------------------------------------------------------

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
    coalesce(sum(case when status = 'confirmed' then total_cost else 0 end), 0) as total_revenue,
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
  group by 1
  order by date_trunc('month', booking_date);
$$;

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
  group by 1
  order by date_trunc('month', booking_date);
$$;

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

-- TODO: configure Row Level Security (RLS) policies for each table to allow
-- authenticated admins to read/write while denying anonymous access.
