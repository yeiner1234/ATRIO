insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do nothing;

drop policy if exists "Cualquiera puede ver fotos de productos" on storage.objects;
create policy "Cualquiera puede ver fotos de productos"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'productos');

drop policy if exists "Administradores suben fotos de productos" on storage.objects;
create policy "Administradores suben fotos de productos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'productos'
    and exists (select 1 from public.perfiles where id = auth.uid() and rol = 'administrador')
  );

drop policy if exists "Administradores actualizan fotos de productos" on storage.objects;
create policy "Administradores actualizan fotos de productos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'productos'
    and exists (select 1 from public.perfiles where id = auth.uid() and rol = 'administrador')
  )
  with check (
    bucket_id = 'productos'
    and exists (select 1 from public.perfiles where id = auth.uid() and rol = 'administrador')
  );

drop policy if exists "Administradores borran fotos de productos" on storage.objects;
create policy "Administradores borran fotos de productos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'productos'
    and exists (select 1 from public.perfiles where id = auth.uid() and rol = 'administrador')
  );
