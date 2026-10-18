-- ==============================================================================
-- FLORALYN SKIN AUTHENTICATION SCHEMA
-- Migration: 20261018000000_auth_schema.sql
-- Description: Creates the public.profiles table, RLS policies, automated triggers,
--              and secure helper functions for username/password and Google OAuth.
-- ==============================================================================

-- 1. Create public.profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_length check (char_length(username) >= 3 and char_length(username) <= 20),
  constraint username_format check (username ~ '^[a-zA-Z0-9_]+$')
);

-- Case-insensitive unique index on lower(username)
create unique index if not exists idx_profiles_username_lower on public.profiles (lower(username));

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Drop existing policies if re-running
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

-- RLS Policy: Anyone can read public profile details (id, username, display_name, avatar_url)
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- RLS Policy: Users can insert their own profile matching their auth.uid()
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- RLS Policy: Users can update their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. Prevent Privilege Escalation on Role
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  -- Prevent changing role column via standard client updates
  if new.role is distinct from old.role then
    raise exception 'Modifying user role is restricted';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_profile_role on public.profiles;
create trigger enforce_profile_role
  before update on public.profiles
  for each row
  execute procedure public.prevent_role_change();

-- 4. Automatically maintain updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure public.handle_updated_at();

-- 5. Trigger to provision profile for password sign-ups (with username in metadata)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_username text;
begin
  signup_username := new.raw_user_meta_data->>'username';

  -- Only auto-create if a valid username was supplied in metadata during signup
  if signup_username is not null and trim(signup_username) <> '' then
    insert into public.profiles (id, username, display_name, avatar_url, role)
    values (
      new.id,
      lower(trim(signup_username)),
      coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', trim(signup_username)),
      new.raw_user_meta_data->>'avatar_url',
      'customer'
    )
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- 6. Helper: Securely retrieve email for username login (never exposes email list publicly)
create or replace function public.get_email_by_username(lookup_username text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  found_email text;
begin
  if lookup_username is null or trim(lookup_username) = '' then
    return null;
  end if;

  select u.email into found_email
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(p.username) = lower(trim(lookup_username))
  limit 1;

  return found_email;
end;
$$;

-- 7. Helper: Check if a username is available
create or replace function public.check_username_available(check_username text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if check_username is null or trim(check_username) = '' then
    return false;
  end if;

  return not exists (
    select 1 from public.profiles
    where lower(username) = lower(trim(check_username))
  );
end;
$$;
