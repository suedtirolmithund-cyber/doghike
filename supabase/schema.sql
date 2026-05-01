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

create policy "Alle Profile lesen"
  on public.profiles for select
  using (auth.uid() is not null);

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
  latitude          numeric(10,7),
  longitude         numeric(10,7),
  dog_id            uuid references public.dogs(id) on delete set null,
  hazard_notes      text,
  seasons           text[] default '{}',
  visibility        text default 'private' check (visibility in ('private', 'friends', 'public')),
  status            text default 'draft' check (status in ('draft', 'pending', 'approved', 'rejected')),
  rejection_reason  text,
  created_at        timestamptz default now()
);

-- Falls die Tabelle bereits existiert, einmalig ausführen:
-- alter table public.journal_entries
--   add column if not exists latitude numeric(10,7),
--   add column if not exists longitude numeric(10,7),
--   add column if not exists dog_id uuid references public.dogs(id) on delete set null,
--   add column if not exists seasons text[] default '{}',
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

create policy "Freunde und öffentliche Einträge lesen"
  on public.journal_entries for select
  using (
    (visibility = 'public' and status = 'approved')
    or (
      visibility = 'friends'
      and status in ('approved', 'draft')
      and auth.uid() is not null
      and exists (
        select 1
        from public.friendships f
        where
          f.status = 'accepted'
          and (
            (f.requester_id = auth.uid() and f.receiver_id = user_id)
            or (f.receiver_id = auth.uid() and f.requester_id = user_id)
          )
      )
    )
  );

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

-- FRIENDSHIPS
create table if not exists public.friendships (
  id           uuid default gen_random_uuid() primary key,
  requester_id uuid references auth.users(id) on delete cascade not null,
  receiver_id  uuid references auth.users(id) on delete cascade not null,
  status       text default 'pending' check (status in ('pending','accepted','rejected')),
  created_at   timestamptz default now(),
  unique (requester_id, receiver_id)
);
alter table public.friendships enable row level security;
-- Anyone in the friendship can read it
create policy "Freundschaften lesen" on public.friendships for select
  using (auth.uid() = requester_id or auth.uid() = receiver_id);
-- Only requester can create
create policy "Freundschaftsanfrage senden" on public.friendships for insert
  with check (auth.uid() = requester_id);
-- Only receiver can accept/reject; requester can delete (unfriend)
create policy "Freundschaft verwalten" on public.friendships for update
  using (auth.uid() = receiver_id);
create policy "Freundschaft löschen" on public.friendships for delete
  using (auth.uid() = requester_id or auth.uid() = receiver_id);

-- SAVED HIKES
create table if not exists public.saved_hikes (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  hike_id     text not null,
  hike_source text default 'sheets' check (hike_source in ('sheets','journal')),
  created_at  timestamptz default now(),
  unique (user_id, hike_id, hike_source)
);
alter table public.saved_hikes enable row level security;
create policy "Eigene gespeicherte Touren" on public.saved_hikes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- RATINGS
create table if not exists public.ratings (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade not null,
  hike_id    text not null,
  hike_source text default 'sheets' check (hike_source in ('sheets','journal')),
  rating     smallint not null check (rating between 1 and 5),
  created_at timestamptz default now(),
  unique (user_id, hike_id, hike_source)
);
alter table public.ratings enable row level security;
create policy "Ratings lesen" on public.ratings for select using (true);
create policy "Eigene Ratings verwalten" on public.ratings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- COMMENTS
create table if not exists public.comments (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users(id) on delete cascade not null,
  hike_id         text not null,
  hike_source     text default 'sheets' check (hike_source in ('sheets','journal')),
  text            text not null,
  photo_url       text,
  reported        boolean default false,
  reported_reason text,
  created_at      timestamptz default now()
);
alter table public.comments enable row level security;
create policy "Kommentare lesen" on public.comments
  for select using (reported = false OR auth.uid() = user_id OR public.is_admin());
create policy "Eigene Kommentare erstellen" on public.comments
  for insert with check (auth.uid() = user_id);
create policy "Admin Kommentare moderieren" on public.comments
  for update using (public.is_admin()) with check (public.is_admin());
create policy "Eigene oder Admin Kommentare löschen" on public.comments
  for delete using (auth.uid() = user_id OR public.is_admin());

-- Falls Tabelle bereits existiert:
-- alter table public.comments
--   add column if not exists reported boolean default false,
--   add column if not exists reported_reason text;

-- USER ROUTES
create table if not exists public.user_routes (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null,
  description text,
  start_location text,
  notes       text,
  waypoints   jsonb default '[]',
  distance_km numeric(6,2),
  elevation_gain_m integer,
  duration_minutes integer,
  avg_speed_kmh numeric(5,2),
  gpx_url     text,
  route_type  text default 'planned' check (route_type in ('planned','recorded','gpx')),
  is_public   boolean default false,
  completed   boolean default false,
  completed_date date,
  completed_duration_minutes integer,
  completed_notes text,
  completed_rating smallint check (completed_rating between 1 and 5),
  created_at  timestamptz default now()
);
alter table public.user_routes enable row level security;
create policy "Eigene Routen lesen" on public.user_routes
  for select using (auth.uid() = user_id or public.is_admin());
create policy "Eigene Routen verwalten" on public.user_routes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Storage Buckets (manuell im Supabase Dashboard anlegen):
-- 1. "avatars"      – Public bucket für Profilbilder
-- 2. "dog-photos"   – Public bucket für Hundefotos
-- 3. "journal"      – Public bucket für Journal-Fotos & GPX-Dateien
-- 4. "comments"     – Public bucket für Kommentar-Fotos
-- ============================================================

