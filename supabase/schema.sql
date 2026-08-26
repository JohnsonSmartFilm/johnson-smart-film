-- ============================================================
-- JOHNSON SMART FILM — Database Schema (Supabase / PostgreSQL)
-- Run this once in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ─────────────────────────────────────────────
-- 0. EXTENSIONS
-- ─────────────────────────────────────────────
create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- 1. TABLES
-- ─────────────────────────────────────────────

-- Every user (admin or customer) has one profile row, same id as auth.users
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'customer' check (role in ('admin','customer')),
  code         text unique,
  full_name    text not null,
  phone        text,
  email        text,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Cars registered to a customer
create table if not exists public.vehicles (
  id           uuid primary key default gen_random_uuid(),
  code         text unique,
  customer_id  uuid not null references public.profiles(id) on delete cascade,
  make         text not null,
  model        text,
  year         text,
  color        text,
  plate        text,
  created_at   timestamptz not null default now()
);

-- A service performed (or scheduled) for a customer's vehicle
create table if not exists public.services (
  id             uuid primary key default gen_random_uuid(),
  code           text unique,
  customer_id    uuid not null references public.profiles(id) on delete cascade,
  vehicle_id     uuid references public.vehicles(id) on delete set null,
  service_type   text not null,        -- e.g. "PPF", "Window Tint", "Ceramic Coating"
  package        text,                 -- e.g. "Gold", "Platinum", "Full Body"
  price          numeric(10,2),
  status         text not null default 'pending' check (status in ('pending','in_progress','completed','cancelled')),
  warranty_months int,
  warranty_until  date,
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Public booking-form submissions from the website (before becoming a customer)
create table if not exists public.bookings (
  id            uuid primary key default gen_random_uuid(),
  code          text unique,
  full_name     text not null,
  email         text not null,
  phone         text not null,
  service_type  text,
  package       text,
  vehicle_info  text,
  preferred_date date,
  message       text,
  status        text not null default 'new' check (status in ('new','contacted','converted')),
  created_at    timestamptz not null default now()
);

-- Notifications shown live on the customer dashboard
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.profiles(id) on delete cascade,
  title        text not null,
  message      text not null,
  type         text not null default 'info', -- info | success | warning
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2. AUTO-GENERATED CODES
-- Note: checks uniqueness across all 4 tables per attempt. Fine at small/
-- medium volume; if you ever do bulk imports, widen the random segment
-- or give each entity its own code space to reduce lookup cost.
-- ─────────────────────────────────────────────

create or replace function public.gen_code(prefix text)
returns text language plpgsql
set search_path = public, pg_temp
as $$
declare
  new_code text;
begin
  loop
    new_code := prefix || '-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (
      select 1 from public.profiles where code = new_code
      union all select 1 from public.vehicles where code = new_code
      union all select 1 from public.services where code = new_code
      union all select 1 from public.bookings where code = new_code
    );
  end loop;
  return new_code;
end;
$$;

create or replace function public.set_profile_code()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.code is null then
    new.code := public.gen_code('JSF-CUS');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_profile_code on public.profiles;
create trigger trg_profile_code before insert on public.profiles
for each row execute function public.set_profile_code();

create or replace function public.set_vehicle_code()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.code is null then
    new.code := public.gen_code('JSF-VEH');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_vehicle_code on public.vehicles;
create trigger trg_vehicle_code before insert on public.vehicles
for each row execute function public.set_vehicle_code();

create or replace function public.set_service_code()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.code is null then
    new.code := public.gen_code('JSF-SRV');
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists trg_service_code on public.services;
create trigger trg_service_code before insert on public.services
for each row execute function public.set_service_code();

create or replace function public.touch_service_updated_at()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists trg_service_touch on public.services;
create trigger trg_service_touch before update on public.services
for each row execute function public.touch_service_updated_at();

create or replace function public.set_booking_code()
returns trigger language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.code is null then
    new.code := public.gen_code('JSF-BK');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_booking_code on public.bookings;
create trigger trg_booking_code before insert on public.bookings
for each row execute function public.set_booking_code();

-- ─────────────────────────────────────────────
-- 3. AUTO NOTIFICATIONS (customer hears about every admin change instantly)
-- ─────────────────────────────────────────────

create or replace function public.notify_service_change()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (customer_id, title, message, type)
    values (new.customer_id, 'New service added',
      'A new "' || new.service_type || '" service (' || new.code || ') was added to your account.', 'success');
  elsif tg_op = 'UPDATE' and (new.status is distinct from old.status) then
    insert into public.notifications (customer_id, title, message, type)
    values (new.customer_id, 'Service status updated',
      'Your service ' || new.code || ' is now: ' || new.status || '.', 'info');
  elsif tg_op = 'UPDATE' then
    insert into public.notifications (customer_id, title, message, type)
    values (new.customer_id, 'Service updated',
      'Your service ' || new.code || ' details were updated by our team.', 'info');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_notify_service on public.services;
create trigger trg_notify_service after insert or update on public.services
for each row execute function public.notify_service_change();

create or replace function public.notify_vehicle_change()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (customer_id, title, message, type)
    values (new.customer_id, 'Vehicle registered',
      'Your vehicle ' || coalesce(new.make,'') || ' ' || coalesce(new.model,'') || ' (' || new.code || ') was added to your account.', 'success');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_notify_vehicle on public.vehicles;
