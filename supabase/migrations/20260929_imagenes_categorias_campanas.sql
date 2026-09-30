-- Imagen para cada categoría (círculos de Inicio/Catálogo).
-- Nullable a propósito: una categoría sin imagen sigue mostrando el
-- marcador de posición existente, nunca rompe la pantalla.
alter table public.categorias
  add column if not exists imagen_url text;

-- Campaña del banner de Inicio ("Capas esenciales"), ahora editable desde
-- el dashboard de Supabase en vez de un objeto fijo en el código.
create table if not exists public.campanas (
  id uuid primary key default gen_random_uuid(),
  etiqueta text not null,
  titulo text not null,
  texto_boton text not null,
  categoria_destino text not null,
  imagen_url text,
  activa boolean not null default true,
  creado_en timestamptz not null default now()
);

alter table public.campanas enable row level security;

-- Lectura pública: el banner de Inicio se muestra a cualquiera, con o sin
-- sesión, igual que el resto del catálogo.
-- (CREATE POLICY no admite IF NOT EXISTS en Postgres: se hace idempotente
-- con DROP POLICY IF EXISTS antes.)
drop policy if exists "Cualquiera puede leer campañas activas" on public.campanas;
create policy "Cualquiera puede leer campañas activas"
  on public.campanas
  for select
  to anon, authenticated
  using (activa = true);

-- Solo administradores pueden gestionar campañas (por si más adelante se
-- construye una pantalla admin para esto; hoy se edita desde el Table
-- Editor de Supabase, que usa service_role y no pasa por RLS).
drop policy if exists "Administradores gestionan campañas" on public.campanas;
create policy "Administradores gestionan campañas"
  on public.campanas
  for all
  to authenticated
  using (exists (select 1 from public.perfiles where id = auth.uid() and rol = 'administrador'))
  with check (exists (select 1 from public.perfiles where id = auth.uid() and rol = 'administrador'));
