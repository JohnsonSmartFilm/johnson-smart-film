-- ============================================================
-- JOHNSON SMART FILM — Realistic-data guardrails (bookings, profiles, vehicles)
-- Run once in: Supabase Dashboard → SQL Editor → New query
--
-- WHY THIS FILE EXISTS
-- The public booking form on the homepage can be submitted by ANYONE on
-- the internet, logged in or not (see the "bookings_insert_public" policy
-- in schema.sql — it allows `insert ... with check (true)`, i.e. no rules
-- at all). The JavaScript form validation in js/booking.js, js/dashboard.js
-- and js/admin.js checks for a real-looking name, a valid Egyptian mobile
-- number, a real-looking year etc. — but client-side JS can ALWAYS be
-- bypassed by anyone who opens dev tools and calls the Supabase REST API
-- directly with the public anon key. These CHECK constraints enforce the
-- same rules at the database level, which cannot be bypassed by skipping
-- the website.
--
-- IMPORTANT — what this can and cannot guarantee:
--   ✅ Rejects obviously fake/garbage formats: "asdasd" as a name,
--      "123" as a phone number, "9999" as a car year, "a@a" as an email.
--   ❌ Cannot confirm a phone number is reachable or an email inbox is
--      real — that requires sending an OTP/confirmation code, which is a
--      separate feature (e.g. Supabase phone-auth or an SMS provider like
--      Twilio) with its own setup and per-message cost. Ask if you want
--      that added; it's a bigger change than a data-format guardrail.
-- ============================================================

alter table public.bookings
  drop constraint if exists bookings_full_name_format,
  drop constraint if exists bookings_phone_format,
  drop constraint if exists bookings_email_format;

alter table public.bookings
  add constraint bookings_full_name_format
    check (
      full_name ~ '^[A-Za-z؀-ۿ'' -]{3,80}$'   -- letters/spaces/'/- only, 3–80 chars
      and full_name ~ ' '                        -- must contain at least first + last name
      and full_name !~ '^(.)\1+$'                -- not the same character repeated ("aaaaaa")
    ),
  add constraint bookings_phone_format
    check (
      regexp_replace(phone, '[\s-]', '', 'g') ~ '^01[0125][0-9]{8}$'  -- real Egyptian mobile shape
    ),
  add constraint bookings_email_format
    check (
      email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );

-- Same guardrails on the dashboard/admin side: a customer editing their own
-- profile, or the admin adding a customer or a vehicle, is a trusted
-- authenticated user rather than an anonymous stranger — but the same
-- format constraints keep the *data* itself just as realistic everywhere,
-- and stop e.g. an admin's copy-paste mistake or a customer fat-fingering
-- their profile from saving obvious garbage.

alter table public.profiles
  drop constraint if exists profiles_full_name_format,
  drop constraint if exists profiles_phone_format;

alter table public.profiles
  add constraint profiles_full_name_format
    check (
      full_name ~ '^[A-Za-z؀-ۿ'' -]{3,80}$'
      and full_name ~ ' '
      and full_name !~ '^(.)\1+$'
    ),
  add constraint profiles_phone_format
    check (phone is null or phone = '' or regexp_replace(phone, '[\s-]', '', 'g') ~ '^01[0125][0-9]{8}$');

alter table public.vehicles
  drop constraint if exists vehicles_make_format,
  drop constraint if exists vehicles_model_format,
  drop constraint if exists vehicles_year_format,
  drop constraint if exists vehicles_color_format,
  drop constraint if exists vehicles_plate_format;

alter table public.vehicles
  add constraint vehicles_make_format
    check (make ~ '^[A-Za-z؀-ۿ -]{2,40}$' and make !~ '^(.)\1+$'),
  add constraint vehicles_model_format
    check (model is null or model = '' or model ~ '^[A-Za-z0-9؀-ۿ -]{1,40}$'),
  add constraint vehicles_year_format
    check (year is null or year = '' or (year ~ '^[0-9]{4}$' and year::int between 1980 and extract(year from now())::int + 1)),
  add constraint vehicles_color_format
    check (color is null or color = '' or color ~ '^[A-Za-z؀-ۿ -]{2,30}$'),
  add constraint vehicles_plate_format
    check (plate is null or plate = '' or plate ~ '^[A-Za-z0-9؀-ۿ -]{2,15}$');

-- IMPORTANT: if any row already in these tables today doesn't match these
-- patterns, the ALTER TABLE ... ADD CONSTRAINT above will fail with a
-- "constraint is violated by some row" error instead of silently applying.
-- That's Postgres protecting you from a constraint that doesn't match your
-- real data — if that happens, find and fix (or delete) the offending
-- row(s) first, then re-run this file.
