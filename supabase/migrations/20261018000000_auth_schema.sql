-- ==============================================================================
-- FLORALYN SKIN AUTHENTICATION SCHEMA
-- Migration: 20261018000000_auth_schema.sql
-- Description: Creates / alters the public.profiles table, RLS policies,
--              automated triggers, table grants, and secure helper functions.
-- ==============================================================================

-- 1. Create public.profiles table if it does not exist
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Ensure all required columns exist (even if table was created previously)
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists role text not null default 'member';
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles drop constraint if exists profiles_role_check;
update public.profiles set role = 'member' where role is null or role = 'customer';
alter table public.profiles alter column role set default 'member';
alter table public.profiles alter column role set not null;
alter table public.profiles
  add constraint profiles_role_check check (role in ('member', 'customer', 'admin'));

-- Ensure username constraint and index
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_username_format'
  ) then
    alter table public.profiles add constraint profiles_username_format check (username is null or (char_length(username) >= 3 and char_length(username) <= 20 and username ~ '^[a-zA-Z0-9_]+$'));
  end if;
end;
$$;

-- Case-insensitive unique index on lower(username)
create unique index if not exists idx_profiles_username_lower on public.profiles (lower(username)) where username is not null;

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

-- Grant privileges to authenticated and anon roles
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on table public.profiles to authenticated;
grant select on table public.profiles to anon;

-- 3. Prevent Privilege Escalation on Role
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role'
     and session_user not in ('postgres', 'supabase_admin') then
    if tg_op = 'INSERT' and new.role <> 'member' then
      raise exception 'Modifying user role is restricted';
    elsif tg_op = 'UPDATE' and new.role is distinct from old.role then
      raise exception 'Modifying user role is restricted';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_profile_role on public.profiles;
create trigger enforce_profile_role
  before insert or update on public.profiles
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
      coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
      'member'
    )
    on conflict (id) do update set
      username = coalesce(public.profiles.username, excluded.username),
      display_name = coalesce(public.profiles.display_name, excluded.display_name),
      avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url);
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

-- Grant execute privileges on helper functions
grant execute on function public.check_username_available(text) to anon, authenticated;
grant execute on function public.get_email_by_username(text) to anon, authenticated;

-- 8. Refresh PostgREST schema cache
notify pgrst, 'reload schema';
