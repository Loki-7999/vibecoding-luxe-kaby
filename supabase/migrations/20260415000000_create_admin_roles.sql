create type public.app_role as enum ('admin', 'broker', 'agent', 'viewer');

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid references auth.users (id) on delete set null
);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_user_roles_updated_at on public.user_roles;
create trigger set_user_roles_updated_at
before update on public.user_roles
for each row
execute function public.set_current_timestamp_updated_at();

create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.user_roles (user_id, role)
  values (new.id, 'viewer')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_assign_role on auth.users;
create trigger on_auth_user_created_assign_role
after insert on auth.users
for each row
execute function public.handle_new_user_role();

create or replace function public.is_admin(check_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = check_user_id
      and role = 'admin'
  );
$$;

alter table public.user_roles enable row level security;

drop policy if exists "Users can view their own role" on public.user_roles;
create policy "Users can view their own role"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Admins can read all roles" on public.user_roles;
create policy "Admins can read all roles"
on public.user_roles
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can insert roles" on public.user_roles;
create policy "Admins can insert roles"
on public.user_roles
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update roles" on public.user_roles;
create policy "Admins can update roles"
on public.user_roles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.get_admin_users()
returns table (
  user_id uuid,
  email text,
  full_name text,
  avatar_url text,
  role public.app_role,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_authorized';
  end if;

  return query
  select
    users.id as user_id,
    users.email::text,
    coalesce(
      users.raw_user_meta_data ->> 'full_name',
      users.raw_user_meta_data ->> 'name',
      users.raw_user_meta_data ->> 'user_name',
      users.email
    )::text as full_name,
    coalesce(
      users.raw_user_meta_data ->> 'avatar_url',
      users.raw_user_meta_data ->> 'picture'
    )::text as avatar_url,
    coalesce(roles.role, 'viewer'::public.app_role) as role,
    users.created_at,
    users.last_sign_in_at
  from auth.users as users
  left join public.user_roles as roles
    on roles.user_id = users.id
  order by users.created_at desc;
end;
$$;

grant execute on function public.get_admin_users() to authenticated;

create or replace function public.set_user_role(
  target_user_id uuid,
  new_role public.app_role
)
returns public.user_roles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  updated_record public.user_roles;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_authorized';
  end if;

  if auth.uid() = target_user_id then
    raise exception 'cannot_change_own_role';
  end if;

  insert into public.user_roles (user_id, role, updated_by)
  values (target_user_id, new_role, auth.uid())
  on conflict (user_id)
  do update set
    role = excluded.role,
    updated_by = excluded.updated_by,
    updated_at = timezone('utc', now())
  returning * into updated_record;

  return updated_record;
end;
$$;

grant execute on function public.set_user_role(uuid, public.app_role) to authenticated;
