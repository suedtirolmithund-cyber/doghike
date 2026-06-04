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
  is_premium   boolean not null default false,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text,
  premium_current_period_end timestamptz,
  premium_updated_at timestamptz,
  created_at   timestamptz default now()
);

create or replace function public.normalize_username(value text)
returns text
language sql
immutable
as $$
  select nullif(lower(regexp_replace(btrim(coalesce(value, '')), '^@+', '')), '');
$$;

create or replace function public.apply_profile_username_normalization()
returns trigger
language plpgsql
as $$
begin
  new.username := public.normalize_username(new.username);
  return new;
end;
$$;

drop trigger if exists profiles_normalize_username on public.profiles;
create trigger profiles_normalize_username
before insert or update on public.profiles
for each row
execute function public.apply_profile_username_normalization();

update public.profiles
set username = public.normalize_username(username)
where username is distinct from public.normalize_username(username);

drop index if exists public.profiles_username_normalized_unique;
create unique index if not exists profiles_username_normalized_unique
  on public.profiles (username)
  where username is not null;

create or replace view public.public_profiles as
select
  user_id,
  username,
  full_name,
  avatar_url,
  created_at
from public.profiles;

grant select on public.public_profiles to authenticated;
grant select on public.public_profiles to anon;

-- Falls die Tabelle bereits existiert:
-- alter table public.profiles
--   add column if not exists role text default 'user' check (role in ('user','admin'));
alter table public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists subscription_status text,
  add column if not exists premium_current_period_end timestamptz,
  add column if not exists premium_updated_at timestamptz;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  event_payload jsonb,
  stripe_created_at timestamptz,
  stripe_livemode boolean,
  stripe_api_version text,
  stripe_request_id text,
  processing_status text not null default 'processing'
    check (processing_status in ('processing', 'processed', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.stripe_webhook_events
  add column if not exists event_payload jsonb,
  add column if not exists stripe_created_at timestamptz,
  add column if not exists stripe_livemode boolean,
  add column if not exists stripe_api_version text,
  add column if not exists stripe_request_id text;

alter table public.stripe_webhook_events enable row level security;

create policy "Admin Stripe-Webhook-Events verwalten"
  on public.stripe_webhook_events
  for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.registration_consents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique not null,
  privacy_version text not null default '2026-06',
  terms_version text not null default '2026-06',
  accepted_at timestamptz not null default now(),
  accepted_source text not null default 'registration',
  created_at timestamptz not null default now()
);

alter table public.registration_consents enable row level security;

create policy "Eigene Registrierungseinwilligung lesen"
  on public.registration_consents for select
  using (auth.uid() = user_id);

create policy "Eigene Registrierungseinwilligung anlegen"
  on public.registration_consents for insert
  with check (auth.uid() = user_id);

drop policy if exists "Eigene Registrierungseinwilligung aktualisieren" on public.registration_consents;
create policy "Eigene Registrierungseinwilligung aktualisieren"
  on public.registration_consents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admin Registrierungseinwilligungen verwalten"
  on public.registration_consents
  for all
  using (public.is_admin())
  with check (public.is_admin());

create table if not exists public.premium_checkout_consents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  stripe_customer_id text,
  stripe_checkout_session_id text unique,
  checkout_plan text not null check (checkout_plan in ('monthly', 'one_time')),
  withdrawal_consent boolean not null check (withdrawal_consent = true),
  withdrawal_consent_at timestamptz not null,
  withdrawal_consent_source text not null default 'premium_checkout',
  created_at timestamptz not null default now()
);

alter table public.premium_checkout_consents enable row level security;

create policy "Eigene Premium-Checkout-Einwilligungen lesen"
  on public.premium_checkout_consents for select
  using (auth.uid() = user_id);

create policy "Admin Premium-Checkout-Einwilligungen verwalten"
  on public.premium_checkout_consents
  for all
  using (public.is_admin())
  with check (public.is_admin());

alter table public.profiles enable row level security;

create policy "Eigenes Profil lesen"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Alle Profile lesen" on public.profiles;

