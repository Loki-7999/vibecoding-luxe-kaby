alter table public.properties
  add column if not exists is_active boolean not null default true;

drop policy if exists "Public read access" on public.properties;
drop policy if exists "Public can read properties" on public.properties;
create policy "Public can read active properties"
on public.properties
for select
to anon, authenticated
using ((is_active = true and is_draft = false) or public.is_admin());

drop policy if exists "Admins can delete properties" on public.properties;
