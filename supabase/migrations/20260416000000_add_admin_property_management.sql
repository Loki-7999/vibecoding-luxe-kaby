create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

alter table public.properties
  add column if not exists description text,
  add column if not exists year_built integer,
  add column if not exists parking integer not null default 0,
  add column if not exists amenities text[] not null default '{}',
  add column if not exists is_draft boolean not null default false,
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

drop trigger if exists set_properties_updated_at on public.properties;
create trigger set_properties_updated_at
before update on public.properties
for each row
execute function public.set_current_timestamp_updated_at();

drop policy if exists "Admins can insert properties" on public.properties;
create policy "Admins can insert properties"
on public.properties
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "Admins can update properties" on public.properties;
create policy "Admins can update properties"
on public.properties
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete properties" on public.properties;
create policy "Admins can delete properties"
on public.properties
for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Public can view property images" on storage.objects;
create policy "Public can view property images"
on storage.objects
for select
to public
using (bucket_id = 'property-images');

drop policy if exists "Admins can upload property images" on storage.objects;
create policy "Admins can upload property images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'property-images'
  and public.is_admin()
);

drop policy if exists "Admins can update property images" on storage.objects;
create policy "Admins can update property images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'property-images'
  and public.is_admin()
)
with check (
  bucket_id = 'property-images'
  and public.is_admin()
);

drop policy if exists "Admins can delete property images" on storage.objects;
create policy "Admins can delete property images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'property-images'
  and public.is_admin()
);