create policy "Eigenes Profil anlegen"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Eigenes Profil bearbeiten" on public.profiles;
create policy "Eigenes Profil bearbeiten"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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

create policy "Öffentliche Hunde genehmigter Touren lesen"
  on public.dogs for select
  using (
    exists (
      select 1
      from public.public_hikes h
      where h.status = 'approved'
        and (
          h.dog_id = public.dogs.id
          or public.dogs.id = any(coalesce(h.dog_ids, '{}'::uuid[]))
        )
    )
    or exists (
      select 1
      from public.journal_entries je
      where je.status = 'approved'
        and (
          je.visibility = 'public'
          or (
            je.visibility = 'friends'
            and auth.uid() is not null
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
        and (
          je.dog_id = public.dogs.id
          or public.dogs.id = any(coalesce(je.dog_ids, '{}'::uuid[]))
        )
    )
  );

create policy "Eigene Hunde anlegen"
  on public.dogs for insert
  with check (auth.uid() = user_id);

create policy "Eigene Hunde bearbeiten"
  on public.dogs for update
  using (auth.uid() = user_id);

create policy "Eigene Hunde löschen"
  on public.dogs for delete
  using (auth.uid() = user_id);

create or replace function public.get_public_dog_profile_count()
returns integer
language sql
security invoker
stable
set search_path = public
as $$
  select count(*)::integer
  from public.dogs;
$$;

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
  dog_ids           uuid[] default '{}',
  grazing_animals   boolean default false,
  muzzle_recommended boolean default false,
  dog_mood_tags     text[] default '{}',
  tags              text[] default '{}',
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
--   add column if not exists dog_ids uuid[] default '{}',
--   add column if not exists grazing_animals boolean default false,
--   add column if not exists muzzle_recommended boolean default false,
--   add column if not exists dog_mood_tags text[] default '{}',
--   add column if not exists tags text[] default '{}',
--   add column if not exists seasons text[] default '{}',
--   add column if not exists visibility text default 'private' check (visibility in ('private','friends','public')),
--   add column if not exists status text default 'draft' check (status in ('draft','pending','approved','rejected'));

alter table public.journal_entries enable row level security;

create or replace function public.get_top_dogs_leaderboard(timeframe_value text default 'overall')
returns table (
  dog_id uuid,
  user_id uuid,
  dog_name text,
  dog_breed text,
  dog_photo_url text,
  tour_count integer,
  total_distance numeric,
  total_elevation integer,
  avg_rating numeric,
  rating_count integer
)
language sql
security definer
stable
set search_path = public
as $$
  with timeframe_bounds as (
    select
      date_trunc('day', now()) - (((extract(dow from now())::int + 6) % 7) * interval '1 day') as start_of_week,
      date_trunc('month', now()) as start_of_month
  ),
  source_entries as (
    select
      coalesce(je.date::timestamptz, je.created_at) as occurred_at,
      je.distance_km,
      je.elevation_m as elevation_value,
      je.rating,
      array_cat(
        coalesce(je.dog_ids, '{}'::uuid[]),
        case when je.dog_id is not null then array[je.dog_id] else '{}'::uuid[] end
      ) as dog_ids
    from public.journal_entries je
    where auth.uid() is not null

    union all

    select
      coalesce(h.date::timestamptz, h.created_at) as occurred_at,
      h.distance_km,
      h.elevation_gain_m as elevation_value,
      null::numeric as rating,
      array_cat(
        coalesce(h.dog_ids, '{}'::uuid[]),
        case when h.dog_id is not null then array[h.dog_id] else '{}'::uuid[] end
      ) as dog_ids
    from public.public_hikes h
    where auth.uid() is not null
      and h.status = 'approved'
  ),
  filtered_entries as (
    select se.*
    from source_entries se
    cross join timeframe_bounds tb
    where
      timeframe_value = 'overall'
      or (
        timeframe_value = 'week'
        and se.occurred_at is not null
        and se.occurred_at >= tb.start_of_week
      )
      or (
        timeframe_value = 'month'
        and se.occurred_at is not null
        and se.occurred_at >= tb.start_of_month
      )
  ),
  entry_dogs as (
    select
      fe.distance_km,
      fe.elevation_value,
      fe.rating,
      selected_dogs.dog_id
    from filtered_entries fe
    cross join lateral (
      select distinct dog_id
      from unnest(fe.dog_ids) as dog_id
    ) selected_dogs
  )
  select
    d.id as dog_id,
    d.user_id,
    d.name as dog_name,
    d.breed as dog_breed,
    d.photo_url as dog_photo_url,
    count(*)::integer as tour_count,
    round(coalesce(sum(ed.distance_km), 0)::numeric, 1) as total_distance,
    round(coalesce(sum(ed.elevation_value), 0))::integer as total_elevation,
    case
      when count(ed.rating) > 0 then round(avg(ed.rating)::numeric, 1)
      else 0
    end as avg_rating,
    count(ed.rating)::integer as rating_count
  from entry_dogs ed
  join public.dogs d on d.id = ed.dog_id
  group by d.id, d.user_id, d.name, d.breed, d.photo_url;
$$;

grant execute on function public.get_top_dogs_leaderboard(text) to authenticated;
revoke execute on function public.get_top_dogs_leaderboard(text) from public;
revoke execute on function public.get_top_dogs_leaderboard(text) from anon;

-- Helper: Prüft ob der aktuelle Nutzer Admin ist
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;
revoke execute on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;

create or replace function public.prevent_profile_billing_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.is_premium is distinct from old.is_premium
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.stripe_subscription_id is distinct from old.stripe_subscription_id
    or new.subscription_status is distinct from old.subscription_status
    or new.premium_current_period_end is distinct from old.premium_current_period_end
    or new.premium_updated_at is distinct from old.premium_updated_at then
    raise exception 'Premium billing fields cannot be updated directly';
  end if;

  return new;
end;
$$;

revoke execute on function public.prevent_profile_billing_self_update() from public;
revoke execute on function public.prevent_profile_billing_self_update() from anon;

create or replace function public.prevent_profile_role_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or public.is_admin() then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Profile role cannot be updated directly';
  end if;

  return new;
end;
$$;

revoke execute on function public.prevent_profile_role_self_update() from public;
revoke execute on function public.prevent_profile_role_self_update() from anon;

drop trigger if exists protect_profile_billing_fields on public.profiles;
create trigger protect_profile_billing_fields
  before update on public.profiles
  for each row execute function public.prevent_profile_billing_self_update();

drop trigger if exists protect_profile_role_field on public.profiles;
create trigger protect_profile_role_field
  before update on public.profiles
  for each row execute function public.prevent_profile_role_self_update();

create policy "Eigene Einträge lesen"
  on public.journal_entries for select
  using (auth.uid() = user_id OR public.is_admin())
  with check (auth.uid() = user_id OR public.is_admin());

create policy "Freunde und öffentliche Einträge lesen"
  on public.journal_entries for select
  using (
    (visibility = 'public' and status = 'approved')
    or (
      visibility = 'friends'
      and status = 'approved'
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

-- WEB PUSH SUBSCRIPTIONS
create table if not exists public.push_subscriptions (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  endpoint     text not null unique,
  p256dh_key   text not null,
  auth_key     text not null,
  user_agent   text,
  last_seen_at timestamptz default now(),
  created_at   timestamptz default now()
);
alter table public.push_subscriptions enable row level security;
create policy "Eigene Push-Subscriptions lesen" on public.push_subscriptions
  for select using (auth.uid() = user_id);
create policy "Eigene Push-Subscriptions anlegen" on public.push_subscriptions
  for insert with check (auth.uid() = user_id);
create policy "Eigene Push-Subscriptions bearbeiten" on public.push_subscriptions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Eigene Push-Subscriptions löschen" on public.push_subscriptions
  for delete using (auth.uid() = user_id);

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
security invoker
set search_path = public
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
          and je.status = 'approved'
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

  if bucket_name = 'journal' and file_reference like 'public-hikes/%' then
    return file_reference;
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
set search_path = public
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
      union
      select public.extract_storage_object_name('journal', ph.photo_url)
      from public.public_hikes phike
      join public.public_hike_photos ph on ph.hike_id = phike.id
      where phike.user_id = target_user_id
      union
      select public.extract_storage_object_name('journal', phike.image)
      from public.public_hikes phike
      where phike.user_id = target_user_id
      union
      select public.extract_storage_object_name('journal', phike.image2)
      from public.public_hikes phike
      where phike.user_id = target_user_id
      union
      select public.extract_storage_object_name('journal', phike.image3)
      from public.public_hikes phike
      where phike.user_id = target_user_id
      union
      select public.extract_storage_object_name('journal', phike.image4)
      from public.public_hikes phike
      where phike.user_id = target_user_id
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

  delete from public.support_requests
  where user_id = target_user_id;

  delete from public.public_hikes
  where user_id = target_user_id;

  delete from auth.users
  where id = target_user_id;
end;
$$;

grant execute on function public.admin_delete_user_account(uuid) to authenticated;
revoke execute on function public.admin_delete_user_account(uuid) from public;
revoke execute on function public.admin_delete_user_account(uuid) from anon;

create or replace function public.admin_approve_journal_entry(target_entry_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;

  update public.journal_entries
  set status = 'approved',
      rejection_reason = null
  where id = target_entry_id;

  if not found then
    raise exception 'not_found';
  end if;
end;
$$;

grant execute on function public.admin_approve_journal_entry(uuid) to authenticated;
revoke execute on function public.admin_approve_journal_entry(uuid) from public;
revoke execute on function public.admin_approve_journal_entry(uuid) from anon;

create or replace function public.admin_reject_journal_entry(target_entry_id uuid, target_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not_allowed';
  end if;

  update public.journal_entries
  set status = 'rejected',
      rejection_reason = nullif(btrim(target_reason), '')
  where id = target_entry_id;

  if not found then
    raise exception 'not_found';
  end if;
end;
$$;

grant execute on function public.admin_reject_journal_entry(uuid, text) to authenticated;
revoke execute on function public.admin_reject_journal_entry(uuid, text) from public;
revoke execute on function public.admin_reject_journal_entry(uuid, text) from anon;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
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
      union
      select public.extract_storage_object_name('journal', ph.photo_url)
      from public.public_hikes phike
      join public.public_hike_photos ph on ph.hike_id = phike.id
      where phike.user_id = current_user_id
      union
      select public.extract_storage_object_name('journal', phike.image)
      from public.public_hikes phike
      where phike.user_id = current_user_id
      union
      select public.extract_storage_object_name('journal', phike.image2)
      from public.public_hikes phike
      where phike.user_id = current_user_id
      union
      select public.extract_storage_object_name('journal', phike.image3)
      from public.public_hikes phike
      where phike.user_id = current_user_id
      union
      select public.extract_storage_object_name('journal', phike.image4)
      from public.public_hikes phike
      where phike.user_id = current_user_id
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

  delete from public.support_requests
  where user_id = current_user_id;

  delete from public.public_hikes
  where user_id = current_user_id;

  delete from auth.users
  where id = current_user_id;
end;
$$;

grant execute on function public.delete_own_account() to authenticated;
revoke execute on function public.delete_own_account() from public;
revoke execute on function public.delete_own_account() from anon;

create table if not exists public.support_requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  email text,
  category text not null default 'feedback',
  subject text not null,
  message text not null,
  page_url text,
  user_agent text,
  email_status text not null default 'pending',
  email_error text,
  created_at timestamptz not null default now()
);

alter table public.support_requests enable row level security;

create policy "Eigene Support-Anfragen lesen" on public.support_requests
  for select using (auth.uid() = user_id);

create policy "Admin Support-Anfragen verwalten" on public.support_requests
  for all using (public.is_admin()) with check (public.is_admin());

-- PUBLIC HIKES
create table if not exists public.public_hikes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  location text,
  country text,
  date date,
  distance_km numeric(6,2),
  elevation_gain_m integer,
  duration_minutes integer,
  difficulty smallint check (difficulty between 1 and 5),
  dog_difficulty smallint check (dog_difficulty between 1 and 5),
  water_availability smallint check (water_availability between 0 and 3),
  season text,
  seasons text[] default '{}',
  grazing_animals boolean default false,
  muzzle_recommended boolean default false,
  hazard_notes text,
  parking_info text,
  restaurant_info text,
  notes text,
  tags text[] default '{}',
  is_premium boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'approved', 'archived')),
  latitude numeric(10,7),
  longitude numeric(10,7),
  dog_id uuid references public.dogs(id) on delete set null,
  dog_ids uuid[] default '{}',
  dog_mood_tags text[] default '{}',
  image text,
  image2 text,
  image3 text,
  image4 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz default now()
);

create table if not exists public.public_hike_photos (
  id uuid default gen_random_uuid() primary key,
  hike_id uuid references public.public_hikes(id) on delete cascade not null,
  photo_url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists public_hikes_status_idx on public.public_hikes(status);
create index if not exists public_hikes_user_id_idx on public.public_hikes(user_id);
create index if not exists public_hike_photos_hike_id_sort_idx
  on public.public_hike_photos(hike_id, sort_order);

alter table public.public_hikes enable row level security;
alter table public.public_hike_photos enable row level security;

create policy "Öffentliche Touren lesen"
  on public.public_hikes for select
  using (
    (status = 'approved')
    or (auth.uid() = user_id)
    or public.is_admin()
  );

create policy "Eigene öffentliche Touren anlegen"
  on public.public_hikes for insert
  with check (
    (auth.uid() = user_id)
    or public.is_admin()
  );

create policy "Eigene oder Admin öffentliche Touren bearbeiten"
  on public.public_hikes for update
  using (
    (auth.uid() = user_id)
    or public.is_admin()
  )
  with check (
    (auth.uid() = user_id)
    or public.is_admin()
  );

create policy "Eigene oder Admin öffentliche Touren löschen"
  on public.public_hikes for delete
  using (
    (auth.uid() = user_id)
    or public.is_admin()
  );

create policy "Öffentliche Tourfotos lesen"
  on public.public_hike_photos for select
  using (
    exists (
      select 1
      from public.public_hikes h
      where h.id = public.public_hike_photos.hike_id
        and (
          h.status = 'approved'
          or h.user_id = auth.uid()
          or public.is_admin()
        )
    )
  );

create policy "Eigene oder Admin Tourfotos anlegen"
  on public.public_hike_photos for insert
  with check (
    exists (
      select 1
      from public.public_hikes h
      where h.id = public.public_hike_photos.hike_id
        and (
          h.user_id = auth.uid()
          or public.is_admin()
        )
    )
  );

create policy "Eigene oder Admin Tourfotos bearbeiten"
  on public.public_hike_photos for update
  using (
    exists (
      select 1
      from public.public_hikes h
      where h.id = public.public_hike_photos.hike_id
        and (
          h.user_id = auth.uid()
          or public.is_admin()
        )
    )
  )
  with check (
    exists (
      select 1
      from public.public_hikes h
      where h.id = public.public_hike_photos.hike_id
        and (
          h.user_id = auth.uid()
          or public.is_admin()
        )
    )
  );

create policy "Eigene oder Admin Tourfotos löschen"
  on public.public_hike_photos for delete
  using (
    exists (
      select 1
      from public.public_hikes h
      where h.id = public.public_hike_photos.hike_id
        and (
          h.user_id = auth.uid()
          or public.is_admin()
        )
    )
  );

-- Falls die Tabelle bereits existiert und mehrere Jahreszeiten speichern soll:
-- alter table public.public_hikes
--   add column if not exists seasons text[] default '{}';
--
-- update public.public_hikes
-- set seasons = case
--   when season is null then '{}'::text[]
--   else array[season]
-- end
-- where seasons is null or array_length(seasons, 1) is null;
