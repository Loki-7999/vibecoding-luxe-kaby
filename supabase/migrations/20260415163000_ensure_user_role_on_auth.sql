create or replace function public.ensure_user_role()
returns public.user_roles
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  ensured_role public.user_roles;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.user_roles (user_id, role)
  values (auth.uid(), 'viewer')
  on conflict (user_id)
  do update set
    user_id = excluded.user_id
  returning * into ensured_role;

  return ensured_role;
end;
$$;

grant execute on function public.ensure_user_role() to authenticated;
