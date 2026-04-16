-- ============================================================
-- DogHike Südtirol – Supabase Schema
-- In Supabase Dashboard → SQL Editor ausführen
-- ============================================================

-- PROFILES
create table if not exists public.profiles (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade unique not null,
  username     text,
  full_name    text,
  avatar_url   text,
  role         text default 'user' check (role in ('user', 'admin')),
  created_at   timestamptz default now()
);

-- Falls die Tabelle bereits existiert:
-- alter table public.profiles
--   add column if not exists role text default 'user' check (role in ('user','admin'));

alter table public.profiles enable row level security;

create policy "Eigenes Profil lesen"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Eigenes Profil anlegen"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Eigenes Profil bearbeiten"
  on public.profiles for update
  using (auth.uid() = user_id);

-- DOGS
create table if not exists public.dogs (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null,
  breed        text,
  birth_date   date,
  character    text,
  notes        text,
  favorite_food text,
  photo_url    text,
  created_at   timestamptz default now()
);

alter table public.dogs enable row level security;

create policy "Eigene Hunde lesen"
  on public.dogs for select
  using (auth.uid() = user_id);

create policy "Eigene Hunde anlegen"
  on public.dogs for insert
  with check (auth.uid() = user_id);

create policy "Eigene Hunde bearbeiten"
  on public.dogs for update
  using (auth.uid() = user_id);

create policy "Eigene Hunde löschen"
  on public.dogs for delete
  using (auth.uid() = user_id);

-- JOURNAL ENTRIES
create table if not exists public.journal_entries (
  id                uuid default gen_random_uuid() primary key,
  user_id           uuid references auth.users(id) on delete cascade not null,
  title             text not null,
  date              date not null,
  location          text,
  distance_km       numeric(6,2),
  elevation_m       integer,
  duration_minutes  integer,
  difficulty        smallint check (difficulty between 1 and 5),
  description       text,
  photos            text[] default '{}',
  gpx_url           text,
  rating            smallint check (rating between 1 and 5),
  dog_suitable      boolean default true,
  water_available   smallint default 0 check (water_available between 0 and 3),
  -- 0=kein Wasser, 1=wenig, 2=etwas, 3=viel
  dog_difficulty    smallint check (dog_difficulty between 1 and 5),
  hazard_notes      text,
  visibility        text default 'private' check (visibility in ('private', 'friends', 'public')),
  status            text default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  rejection_reason  text,
  created_at        timestamptz default now()
);

-- Falls die Tabelle bereits existiert, einmalig ausführen:
-- alter table public.journal_entries
--   add column if not exists visibility text default 'private' check (visibility in ('private','friends','public')),
--   add column if not exists status text default 'draft' check (status in ('draft','pending','approved','rejected'));

alter table public.journal_entries enable row level security;

-- Helper: Prüft ob der aktuelle Nutzer Admin ist
create or replace function public.is_admin()
returns boolean
language sql security definer
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

create policy "Eigene Einträge lesen"
  on public.journal_entries for select
  using (auth.uid() = user_id OR public.is_admin());

create policy "Eigene Einträge anlegen"
  on public.journal_entries for insert
  with check (auth.uid() = user_id);

create policy "Eigene Einträge oder Admin bearbeiten"
  on public.journal_entries for update
  using (auth.uid() = user_id OR public.is_admin());

create policy "Eigene Einträge löschen"
  on public.journal_entries for delete
  using (auth.uid() = user_id OR public.is_admin());

-- Falls die Tabelle bereits mit boolean angelegt wurde, einmalig ausführen:
-- alter table public.journal_entries
--   alter column water_available type smallint using (water_available::int),
--   alter column water_available set default 0;

-- ============================================================
-- Storage Buckets (manuell im Supabase Dashboard anlegen):
-- 1. "avatars"      – Public bucket für Profilbilder
-- 2. "dog-photos"   – Public bucket für Hundefotos
-- 3. "journal"      – Public bucket für Journal-Fotos & GPX-Dateien
-- ============================================================
