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