-- Zusaetzliche Admin-Policies
create policy "Admin Profile verwalten" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admin Hunde verwalten" on public.dogs
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admin Freundschaften verwalten" on public.friendships
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admin gespeicherte Touren verwalten" on public.saved_hikes
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admin Ratings verwalten" on public.ratings
  for all using (public.is_admin()) with check (public.is_admin());

create policy "Admin Routen verwalten" on public.user_routes
  for all using (public.is_admin()) with check (public.is_admin());

create or replace function public.can_read_shared_journal_file(object_name text)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.journal_entries je
    where
      (
        object_name = any(coalesce(je.photos, '{}'::text[]))
        or object_name = je.gpx_url
      )
      and (
        (je.visibility = 'public' and je.status = 'approved')
        or (
          auth.uid() is not null
          and je.visibility = 'friends'
          and je.status in ('approved', 'draft')
          and exists (
            select 1
            from public.friendships f
            where
              f.status = 'accepted'
              and (
                (f.requester_id = auth.uid() and f.receiver_id = je.user_id)
                or (f.receiver_id = auth.uid() and f.requester_id = je.user_id)
              )
          )
        )
      )
  );
$$;

create or replace function public.extract_storage_object_name(bucket_name text, file_reference text)
returns text
language plpgsql
immutable
as $$
declare
  public_marker text;
  signed_marker text;
begin
  if file_reference is null or btrim(file_reference) = '' then
    return null;
  end if;

  public_marker := '/storage/v1/object/public/' || bucket_name || '/';
  signed_marker := '/storage/v1/object/sign/' || bucket_name || '/';

  if bucket_name = 'comments-pending' and file_reference like 'pending://%' then
    return substring(file_reference from length('pending://') + 1);
  end if;

  if file_reference like bucket_name || '/%' then
    return substring(file_reference from length(bucket_name) + 2);
  end if;

  if position(public_marker in file_reference) > 0 then
    return substring(file_reference from position(public_marker in file_reference) + length(public_marker));
  end if;

  if position(signed_marker in file_reference) > 0 then
    return split_part(
      substring(file_reference from position(signed_marker in file_reference) + length(signed_marker)),
      '?',
      1
    );
  end if;

  return null;
end;
$$;

create or replace function public.admin_delete_user_account(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;

  delete from storage.objects
  where bucket_id = 'avatars'
    and name in (
      select public.extract_storage_object_name('avatars', avatar_url)
      from public.profiles
      where user_id = target_user_id
    );

  delete from storage.objects
  where bucket_id = 'dog-photos'
    and name in (
      select public.extract_storage_object_name('dog-photos', photo_url)
      from public.dogs
      where user_id = target_user_id
    );

  delete from storage.objects
  where bucket_id = 'journal'
    and name in (
      select public.extract_storage_object_name('journal', photo_ref)
      from public.journal_entries je,
      lateral unnest(coalesce(je.photos, '{}'::text[])) as photo_ref
      where je.user_id = target_user_id
      union
      select public.extract_storage_object_name('journal', je.gpx_url)
      from public.journal_entries je
      where je.user_id = target_user_id
      union
      select public.extract_storage_object_name('journal', ur.gpx_url)
      from public.user_routes ur
      where ur.user_id = target_user_id
    );

  delete from storage.objects
  where bucket_id = 'comments'
    and name in (
      select public.extract_storage_object_name('comments', c.photo_url)
      from public.comments c
      where c.user_id = target_user_id
    );

  delete from storage.objects
  where bucket_id = 'comments-pending'
    and name in (
      select public.extract_storage_object_name('comments-pending', c.photo_url)
      from public.comments c
      where c.user_id = target_user_id
    );

  delete from auth.users
  where id = target_user_id;
end;
$$;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
as $$
declare
  current_user_id uuid;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'not_authenticated';
  end if;

  delete from storage.objects
  where bucket_id = 'avatars'
    and name in (
      select public.extract_storage_object_name('avatars', avatar_url)
      from public.profiles
      where user_id = current_user_id
    );

  delete from storage.objects
  where bucket_id = 'dog-photos'
    and name in (
      select public.extract_storage_object_name('dog-photos', photo_url)
      from public.dogs
      where user_id = current_user_id
    );

  delete from storage.objects
  where bucket_id = 'journal'
    and name in (
      select public.extract_storage_object_name('journal', photo_ref)
      from public.journal_entries je,
      lateral unnest(coalesce(je.photos, '{}'::text[])) as photo_ref
      where je.user_id = current_user_id
      union
      select public.extract_storage_object_name('journal', je.gpx_url)
      from public.journal_entries je
      where je.user_id = current_user_id
      union
      select public.extract_storage_object_name('journal', ur.gpx_url)
      from public.user_routes ur
      where ur.user_id = current_user_id
    );

  delete from storage.objects
  where bucket_id = 'comments'
    and name in (
      select public.extract_storage_object_name('comments', c.photo_url)
      from public.comments c
      where c.user_id = current_user_id
    );

  delete from storage.objects
  where bucket_id = 'comments-pending'
    and name in (
      select public.extract_storage_object_name('comments-pending', c.photo_url)
      from public.comments c
      where c.user_id = current_user_id
    );

  delete from auth.users
  where id = current_user_id;
end;
$$;
