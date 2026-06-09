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
    );

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'public_hikes'
      and column_name = 'user_id'
  ) then
    execute $sql$
      delete from storage.objects
      where bucket_id = 'journal'
        and name in (
          select public.extract_storage_object_name('journal', ph.photo_url)
          from public.public_hikes phike
          join public.public_hike_photos ph on ph.hike_id = phike.id
          where phike.user_id = $1
          union
          select public.extract_storage_object_name('journal', phike.image)
          from public.public_hikes phike
          where phike.user_id = $1
          union
          select public.extract_storage_object_name('journal', phike.image2)
          from public.public_hikes phike
          where phike.user_id = $1
          union
          select public.extract_storage_object_name('journal', phike.image3)
          from public.public_hikes phike
          where phike.user_id = $1
          union
          select public.extract_storage_object_name('journal', phike.image4)
          from public.public_hikes phike
          where phike.user_id = $1
        )
    $sql$ using target_user_id;
  end if;

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

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'public_hikes'
      and column_name = 'user_id'
  ) then
    execute 'delete from public.public_hikes where user_id = $1'
      using target_user_id;
  end if;

  delete from auth.users
  where id = target_user_id;
end;
$$;

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
    );

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'public_hikes'
      and column_name = 'user_id'
  ) then
    execute $sql$
      delete from storage.objects
      where bucket_id = 'journal'
        and name in (
          select public.extract_storage_object_name('journal', ph.photo_url)
          from public.public_hikes phike
          join public.public_hike_photos ph on ph.hike_id = phike.id
          where phike.user_id = $1
          union
          select public.extract_storage_object_name('journal', phike.image)
          from public.public_hikes phike
          where phike.user_id = $1
          union
          select public.extract_storage_object_name('journal', phike.image2)
          from public.public_hikes phike
          where phike.user_id = $1
          union
          select public.extract_storage_object_name('journal', phike.image3)
          from public.public_hikes phike
          where phike.user_id = $1
          union
          select public.extract_storage_object_name('journal', phike.image4)
          from public.public_hikes phike
          where phike.user_id = $1
        )
    $sql$ using current_user_id;
  end if;

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

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'public_hikes'
      and column_name = 'user_id'
  ) then
    execute 'delete from public.public_hikes where user_id = $1'
      using current_user_id;
  end if;

  delete from auth.users
  where id = current_user_id;
end;
$$;