create trigger trg_notify_vehicle after insert on public.vehicles
for each row execute function public.notify_vehicle_change();

create or replace function public.notify_profile_change()
returns trigger language plpgsql security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' and new.role = 'customer' then
    insert into public.notifications (customer_id, title, message, type)
    values (new.id, 'Welcome to Johnson Smart Film',
      'Your account (' || new.code || ') was created. Welcome aboard!', 'success');
  elsif tg_op = 'UPDATE' then
    insert into public.notifications (customer_id, title, message, type)
    values (new.id, 'Profile updated',
      'Your account details were updated by our team.', 'info');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_notify_profile on public.profiles;
create trigger trg_notify_profile after insert or update on public.profiles
for each row execute function public.notify_profile_change();

-- ─────────────────────────────────────────────
-- 4. HELPER: is the current user an admin?
-- ─────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean language sql security definer stable
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Pin ownership of every SECURITY DEFINER function to the role that owns the
-- underlying tables (in Supabase's SQL Editor that's always `postgres`, which
-- has BYPASSRLS). This is what actually lets these functions write into
-- public.notifications regardless of the calling user's own RLS permissions —
-- without it, notification inserts could silently fail depending on how/where
-- the function was created.
do $$
begin
  alter function public.is_admin() owner to postgres;
  alter function public.notify_service_change() owner to postgres;
  alter function public.notify_vehicle_change() owner to postgres;
  alter function public.notify_profile_change() owner to postgres;
exception when others then
  raise notice 'Could not reassign function ownership (safe to ignore if you are not using the default "postgres" role): %', sqlerrm;
end $$;

-- ─────────────────────────────────────────────
-- 5. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.vehicles      enable row level security;
alter table public.services      enable row level security;
alter table public.bookings      enable row level security;
alter table public.notifications enable row level security;

-- profiles
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert" on public.profiles;
create policy "profiles_insert" on public.profiles for insert
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update" on public.profiles;
create policy "profiles_update" on public.profiles for update
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_delete" on public.profiles;
create policy "profiles_delete" on public.profiles for delete
  using (public.is_admin());

-- vehicles
drop policy if exists "vehicles_select" on public.vehicles;
create policy "vehicles_select" on public.vehicles for select
  using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "vehicles_write" on public.vehicles;
create policy "vehicles_write" on public.vehicles for insert with check (public.is_admin());
drop policy if exists "vehicles_update" on public.vehicles;
create policy "vehicles_update" on public.vehicles for update using (public.is_admin());
drop policy if exists "vehicles_delete" on public.vehicles;
create policy "vehicles_delete" on public.vehicles for delete using (public.is_admin());

-- services
drop policy if exists "services_select" on public.services;
create policy "services_select" on public.services for select
  using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "services_insert" on public.services;
create policy "services_insert" on public.services for insert with check (public.is_admin());
drop policy if exists "services_update" on public.services;
create policy "services_update" on public.services for update using (public.is_admin());
drop policy if exists "services_delete" on public.services;
create policy "services_delete" on public.services for delete using (public.is_admin());

-- bookings (public form must be able to insert without logging in).
-- Intentionally allows both anon AND authenticated — a customer who is
-- already logged in can still submit the homepage booking form.
drop policy if exists "bookings_insert_public" on public.bookings;
create policy "bookings_insert_public" on public.bookings for insert
  to anon, authenticated with check (true);

drop policy if exists "bookings_select_admin" on public.bookings;
create policy "bookings_select_admin" on public.bookings for select using (public.is_admin());
drop policy if exists "bookings_update_admin" on public.bookings;
create policy "bookings_update_admin" on public.bookings for update using (public.is_admin());
drop policy if exists "bookings_delete_admin" on public.bookings;
create policy "bookings_delete_admin" on public.bookings for delete using (public.is_admin());

-- notifications
drop policy if exists "notifications_select" on public.notifications;
create policy "notifications_select" on public.notifications for select
  using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_update" on public.notifications;
create policy "notifications_update" on public.notifications for update
  using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "notifications_insert" on public.notifications;
create policy "notifications_insert" on public.notifications for insert
  with check (public.is_admin());

-- ─────────────────────────────────────────────
-- 6. REALTIME (so the customer dashboard updates live, no refresh)
-- Wrapped so that re-running this script, or a table already being
-- in the publication, never aborts the rest of the script.
-- ─────────────────────────────────────────────
do $$
begin
  alter publication supabase_realtime add table public.services;
exception when duplicate_object then null;
  when others then raise notice 'Realtime publish (services) skipped: %', sqlerrm;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.vehicles;
exception when duplicate_object then null;
  when others then raise notice 'Realtime publish (vehicles) skipped: %', sqlerrm;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
  when others then raise notice 'Realtime publish (notifications) skipped: %', sqlerrm;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
  when others then raise notice 'Realtime publish (profiles) skipped: %', sqlerrm;
end $$;

-- ============================================================
-- Done. Next: create your first ADMIN account.
-- 1) Authentication → Users → Add user (email + password, "Auto Confirm User" ON)
-- 2) Copy the new user's UID
-- 3) Run:
--    insert into public.profiles (id, role, full_name, email)
--    values ('PASTE-UID-HERE', 'admin', 'Your Name', 'your@email.com');
-- ============================================================
